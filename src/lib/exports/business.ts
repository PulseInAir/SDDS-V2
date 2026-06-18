import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import type { Json, Tables } from "@/types/database.types";

export const BUSINESS_EXPORT_DEFINITIONS = [
  {
    key: "clients",
    label: "Clients",
    description: "Permanent client identities, follow-up exclusions, and contact fields without credential payloads.",
    table: "clients",
    route: "/api/exports/clients",
  },
  {
    key: "filing-cases",
    label: "Filing cases",
    description: "Assessment-year case workflow, dates, blockers, and completion state.",
    table: "filing_cases",
    route: "/api/exports/filing-cases",
  },
  {
    key: "filing-records",
    label: "Filing records",
    description: "Original, revised, updated, belated, and rectification-linked filing history.",
    table: "filing_records",
    route: "/api/exports/filing-records",
  },
  {
    key: "documents",
    label: "Document metadata",
    description: "Private storage inventory, checklist state, versions, and recovery-safe metadata only.",
    table: "documents",
    route: "/api/exports/documents",
  },
  {
    key: "invoices",
    label: "Invoices",
    description: "Issued invoice records, totals, lifecycle dates, and case linkage.",
    table: "invoices",
    route: "/api/exports/invoices",
  },
  {
    key: "invoice-items",
    label: "Invoice items",
    description: "Line-item detail for reconciled invoice subtotal and pricing history.",
    table: "invoice_items",
    route: "/api/exports/invoice-items",
  },
  {
    key: "payments",
    label: "Payments",
    description: "Cash and UPI payment history, including reversal state and invoice linkage.",
    table: "payments",
    route: "/api/exports/payments",
  },
  {
    key: "refunds",
    label: "Refunds",
    description: "Expected, received, adjusted, and follow-up refund records.",
    table: "refunds",
    route: "/api/exports/refunds",
  },
  {
    key: "tax-events",
    label: "Tax events",
    description: "Intimations, notices, rectifications, deadlines, and closure history.",
    table: "tax_events",
    route: "/api/exports/tax-events",
  },
  {
    key: "follow-ups",
    label: "Follow-ups",
    description: "Annual and case follow-ups, exclusions, completion, and next action context.",
    table: "follow_ups",
    route: "/api/exports/follow-ups",
  },
  {
    key: "activity-summary",
    label: "Activity summary",
    description: "Append-only operational activity summary without decrypted credentials or signed links.",
    table: "activity_events",
    route: "/api/exports/activity-summary",
  },
] as const;

export type BusinessExportKey = (typeof BUSINESS_EXPORT_DEFINITIONS)[number]["key"];

type BusinessExportDefinition = (typeof BUSINESS_EXPORT_DEFINITIONS)[number];

type ExportAuditRecord = {
  id: string;
  action: string;
  message: string;
  created_at: string;
  metadata: Json;
};

type CountRecord = {
  key: BusinessExportKey;
  rowCount: number;
};

type ReferenceMaps = {
  assessmentYears: Map<string, string>;
  clients: Map<string, Pick<Tables<"clients">, "full_name" | "pan_uppercase">>;
  cases: Map<
    string,
    Pick<Tables<"filing_cases">, "client_id" | "assessment_year_id" | "case_status" | "return_category">
  >;
  invoices: Map<
    string,
    Pick<Tables<"invoices">, "invoice_number" | "client_id" | "case_id" | "assessment_year_id" | "status">
  >;
};

type ExportPageData = {
  workspaceName: string;
  exports: Array<BusinessExportDefinition & { rowCount: number }>;
  recentExports: Array<{
    id: string;
    createdAt: string;
    message: string;
    exportKey: string | null;
    rowCount: number | null;
  }>;
};

type ExportPayload = {
  content: string;
  definition: BusinessExportDefinition;
  filename: string;
  rowCount: number;
};

