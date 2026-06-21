"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createInvoiceSchema,
  issueInvoiceSchema,
  recordPaymentSchema,
  type InvoiceItemInput,
} from "@/lib/validations/invoices";
import {
  deriveInvoiceStatus,
  getActivePayments,
  sumPaymentAmount,
  type InvoiceItemRow,
  type InvoiceRow,
  type PaymentRow,
} from "@/lib/utils/invoices";
import type { Tables, TablesInsert } from "@/types/database.types";

type InvoiceFilters = {
  search?: string;
  clientId?: string;
  assessmentYearId?: string;
  status?: string;
  scope?: string;
  overdueOnly?: boolean;
  page?: number;
  pageSize?: number;
};

type InvoiceJoinedRow = InvoiceRow & {
  clients:
    | Pick<Tables<"clients">, "id" | "full_name" | "pan_uppercase" | "email" | "address">
    | Array<Pick<Tables<"clients">, "id" | "full_name" | "pan_uppercase" | "email" | "address">>
    | null;
  assessment_years:
    | Pick<Tables<"assessment_years">, "id" | "label" | "is_current">
    | Array<Pick<Tables<"assessment_years">, "id" | "label" | "is_current">>
    | null;
  filing_cases:
    | Pick<Tables<"filing_cases">, "id" | "case_status" | "next_action" | "due_date">
    | Array<Pick<Tables<"filing_cases">, "id" | "case_status" | "next_action" | "due_date">>
    | null;
  payments: PaymentRow[] | null;
};

type InvoiceDetailRow = InvoiceJoinedRow & {
  invoice_items: InvoiceItemRow[] | null;
};

export type InvoiceActionState = {
  error?: string;
  success?: string;
  invoiceId?: string;
};

function normalizeRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function normalizeInvoice(invoice: InvoiceJoinedRow | InvoiceDetailRow) {
  const payments = (invoice.payments ?? []).slice().sort((left, right) =>
    `${right.payment_date}T00:00:00`.localeCompare(`${left.payment_date}T00:00:00`),
  );
  const activePayments = getActivePayments(payments);
  const paidAmount = sumPaymentAmount(activePayments);
  const balanceAmount = Number((Number(invoice.total_amount ?? 0) - paidAmount).toFixed(2));
  const derivedStatus = deriveInvoiceStatus(invoice, balanceAmount);

  return {
    ...invoice,
    clients: normalizeRelation(invoice.clients),
    assessment_years: normalizeRelation(invoice.assessment_years),
    filing_cases: normalizeRelation(invoice.filing_cases),
    invoice_items: "invoice_items" in invoice ? (invoice.invoice_items ?? []).slice().sort((a, b) => a.display_order - b.display_order) : undefined,
    payments,
    activePayments,
    paidAmount,
    balanceAmount,
    derivedStatus,
  };
}

async function getInvoiceReferenceData(workspaceId: string, clientId?: string) {
  const supabase = await createSupabaseServerClient();

  const clientsQuery = supabase
    .from("clients")
    .select("id, full_name, pan_uppercase")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("full_name", { ascending: true });

  if (clientId) {
    clientsQuery.eq("id", clientId);
  }

  const [{ data: clients, error: clientsError }, { data: assessmentYears, error: yearsError }] =
    await Promise.all([
      clientsQuery,
      supabase
        .from("assessment_years")
        .select("id, label, is_current")
        .eq("workspace_id", workspaceId)
        .order("start_date", { ascending: false }),
    ]);

  if (clientsError) {
    throw new Error(`Failed to fetch clients: ${clientsError.message}`);
  }

  if (yearsError) {
    throw new Error(`Failed to fetch assessment years: ${yearsError.message}`);
  }

  return {
    clients: clients ?? [],
    assessmentYears: assessmentYears ?? [],
  };
}

