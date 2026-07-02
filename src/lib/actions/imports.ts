"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { parseCsv, CSV_HEADERS } from "@/lib/imports/csv";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_IMPORT_SIZE_BYTES = 1024 * 1024;

const CASE_STATUSES = new Set([
  "New Client",
  "Filing Queue",
  "Filed",
]);

const RETURN_CATEGORIES = new Set([
  "ITR-1",
  "ITR-2",
  "ITR-3",
  "ITR-4",
  "ITR-5",
  "ITR-6",
  "ITR-7",
]);

const FILING_KIND_MAP: Record<string, string> = {
  original: "original",
  revised: "revised",
  updated: "updated",
  belated: "belated",
  "rectification request": "rectification_request",
  "rectification response": "rectification_response",
};

const VERIFICATION_STATUS_MAP: Record<string, string> = {
  pending: "pending",
  "e-verified": "e_verified",
  everified: "e_verified",
  "physical verified": "physical_verified",
  "itr-v received": "physical_verified",
  failed: "failed",
  "attention required": "failed",
  "not required": "not_required",
};

const PROCESSING_STATUS_MAP: Record<string, string> = {
  submitted: "submitted",
  processing: "processing",
  processed: "processed",
  defective: "defective",
  invalid: "invalid",
  withdrawn: "withdrawn",
};

const PAYMENT_MODE_MAP: Record<string, "cash" | "upi"> = {
  cash: "cash",
  upi: "upi",
};

export type ImportActionState = {
  error?: string;
};

type ImportJobRecord = {
  id: string;
  import_type: string;
  status: string;
  source_filename: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  committed_rows: number;
  error_summary: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
};

type ImportRowRecord = {
  id: string;
  row_number: number;
  action: "create" | "update" | "skip" | "error";
  row_status: "valid" | "error" | "skipped" | "committed";
  source_key: string;
  errors: string[];
  source_row: Record<string, string>;
  normalized_row: NormalizedImportRow | Record<string, unknown>;
  outcome: Record<string, unknown>;
  committed_at: string | null;
};

type NormalizedImportRow = {
  clientFullName: string;
  pan: string;
  dateOfBirth: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  familyGroup: string | null;
  assessmentYearId: string;
  assessmentYearLabel: string;
  caseStatus: string;
  returnCategory: string | null;
  nextAction: string | null;
  dueDate: string | null;
  expectedCompletionDate: string | null;
  blockerCode: string | null;
  blockerNote: string | null;
  followUpExcluded: boolean;
  filingKind: string | null;
  filingDate: string | null;
  acknowledgementNumber: string | null;
  verificationStatus: string | null;
  verificationDate: string | null;
  processingStatus: string | null;
  filingNotes: string | null;
  sourceInvoiceReference: string | null;
  invoiceIssueDate: string | null;
  invoiceDueDate: string | null;
  invoiceItemDescription: string | null;
  invoiceItemQuantity: number | null;
  invoiceItemUnitAmount: number | null;
  invoiceDiscountAmount: number;
  invoiceNotes: string | null;
  paymentDate: string | null;
  paymentAmount: number | null;
  paymentMode: "cash" | "upi" | null;
  paymentReference: string | null;
  paymentNote: string | null;
};

type DryRunOutcome = {
  plannedOperations: string[];
  warnings: string[];
};

type ImportPageData = {
  selectedJob: {
    job: ImportJobRecord;
    rows: ImportRowRecord[];
  } | null;
  recentJobs: ImportJobRecord[];
  templateHeaders: string[];
};

type WorkspaceReferenceData = {
  assessmentYears: Array<{ id: string; label: string }>;
  clients: Array<{
    id: string;
    full_name: string;
    pan_uppercase: string;
    date_of_birth: string | null;
    mobile: string | null;
    email: string | null;
    address: string | null;
    family_group: string | null;
  }>;
  filingCases: Array<{
    id: string;
    client_id: string;
    assessment_year_id: string;
    case_status: string;
    return_category: string | null;
    next_action: string | null;
    due_date: string | null;
    expected_completion_date: string | null;
    blocker_code: string | null;
    blocker_note: string | null;
    follow_up_excluded: boolean;
  }>;
  filingRecords: Array<{
    id: string;
    case_id: string;
    filing_kind: string;
    filing_date: string;
    acknowledgement_number: string | null;
  }>;
  invoices: Array<{
    id: string;
    case_id: string | null;
    client_id: string;
    assessment_year_id: string;
    status: string;
    issue_date: string | null;
    due_date: string | null;
  }>;
  committedSourceKeys: Set<string>;
};

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePan(value: string | null | undefined) {
  const normalized = normalizeText(value)?.toUpperCase() ?? null;
  if (!normalized) {
    return null;
  }

  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalized) ? normalized : null;
}

