import type { Database } from "./database.types";

export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
export type DocumentChecklistStatus =
  | "required"
  | "requested"
  | "received"
  | "verified"
  | "rejected"
  | "replacement_needed"
  | "not_applicable";

export interface DocumentUploadPayload {
  id: string;
  clientId: string;
  caseId?: string;
  filingRecordId?: string;
  assessmentYearId?: string;
  documentType: string;
  checklistStatus?: DocumentChecklistStatus;
  originalFilename: string;
  safeFilename: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256?: string;
}

export interface DocumentReplacementPayload extends DocumentUploadPayload {
  replacesDocumentId: string;
}

export interface DocumentRecord extends DocumentRow {
  clients: {
    id: string;
    full_name: string;
    pan_uppercase: string;
  } | null;
  assessment_years: {
    id: string;
    label: string;
  } | null;
  filing_cases: {
    id: string;
    case_status: string;
    next_action: string | null;
    due_date: string | null;
  } | null;
  filing_records: {
    id: string;
    filing_kind: string;
    verification_status: string;
    processing_status: string;
    acknowledgement_number: string | null;
  } | null;
}