async function fetchInvoices(workspaceId: string, filters: InvoiceFilters) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("invoices")
    .select(`
      *,
      clients!inner (id, full_name, pan_uppercase),
      assessment_years!inner (id, label, is_current),
      filing_cases (id, case_status, next_action, due_date),
      payments (*)
    `)
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  if (filters.assessmentYearId) {
    query = query.eq("assessment_year_id", filters.assessmentYearId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch invoices: ${error.message}`);
  }

  const normalized = ((data ?? []) as InvoiceJoinedRow[]).map(normalizeInvoice);
  const searchTerm = filters.search?.trim().toLowerCase() ?? "";

  return normalized.filter((invoice) => {
    const matchesSearch =
      !searchTerm ||
      invoice.invoice_number.toLowerCase().includes(searchTerm) ||
      invoice.clients?.full_name.toLowerCase().includes(searchTerm) ||
      invoice.clients?.pan_uppercase.toLowerCase().includes(searchTerm);

    const matchesStatus = filters.status
      ? filters.status === invoice.derivedStatus
      : true;

    const matchesScope =
      filters.scope === "billed"
        ? !["draft", "cancelled"].includes(invoice.derivedStatus)
        : filters.scope === "received"
          ? invoice.paidAmount > 0
          : filters.scope === "outstanding"
            ? invoice.balanceAmount > 0
            : filters.scope === "overdue"
              ? invoice.derivedStatus === "overdue"
              : true;

    const matchesOverdue = filters.overdueOnly ? invoice.derivedStatus === "overdue" : true;

    return matchesSearch && matchesStatus && matchesScope && matchesOverdue;
  });
}

export async function getInvoicesModuleData(filters: InvoiceFilters = {}) {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();
  const { clients, assessmentYears } = await getInvoiceReferenceData(session.workspace.id, filters.clientId);

  const [invoices, { data: invoiceSettings }] = await Promise.all([
    fetchInvoices(session.workspace.id, filters),
    supabase
      .from("workspace_invoice_settings")
      .select("rate_card, refund_charge_percentage, pdf_extraction_settings")
      .eq("workspace_id", session.workspace.id)
      .maybeSingle()
  ]);

  const totalInvoices = invoices.length;
  const pageSize = filters.pageSize ?? 12;
  const requestedPage = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(totalInvoices / pageSize));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (page - 1) * pageSize;
  const paginatedInvoices = invoices.slice(startIndex, startIndex + pageSize);

  const billableInvoices = invoices.filter((invoice) => !["draft", "cancelled"].includes(invoice.derivedStatus));
  const outstandingInvoices = billableInvoices.filter((invoice) => invoice.balanceAmount > 0);
  const overdueInvoices = outstandingInvoices.filter((invoice) => invoice.derivedStatus === "overdue");

  return {
    filters,
    page,
    pageSize,
    totalPages,
    clients,
    assessmentYears,
    invoices,
    paginatedInvoices,
    invoiceSettings: invoiceSettings ?? {
      rate_card: {
        "ITR-1": 500,
        "ITR-2": 1500,
        "ITR-3": 3000,
        "ITR-4": 2000,
        "ITR-5": 5000,
        "ITR-6": 10000,
        "ITR-7": 5000,
        "ITR-V": 500
      },
      refund_charge_percentage: 10,
      pdf_extraction_settings: {
        page_scope: "first_page",
        itr_form_pattern: "ITR-\\d[A-Z]?|ITR-V",
        refund_amount_pattern: "refund\\s*due|refund|refundable"
      }
    },
    summary: {
      billedAmount: Number(billableInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount ?? 0), 0).toFixed(2)),
      receivedAmount: Number(billableInvoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0).toFixed(2)),
      outstandingAmount: Number(outstandingInvoices.reduce((sum, invoice) => sum + invoice.balanceAmount, 0).toFixed(2)),
      overdueAmount: Number(overdueInvoices.reduce((sum, invoice) => sum + invoice.balanceAmount, 0).toFixed(2)),
      partialCount: billableInvoices.filter((invoice) => invoice.derivedStatus === "partially_paid").length,
      overdueCount: overdueInvoices.length,
    },
  };
}

export async function getClientInvoicesModuleData(clientId: string, filters: Omit<InvoiceFilters, "clientId"> = {}) {
  return getInvoicesModuleData({
    ...filters,
    clientId,
  });
}

export async function getInvoiceDetail(invoiceId: string) {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      clients!inner (id, full_name, pan_uppercase, mobile, email, address),
      assessment_years!inner (id, label, is_current),
      filing_cases (id, case_status, next_action, due_date),
      invoice_items (*),
      payments (*)
    `)
    .eq("workspace_id", session.workspace.id)
    .eq("id", invoiceId)
    .is("archived_at", null)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...normalizeInvoice(data as InvoiceDetailRow),
    workspaceName: session.workspace.name,
  };
}