function normalizeDate(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function normalizeMoney(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Number(parsed.toFixed(2));
}

function normalizePositiveMoney(value: string | null | undefined) {
  const normalized = normalizeMoney(value);
  if (normalized === null || normalized <= 0) {
    return null;
  }

  return normalized;
}

function normalizePositiveNumber(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Number(parsed.toFixed(2));
}

function normalizeBoolean(value: string | null | undefined) {
  const normalized = normalizeText(value)?.toLowerCase();
  if (!normalized) {
    return false;
  }

  return ["true", "yes", "1"].includes(normalized);
}

function mapControlledValue<T extends string>(value: string | null, mapping: Record<string, T>) {
  if (!value) {
    return null;
  }

  return mapping[value.toLowerCase()] ?? null;
}

function hashSourceKey(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getImportSummaryRows(rows: Array<{ action: string; rowStatus: string }>) {
  const summary = {
    create: 0,
    update: 0,
    skip: 0,
    error: 0,
  };

  for (const row of rows) {
    if (row.rowStatus === "error") {
      summary.error += 1;
    } else if (row.action === "create") {
      summary.create += 1;
    } else if (row.action === "update") {
      summary.update += 1;
    } else {
      summary.skip += 1;
    }
  }

  return summary;
}

async function getWorkspaceReferenceData(workspaceId: string): Promise<WorkspaceReferenceData> {
  const supabase = await createSupabaseServerClient();

  const [
    { data: assessmentYears, error: assessmentYearsError },
    { data: clients, error: clientsError },
    { data: filingCases, error: filingCasesError },
    { data: filingRecords, error: filingRecordsError },
    { data: invoices, error: invoicesError },
    { data: committedSourceKeys, error: committedSourceKeysError },
  ] = await Promise.all([
    supabase
      .from("assessment_years")
      .select("id, label")
      .eq("workspace_id", workspaceId),
    supabase
      .from("clients")
      .select("id, full_name, pan_uppercase, date_of_birth, mobile, email, address, family_group")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null),
    supabase
      .from("filing_cases")
      .select("id, client_id, assessment_year_id, case_status, return_category, next_action, due_date, expected_completion_date, blocker_code, blocker_note, follow_up_excluded")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null),
    supabase
      .from("filing_records")
      .select("id, case_id, filing_kind, filing_date, acknowledgement_number")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null),
    supabase
      .from("invoices")
      .select("id, case_id, client_id, assessment_year_id, status, issue_date, due_date")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null),
    supabase
      .from("import_rows")
      .select("source_key")
      .eq("workspace_id", workspaceId)
      .eq("row_status", "committed")
      .is("archived_at", null),
  ]);

  if (assessmentYearsError || clientsError || filingCasesError || filingRecordsError || invoicesError || committedSourceKeysError) {
    throw new Error("Failed to load import reference data.");
  }

  return {
    assessmentYears: assessmentYears ?? [],
    clients: clients ?? [],
    filingCases: filingCases ?? [],
    filingRecords: filingRecords ?? [],
    invoices: invoices ?? [],
    committedSourceKeys: new Set((committedSourceKeys ?? []).map((row) => row.source_key)),
  };
}

function buildSourceRow(headers: readonly string[], values: string[]) {
  return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])) as Record<string, string>;
}

