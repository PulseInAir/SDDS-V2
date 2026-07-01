"use client";

import { useActionState, useMemo, useState, useEffect } from "react";
import { Loader2, RotateCcw, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { getClientDocumentsModuleData } from "@/lib/actions/documents";
import { createRefundAction, updateRefundAction, type RefundActionState } from "@/lib/actions/refunds";
import { REFUND_STATUSES, formatRefundStatus, toDateTimeLocalValue } from "@/lib/utils/refunds";

type ClientOption = {
  id: string;
  full_name: string;
  pan_uppercase: string;
};

type AssessmentYearOption = {
  id: string;
  label: string;
  is_current: boolean | null;
};

type CaseOption = {
  id: string;
  client_id: string;
  assessment_year_id: string;
  case_status: string;
  next_action: string | null;
};

type FilingRecordOption = {
  id: string;
  case_id: string;
  filing_kind: string;
  filing_date: string | null;
  acknowledgement_number: string | null;
};

type RefundFormRecord = {
  id: string;
  client_id: string;
  assessment_year_id: string;
  case_id: string;
  filing_record_id: string | null;
  status: string;
  expected_amount: number | null;
  expected_date: string | null;
  received_amount: number | null;
  received_date: string | null;
  last_checked_at: string | null;
  next_action: string | null;
  notes: string | null;
};

const initialState: RefundActionState = {};

export function RefundCreateForm({
  clients,
  assessmentYears,
  caseOptions,
  filingRecordOptions,
  defaultClientId,
  editingRefund,
  onCancelEdit,
  revalidateTarget = "/refunds",
}: {
  clients: ClientOption[];
  assessmentYears: AssessmentYearOption[];
  caseOptions: CaseOption[];
  filingRecordOptions: FilingRecordOption[];
  defaultClientId?: string;
  editingRefund?: RefundFormRecord | null;
  onCancelEdit?: () => void;
  revalidateTarget?: string;
}) {
  const [clientId, setClientId] = useState(editingRefund ? editingRefund.client_id : (defaultClientId ?? ""));
  const [assessmentYearId, setAssessmentYearId] = useState(
    editingRefund
      ? editingRefund.assessment_year_id
      : (assessmentYears.find((assessmentYear) => assessmentYear.is_current)?.id ?? ""),
  );
  const [status, setStatus] = useState(editingRefund ? editingRefund.status : "expected");
  const [expectedAmount, setExpectedAmount] = useState(
    editingRefund && editingRefund.expected_amount !== null ? String(editingRefund.expected_amount) : "",
  );
  const [expectedDate, setExpectedDate] = useState(editingRefund ? (editingRefund.expected_date ?? "") : "");
  const [receivedAmount, setReceivedAmount] = useState(
    editingRefund && editingRefund.received_amount !== null ? String(editingRefund.received_amount) : "",
  );
  const [receivedDate, setReceivedDate] = useState(editingRefund ? (editingRefund.received_date ?? "") : "");
  const [lastCheckedAt, setLastCheckedAt] = useState(
    editingRefund ? toDateTimeLocalValue(editingRefund.last_checked_at) : "",
  );
  const [filingRecordId, setFilingRecordId] = useState(editingRefund ? (editingRefund.filing_record_id ?? "") : "");
  const [nextAction, setNextAction] = useState(editingRefund ? (editingRefund.next_action ?? "") : "");
  const [notes, setNotes] = useState(editingRefund ? (editingRefund.notes ?? "") : "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  // Form submit handler that decides to Create or Update
  const formActionHandler = async (prevState: RefundActionState, formData: FormData) => {
    if (editingRefund) {
      return updateRefundAction(editingRefund.id, prevState, formData);
    } else {
      return createRefundAction(prevState, formData);
    }
  };

  const [state, formAction, isPending] = useActionState(formActionHandler, initialState);

  // Clear or reset on success
  useEffect(() => {
    if (state.success) {
      if (editingRefund) {
        if (onCancelEdit) {
          onCancelEdit();
        }
      } else {
        Promise.resolve().then(() => {
          setExpectedAmount("");
          setExpectedDate("");
          setReceivedAmount("");
          setReceivedDate("");
          setLastCheckedAt("");
          setFilingRecordId("");
          setNextAction("");
          setNotes("");
          setSelectedDocId("");
        });
      }
    }
  }, [state.success, editingRefund, onCancelEdit]);

  // Load client documents
  useEffect(() => {
    if (!clientId) {
      Promise.resolve().then(() => setClientDocuments((prev) => (prev.length === 0 ? prev : [])));
      return;
    }
    getClientDocumentsModuleData(clientId)
      .then((res) => {
        const docs = res.chains
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c: any) => c.latest)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((d: any) => d.mime_type === "application/pdf");
        setClientDocuments(docs);
      })
      .catch((err) => {
        console.error("Failed to load client documents:", err);
      });
  }, [clientId]);

  const handleExtract = async (docId: string) => {
    if (!docId) return;
    setIsExtracting(true);
    try {
      const res = await fetch(`/api/documents/${docId}/extract`, {
        method: "POST",
      });
      const result = await res.json();
      
      if (result.success && result.data) {
        const { assessmentYear, assessmentYearId: extractedAyId, refundAmount } = result.data;
        
        if (extractedAyId) {
          setAssessmentYearId(extractedAyId);
        } else if (assessmentYear) {
          const match = assessmentYears.find((ay) => ay.label === assessmentYear);
          if (match) setAssessmentYearId(match.id);
        }

        if (refundAmount && refundAmount > 0) {
          setExpectedAmount(String(refundAmount));
          setNotes((prev) => prev ? `${prev}\nAuto-populated from ITR-V.` : "Auto-populated from ITR-V.");
        }
      }
    } catch (err) {
      console.error("Extraction error:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const selectedCaseId = useMemo(
    () =>
      caseOptions.find(
        (filingCase) =>
          filingCase.client_id === clientId && filingCase.assessment_year_id === assessmentYearId,
      )?.id ?? "",
    [assessmentYearId, caseOptions, clientId],
  );

  const availableFilingRecords = useMemo(
    () => filingRecordOptions.filter((filingRecord) => filingRecord.case_id === selectedCaseId),
    [filingRecordOptions, selectedCaseId],
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm"
    >
      {/* Hidden inputs to make sure disabled values are submitted in edit mode */}
      {(defaultClientId || editingRefund) && (
        <input type="hidden" name="clientId" value={clientId} />
      )}
      {editingRefund && (
        <input type="hidden" name="assessmentYearId" value={assessmentYearId} />
      )}
      <input type="hidden" name="revalidateTarget" value={revalidateTarget} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            {editingRefund ? "Edit refund record" : "Create refund record"}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {editingRefund
              ? "Update the refund details, receipt status, and actions."
              : "Record the expected refund, receipt status, follow-up action, and filing link without leaving the operational queue."}
          </p>
        </div>
        <WalletCards className="h-5 w-5 text-text-muted" aria-hidden="true" />
      </div>

      {clientId && clientDocuments.length > 0 && !editingRefund && (
        <div className="rounded-[var(--radius-input)] border border-brand-100 bg-brand-50/50 p-3 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-semibold text-brand-900">Autofill from document</span>
              <p className="text-xs text-brand-700">Extract filing details and auto-populate refund amount.</p>
            </div>
            <select
              value={selectedDocId}
              onChange={(e) => {
                const docId = e.target.value;
                setSelectedDocId(docId);
                handleExtract(docId);
              }}
              disabled={isExtracting}
              className="h-9 rounded-[var(--radius-input)] border border-brand-200 bg-white px-2 text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:opacity-50"
            >
              <option value="">Choose a document...</option>
              {clientDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.document_type} ({doc.original_filename})
                </option>
              ))}
            </select>
          </div>
          {isExtracting && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-800">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-700" />
              <span>Parsing document and extracting refund...</span>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Client</span>
          <select
            name={(defaultClientId || editingRefund) ? undefined : "clientId"}
            value={clientId}
            onChange={(event) => {
              setClientId(event.target.value);
              setSelectedDocId("");
            }}
            required
            disabled={Boolean(defaultClientId) || Boolean(editingRefund)}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:bg-surface-muted"
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name} • {client.pan_uppercase}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Assessment year</span>
          <select
            name={editingRefund ? undefined : "assessmentYearId"}
            value={assessmentYearId}
            onChange={(event) => setAssessmentYearId(event.target.value)}
            required
            disabled={Boolean(editingRefund)}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:bg-surface-muted"
          >
            <option value="">Select AY</option>
            {assessmentYears.map((assessmentYear) => (
              <option key={assessmentYear.id} value={assessmentYear.id}>
                {assessmentYear.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Status</span>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            {REFUND_STATUSES.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {formatRefundStatus(statusOption)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Expected amount</span>
          <input
            type="number"
            name="expectedAmount"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={expectedAmount}
            onChange={(e) => setExpectedAmount(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Expected date</span>
          <input
            type="date"
            name="expectedDate"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Received amount</span>
          <input
            type="number"
            name="receivedAmount"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={receivedAmount}
            onChange={(e) => setReceivedAmount(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Received date</span>
          <input
            type="date"
            name="receivedDate"
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Last checked</span>
          <input
            type="datetime-local"
            name="lastCheckedAt"
            value={lastCheckedAt}
            onChange={(e) => setLastCheckedAt(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Linked filing record</span>
          <select
            name="filingRecordId"
            value={filingRecordId}
            onChange={(e) => setFilingRecordId(e.target.value)}
            disabled={!selectedCaseId}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:bg-surface-muted"
          >
            <option value="">{selectedCaseId ? "Optional filing link" : "Choose client and AY first"}</option>
            {availableFilingRecords.map((filingRecord) => (
              <option key={filingRecord.id} value={filingRecord.id}>
                {filingRecord.filing_kind}
                {filingRecord.acknowledgement_number ? ` • ${filingRecord.acknowledgement_number}` : ""}
                {filingRecord.filing_date ? ` • ${filingRecord.filing_date}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Next action</span>
          <textarea
            name="nextAction"
            rows={3}
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="Check refund processing, confirm bank credit, or record discrepancy follow-up."
            className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Notes</span>
          <textarea
            name="notes"
            rows={3}
            placeholder="Optional internal note about amount mismatch, bank issue, or return processing."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      {!selectedCaseId && clientId && assessmentYearId ? (
        <p className="rounded-[var(--radius-input)] border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          No filing case exists yet for this client and assessment year. Create the case before saving a refund record.
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-[var(--radius-input)] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {editingRefund ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancelEdit}
          >
            Cancel
          </Button>
        ) : (
          <Button
            type="reset"
            variant="secondary"
            onClick={() => {
              setClientId(defaultClientId ?? "");
              setAssessmentYearId(assessmentYears.find((assessmentYear) => assessmentYear.is_current)?.id ?? "");
              setStatus("expected");
              setExpectedAmount("");
              setExpectedDate("");
              setReceivedAmount("");
              setReceivedDate("");
              setLastCheckedAt("");
              setFilingRecordId("");
              setNextAction("");
              setNotes("");
              setSelectedDocId("");
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isPending || !selectedCaseId}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {editingRefund ? "Save update" : "Save refund"}
        </Button>
      </div>
    </form>
  );
}
