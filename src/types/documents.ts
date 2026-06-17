import type { Database } from "./database.types";

export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];

export interface DocumentUploadPayload {
  id: string;
  clientId: string;
  caseId?: string;
  filingRecordId?: string;
  assessmentYearId?: string;
  documentType: string;
  checklistStatus?: "required" | "requested" | "received" | "verified" | "rejected" | "replacement_needed" | "not_applicable";
  originalFilename: string;
  safeFilename: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256?: string;
}

export interface DocumentReplacementPayload extends DocumentUploadPayload {
  replacesDocumentId: string;
}