function normalizeImportRow(
  sourceRow: Record<string, string>,
  assessmentYearMap: Map<string, { id: string; label: string }>,
) {
  const errors: string[] = [];

  const clientFullName = normalizeText(sourceRow.client_full_name);
  if (!clientFullName) {
    errors.push("Client full name is required.");
  }

  const pan = normalizePan(sourceRow.pan);
  if (!pan) {
    errors.push("PAN must use the canonical 10-character format.");
  }

  const assessmentYearLabel = normalizeText(sourceRow.assessment_year);
  const assessmentYear = assessmentYearLabel ? assessmentYearMap.get(assessmentYearLabel) : null;
  if (!assessmentYear) {
    errors.push("Assessment year must match a configured SDDS assessment year label.");
  }

  const caseStatus = normalizeText(sourceRow.case_status);
  if (!caseStatus || !CASE_STATUSES.has(caseStatus)) {
    errors.push("Case status must use one of the approved filing workflow labels.");
  }

  const returnCategory = normalizeText(sourceRow.return_category);
  if (returnCategory && !RETURN_CATEGORIES.has(returnCategory)) {
    errors.push("Return category must be one of ITR-1 through ITR-7.");
  }

  const dateOfBirth = normalizeText(sourceRow.date_of_birth) ? normalizeDate(sourceRow.date_of_birth) : null;
  if (normalizeText(sourceRow.date_of_birth) && !dateOfBirth) {
    errors.push("Date of birth must use YYYY-MM-DD.");
  }

  const dueDate = normalizeText(sourceRow.due_date) ? normalizeDate(sourceRow.due_date) : null;
  if (normalizeText(sourceRow.due_date) && !dueDate) {
    errors.push("Due date must use YYYY-MM-DD.");
  }

  const expectedCompletionDate = normalizeText(sourceRow.expected_completion_date)
    ? normalizeDate(sourceRow.expected_completion_date)
    : null;
  if (normalizeText(sourceRow.expected_completion_date) && !expectedCompletionDate) {
    errors.push("Expected completion date must use YYYY-MM-DD.");
  }

  const filingKind = mapControlledValue(normalizeText(sourceRow.filing_kind), FILING_KIND_MAP);
  const filingDate = normalizeText(sourceRow.filing_date) ? normalizeDate(sourceRow.filing_date) : null;
  const acknowledgementNumber = normalizeText(sourceRow.acknowledgement_number);
  const verificationStatus = mapControlledValue(normalizeText(sourceRow.verification_status), VERIFICATION_STATUS_MAP);
  const verificationDate = normalizeText(sourceRow.verification_date) ? normalizeDate(sourceRow.verification_date) : null;
  const processingStatus = mapControlledValue(normalizeText(sourceRow.processing_status), PROCESSING_STATUS_MAP);
  const filingNotes = normalizeText(sourceRow.filing_notes);
  const hasFilingData = Boolean(
    normalizeText(sourceRow.filing_kind) ||
      normalizeText(sourceRow.filing_date) ||
      acknowledgementNumber ||
      normalizeText(sourceRow.verification_status) ||
      normalizeText(sourceRow.processing_status) ||
      filingNotes,
  );

  if (hasFilingData) {
    if (!filingKind) {
      errors.push("Filing kind must use an approved value when filing data is supplied.");
    }
    if (!filingDate) {
      errors.push("Filing date is required when filing data is supplied.");
    }
    if (normalizeText(sourceRow.verification_status) && !verificationStatus) {
      errors.push("Verification status must use an approved value.");
    }
    if (normalizeText(sourceRow.verification_date) && !verificationDate) {
      errors.push("Verification date must use YYYY-MM-DD.");
    }
    if (normalizeText(sourceRow.processing_status) && !processingStatus) {
      errors.push("Processing status must use an approved value.");
    }
    if (verificationStatus === "e_verified" || verificationStatus === "physical_verified") {
      if (!verificationDate) {
        errors.push("Verified filings must include a verification date.");
      }
    }
  }

  const sourceInvoiceReference = normalizeText(sourceRow.source_invoice_reference);
  const invoiceIssueDate = normalizeText(sourceRow.invoice_issue_date) ? normalizeDate(sourceRow.invoice_issue_date) : null;
  const invoiceDueDate = normalizeText(sourceRow.invoice_due_date) ? normalizeDate(sourceRow.invoice_due_date) : null;
  const invoiceItemDescription = normalizeText(sourceRow.invoice_item_description);
  const invoiceItemQuantity = normalizeText(sourceRow.invoice_item_quantity)
    ? normalizePositiveNumber(sourceRow.invoice_item_quantity)
    : null;
  const invoiceItemUnitAmount = normalizeText(sourceRow.invoice_item_unit_amount)
    ? normalizeMoney(sourceRow.invoice_item_unit_amount)
    : null;
  const invoiceDiscountAmountRaw = normalizeText(sourceRow.invoice_discount_amount)
    ? normalizeMoney(sourceRow.invoice_discount_amount)
    : 0;
  const invoiceNotes = normalizeText(sourceRow.invoice_notes);
  const hasInvoiceData = Boolean(
    sourceInvoiceReference ||
      normalizeText(sourceRow.invoice_issue_date) ||
      normalizeText(sourceRow.invoice_due_date) ||
      invoiceItemDescription ||
      normalizeText(sourceRow.invoice_item_quantity) ||
      normalizeText(sourceRow.invoice_item_unit_amount) ||
      normalizeText(sourceRow.invoice_discount_amount) ||
      invoiceNotes,
  );

  if (hasInvoiceData) {
    if (!invoiceIssueDate) {
      errors.push("Invoice issue date is required when invoice data is supplied.");
    }
    if (!invoiceDueDate) {
      errors.push("Invoice due date is required when invoice data is supplied.");
    }
    if (invoiceIssueDate && invoiceDueDate && invoiceDueDate < invoiceIssueDate) {
      errors.push("Invoice due date cannot be earlier than the issue date.");
    }
    if (!invoiceItemDescription) {
      errors.push("Invoice item description is required when invoice data is supplied.");
    }
    if (!invoiceItemQuantity) {
      errors.push("Invoice item quantity must be greater than zero.");
    }
    if (invoiceItemUnitAmount === null) {
      errors.push("Invoice item unit amount must be zero or greater.");
    }
    if (
      invoiceItemQuantity !== null &&
      invoiceItemUnitAmount !== null &&
      invoiceDiscountAmountRaw !== null &&
      invoiceDiscountAmountRaw > Number((invoiceItemQuantity * invoiceItemUnitAmount).toFixed(2))
    ) {
      errors.push("Invoice discount cannot exceed the imported subtotal.");
    }
    if (normalizeText(sourceRow.invoice_discount_amount) && invoiceDiscountAmountRaw === null) {
      errors.push("Invoice discount amount must be zero or greater.");
    }
  }

  const paymentDate = normalizeText(sourceRow.payment_date) ? normalizeDate(sourceRow.payment_date) : null;
  const paymentAmount = normalizeText(sourceRow.payment_amount) ? normalizePositiveMoney(sourceRow.payment_amount) : null;
  const paymentMode = mapControlledValue(normalizeText(sourceRow.payment_mode), PAYMENT_MODE_MAP);
  const paymentReference = normalizeText(sourceRow.payment_reference);
  const paymentNote = normalizeText(sourceRow.payment_note);
  const hasPaymentData = Boolean(
    normalizeText(sourceRow.payment_date) ||
      normalizeText(sourceRow.payment_amount) ||
      normalizeText(sourceRow.payment_mode) ||
      paymentReference ||
      paymentNote,
  );

  if (hasPaymentData) {
    if (!hasInvoiceData) {
      errors.push("Payment data requires an invoice in the same CSV row.");
    }
    if (!paymentDate) {
      errors.push("Payment date is required when payment data is supplied.");
    }
    if (!paymentAmount) {
      errors.push("Payment amount must be greater than zero.");
    }
    if (!paymentMode) {
      errors.push("Payment mode must be Cash or UPI.");
    }
  }

  return {
    errors,
    normalizedRow: {
      clientFullName: clientFullName ?? "",
      pan: pan ?? "",
      dateOfBirth,
      mobile: normalizeText(sourceRow.mobile),
      email: normalizeText(sourceRow.email),
      address: normalizeText(sourceRow.address),
      familyGroup: normalizeText(sourceRow.family_group),
      assessmentYearId: assessmentYear?.id ?? "",
      assessmentYearLabel: assessmentYear?.label ?? "",
      caseStatus: caseStatus ?? "",
      returnCategory,
      nextAction: normalizeText(sourceRow.next_action),
      dueDate,
      expectedCompletionDate,
      blockerCode: normalizeText(sourceRow.blocker_code),
      blockerNote: normalizeText(sourceRow.blocker_note),
      followUpExcluded: normalizeBoolean(sourceRow.follow_up_excluded),
      filingKind: hasFilingData ? filingKind : null,
      filingDate: hasFilingData ? filingDate : null,
      acknowledgementNumber,
      verificationStatus: hasFilingData ? verificationStatus : null,
      verificationDate: hasFilingData ? verificationDate : null,
      processingStatus: hasFilingData ? processingStatus : null,
      filingNotes,
      sourceInvoiceReference,
      invoiceIssueDate: hasInvoiceData ? invoiceIssueDate : null,
      invoiceDueDate: hasInvoiceData ? invoiceDueDate : null,
      invoiceItemDescription,
      invoiceItemQuantity,
      invoiceItemUnitAmount,
      invoiceDiscountAmount: invoiceDiscountAmountRaw ?? 0,
      invoiceNotes,
      paymentDate: hasPaymentData ? paymentDate : null,
      paymentAmount,
      paymentMode: hasPaymentData ? paymentMode : null,
      paymentReference,
      paymentNote,
    } satisfies NormalizedImportRow,
  };
}