function parseItemsJson(value: string) {
  try {
    return JSON.parse(value) as InvoiceItemInput[];
  } catch {
    return null;
  }
}

function mapZodError(error: ZodError) {
  const flattened = error.flatten();
  return flattened.formErrors[0] ?? Object.values(flattened.fieldErrors).flat()[0] ?? "Validation failed.";
}

export async function createInvoiceAction(
  _previousState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const items = parseItemsJson(String(formData.get("itemsJson") ?? ""));
  if (!items) {
    return { error: "Invoice items could not be parsed." };
  }

  const parsed = createInvoiceSchema.safeParse({
    clientId: String(formData.get("clientId") ?? "").trim(),
    assessmentYearId: String(formData.get("assessmentYearId") ?? "").trim(),
    discountAmount: String(formData.get("discountAmount") ?? "0").trim() || "0",
    notes: String(formData.get("notes") ?? "").trim(),
    items,
  });

  if (!parsed.success) {
    return { error: mapZodError(parsed.error) };
  }

  const { clientId, assessmentYearId, discountAmount, notes } = parsed.data;

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("workspace_id", session.workspace.id)
    .eq("id", clientId)
    .is("archived_at", null)
    .single();

  if (clientError || !client) {
    return { error: "Client not found in the active workspace." };
  }

  const { data: assessmentYear, error: assessmentYearError } = await supabase
    .from("assessment_years")
    .select("id")
    .eq("workspace_id", session.workspace.id)
    .eq("id", assessmentYearId)
    .single();

  if (assessmentYearError || !assessmentYear) {
    return { error: "Assessment year not found in the active workspace." };
  }

  const { data: filingCase, error: caseError } = await supabase
    .from("filing_cases")
    .select("id")
    .eq("workspace_id", session.workspace.id)
    .eq("client_id", clientId)
    .eq("assessment_year_id", assessmentYearId)
    .is("archived_at", null)
    .maybeSingle();

  if (caseError) {
    return { error: "Failed to resolve the client filing case for this assessment year." };
  }

  if (filingCase?.id) {
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("workspace_id", session.workspace.id)
      .eq("case_id", filingCase.id)
      .neq("status", "cancelled")
      .is("archived_at", null)
      .maybeSingle();

    if (existingInvoice) {
      return { error: "This filing case already has an active primary invoice." };
    }
  }

  // Insert the invoice first with discount_amount=0 so the check constraint
  // (discount_amount <= subtotal) is satisfied while subtotal is still 0.
  // Items are inserted next — the invoice_items_recalculate trigger then
  // recomputes subtotal and total_amount. Finally, if a discount was supplied,
  // we update discount_amount to the real value so the recalculate_invoice_after_discount
  // trigger can validate it against the now-populated subtotal.
  const invoiceInsert = {
    workspace_id: session.workspace.id,
    client_id: clientId,
    case_id: filingCase?.id ?? null,
    assessment_year_id: assessmentYearId,
    discount_amount: 0,
    notes: notes || null,
  };

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert(invoiceInsert as TablesInsert<"invoices">)
    .select("id, invoice_number, client_id")
    .single();

  if (invoiceError || !invoice) {
    return { error: `Failed to create the invoice draft: ${invoiceError?.message ?? "Unknown error"}` };
  }

  const itemRows = parsed.data.items.map((item, index) => ({
    workspace_id: session.workspace.id,
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_amount: item.unitAmount,
    display_order: index,
  }));

  const { error: itemsError } = await supabase.from("invoice_items").insert(itemRows);

  if (itemsError) {
    return { error: `Invoice draft was created, but its items failed to save: ${itemsError.message}` };
  }

  // Apply discount after items are inserted so subtotal is already computed.
  if (discountAmount > 0) {
    const { error: discountError } = await supabase
      .from("invoices")
      .update({ discount_amount: discountAmount })
      .eq("workspace_id", session.workspace.id)
      .eq("id", invoice.id);

    if (discountError) {
      return { error: `Invoice and items were saved, but the discount could not be applied: ${discountError.message}` };
    }
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: clientId,
    case_id: filingCase?.id ?? null,
    entity_type: "invoice",
    entity_id: invoice.id,
    action: "invoice_created",
    message: `Draft invoice ${invoice.invoice_number} was created.`,
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/invoices`);

  return {
    success: `Created draft invoice ${invoice.invoice_number}.`,
    invoiceId: invoice.id,
  };
}

export async function issueInvoiceAction(
  invoiceId: string,
  _previousState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const parsed = issueInvoiceSchema.safeParse({
    issueDate: String(formData.get("issueDate") ?? "").trim(),
    dueDate: String(formData.get("dueDate") ?? "").trim(),
  });

  if (!parsed.success) {
    return { error: mapZodError(parsed.error) };
  }

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, client_id, case_id, status, total_amount")
    .eq("workspace_id", session.workspace.id)
    .eq("id", invoiceId)
    .is("archived_at", null)
    .single();

  if (fetchError || !invoice) {
    return { error: "Invoice not found." };
  }

  if (invoice.status !== "draft") {
    return { error: "Only draft invoices can be issued." };
  }

  if (Number(invoice.total_amount ?? 0) <= 0) {
    return { error: "Draft invoice total must be greater than zero before issue." };
  }

  const { error: issueError } = await supabase
    .from("invoices")
    .update({
      status: "issued",
      issue_date: parsed.data.issueDate,
      due_date: parsed.data.dueDate,
    })
    .eq("workspace_id", session.workspace.id)
    .eq("id", invoiceId);

  if (issueError) {
    return { error: `Failed to issue invoice: ${issueError.message}` };
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: invoice.client_id,
    case_id: invoice.case_id,
    entity_type: "invoice",
    entity_id: invoiceId,
    action: "invoice_issued",
    message: `Invoice ${invoiceId} was issued.`,
    metadata: parsed.data,
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/clients/${invoice.client_id}`);
  revalidatePath(`/clients/${invoice.client_id}/invoices`);

  return { success: "Invoice issued." };
}

