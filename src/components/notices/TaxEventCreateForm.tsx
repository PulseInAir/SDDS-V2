"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { createTaxEventAction, type TaxEventActionState } from "@/lib/actions/notices";
import { TAX_EVENT_STATUSES, TAX_EVENT_TYPES, formatTaxEventStatus, formatTaxEventType } from "@/lib/utils/notices";

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

const initialState: TaxEventActionState = {};

export function TaxEventCreateForm({
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
  const [state, formAction, isPending] = useActionState(createTaxEventAction, initialState);
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
          <h2 className="text-base font-semibold text-text-primary">Create notice record</h2>
          <p className="mt-1 text-sm text-text-muted">
            Capture the event, response timeline, filing link, and closure path in one operational record.
          </p>
        </div>
        <AlertCircle className="h-5 w-5 text-text-muted" aria-hidden="true" />
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
          <span className="font-medium text-text-primary">Type</span>
          <select
            name="eventType"
            defaultValue="notice"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            {TAX_EVENT_TYPES.map((eventType) => (
              <option key={eventType} value={eventType}>
                {formatTaxEventType(eventType)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Category</span>
          <input
            type="text"
            name="category"
            required
            placeholder="143(1) demand, defective return, rectification response..."
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Status</span>
          <select
            name="status"
            defaultValue="open"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            {TAX_EVENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatTaxEventStatus(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Amount / demand</span>
          <input
            type="number"
            name="amount"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Issue date</span>
          <input
            type="date"
            name="issueDate"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
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

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Response due date</span>
          <input
            type="date"
            name="responseDueDate"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Submission date</span>
          <input
            type="date"
            name="submissionDate"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Closure date</span>
          <input
            type="date"
            name="closureDate"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Submission / reference number</span>
          <input
            type="text"
            name="referenceNumber"
            placeholder="DIN, CPC reference, response ARN..."
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

        <div className="rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-3 py-2 text-sm text-text-secondary">
          Related documents stay on the client/case document history. Use this notice record to keep the response deadline and filing link visible.
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Next action</span>
          <textarea
            name="nextAction"
            rows={3}
            placeholder="Prepare response, upload proof, confirm closure with CPC, or record a hearing step."
            className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Notes</span>
          <textarea
            name="notes"
            rows={3}
            placeholder="Internal summary of the issue, reply filed, or resolution details."
            className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      {!selectedCaseId && clientId && assessmentYearId ? (
        <p className="rounded-[var(--radius-input)] border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          No filing case exists yet for this client and assessment year. Create the case before saving a notice record.
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
          Save notice
        </Button>
      </div>
    </form>
  );
}