function determineRowIntent(
  normalizedRow: NormalizedImportRow,
  sourceKey: string,
  referenceData: WorkspaceReferenceData,
) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const plannedOperations: string[] = [];
  let action: "create" | "update" | "skip" | "error" = "skip";
  let rowStatus: "valid" | "error" | "skipped" = "skipped";

  if (referenceData.committedSourceKeys.has(sourceKey)) {
    return {
      action: "skip" as const,
      rowStatus: "skipped" as const,
      errors,
      outcome: {
        plannedOperations: ["Row already committed by a previous import job."],
        warnings,
      } satisfies DryRunOutcome,
    };
  }

  const client = referenceData.clients.find((candidate) => candidate.pan_uppercase === normalizedRow.pan) ?? null;
  if (!client) {
    plannedOperations.push("Create client");
    action = "create";
    rowStatus = "valid";
  } else {
    const conflictingFields: string[] = [];
    if (client.full_name !== normalizedRow.clientFullName) {
      conflictingFields.push("full name");
    }
    if (client.date_of_birth && normalizedRow.dateOfBirth && client.date_of_birth !== normalizedRow.dateOfBirth) {
      conflictingFields.push("date of birth");
    }

    if (conflictingFields.length > 0) {
      errors.push(`Existing client data conflicts on ${conflictingFields.join(" and ")}.`);
    } else {
      const enrichableFields = [
        ["mobile", client.mobile, normalizedRow.mobile],
        ["email", client.email, normalizedRow.email],
        ["address", client.address, normalizedRow.address],
        ["family group", client.family_group, normalizedRow.familyGroup],
      ] as const;

      if (enrichableFields.some(([, current, incoming]) => !current && incoming)) {
        plannedOperations.push("Enrich client profile");
        action = "update";
        rowStatus = "valid";
      }
    }
  }

  const filingCase =
    client
      ? referenceData.filingCases.find(
          (candidate) =>
            candidate.client_id === client.id && candidate.assessment_year_id === normalizedRow.assessmentYearId,
        ) ?? null
      : null;

  if (!filingCase) {
    plannedOperations.push("Create filing case");
    action = action === "create" ? "create" : "update";
    rowStatus = "valid";
  } else {
    if (filingCase.case_status !== normalizedRow.caseStatus) {
      errors.push("Existing filing case already has a different workflow status.");
    }
    if (filingCase.return_category && normalizedRow.returnCategory && filingCase.return_category !== normalizedRow.returnCategory) {
      errors.push("Existing filing case already has a different return category.");
    }

    const canEnrichCase =
      (!filingCase.next_action && normalizedRow.nextAction) ||
      (!filingCase.due_date && normalizedRow.dueDate) ||
      (!filingCase.expected_completion_date && normalizedRow.expectedCompletionDate) ||
      (!filingCase.blocker_code && normalizedRow.blockerCode) ||
      (!filingCase.blocker_note && normalizedRow.blockerNote) ||
      (!filingCase.follow_up_excluded && normalizedRow.followUpExcluded);

    if (canEnrichCase) {
      plannedOperations.push("Enrich filing case");
      if (action !== "create") {
        action = "update";
      }
      rowStatus = "valid";
    }
  }

  if (normalizedRow.filingKind && normalizedRow.filingDate) {
    const matchingRecord = filingCase
      ? referenceData.filingRecords.find((candidate) => {
          if (candidate.case_id !== filingCase.id) {
            return false;
          }

          if (normalizedRow.acknowledgementNumber) {
            return candidate.acknowledgement_number === normalizedRow.acknowledgementNumber;
          }

          return candidate.filing_kind === normalizedRow.filingKind && candidate.filing_date === normalizedRow.filingDate;
        }) ?? null
      : null;

    if (matchingRecord) {
      warnings.push("Matching filing record already exists and will be left unchanged.");
    } else {
      plannedOperations.push("Create filing record");
      if (action !== "create") {
        action = "update";
      }
      rowStatus = "valid";
    }
  }

  if (normalizedRow.invoiceIssueDate && normalizedRow.invoiceDueDate && normalizedRow.invoiceItemDescription) {
    if (filingCase) {
      const activeInvoice = referenceData.invoices.find(
        (candidate) => candidate.case_id === filingCase.id && candidate.status !== "cancelled",
      );

      if (activeInvoice) {
        errors.push("Existing filing case already has an active invoice, so this import row would be ambiguous.");
      } else {
        plannedOperations.push("Create invoice");
        if (normalizedRow.paymentAmount && normalizedRow.invoiceItemQuantity && normalizedRow.invoiceItemUnitAmount !== null) {
          const subtotal = Number((normalizedRow.invoiceItemQuantity * normalizedRow.invoiceItemUnitAmount).toFixed(2));
          const invoiceTotal = Number((subtotal - normalizedRow.invoiceDiscountAmount).toFixed(2));

          if (normalizedRow.paymentAmount > invoiceTotal) {
            errors.push("Payment amount cannot exceed the imported invoice total.");
          } else {
            plannedOperations.push("Record payment");
          }
        }

        if (action !== "create") {
          action = "update";
        }
        rowStatus = "valid";
      }
    } else {
      plannedOperations.push("Create invoice");
      if (normalizedRow.paymentAmount) {
        plannedOperations.push("Record payment");
      }
      if (action !== "create") {
        action = "update";
      }
      rowStatus = "valid";
    }
  }

  if (errors.length > 0) {
    return {
      action: "error" as const,
      rowStatus: "error" as const,
      errors,
      outcome: {
        plannedOperations,
        warnings,
      } satisfies DryRunOutcome,
    };
  }

  if (plannedOperations.length === 0) {
    return {
      action: "skip" as const,
      rowStatus: "skipped" as const,
      errors,
      outcome: {
        plannedOperations: ["Row does not add or enrich any importable business record."],
        warnings,
      } satisfies DryRunOutcome,
    };
  }

  return {
    action,
    rowStatus,
    errors,
    outcome: {
      plannedOperations,
      warnings,
    } satisfies DryRunOutcome,
  };
}

