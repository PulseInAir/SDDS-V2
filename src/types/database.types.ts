export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type TableDefinition<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: Relationship[]
}

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      assessment_years: TableDefinition<
        { created_at: string; end_date: string; id: string; is_current: boolean; is_open: boolean; label: string; start_date: string; updated_at: string; workspace_id: string },
        { created_at?: string; end_date: string; id?: string; is_current?: boolean; is_open?: boolean; label: string; start_date: string; updated_at?: string; workspace_id: string },
        { created_at?: string; end_date?: string; id?: string; is_current?: boolean; is_open?: boolean; label?: string; start_date?: string; updated_at?: string; workspace_id?: string }
      >
      case_status_history: TableDefinition<
        { case_id: string; changed_at: string; changed_by: string; from_status: string | null; id: string; reason: string | null; to_status: string; workspace_id: string },
        { case_id: string; changed_at?: string; changed_by: string; from_status?: string | null; id?: string; reason?: string | null; to_status: string; workspace_id: string },
        { case_id?: string; changed_at?: string; changed_by?: string; from_status?: string | null; id?: string; reason?: string | null; to_status?: string; workspace_id?: string }
      >
      client_credentials: TableDefinition<
        { archived_at: string | null; client_id: string; created_at: string; encrypted_payload: Json; encryption_version: number; id: string; updated_at: string; updated_by: string; workspace_id: string },
        { archived_at?: string | null; client_id: string; created_at?: string; encrypted_payload: Json; encryption_version: number; id?: string; updated_at?: string; updated_by: string; workspace_id: string },
        { archived_at?: string | null; client_id?: string; created_at?: string; encrypted_payload?: Json; encryption_version?: number; id?: string; updated_at?: string; updated_by?: string; workspace_id?: string }
      >
      clients: TableDefinition<
        { active: boolean; address: string | null; archived_at: string | null; created_at: string; date_of_birth: string | null; email: string | null; exclusion_reason: string | null; family_group: string | null; follow_up_excluded: boolean; full_name: string; id: string; mobile: string | null; pan_uppercase: string; updated_at: string; workspace_id: string },
        { active?: boolean; address?: string | null; archived_at?: string | null; created_at?: string; date_of_birth?: string | null; email?: string | null; exclusion_reason?: string | null; family_group?: string | null; follow_up_excluded?: boolean; full_name: string; id?: string; mobile?: string | null; pan_uppercase: string; updated_at?: string; workspace_id: string },
        { active?: boolean; address?: string | null; archived_at?: string | null; created_at?: string; date_of_birth?: string | null; email?: string | null; exclusion_reason?: string | null; family_group?: string | null; follow_up_excluded?: boolean; full_name?: string; id?: string; mobile?: string | null; pan_uppercase?: string; updated_at?: string; workspace_id?: string }
      >
      documents: TableDefinition<
        { archived_at: string | null; assessment_year_id: string | null; case_id: string | null; checklist_status: string; checksum_sha256: string | null; client_id: string; document_type: string; filing_record_id: string | null; id: string; mime_type: string; original_filename: string; replaces_document_id: string | null; safe_filename: string; size_bytes: number; storage_bucket: string; storage_path: string; uploaded_at: string; uploaded_by: string; verified_at: string | null; verified_by: string | null; version: number; workspace_id: string },
        { archived_at?: string | null; assessment_year_id?: string | null; case_id?: string | null; checklist_status?: string; checksum_sha256?: string | null; client_id: string; document_type: string; filing_record_id?: string | null; id?: string; mime_type: string; original_filename: string; replaces_document_id?: string | null; safe_filename: string; size_bytes: number; storage_bucket?: string; storage_path: string; uploaded_at?: string; uploaded_by: string; verified_at?: string | null; verified_by?: string | null; version?: number; workspace_id: string },
        { archived_at?: string | null; assessment_year_id?: string | null; case_id?: string | null; checklist_status?: string; checksum_sha256?: string | null; client_id?: string; document_type?: string; filing_record_id?: string | null; id?: string; mime_type?: string; original_filename?: string; replaces_document_id?: string | null; safe_filename?: string; size_bytes?: number; storage_bucket?: string; storage_path?: string; uploaded_at?: string; uploaded_by?: string; verified_at?: string | null; verified_by?: string | null; version?: number; workspace_id?: string }
      >
      filing_cases: TableDefinition<
        { archived_at: string | null; assessment_year_id: string; blocker_code: string | null; blocker_note: string | null; cancelled_at: string | null; case_status: string; client_id: string; completed_at: string | null; created_at: string; due_date: string | null; expected_completion_date: string | null; follow_up_excluded: boolean; hold_reason: string | null; id: string; next_action: string | null; next_review_date: string | null; return_category: string | null; updated_at: string; workspace_id: string },
        { archived_at?: string | null; assessment_year_id: string; blocker_code?: string | null; blocker_note?: string | null; cancelled_at?: string | null; case_status?: string; client_id: string; completed_at?: string | null; created_at?: string; due_date?: string | null; expected_completion_date?: string | null; follow_up_excluded?: boolean; hold_reason?: string | null; id?: string; next_action?: string | null; next_review_date?: string | null; return_category?: string | null; updated_at?: string; workspace_id: string },
        { archived_at?: string | null; assessment_year_id?: string; blocker_code?: string | null; blocker_note?: string | null; cancelled_at?: string | null; case_status?: string; client_id?: string; completed_at?: string | null; created_at?: string; due_date?: string | null; expected_completion_date?: string | null; follow_up_excluded?: boolean; hold_reason?: string | null; id?: string; next_action?: string | null; next_review_date?: string | null; return_category?: string | null; updated_at?: string; workspace_id?: string }
      >
      filing_records: TableDefinition<
        { acknowledgement_number: string | null; archived_at: string | null; case_id: string; created_at: string; filing_date: string; filing_kind: string; id: string; notes: string | null; parent_filing_record_id: string | null; processing_status: string; updated_at: string; verification_date: string | null; verification_status: string; workspace_id: string },
        { acknowledgement_number?: string | null; archived_at?: string | null; case_id: string; created_at?: string; filing_date: string; filing_kind: string; id?: string; notes?: string | null; parent_filing_record_id?: string | null; processing_status?: string; updated_at?: string; verification_date?: string | null; verification_status?: string; workspace_id: string },
        { acknowledgement_number?: string | null; archived_at?: string | null; case_id?: string; created_at?: string; filing_date?: string; filing_kind?: string; id?: string; notes?: string | null; parent_filing_record_id?: string | null; processing_status?: string; updated_at?: string; verification_date?: string | null; verification_status?: string; workspace_id?: string }
      >
      invoice_items: TableDefinition<
        { created_at: string; description: string; display_order: number; id: string; invoice_id: string; line_amount: number | null; quantity: number; unit_amount: number; updated_at: string; workspace_id: string },
        { created_at?: string; description: string; display_order?: number; id?: string; invoice_id: string; line_amount?: number | null; quantity?: number; unit_amount: number; updated_at?: string; workspace_id: string },
        { created_at?: string; description?: string; display_order?: number; id?: string; invoice_id?: string; line_amount?: number | null; quantity?: number; unit_amount?: number; updated_at?: string; workspace_id?: string }
      >
      invoice_sequences: TableDefinition<
        { assessment_year_id: string; next_serial: number; updated_at: string; workspace_id: string },
        { assessment_year_id: string; next_serial?: number; updated_at?: string; workspace_id: string },
        { assessment_year_id?: string; next_serial?: number; updated_at?: string; workspace_id?: string }
      >
      invoices: TableDefinition<
        { archived_at: string | null; assessment_year_id: string; cancelled_at: string | null; case_id: string | null; client_id: string; created_at: string; discount_amount: number; due_date: string | null; id: string; invoice_number: string; issue_date: string | null; issued_at: string | null; notes: string | null; serial_number: number; status: string; subtotal: number; total_amount: number; updated_at: string; workspace_id: string },
        { archived_at?: string | null; assessment_year_id: string; cancelled_at?: string | null; case_id?: string | null; client_id: string; created_at?: string; discount_amount?: number; due_date?: string | null; id?: string; invoice_number: string; issue_date?: string | null; issued_at?: string | null; notes?: string | null; serial_number: number; status?: string; subtotal?: number; total_amount?: number; updated_at?: string; workspace_id: string },
        { archived_at?: string | null; assessment_year_id?: string; cancelled_at?: string | null; case_id?: string | null; client_id?: string; created_at?: string; discount_amount?: number; due_date?: string | null; id?: string; invoice_number?: string; issue_date?: string | null; issued_at?: string | null; notes?: string | null; serial_number?: number; status?: string; subtotal?: number; total_amount?: number; updated_at?: string; workspace_id?: string }
      >
      payments: TableDefinition<
        { amount: number; created_at: string; id: string; invoice_id: string; mode: string; note: string | null; payment_date: string; recorded_by: string; reference: string | null; reversed_at: string | null; workspace_id: string },
        { amount: number; created_at?: string; id?: string; invoice_id: string; mode: string; note?: string | null; payment_date: string; recorded_by: string; reference?: string | null; reversed_at?: string | null; workspace_id: string },
        { amount?: number; created_at?: string; id?: string; invoice_id?: string; mode?: string; note?: string | null; payment_date?: string; recorded_by?: string; reference?: string | null; reversed_at?: string | null; workspace_id?: string }
      >
      workspace_members: TableDefinition<
        { active: boolean; created_at: string; role: string; updated_at: string; user_id: string; workspace_id: string },
        { active?: boolean; created_at?: string; role?: string; updated_at?: string; user_id: string; workspace_id: string },
        { active?: boolean; created_at?: string; role?: string; updated_at?: string; user_id?: string; workspace_id?: string }
      >
      workspaces: TableDefinition<
        { archived_at: string | null; created_at: string; id: string; name: string; updated_at: string },
        { archived_at?: string | null; created_at?: string; id?: string; name: string; updated_at?: string },
        { archived_at?: string | null; created_at?: string; id?: string; name?: string; updated_at?: string }
      >
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals["public"]

export type Tables<Name extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][Name]["Row"]
export type TablesInsert<Name extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][Name]["Insert"]
export type TablesUpdate<Name extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][Name]["Update"]
export type Enums<Name extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][Name]
export type CompositeTypes<Name extends keyof DefaultSchema["CompositeTypes"]> = DefaultSchema["CompositeTypes"][Name]

export const Constants = { public: { Enums: {} } } as const