export async function recordPaymentAction(
  invoiceId: string,
  _previousState: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const parsed = recordPaymentSchema.safeParse({
    paymentDate: String(formData.get("paymentDate") ?? "").trim(),
    amount: String(formData.get("amount") ?? "").trim(),
    mode: String(formData.get("mode") ?? "").trim(),
    reference: String(formData.get("reference") ?? "").trim(),
    note: String(formData.get("note") ?? "").trim(),
  });

  if (!parsed.success) {
    return { error: mapZodError(parsed.error) };
  }

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, client_id, case_id, status")
    .eq("workspace_id", session.workspace.id)
    .eq("id", invoiceId)
    .is("archived_at", null)
    .single();

  if (fetchError || !invoice) {
    return { error: "Invoice not found." };
  }

  if (!["issued", "partially_paid", "overdue"].includes(invoice.status)) {
    return { error: "Payments can only be recorded against issued unpaid invoices." };
  }

  const paymentInsert: TablesInsert<"payments"> = {
    workspace_id: session.workspace.id,
    invoice_id: invoiceId,
    payment_date: parsed.data.paymentDate,
    amount: parsed.data.amount,
    mode: parsed.data.mode,
    reference: parsed.data.reference || null,
    note: parsed.data.note || null,
    recorded_by: session.user.id,
  };

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert(paymentInsert)
    .select("id")
    .single();

  if (paymentError || !payment) {
    return { error: `Failed to record payment: ${paymentError?.message ?? "Unknown error"}` };
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    client_id: invoice.client_id,
    case_id: invoice.case_id,
    entity_type: "payment",
    entity_id: payment.id,
    action: "payment_recorded",
    message: `Payment was recorded against invoice ${invoiceId}.`,
    metadata: {
      invoice_id: invoiceId,
      amount: parsed.data.amount,
      mode: parsed.data.mode,
      payment_date: parsed.data.paymentDate,
    },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/clients/${invoice.client_id}`);
  revalidatePath(`/clients/${invoice.client_id}/invoices`);

  return { success: "Payment recorded." };
}