function buildSourceKey(row: NormalizedImportRow) {
  const invoiceIdentity = row.sourceInvoiceReference
    ? `source-invoice:${row.sourceInvoiceReference}`
    : row.invoiceIssueDate && row.invoiceDueDate && row.invoiceItemDescription && row.invoiceItemQuantity && row.invoiceItemUnitAmount !== null
      ? `invoice:${row.invoiceIssueDate}|${row.invoiceDueDate}|${row.invoiceItemDescription}|${row.invoiceItemQuantity}|${row.invoiceItemUnitAmount}|${row.invoiceDiscountAmount}`
      : "invoice:none";

  const filingIdentity = row.acknowledgementNumber
    ? `ack:${row.acknowledgementNumber}`
    : row.filingKind && row.filingDate
      ? `filing:${row.filingKind}|${row.filingDate}`
      : "filing:none";

  const paymentIdentity =
    row.paymentDate && row.paymentAmount && row.paymentMode
      ? `payment:${row.paymentDate}|${row.paymentAmount}|${row.paymentMode}|${row.paymentReference ?? ""}`
      : "payment:none";

  return hashSourceKey(
    [
      row.pan,
      row.assessmentYearLabel,
      row.caseStatus,
      filingIdentity,
      invoiceIdentity,
      paymentIdentity,
    ].join("|"),
  );
}

function appendImportedReference(notes: string | null, sourceInvoiceReference: string | null) {
  if (!sourceInvoiceReference) {
    return notes;
  }

  const importedTag = `Imported source reference: ${sourceInvoiceReference}`;
  if (notes?.includes(importedTag)) {
    return notes;
  }

  return notes ? `${notes}\n${importedTag}` : importedTag;
}

async function createOrUpdateClient(
  workspaceId: string,
  userId: string,
  row: NormalizedImportRow,
) {
  const supabase = await createSupabaseServerClient();

  const { data: existingClient } = await supabase
    .from("clients")
    .select("id, full_name, date_of_birth, mobile, email, address, family_group")
    .eq("workspace_id", workspaceId)
    .eq("pan_uppercase", row.pan)
    .is("archived_at", null)
    .maybeSingle();

  if (!existingClient) {
    const { data: insertedClient, error } = await supabase
      .from("clients")
      .insert({
        workspace_id: workspaceId,
        full_name: row.clientFullName,
        pan_uppercase: row.pan,
        date_of_birth: row.dateOfBirth,
        mobile: row.mobile,
        email: row.email,
        address: row.address,
        family_group: row.familyGroup,
        active: true,
        follow_up_excluded: false,
        exclusion_reason: null,
      })
      .select("id")
      .single();

    if (error || !insertedClient) {
      throw new Error(`Failed to create client ${row.pan}.`);
    }

    await supabase.from("activity_events").insert({
      workspace_id: workspaceId,
      actor_id: userId,
      client_id: insertedClient.id,
      entity_type: "client",
      entity_id: insertedClient.id,
      action: "import_client_created",
      message: `Client ${row.clientFullName} was created from a CSV import.`,
      metadata: {
        pan: row.pan,
      },
    });

    return insertedClient.id;
  }

  const clientPatch = {
    mobile: existingClient.mobile ?? row.mobile,
    email: existingClient.email ?? row.email,
    address: existingClient.address ?? row.address,
    family_group: existingClient.family_group ?? row.familyGroup,
  };

  const hasPatch = Object.entries(clientPatch).some(([key, value]) => {
    const currentValue = existingClient[key as keyof typeof existingClient];
    return currentValue !== value;
  });

  if (hasPatch) {
    const { error } = await supabase
      .from("clients")
      .update(clientPatch)
      .eq("workspace_id", workspaceId)
      .eq("id", existingClient.id);

    if (error) {
      throw new Error(`Failed to enrich client ${row.pan}.`);
    }

    await supabase.from("activity_events").insert({
      workspace_id: workspaceId,
      actor_id: userId,
      client_id: existingClient.id,
      entity_type: "client",
      entity_id: existingClient.id,
      action: "import_client_enriched",
      message: `Client ${row.clientFullName} was enriched from a CSV import.`,
      metadata: {
        pan: row.pan,
      },
    });
  }

  return existingClient.id;
}

