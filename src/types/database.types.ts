export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          action: string
          actor_id: string | null
          case_id: string | null
          client_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          message: string
          metadata: Json
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          message: string
          metadata?: Json
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          message?: string
          metadata?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_case_workspace_fk"
            columns: ["workspace_id", "case_id"]
            isOneToOne: false
            referencedRelation: "filing_cases"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "activity_events_client_workspace_fk"
            columns: ["workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "activity_events_workspace_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          is_open: boolean
          label: string
          start_date: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          is_open?: boolean
          label: string
          start_date: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          is_open?: boolean
          label?: string
          start_date?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_years_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      case_status_history: {
        Row: {
          case_id: string
          changed_at: string
          changed_by: string
          from_status: string | null
          id: string
          reason: string | null
          to_status: string
          workspace_id: string
        }
        Insert: {
          case_id: string
          changed_at?: string
          changed_by: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status: string
          workspace_id: string
        }
        Update: {
          case_id?: string
          changed_at?: string
          changed_by?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_status_history_case_workspace_fk"
            columns: ["workspace_id", "case_id"]
            isOneToOne: false
            referencedRelation: "filing_cases"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      client_credentials: {
        Row: {
          archived_at: string | null
          client_id: string
          created_at: string
          encrypted_payload: Json
          encryption_version: number
          id: string
          updated_at: string
          updated_by: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          client_id: string
          created_at?: string
          encrypted_payload: Json
          encryption_version: number
          id?: string
          updated_at?: string
          updated_by: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          client_id?: string
          created_at?: string
          encrypted_payload?: Json
          encryption_version?: number
          id?: string
          updated_at?: string
          updated_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_credentials_client_workspace_fk"
            columns: ["workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      clients: {
        Row: {
          active: boolean
          address: string | null
          archived_at: string | null
          client_id_code: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          exclusion_reason: string | null
          family_group: string | null
          follow_up_excluded: boolean
          full_name: string
          id: string
          mobile: string | null
          pan_uppercase: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          archived_at?: string | null
          client_id_code?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          exclusion_reason?: string | null
          family_group?: string | null
          follow_up_excluded?: boolean
          full_name: string
          id?: string
          mobile?: string | null
          pan_uppercase: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          address?: string | null
          archived_at?: string | null
          client_id_code?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          exclusion_reason?: string | null
          family_group?: string | null
          follow_up_excluded?: boolean
          full_name?: string
          id?: string
          mobile?: string | null
          pan_uppercase?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          archived_at: string | null
          case_id: string | null
          channel: string
          client_id: string
          communication_at: string
          created_at: string
          direction: string
          id: string
          recorded_by: string
          subject: string | null
          summary: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          case_id?: string | null
          channel: string
          client_id: string
          communication_at?: string
          created_at?: string
          direction: string
          id?: string
          recorded_by: string
          subject?: string | null
          summary: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          case_id?: string | null
          channel?: string
          client_id?: string
          communication_at?: string
          created_at?: string
          direction?: string
          id?: string
          recorded_by?: string
          subject?: string | null
          summary?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_case_workspace_fk"
            columns: ["workspace_id", "case_id"]
            isOneToOne: false
            referencedRelation: "filing_cases"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "communications_client_workspace_fk"
            columns: ["workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      documents: {
        Row: {
          archived_at: string | null
          assessment_year_id: string | null
          case_id: string | null
          checklist_status: string
          checksum_sha256: string | null
          client_id: string
          document_type: string
          filing_record_id: string | null
          id: string
          mime_type: string
          original_filename: string
          replaces_document_id: string | null
          safe_filename: string
          size_bytes: number
          storage_bucket: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string
          verified_at: string | null
          verified_by: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          assessment_year_id?: string | null
          case_id?: string | null
          checklist_status?: string
          checksum_sha256?: string | null
          client_id: string
          document_type: string
          filing_record_id?: string | null
          id?: string
          mime_type: string
          original_filename: string
          replaces_document_id?: string | null
          safe_filename: string
          size_bytes: number
          storage_bucket?: string
          storage_path: string
          uploaded_at?: string
          uploaded_by: string
          verified_at?: string | null
          verified_by?: string | null
          version?: number
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          assessment_year_id?: string | null
          case_id?: string | null
          checklist_status?: string
          checksum_sha256?: string | null
          client_id?: string
          document_type?: string
          filing_record_id?: string | null
          id?: string
          mime_type?: string
          original_filename?: string
          replaces_document_id?: string | null
          safe_filename?: string
          size_bytes?: number
          storage_bucket?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string
          verified_at?: string | null
          verified_by?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_assessment_year_workspace_fk"
            columns: ["workspace_id", "assessment_year_id"]
            isOneToOne: false
            referencedRelation: "assessment_years"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "documents_case_workspace_fk"
            columns: ["workspace_id", "case_id"]
            isOneToOne: false
            referencedRelation: "filing_cases"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "documents_client_workspace_fk"
            columns: ["workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "documents_filing_record_workspace_fk"
            columns: ["workspace_id", "case_id", "filing_record_id"]
            isOneToOne: false
            referencedRelation: "filing_records"
            referencedColumns: ["workspace_id", "case_id", "id"]
          },
          {
            foreignKeyName: "documents_replacement_same_client_fk"
            columns: ["workspace_id", "client_id", "replaces_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["workspace_id", "client_id", "id"]
          },
        ]
      }
      filing_cases: {
        Row: {
          archived_at: string | null
          assessment_year_id: string
          blocker_code: string | null
          blocker_note: string | null
          cancelled_at: string | null
          case_status: string
          client_id: string
          completed_at: string | null
          created_at: string
          due_date: string | null
          expected_completion_date: string | null
          follow_up_excluded: boolean
          hold_reason: string | null
          id: string
          next_action: string | null
          next_review_date: string | null
          return_category: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          assessment_year_id: string
          blocker_code?: string | null
          blocker_note?: string | null
          cancelled_at?: string | null
          case_status?: string
          client_id: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          expected_completion_date?: string | null
          follow_up_excluded?: boolean
          hold_reason?: string | null
          id?: string
          next_action?: string | null
          next_review_date?: string | null
          return_category?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          assessment_year_id?: string
          blocker_code?: string | null
          blocker_note?: string | null
          cancelled_at?: string | null
          case_status?: string
          client_id?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          expected_completion_date?: string | null
          follow_up_excluded?: boolean
          hold_reason?: string | null
          id?: string
          next_action?: string | null
          next_review_date?: string | null
          return_category?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filing_cases_assessment_year_workspace_fk"
            columns: ["workspace_id", "assessment_year_id"]
            isOneToOne: false
            referencedRelation: "assessment_years"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "filing_cases_client_workspace_fk"
            columns: ["workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      filing_records: {
        Row: {
          acknowledgement_number: string | null
          archived_at: string | null
          case_id: string
          created_at: string
          filing_date: string
          filing_kind: string
          id: string
          notes: string | null
          parent_filing_record_id: string | null
          processing_status: string
          updated_at: string
          verification_date: string | null
          verification_status: string
          workspace_id: string
        }
        Insert: {
          acknowledgement_number?: string | null
          archived_at?: string | null
          case_id: string
          created_at?: string
          filing_date: string
          filing_kind: string
          id?: string
          notes?: string | null
          parent_filing_record_id?: string | null
          processing_status?: string
          updated_at?: string
          verification_date?: string | null
          verification_status?: string
          workspace_id: string
        }
        Update: {
          acknowledgement_number?: string | null
          archived_at?: string | null
          case_id?: string
          created_at?: string
          filing_date?: string
          filing_kind?: string
          id?: string
          notes?: string | null
          parent_filing_record_id?: string | null
          processing_status?: string
          updated_at?: string
          verification_date?: string | null
          verification_status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filing_records_case_workspace_fk"
            columns: ["workspace_id", "case_id"]
            isOneToOne: false
            referencedRelation: "filing_cases"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "filing_records_parent_same_case_fk"
            columns: ["workspace_id", "case_id", "parent_filing_record_id"]
            isOneToOne: false
            referencedRelation: "filing_records"
            referencedColumns: ["workspace_id", "case_id", "id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          archived_at: string | null
          assessment_year_id: string | null
          case_id: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          due_date: string
          excluded_at: string | null
          exclusion_reason: string | null
          follow_up_type: string
          id: string
          next_action: string | null
          notes: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          assessment_year_id?: string | null
          case_id?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          due_date: string
          excluded_at?: string | null
          exclusion_reason?: string | null
          follow_up_type: string
          id?: string
          next_action?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          assessment_year_id?: string | null
          case_id?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string
          excluded_at?: string | null
          exclusion_reason?: string | null
          follow_up_type?: string
          id?: string
          next_action?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_assessment_year_workspace_fk"
            columns: ["workspace_id", "assessment_year_id"]
            isOneToOne: false
            referencedRelation: "assessment_years"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "follow_ups_case_workspace_fk"
            columns: ["workspace_id", "case_id"]
            isOneToOne: false
            referencedRelation: "filing_cases"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "follow_ups_client_workspace_fk"
            columns: ["workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          archived_at: string | null
          committed_rows: number
          completed_at: string | null
          created_at: string
          error_summary: Json
          id: string
          import_type: string
          invalid_rows: number
          source_filename: string
          started_at: string
          started_by: string
          status: string
          total_rows: number
          valid_rows: number
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          committed_rows?: number
          completed_at?: string | null
          created_at?: string
          error_summary?: Json
          id?: string
          import_type: string
          invalid_rows?: number
          source_filename: string
          started_at?: string
          started_by: string
          status?: string
          total_rows?: number
          valid_rows?: number
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          committed_rows?: number
          completed_at?: string | null
          created_at?: string
          error_summary?: Json
          id?: string
          import_type?: string
          invalid_rows?: number
          source_filename?: string
          started_at?: string
          started_by?: string
          status?: string
          total_rows?: number
          valid_rows?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      import_rows: {
        Row: {
          action: string
          archived_at: string | null
          committed_at: string | null
          created_at: string
          errors: Json
          id: string
          import_job_id: string
          normalized_row: Json
          outcome: Json
          row_number: number
          row_status: string
          source_key: string
          source_row: Json
          workspace_id: string
        }
        Insert: {
          action?: string
          archived_at?: string | null
          committed_at?: string | null
          created_at?: string
          errors?: Json
          id?: string
          import_job_id: string
          normalized_row?: Json
          outcome?: Json
          row_number: number
          row_status?: string
          source_key: string
          source_row?: Json
          workspace_id: string
        }
        Update: {
          action?: string
          archived_at?: string | null
          committed_at?: string | null
          created_at?: string
          errors?: Json
          id?: string
          import_job_id?: string
          normalized_row?: Json
          outcome?: Json
          row_number?: number
          row_status?: string
          source_key?: string
          source_row?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_rows_job_workspace_fk"
            columns: ["workspace_id", "import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "import_rows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          invoice_id: string
          line_amount: number | null
          quantity: number
          unit_amount: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          id?: string
          invoice_id: string
          line_amount?: number | null
          quantity?: number
          unit_amount: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          invoice_id?: string
          line_amount?: number | null
          quantity?: number
          unit_amount?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_workspace_fk"
            columns: ["workspace_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      invoice_sequences: {
        Row: {
          assessment_year_id: string
          next_serial: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assessment_year_id: string
          next_serial?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assessment_year_id?: string
          next_serial?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sequences_assessment_year_workspace_fk"
            columns: ["workspace_id", "assessment_year_id"]
            isOneToOne: true
            referencedRelation: "assessment_years"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "invoice_sequences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          archived_at: string | null
          assessment_year_id: string
          cancelled_at: string | null
          case_id: string | null
          client_id: string
          created_at: string
          discount_amount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string | null
          issued_at: string | null
          notes: string | null
          serial_number: number
          status: string
          subtotal: number
          total_amount: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          assessment_year_id: string
          cancelled_at?: string | null
          case_id?: string | null
          client_id: string
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string | null
          issued_at?: string | null
          notes?: string | null
          serial_number: number
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          assessment_year_id?: string
          cancelled_at?: string | null
          case_id?: string | null
          client_id?: string
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string | null
          issued_at?: string | null
          notes?: string | null
          serial_number?: number
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_assessment_year_workspace_fk"
            columns: ["workspace_id", "assessment_year_id"]
            isOneToOne: false
            referencedRelation: "assessment_years"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "invoices_case_context_fk"
            columns: [
              "workspace_id",
              "case_id",
              "client_id",
              "assessment_year_id",
            ]
            isOneToOne: false
            referencedRelation: "filing_cases"
            referencedColumns: [
              "workspace_id",
              "id",
              "client_id",
              "assessment_year_id",
            ]
          },
          {
            foreignKeyName: "invoices_client_workspace_fk"
            columns: ["workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          mode: string
          note: string | null
          payment_date: string
          recorded_by: string
          reference: string | null
          reversed_at: string | null
          workspace_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          mode: string
          note?: string | null
          payment_date: string
          recorded_by: string
          reference?: string | null
          reversed_at?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          mode?: string
          note?: string | null
          payment_date?: string
          recorded_by?: string
          reference?: string | null
          reversed_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_workspace_fk"
            columns: ["workspace_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      refunds: {
        Row: {
          archived_at: string | null
          assessment_year_id: string
          case_id: string
          client_id: string
          created_at: string
          expected_amount: number | null
          expected_date: string | null
          filing_record_id: string | null
          id: string
          last_checked_at: string | null
          next_action: string | null
          notes: string | null
          received_amount: number | null
          received_date: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          assessment_year_id: string
          case_id: string
          client_id: string
          created_at?: string
          expected_amount?: number | null
          expected_date?: string | null
          filing_record_id?: string | null
          id?: string
          last_checked_at?: string | null
          next_action?: string | null
          notes?: string | null
          received_amount?: number | null
          received_date?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          assessment_year_id?: string
          case_id?: string
          client_id?: string
          created_at?: string
          expected_amount?: number | null
          expected_date?: string | null
          filing_record_id?: string | null
          id?: string
          last_checked_at?: string | null
          next_action?: string | null
          notes?: string | null
          received_amount?: number | null
          received_date?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_assessment_year_workspace_fk"
            columns: ["workspace_id", "assessment_year_id"]
            isOneToOne: false
            referencedRelation: "assessment_years"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "refunds_case_context_fk"
            columns: [
              "workspace_id",
              "case_id",
              "client_id",
              "assessment_year_id",
            ]
            isOneToOne: false
            referencedRelation: "filing_cases"
            referencedColumns: [
              "workspace_id",
              "id",
              "client_id",
              "assessment_year_id",
            ]
          },
          {
            foreignKeyName: "refunds_client_workspace_fk"
            columns: ["workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "refunds_filing_record_workspace_fk"
            columns: ["workspace_id", "case_id", "filing_record_id"]
            isOneToOne: false
            referencedRelation: "filing_records"
            referencedColumns: ["workspace_id", "case_id", "id"]
          },
        ]
      }
      tax_events: {
        Row: {
          amount: number | null
          archived_at: string | null
          assessment_year_id: string
          case_id: string
          category: string
          client_id: string
          closure_date: string | null
          created_at: string
          event_type: string
          filing_record_id: string | null
          id: string
          issue_date: string | null
          next_action: string | null
          notes: string | null
          received_date: string | null
          reference_number: string | null
          response_due_date: string | null
          status: string
          submission_date: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount?: number | null
          archived_at?: string | null
          assessment_year_id: string
          case_id: string
          category: string
          client_id: string
          closure_date?: string | null
          created_at?: string
          event_type: string
          filing_record_id?: string | null
          id?: string
          issue_date?: string | null
          next_action?: string | null
          notes?: string | null
          received_date?: string | null
          reference_number?: string | null
          response_due_date?: string | null
          status?: string
          submission_date?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number | null
          archived_at?: string | null
          assessment_year_id?: string
          case_id?: string
          category?: string
          client_id?: string
          closure_date?: string | null
          created_at?: string
          event_type?: string
          filing_record_id?: string | null
          id?: string
          issue_date?: string | null
          next_action?: string | null
          notes?: string | null
          received_date?: string | null
          reference_number?: string | null
          response_due_date?: string | null
          status?: string
          submission_date?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_events_assessment_year_workspace_fk"
            columns: ["workspace_id", "assessment_year_id"]
            isOneToOne: false
            referencedRelation: "assessment_years"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "tax_events_case_context_fk"
            columns: [
              "workspace_id",
              "case_id",
              "client_id",
              "assessment_year_id",
            ]
            isOneToOne: false
            referencedRelation: "filing_cases"
            referencedColumns: [
              "workspace_id",
              "id",
              "client_id",
              "assessment_year_id",
            ]
          },
          {
            foreignKeyName: "tax_events_client_workspace_fk"
            columns: ["workspace_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "tax_events_filing_record_workspace_fk"
            columns: ["workspace_id", "case_id", "filing_record_id"]
            isOneToOne: false
            referencedRelation: "filing_records"
            referencedColumns: ["workspace_id", "case_id", "id"]
          },
        ]
      }
      workspace_invoice_settings: {
        Row: {
          created_at: string
          pdf_extraction_settings: Json
          rate_card: Json
          refund_charge_percentage: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          pdf_extraction_settings?: Json
          rate_card?: Json
          refund_charge_percentage?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          pdf_extraction_settings?: Json
          rate_card?: Json
          refund_charge_percentage?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invoice_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          active: boolean
          created_at: string
          role: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          role?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          role?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_workspace_invoice_sequences: {
        Args: { target_workspace_id: string }
        Returns: {
          assessment_year_id: string
          next_serial: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
