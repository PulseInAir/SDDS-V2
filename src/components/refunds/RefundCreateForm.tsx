"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2, RotateCcw, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { createRefundAction, type RefundActionState } from "@/lib/actions/refunds";
import { REFUND_STATUSES, formatRefundStatus } from "@/lib/utils/refunds";

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

const initialState: RefundActionState = {};

export function RefundCreateForm({
  clients,
  assessmentYears,
  caseOptions,
  filingRecordOptions,
  defaultClientId,
}: {
  clients: ClientOption[];
  assessmentYears: AssessmentYearOption[];
  caseOptions: CaseOption[];
  filingRecordOptions: FilingRecordOption[];
  defaultClientId?: string;
}) {
  const [state, formAction, isPending] = useActionState(createRefundAction, initialState);
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [assessmentYearId, setAssessmentYearId] = useState(
    assessmentYears.find((assessmentYear) => assessmentYear.is_current)?.id ?? "",
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Create refund record</h2>
          <p className="mt-1 text-sm text-text-muted">
            Record the expected refund, receipt status, follow-up action, and filing link without leaving the operational queue.
          </p>
        </div>
        <WalletCards className="h-5 w-5 text-text-muted" aria-hidden="true" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {defaultClientId ? <input type="hidden" name="clientId" value={clientId} /> : null}
        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Client</span>
          <select
            name={defaultClientId ? undefined : "clientId"}
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            required
            disabled={Boolean(defaultClientId)}
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
            name="assessmentYearId"
            value={assessmentYearId}
            onChange={(event) => setAssessmentYearId(event.target.value)}
            required
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
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
            defaultValue="expected"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            {REFUND_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatRefundStatus(status)}
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
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Expected date</span>
          <input
            type="date"
            name="expectedDate"
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
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Received date</span>
          <input
            type="date"
            name="receivedDate"
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
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Linked filing record</span>
          <select
            name="filingRecordId"
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
        <Button
          type="reset"
          variant="secondary"
          onClick={() => {
            setClientId(defaultClientId ?? "");
            setAssessmentYearId(assessmentYears.find((assessmentYear) => assessmentYear.is_current)?.id ?? "");
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          Reset
        </Button>
        <Button type="submit" variant="primary" disabled={isPending || !selectedCaseId}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Save refund
        </Button>
      </div>
    </form>
  );
}