async function createOrUpdateCase(
  workspaceId: string,
  userId: string,
  clientId: string,
  row: NormalizedImportRow,
) {
  const supabase = await createSupabaseServerClient();

  const { data: existingCase } = await supabase
    .from("filing_cases")
    .select("id, next_action, due_date, expected_completion_date, blocker_code, blocker_note, follow_up_excluded")
    .eq("workspace_id", workspaceId)
    .eq("client_id", clientId)
    .eq("assessment_year_id", row.assessmentYearId)
    .is("archived_at", null)
    .maybeSingle();

  if (!existingCase) {
    const caseInsert = {
      workspace_id: workspaceId,
      client_id: clientId,
      assessment_year_id: row.assessmentYearId,
      case_status: row.caseStatus,
      return_category: row.returnCategory,
      next_action: row.nextAction,
      due_date: row.dueDate,
      expected_completion_date: row.expectedCompletionDate,
      blocker_code: row.blockerCode,
      blocker_note: row.blockerNote,
      follow_up_excluded: row.followUpExcluded,
      completed_at: row.caseStatus === "Completed" ? new Date().toISOString() : null,
      cancelled_at: row.caseStatus === "Cancelled" ? new Date().toISOString() : null,
    };

    const { data: insertedCase, error } = await supabase
      .from("filing_cases")
      .insert(caseInsert)
      .select("id")
      .single();

    if (error || !insertedCase) {
      throw new Error(`Failed to create the filing case for ${row.pan} ${row.assessmentYearLabel}.`);
    }

    await supabase.from("case_status_history").insert({
      workspace_id: workspaceId,
      case_id: insertedCase.id,
      from_status: null,
      to_status: row.caseStatus,
      reason: "Imported from CSV.",
      changed_by: userId,
    });

    await supabase.from("activity_events").insert({
      workspace_id: workspaceId,
      actor_id: userId,
      client_id: clientId,
      case_id: insertedCase.id,
      entity_type: "filing_case",
      entity_id: insertedCase.id,
      action: "import_case_created",
      message: `Filing case ${row.assessmentYearLabel} was created from a CSV import.`,
    });

    return insertedCase.id;
  }

  const casePatch = {
    next_action: existingCase.next_action ?? row.nextAction,
    due_date: existingCase.due_date ?? row.dueDate,
    expected_completion_date: existingCase.expected_completion_date ?? row.expectedCompletionDate,
    blocker_code: existingCase.blocker_code ?? row.blockerCode,
    blocker_note: existingCase.blocker_note ?? row.blockerNote,
    follow_up_excluded: existingCase.follow_up_excluded || row.followUpExcluded,
  };

  const hasPatch = Object.entries(casePatch).some(([key, value]) => {
    const currentValue = existingCase[key as keyof typeof existingCase];
    return currentValue !== value;
  });

  if (hasPatch) {
    const { error } = await supabase
      .from("filing_cases")
      .update(casePatch)
      .eq("workspace_id", workspaceId)
      .eq("id", existingCase.id);

    if (error) {
      throw new Error(`Failed to enrich the filing case for ${row.pan} ${row.assessmentYearLabel}.`);
    }

    await supabase.from("activity_events").insert({
      workspace_id: workspaceId,
      actor_id: userId,
      client_id: clientId,
      case_id: existingCase.id,
      entity_type: "filing_case",
      entity_id: existingCase.id,
      action: "import_case_enriched",
      message: `Filing case ${row.assessmentYearLabel} was enriched from a CSV import.`,
    });
  }

  return existingCase.id;
}

async function createFilingRecordIfNeeded(
  workspaceId: string,
  userId: string,
  clientId: string,
  caseId: string,
  row: NormalizedImportRow,
) {
  if (!row.filingKind || !row.filingDate) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data: existingRecord } = await supabase
    .from("filing_records")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("case_id", caseId)
    .match(
      row.acknowledgementNumber
        ? { acknowledgement_number: row.acknowledgementNumber }
        : { filing_kind: row.filingKind, filing_date: row.filingDate },
    )
    .is("archived_at", null)
    .maybeSingle();

  if (existingRecord) {
    return existingRecord.id;
  }

  const { data: insertedRecord, error } = await supabase
    .from("filing_records")
    .insert({
      workspace_id: workspaceId,
      case_id: caseId,
      filing_kind: row.filingKind,
      filing_date: row.filingDate,
      acknowledgement_number: row.acknowledgementNumber,
      verification_status: row.verificationStatus ?? "pending",
      verification_date: row.verificationDate,
      processing_status: row.processingStatus ?? "submitted",
      notes: row.filingNotes,
    })
    .select("id")
    .single();

  if (error || !insertedRecord) {
    throw new Error(`Failed to create the filing record for ${row.pan} ${row.assessmentYearLabel}.`);
  }

  await supabase.from("activity_events").insert({
    workspace_id: workspaceId,
    actor_id: userId,
    client_id: clientId,
    case_id: caseId,
    entity_type: "filing_record",
    entity_id: insertedRecord.id,
    action: "import_filing_created",
    message: `A filing record was created from a CSV import.`,
    metadata: {
      filing_kind: row.filingKind,
      filing_date: row.filingDate,
    },
  });

  return insertedRecord.id;
}

