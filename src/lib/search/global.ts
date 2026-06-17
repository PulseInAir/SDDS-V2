import "server-only";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_RESULTS_PER_TYPE = 4;
const MIN_SEARCH_LENGTH = 2;

export type GlobalSearchResultType = "client" | "invoice" | "filing_record";
export type GlobalSearchMatchField =
  | "client_name"
  | "pan"
  | "mobile"
  | "invoice_number"
  | "acknowledgement_number";

export type GlobalSearchResult = {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  identifier: string;
  context: string;
  destination: string;
  matchedField: GlobalSearchMatchField;
};

export type GlobalSearchResponse = {
  query: string;
  supportedFields: string[];
  results: GlobalSearchResult[];
};

type ClientSearchRow = {
  id: string;
  full_name: string;
  pan_uppercase: string;
  mobile: string | null;
};

type InvoiceSearchRow = {
  id: string;
  invoice_number: string;
  status: string;
  clients:
    | {
        id: string;
        full_name: string;
        pan_uppercase: string;
      }
    | {
        id: string;
        full_name: string;
        pan_uppercase: string;
      }[]
    | null;
  assessment_years:
    | {
        label: string;
      }
    | {
        label: string;
      }[]
    | null;
};

type FilingRecordSearchRow = {
  id: string;
  case_id: string;
  acknowledgement_number: string | null;
  filing_kind: string;
  filing_date: string;
  filing_cases:
    | {
        id: string;
        case_status: string;
        clients:
          | {
              id: string;
              full_name: string;
              pan_uppercase: string;
            }
          | {
              id: string;
              full_name: string;
              pan_uppercase: string;
            }[]
          | null;
        assessment_years:
          | {
              label: string;
            }
          | {
              label: string;
            }[]
          | null;
      }
    | {
        id: string;
        case_status: string;
        clients:
          | {
              id: string;
              full_name: string;
              pan_uppercase: string;
            }
          | {
              id: string;
              full_name: string;
              pan_uppercase: string;
            }[]
          | null;
        assessment_years:
          | {
              label: string;
            }
          | {
              label: string;
            }[]
          | null;
      }[]
    | null;
};

function normalizeRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function sanitizeSearchTerm(searchTerm: string) {
  return searchTerm.replace(/[,%()]/g, " ").trim();
}

function maskTrailing(value: string | null, visibleCount = 4) {
  if (!value) {
    return "Not set";
  }

  if (value.length <= visibleCount) {
    return value;
  }

  return `${"•".repeat(Math.max(0, value.length - visibleCount))}${value.slice(-visibleCount)}`;
}

function getClientMatchedField(searchLower: string, client: ClientSearchRow): GlobalSearchMatchField {
  if (client.pan_uppercase.toLowerCase().includes(searchLower)) {
    return "pan";
  }

  if ((client.mobile ?? "").toLowerCase().includes(searchLower)) {
    return "mobile";
  }

  return "client_name";
}

function mapClientResult(searchLower: string, client: ClientSearchRow): GlobalSearchResult {
  const matchedField = getClientMatchedField(searchLower, client);
  const identifierSource = matchedField === "mobile" ? client.mobile : client.pan_uppercase;

  return {
    id: client.id,
    type: "client",
    title: client.full_name,
    identifier: matchedField === "mobile" ? `Mobile ${maskTrailing(identifierSource)}` : `PAN ${maskTrailing(identifierSource)}`,
    context: "Client record",
    destination: `/clients/${client.id}`,
    matchedField,
  };
}

function mapInvoiceResult(invoice: InvoiceSearchRow): GlobalSearchResult {
  const client = normalizeRelation(invoice.clients);
  const assessmentYear = normalizeRelation(invoice.assessment_years);

  return {
    id: invoice.id,
    type: "invoice",
    title: invoice.invoice_number,
    identifier: client ? `PAN ${maskTrailing(client.pan_uppercase)}` : "PAN Not set",
    context: `${client?.full_name ?? "Unknown client"} • ${assessmentYear?.label ?? "No AY"} • ${invoice.status}`,
    destination: `/invoices/${invoice.id}`,
    matchedField: "invoice_number",
  };
}