function isObject(value: Json | null | undefined): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getBusinessExportDefinition(exportKey: string): BusinessExportDefinition | null {
  return BUSINESS_EXPORT_DEFINITIONS.find((item) => item.key === exportKey) ?? null;
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized =
    typeof value === "string"
      ? value.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
      : typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : JSON.stringify(value);

  return /[",\n]/.test(normalized) ? `"${normalized.replace(/"/g, '""')}"` : normalized;
}

function buildCsv(headers: string[], rows: Array<Record<string, unknown>>) {
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ];

  return `\uFEFF${lines.join("\n")}`;
}

function buildFilename(exportKey: BusinessExportKey) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `sdds-${exportKey}-${timestamp}.csv`;
}

async function getReferenceMaps(workspaceId: string): Promise<ReferenceMaps> {
  const supabase = await createSupabaseServerClient();
  const [
    { data: assessmentYears, error: assessmentYearsError },
    { data: clients, error: clientsError },
    { data: cases, error: casesError },
    { data: invoices, error: invoicesError },
  ] = await Promise.all([
    supabase.from("assessment_years").select("id, label").eq("workspace_id", workspaceId),
    supabase.from("clients").select("id, full_name, pan_uppercase").eq("workspace_id", workspaceId),
    supabase
      .from("filing_cases")
      .select("id, client_id, assessment_year_id, case_status, return_category")
      .eq("workspace_id", workspaceId),
    supabase
      .from("invoices")
      .select("id, invoice_number, client_id, case_id, assessment_year_id, status")
      .eq("workspace_id", workspaceId),
  ]);

  if (assessmentYearsError || clientsError || casesError || invoicesError) {
    throw new Error("Failed to load export reference data.");
  }

  return {
    assessmentYears: new Map((assessmentYears ?? []).map((row) => [row.id, row.label])),
    clients: new Map((clients ?? []).map((row) => [row.id, row])),
    cases: new Map((cases ?? []).map((row) => [row.id, row])),
    invoices: new Map((invoices ?? []).map((row) => [row.id, row])),
  };
}

async function getCountRecords(workspaceId: string): Promise<CountRecord[]> {
  const supabase = await createSupabaseServerClient();
  const counts = await Promise.all(
    BUSINESS_EXPORT_DEFINITIONS.map(async (definition) => {
      const { count, error } = await supabase
        .from(definition.table)
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId);

      if (error) {
        throw new Error(`Failed to count ${definition.label.toLowerCase()}.`);
      }

      return {
        key: definition.key,
        rowCount: count ?? 0,
      };
    }),
  );

  return counts;
}

export async function getExportPageData(): Promise<ExportPageData> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();
  const [countRecords, recentExportsResult] = await Promise.all([
    getCountRecords(session.workspace.id),
    supabase
      .from("activity_events")
      .select("id, action, message, created_at, metadata")
      .eq("workspace_id", session.workspace.id)
      .eq("entity_type", "system")
      .eq("action", "business_export_generated")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (recentExportsResult.error) {
    throw new Error(`Failed to load recent export activity: ${recentExportsResult.error.message}`);
  }

  const countMap = new Map(countRecords.map((record) => [record.key, record.rowCount]));

  return {
    workspaceName: session.workspace.name,
    exports: BUSINESS_EXPORT_DEFINITIONS.map((definition) => ({
      ...definition,
      rowCount: countMap.get(definition.key) ?? 0,
    })),
    recentExports: ((recentExportsResult.data ?? []) as ExportAuditRecord[]).map((event) => {
      const metadata = isObject(event.metadata) ? event.metadata : {};
      return {
        id: event.id,
        createdAt: event.created_at,
        message: event.message,
        exportKey: typeof metadata.export_key === "string" ? metadata.export_key : null,
        rowCount: typeof metadata.row_count === "number" ? metadata.row_count : null,
      };
    }),
  };
}

async function exportClients(workspaceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, full_name, pan_uppercase, date_of_birth, mobile, email, address, family_group, active, follow_up_excluded, exclusion_reason, created_at, updated_at, archived_at",
    )
    .eq("workspace_id", workspaceId)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to export clients: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    client_id: row.id,
    full_name: row.full_name,
    pan_uppercase: row.pan_uppercase,
    date_of_birth: row.date_of_birth,
    mobile: row.mobile,
    email: row.email,
    address: row.address,
    family_group: row.family_group,
    active: row.active,
    follow_up_excluded: row.follow_up_excluded,
    exclusion_reason: row.exclusion_reason,
    created_at: row.created_at,
    updated_at: row.updated_at,
    archived_at: row.archived_at,
  }));
}

async function exportFilingCases(workspaceId: string, references: ReferenceMaps) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("filing_cases")
    .select(
      "id, client_id, assessment_year_id, case_status, return_category, next_action, due_date, expected_completion_date, blocker_code, blocker_note, hold_reason, next_review_date, completed_at, cancelled_at, follow_up_excluded, created_at, updated_at, archived_at",
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to export filing cases: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const client = references.clients.get(row.client_id);
    return {
      case_id: row.id,
      client_id: row.client_id,
      client_name: client?.full_name ?? null,
      client_pan: client?.pan_uppercase ?? null,
      assessment_year_id: row.assessment_year_id,
      assessment_year_label: references.assessmentYears.get(row.assessment_year_id) ?? null,
      case_status: row.case_status,
      return_category: row.return_category,
      next_action: row.next_action,
      due_date: row.due_date,
      expected_completion_date: row.expected_completion_date,
      blocker_code: row.blocker_code,
      blocker_note: row.blocker_note,
      hold_reason: row.hold_reason,
      next_review_date: row.next_review_date,
      completed_at: row.completed_at,
      cancelled_at: row.cancelled_at,
      follow_up_excluded: row.follow_up_excluded,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived_at: row.archived_at,
    };
  });
}

async function exportFilingRecords(workspaceId: string, references: ReferenceMaps) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("filing_records")
    .select(
      "id, case_id, filing_kind, parent_filing_record_id, filing_date, acknowledgement_number, verification_status, verification_date, processing_status, notes, created_at, updated_at, archived_at",
    )
    .eq("workspace_id", workspaceId)
    .order("filing_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to export filing records: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const filingCase = references.cases.get(row.case_id);
    const client = filingCase ? references.clients.get(filingCase.client_id) : null;
    return {
      filing_record_id: row.id,
      case_id: row.case_id,
      client_id: filingCase?.client_id ?? null,
      client_name: client?.full_name ?? null,
      client_pan: client?.pan_uppercase ?? null,
      assessment_year_id: filingCase?.assessment_year_id ?? null,
      assessment_year_label: filingCase ? references.assessmentYears.get(filingCase.assessment_year_id) ?? null : null,
      case_status: filingCase?.case_status ?? null,
      filing_kind: row.filing_kind,
      parent_filing_record_id: row.parent_filing_record_id,
      filing_date: row.filing_date,
      acknowledgement_number: row.acknowledgement_number,
      verification_status: row.verification_status,
      verification_date: row.verification_date,
      processing_status: row.processing_status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived_at: row.archived_at,
    };
  });
}

async function exportDocuments(workspaceId: string, references: ReferenceMaps) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, client_id, case_id, filing_record_id, assessment_year_id, document_type, checklist_status, storage_bucket, storage_path, original_filename, safe_filename, mime_type, size_bytes, checksum_sha256, version, replaces_document_id, uploaded_by, uploaded_at, verified_by, verified_at, archived_at",
    )
    .eq("workspace_id", workspaceId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to export document metadata: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const client = references.clients.get(row.client_id);
    return {
      document_id: row.id,
      client_id: row.client_id,
      client_name: client?.full_name ?? null,
      client_pan: client?.pan_uppercase ?? null,
      case_id: row.case_id,
      filing_record_id: row.filing_record_id,
      assessment_year_id: row.assessment_year_id,
      assessment_year_label: row.assessment_year_id ? references.assessmentYears.get(row.assessment_year_id) ?? null : null,
      document_type: row.document_type,
      checklist_status: row.checklist_status,
      storage_bucket: row.storage_bucket,
      storage_path: row.storage_path,
      original_filename: row.original_filename,
      safe_filename: row.safe_filename,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      checksum_sha256: row.checksum_sha256,
      version: row.version,
      replaces_document_id: row.replaces_document_id,
      uploaded_by: row.uploaded_by,
      uploaded_at: row.uploaded_at,
      verified_by: row.verified_by,
      verified_at: row.verified_at,
      archived_at: row.archived_at,
    };
  });
}

async function exportInvoices(workspaceId: string, references: ReferenceMaps) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, client_id, case_id, assessment_year_id, invoice_number, serial_number, status, issue_date, due_date, subtotal, discount_amount, total_amount, notes, issued_at, cancelled_at, created_at, updated_at, archived_at",
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to export invoices: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const client = references.clients.get(row.client_id);
    return {
      invoice_id: row.id,
      invoice_number: row.invoice_number,
      serial_number: row.serial_number,
      client_id: row.client_id,
      client_name: client?.full_name ?? null,
      client_pan: client?.pan_uppercase ?? null,
      case_id: row.case_id,
      assessment_year_id: row.assessment_year_id,
      assessment_year_label: references.assessmentYears.get(row.assessment_year_id) ?? null,
      status: row.status,
      issue_date: row.issue_date,
      due_date: row.due_date,
      subtotal: row.subtotal,
      discount_amount: row.discount_amount,
      total_amount: row.total_amount,
      notes: row.notes,
      issued_at: row.issued_at,
      cancelled_at: row.cancelled_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived_at: row.archived_at,
    };
  });
}

async function exportInvoiceItems(workspaceId: string, references: ReferenceMaps) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("invoice_items")
    .select("id, invoice_id, description, quantity, unit_amount, line_amount, display_order, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to export invoice items: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const invoice = references.invoices.get(row.invoice_id);
    const client = invoice ? references.clients.get(invoice.client_id) : null;
    return {
      invoice_item_id: row.id,
      invoice_id: row.invoice_id,
      invoice_number: invoice?.invoice_number ?? null,
      client_id: invoice?.client_id ?? null,
      client_name: client?.full_name ?? null,
      client_pan: client?.pan_uppercase ?? null,
      case_id: invoice?.case_id ?? null,
      assessment_year_id: invoice?.assessment_year_id ?? null,
      assessment_year_label: invoice ? references.assessmentYears.get(invoice.assessment_year_id) ?? null : null,
      invoice_status: invoice?.status ?? null,
      description: row.description,
      quantity: row.quantity,
      unit_amount: row.unit_amount,
      line_amount: row.line_amount,
      display_order: row.display_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

async function exportPayments(workspaceId: string, references: ReferenceMaps) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, invoice_id, payment_date, amount, mode, reference, note, recorded_by, created_at, reversed_at")
    .eq("workspace_id", workspaceId)
    .order("payment_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to export payments: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const invoice = references.invoices.get(row.invoice_id);
    const client = invoice ? references.clients.get(invoice.client_id) : null;
    return {
      payment_id: row.id,
      invoice_id: row.invoice_id,
      invoice_number: invoice?.invoice_number ?? null,
      client_id: invoice?.client_id ?? null,
      client_name: client?.full_name ?? null,
      client_pan: client?.pan_uppercase ?? null,
      case_id: invoice?.case_id ?? null,
      assessment_year_id: invoice?.assessment_year_id ?? null,
      assessment_year_label: invoice ? references.assessmentYears.get(invoice.assessment_year_id) ?? null : null,
      payment_date: row.payment_date,
      amount: row.amount,
      mode: row.mode,
      reference: row.reference,
      note: row.note,
      recorded_by: row.recorded_by,
      created_at: row.created_at,
      reversed_at: row.reversed_at,
    };
  });
}

async function exportRefunds(workspaceId: string, references: ReferenceMaps) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("refunds")
    .select(
      "id, client_id, case_id, filing_record_id, assessment_year_id, expected_amount, received_amount, status, expected_date, last_checked_at, received_date, next_action, notes, created_at, updated_at, archived_at",
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to export refunds: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const client = references.clients.get(row.client_id);
    return {
      refund_id: row.id,
      client_id: row.client_id,
      client_name: client?.full_name ?? null,
      client_pan: client?.pan_uppercase ?? null,
      case_id: row.case_id,
      filing_record_id: row.filing_record_id,
      assessment_year_id: row.assessment_year_id,
      assessment_year_label: references.assessmentYears.get(row.assessment_year_id) ?? null,
      expected_amount: row.expected_amount,
      received_amount: row.received_amount,
      status: row.status,
      expected_date: row.expected_date,
      last_checked_at: row.last_checked_at,
      received_date: row.received_date,
      next_action: row.next_action,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived_at: row.archived_at,
    };
  });
}

async function exportTaxEvents(workspaceId: string, references: ReferenceMaps) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tax_events")
    .select(
      "id, client_id, case_id, filing_record_id, assessment_year_id, event_type, category, status, issue_date, received_date, response_due_date, submission_date, closure_date, reference_number, amount, next_action, notes, created_at, updated_at, archived_at",
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to export tax events: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const client = references.clients.get(row.client_id);
    return {
      tax_event_id: row.id,
      client_id: row.client_id,
      client_name: client?.full_name ?? null,
      client_pan: client?.pan_uppercase ?? null,
      case_id: row.case_id,
      filing_record_id: row.filing_record_id,
      assessment_year_id: row.assessment_year_id,
      assessment_year_label: references.assessmentYears.get(row.assessment_year_id) ?? null,
      event_type: row.event_type,
      category: row.category,
      status: row.status,
      issue_date: row.issue_date,
      received_date: row.received_date,
      response_due_date: row.response_due_date,
      submission_date: row.submission_date,
      closure_date: row.closure_date,
      reference_number: row.reference_number,
      amount: row.amount,
      next_action: row.next_action,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived_at: row.archived_at,
    };
  });
}

async function exportFollowUps(workspaceId: string, references: ReferenceMaps) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("follow_ups")
    .select(
      "id, client_id, case_id, assessment_year_id, follow_up_type, status, due_date, completed_at, excluded_at, exclusion_reason, next_action, notes, created_at, updated_at, archived_at",
    )
    .eq("workspace_id", workspaceId)
    .order("due_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to export follow-ups: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const client = references.clients.get(row.client_id);
    return {
      follow_up_id: row.id,
      client_id: row.client_id,
      client_name: client?.full_name ?? null,
      client_pan: client?.pan_uppercase ?? null,
      case_id: row.case_id,
      assessment_year_id: row.assessment_year_id,
      assessment_year_label: row.assessment_year_id ? references.assessmentYears.get(row.assessment_year_id) ?? null : null,
      follow_up_type: row.follow_up_type,
      status: row.status,
      due_date: row.due_date,
      completed_at: row.completed_at,
      excluded_at: row.excluded_at,
      exclusion_reason: row.exclusion_reason,
      next_action: row.next_action,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived_at: row.archived_at,
    };
  });
}

async function exportActivitySummary(workspaceId: string, references: ReferenceMaps) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select("id, actor_id, client_id, case_id, entity_type, entity_id, action, message, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to export activity summary: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const client = row.client_id ? references.clients.get(row.client_id) : null;
    const filingCase = row.case_id ? references.cases.get(row.case_id) : null;
    return {
      activity_event_id: row.id,
      created_at: row.created_at,
      actor_id: row.actor_id,
      client_id: row.client_id,
      client_name: client?.full_name ?? null,
      client_pan: client?.pan_uppercase ?? null,
      case_id: row.case_id,
      assessment_year_id: filingCase?.assessment_year_id ?? null,
      assessment_year_label: filingCase ? references.assessmentYears.get(filingCase.assessment_year_id) ?? null : null,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      action: row.action,
      message: row.message,
    };
  });
}

async function createRowsForExport(exportKey: BusinessExportKey, workspaceId: string, references: ReferenceMaps) {
  switch (exportKey) {
    case "clients":
      return exportClients(workspaceId);
    case "filing-cases":
      return exportFilingCases(workspaceId, references);
    case "filing-records":
      return exportFilingRecords(workspaceId, references);
    case "documents":
      return exportDocuments(workspaceId, references);
    case "invoices":
      return exportInvoices(workspaceId, references);
    case "invoice-items":
      return exportInvoiceItems(workspaceId, references);
    case "payments":
      return exportPayments(workspaceId, references);
    case "refunds":
      return exportRefunds(workspaceId, references);
    case "tax-events":
      return exportTaxEvents(workspaceId, references);
    case "follow-ups":
      return exportFollowUps(workspaceId, references);
    case "activity-summary":
      return exportActivitySummary(workspaceId, references);
  }
}

export async function generateBusinessExportCsv(exportKey: string): Promise<ExportPayload> {
  const definition = getBusinessExportDefinition(exportKey);
  if (!definition) {
    throw new Error("Unknown export set.");
  }

  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();
  const references = await getReferenceMaps(session.workspace.id);
  const rows = await createRowsForExport(definition.key, session.workspace.id, references);
  const headers = rows.length > 0 ? (Object.keys(rows[0]) as string[]) : [];
  const content = buildCsv(headers, rows);
  const filename = buildFilename(definition.key);

  const { error: auditError } = await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    entity_type: "system",
    action: "business_export_generated",
    message: `Business export ${definition.key} was generated.`,
    metadata: {
      export_key: definition.key,
      format: "csv",
      row_count: rows.length,
      filename,
    },
  });

  if (auditError) {
    throw new Error(`Export audit failed: ${auditError.message}`);
  }

  return {
    content,
    definition,
    filename,
    rowCount: rows.length,
  };
}