async function createInvoiceAndPaymentIfNeeded(
  workspaceId: string,
  userId: string,
  clientId: string,
  caseId: string,
  row: NormalizedImportRow,
) {
  if (!row.invoiceIssueDate || !row.invoiceDueDate || !row.invoiceItemDescription || !row.invoiceItemQuantity || row.invoiceItemUnitAmount === null) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("case_id", caseId)
    .neq("status", "cancelled")
    .is("archived_at", null)
    .maybeSingle();

  if (existingInvoice) {
    return existingInvoice.id;
  }

  const { data: insertedInvoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      workspace_id: workspaceId,
      client_id: clientId,
      case_id: caseId,
      assessment_year_id: row.assessmentYearId,
      discount_amount: row.invoiceDiscountAmount,
      notes: appendImportedReference(row.invoiceNotes, row.sourceInvoiceReference),
    })
    .select("id, invoice_number")
    .single();

  if (invoiceError || !insertedInvoice) {
    throw new Error(`Failed to create the invoice for ${row.pan} ${row.assessmentYearLabel}.`);
  }

  const { error: itemError } = await supabase.from("invoice_items").insert({
    workspace_id: workspaceId,
    invoice_id: insertedInvoice.id,
    description: row.invoiceItemDescription,
    quantity: row.invoiceItemQuantity,
    unit_amount: row.invoiceItemUnitAmount,
    display_order: 0,
  });

  if (itemError) {
    throw new Error(`Failed to create the invoice item for ${row.pan} ${row.assessmentYearLabel}.`);
  }

  const hasPayment = Boolean(row.paymentDate && row.paymentAmount && row.paymentMode);

  const { error: issueError } = await supabase
    .from("invoices")
    .update({
      status: "issued",
      issue_date: row.invoiceIssueDate,
      due_date: row.invoiceDueDate,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", insertedInvoice.id);

  if (issueError) {
    throw new Error(`Failed to issue the imported invoice for ${row.pan} ${row.assessmentYearLabel}.`);
  }

  if (hasPayment) {
    const { error: paymentError } = await supabase.from("payments").insert({
      workspace_id: workspaceId,
      invoice_id: insertedInvoice.id,
      payment_date: row.paymentDate,
      amount: row.paymentAmount,
      mode: row.paymentMode,
      reference: row.paymentReference,
      note: row.paymentNote,
      recorded_by: userId,
    });

    if (paymentError) {
      throw new Error(`Failed to record the imported payment for ${row.pan} ${row.assessmentYearLabel}.`);
    }
  }

  await supabase.from("activity_events").insert({
    workspace_id: workspaceId,
    actor_id: userId,
    client_id: clientId,
    case_id: caseId,
    entity_type: "invoice",
    entity_id: insertedInvoice.id,
    action: "import_invoice_created",
    message: `Invoice ${insertedInvoice.invoice_number} was created from a CSV import.`,
    metadata: {
      source_invoice_reference: row.sourceInvoiceReference,
    },
  });

  return insertedInvoice.id;
}

export async function getImportPageData(jobId?: string | null): Promise<ImportPageData> {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const { data: recentJobs, error: recentJobsError } = await supabase
    .from("import_jobs")
    .select("id, import_type, status, source_filename, total_rows, valid_rows, invalid_rows, committed_rows, error_summary, started_at, completed_at")
    .eq("workspace_id", session.workspace.id)
    .order("started_at", { ascending: false })
    .limit(8);

  if (recentJobsError) {
    throw new Error("Failed to load recent import jobs.");
  }

  if (!jobId) {
    return {
      selectedJob: null,
      recentJobs: (recentJobs ?? []) as ImportJobRecord[],
      templateHeaders: [...CSV_HEADERS],
    };
  }

  const [{ data: job, error: jobError }, { data: rows, error: rowsError }] = await Promise.all([
    supabase
      .from("import_jobs")
      .select("id, import_type, status, source_filename, total_rows, valid_rows, invalid_rows, committed_rows, error_summary, started_at, completed_at")
      .eq("workspace_id", session.workspace.id)
      .eq("id", jobId)
      .maybeSingle(),
    supabase
      .from("import_rows")
      .select("id, row_number, action, row_status, source_key, errors, source_row, normalized_row, outcome, committed_at")
      .eq("workspace_id", session.workspace.id)
      .eq("import_job_id", jobId)
      .order("row_number", { ascending: true }),
  ]);

  if (jobError || rowsError) {
    throw new Error("Failed to load the selected import job.");
  }

  return {
    selectedJob: job
      ? {
          job: job as ImportJobRecord,
          rows: ((rows ?? []) as Array<Record<string, unknown>>).map((row) => ({
            id: String(row.id),
            row_number: Number(row.row_number),
            action: row.action as ImportRowRecord["action"],
            row_status: row.row_status as ImportRowRecord["row_status"],
            source_key: String(row.source_key),
            errors: Array.isArray(row.errors) ? (row.errors as string[]) : [],
            source_row: (row.source_row ?? {}) as Record<string, string>,
            normalized_row: (row.normalized_row ?? {}) as NormalizedImportRow,
            outcome: (row.outcome ?? {}) as Record<string, unknown>,
            committed_at: row.committed_at ? String(row.committed_at) : null,
          })),
        }
      : null,
    recentJobs: (recentJobs ?? []) as ImportJobRecord[],
    templateHeaders: [...CSV_HEADERS],
  };
}

export async function createImportDryRunAction(
  _previousState: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  void _previousState;
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();
  const file = formData.get("csvFile");

  if (!(file instanceof File)) {
    return { error: "Choose a CSV file before starting the dry-run." };
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { error: "Only CSV files are allowed for import." };
  }

  if (file.size <= 0) {
    return { error: "The selected CSV file is empty." };
  }

  if (file.size > MAX_IMPORT_SIZE_BYTES) {
    return { error: "The CSV file is too large for this import step. Keep it under 1 MB." };
  }

  const text = await file.text();
  let parsedRows: string[][];

  try {
    parsedRows = parseCsv(text);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "The CSV file could not be parsed.",
    };
  }

  if (parsedRows.length < 2) {
    return { error: "The CSV file must include the template header row and at least one data row." };
  }

  const [headerRow, ...dataRows] = parsedRows;
  const headersMatch =
    headerRow.length === CSV_HEADERS.length &&
    headerRow.every((header, index) => header === CSV_HEADERS[index]);

  if (!headersMatch) {
    return {
      error: "The CSV headers do not match the locked SDDS import template. Use the exact field order shown on the page.",
    };
  }

  const referenceData = await getWorkspaceReferenceData(session.workspace.id);
  const assessmentYearMap = new Map(referenceData.assessmentYears.map((assessmentYear) => [assessmentYear.label, assessmentYear]));

  const dryRunRows = dataRows.map((values, rowIndex) => {
    const sourceRow = buildSourceRow(CSV_HEADERS, values);
    const normalized = normalizeImportRow(sourceRow, assessmentYearMap);
    const sourceKey = normalized.errors.length > 0 ? hashSourceKey(`${rowIndex + 1}|invalid`) : buildSourceKey(normalized.normalizedRow);

    if (normalized.errors.length > 0) {
      return {
        rowNumber: rowIndex + 1,
        sourceKey,
        sourceRow,
        normalizedRow: normalized.normalizedRow,
        action: "error" as const,
        rowStatus: "error" as const,
        errors: normalized.errors,
        outcome: {
          plannedOperations: [],
          warnings: [],
        } satisfies DryRunOutcome,
      };
    }

    const intent = determineRowIntent(normalized.normalizedRow, sourceKey, referenceData);

    return {
      rowNumber: rowIndex + 1,
      sourceKey,
      sourceRow,
      normalizedRow: normalized.normalizedRow,
      action: intent.action,
      rowStatus: intent.rowStatus,
      errors: intent.errors,
      outcome: intent.outcome,
    };
  });

  const summary = getImportSummaryRows(dryRunRows);
  const validRows = dryRunRows.filter((row) => row.rowStatus !== "error").length;
  const invalidRows = dryRunRows.length - validRows;
  const jobStatus = validRows > 0 ? "validated" : "failed";

  const { data: job, error: jobError } = await supabase
    .from("import_jobs")
    .insert({
      workspace_id: session.workspace.id,
      import_type: "filing_cases",
      status: jobStatus,
      source_filename: file.name,
      total_rows: dryRunRows.length,
      valid_rows: validRows,
      invalid_rows: invalidRows,
      committed_rows: 0,
      error_summary: {
        template: "filing-case-v1",
        create_rows: summary.create,
        update_rows: summary.update,
        skipped_rows: summary.skip,
        error_rows: summary.error,
      },
      started_by: session.user.id,
      completed_at: validRows > 0 ? null : new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return { error: "Failed to create the dry-run import job." };
  }

  const rowInsertPayload = dryRunRows.map((row) => ({
    workspace_id: session.workspace.id,
    import_job_id: job.id,
    row_number: row.rowNumber,
    source_key: row.sourceKey,
    action: row.action,
    row_status: row.rowStatus,
    source_row: row.sourceRow,
    normalized_row: row.normalizedRow,
    errors: row.errors,
    outcome: row.outcome,
  }));

  const { error: rowsError } = await supabase.from("import_rows").insert(rowInsertPayload);
  if (rowsError) {
    return { error: "The dry-run job was created, but its row analysis failed to save." };
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    entity_type: "import_job",
    entity_id: job.id,
    action: "import_dry_run_completed",
    message: `CSV import dry-run ${job.id} completed for ${file.name}.`,
    metadata: {
      total_rows: dryRunRows.length,
      valid_rows: validRows,
      invalid_rows: invalidRows,
      create_rows: summary.create,
      update_rows: summary.update,
      skipped_rows: summary.skip,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/import");
  redirect(`/settings/import?job=${job.id}`);
}

export async function commitImportJobAction(
  jobId: string,
  _previousState: ImportActionState,
  _formData: FormData,
): Promise<ImportActionState> {
  void _previousState;
  void _formData;
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const [{ data: job, error: jobError }, { data: rows, error: rowsError }] = await Promise.all([
    supabase
      .from("import_jobs")
      .select("id, status, committed_rows, total_rows, valid_rows, error_summary")
      .eq("workspace_id", session.workspace.id)
      .eq("id", jobId)
      .maybeSingle(),
    supabase
      .from("import_rows")
      .select("id, row_number, source_key, action, row_status, normalized_row")
      .eq("workspace_id", session.workspace.id)
      .eq("import_job_id", jobId)
      .order("row_number", { ascending: true }),
  ]);

  if (jobError || !job || rowsError) {
    return { error: "The selected import job could not be loaded." };
  }

  if (job.status !== "validated") {
    return { error: "Only fully validated dry-runs can be committed." };
  }

  const validRows = (rows ?? []).filter((row) => row.row_status === "valid" || row.row_status === "skipped");
  if (validRows.length === 0) {
    return { error: "This import job does not contain any committable rows." };
  }

  let committedRows = 0;
  const commitErrors: Array<{ rowNumber: number; message: string }> = [];

  for (const row of rows ?? []) {
    if (row.row_status !== "valid" && row.row_status !== "skipped") {
      continue;
    }

    try {
      const normalizedRow = row.normalized_row as unknown as NormalizedImportRow;
      const { data: alreadyCommitted } = await supabase
        .from("import_rows")
        .select("id")
        .eq("workspace_id", session.workspace.id)
        .eq("source_key", row.source_key)
        .eq("row_status", "committed")
        .neq("id", row.id)
        .limit(1)
        .maybeSingle();

      if (!alreadyCommitted) {
        const clientId = await createOrUpdateClient(session.workspace.id, session.user.id, normalizedRow);
        const caseId = await createOrUpdateCase(session.workspace.id, session.user.id, clientId, normalizedRow);
        await createFilingRecordIfNeeded(session.workspace.id, session.user.id, clientId, caseId, normalizedRow);
        await createInvoiceAndPaymentIfNeeded(session.workspace.id, session.user.id, clientId, caseId, normalizedRow);
      }

      const { error: markCommittedError } = await supabase
        .from("import_rows")
        .update({
          row_status: "committed",
          committed_at: new Date().toISOString(),
        })
        .eq("workspace_id", session.workspace.id)
        .eq("id", row.id);

      if (markCommittedError) {
        throw new Error(`Failed to mark row ${row.row_number} as committed.`);
      }

      committedRows += 1;
    } catch (error) {
      commitErrors.push({
        rowNumber: row.row_number,
        message: error instanceof Error ? error.message : "Unknown commit error.",
      });
    }
  }

  const nextStatus = commitErrors.length > 0 ? "failed" : "committed";
  const completedAt = new Date().toISOString();

  const { error: finalizeError } = await supabase
    .from("import_jobs")
    .update({
      status: nextStatus,
      committed_rows: committedRows,
      completed_at: completedAt,
      error_summary: {
        ...((job.error_summary as Record<string, unknown> | null) ?? {}),
        commit_errors: commitErrors,
      },
    })
    .eq("workspace_id", session.workspace.id)
    .eq("id", jobId);

  if (finalizeError) {
    return { error: "The import rows were processed, but the job summary failed to update." };
  }

  await supabase.from("activity_events").insert({
    workspace_id: session.workspace.id,
    actor_id: session.user.id,
    entity_type: "import_job",
    entity_id: jobId,
    action: commitErrors.length > 0 ? "import_commit_failed" : "import_commit_completed",
    message: commitErrors.length > 0
      ? `CSV import commit ${jobId} finished with row-level errors.`
      : `CSV import commit ${jobId} completed successfully.`,
    metadata: {
      committed_rows: committedRows,
      commit_errors: commitErrors.length,
    },
  });

  revalidatePath("/clients");
  revalidatePath("/filing-queue");
  revalidatePath("/invoices");
  revalidatePath("/settings");
  revalidatePath("/settings/import");
  redirect(`/settings/import?job=${jobId}`);
}