function mapFilingRecordResult(filingRecord: FilingRecordSearchRow): GlobalSearchResult | null {
  const filingCase = normalizeRelation(filingRecord.filing_cases);
  const client = normalizeRelation(filingCase?.clients ?? null);
  const assessmentYear = normalizeRelation(filingCase?.assessment_years ?? null);

  if (!filingCase || !client || !filingRecord.acknowledgement_number) {
    return null;
  }

  return {
    id: filingRecord.id,
    type: "filing_record",
    title: filingRecord.acknowledgement_number,
    identifier: `PAN ${maskTrailing(client.pan_uppercase)}`,
    context: `${client.full_name} • ${assessmentYear?.label ?? "No AY"} • ${filingRecord.filing_kind} • ${filingCase.case_status}`,
    destination: `/filing-queue/${filingCase.id}`,
    matchedField: "acknowledgement_number",
  };
}

export async function searchWorkspaceRecords(searchTerm: string): Promise<GlobalSearchResponse> {
  const query = sanitizeSearchTerm(searchTerm);

  if (query.length < MIN_SEARCH_LENGTH) {
    return {
      query,
      supportedFields: ["Client name", "PAN", "Mobile", "Invoice number", "Acknowledgement number"],
      results: [],
    };
  }

  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();
  const normalizedUpper = query.toUpperCase();
  const normalizedLower = query.toLowerCase();

  const [clientsResponse, invoicesResponse, filingRecordsResponse] = await Promise.all([
    supabase
      .from("clients")
      .select("id, full_name, pan_uppercase, mobile")
      .eq("workspace_id", session.workspace.id)
      .is("archived_at", null)
      .or(`full_name.ilike.%${query}%,pan_uppercase.ilike.%${normalizedUpper}%,mobile.ilike.%${query}%`)
      .order("updated_at", { ascending: false })
      .limit(MAX_RESULTS_PER_TYPE),
    supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        status,
        clients!inner (id, full_name, pan_uppercase),
        assessment_years!inner (label)
      `)
      .eq("workspace_id", session.workspace.id)
      .is("archived_at", null)
      .ilike("invoice_number", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(MAX_RESULTS_PER_TYPE),
    supabase
      .from("filing_records")
      .select(`
        id,
        case_id,
        acknowledgement_number,
        filing_kind,
        filing_date,
        filing_cases!inner (
          id,
          case_status,
          clients!inner (id, full_name, pan_uppercase),
          assessment_years!inner (label)
        )
      `)
      .eq("workspace_id", session.workspace.id)
      .is("archived_at", null)
      .ilike("acknowledgement_number", `%${query}%`)
      .order("filing_date", { ascending: false })
      .limit(MAX_RESULTS_PER_TYPE),
  ]);

  if (clientsResponse.error) {
    throw new Error(`Failed to search clients: ${clientsResponse.error.message}`);
  }

  if (invoicesResponse.error) {
    throw new Error(`Failed to search invoices: ${invoicesResponse.error.message}`);
  }

  if (filingRecordsResponse.error) {
    throw new Error(`Failed to search filing records: ${filingRecordsResponse.error.message}`);
  }

  const results = [
    ...((clientsResponse.data ?? []) as ClientSearchRow[]).map((client) =>
      mapClientResult(normalizedLower, client),
    ),
    ...((invoicesResponse.data ?? []) as InvoiceSearchRow[]).map(mapInvoiceResult),
    ...((filingRecordsResponse.data ?? []) as FilingRecordSearchRow[])
      .map(mapFilingRecordResult)
      .filter((result): result is GlobalSearchResult => result !== null),
  ];

  return {
    query,
    supportedFields: ["Client name", "PAN", "Mobile", "Invoice number", "Acknowledgement number"],
    results,
  };
}
