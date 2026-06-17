"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { updateTaxEventAction, type TaxEventActionState } from "@/lib/actions/notices";
import { TAX_EVENT_STATUSES, TAX_EVENT_TYPES, formatTaxEventStatus, formatTaxEventType } from "@/lib/utils/notices";

type FilingRecordOption = {
  id: string;
  case_id: string;
  filing_kind: string;
  filing_date: string | null;
  acknowledgement_number: string | null;
};

type TaxEventFormRecord = {
  id: string;
  client_id: string;
  assessment_year_id: string;
  case_id: string;
  filing_record_id: string | null;
  event_type: string;
  category: string;
  status: string;
  issue_date: string | null;
  received_date: string | null;
  response_due_date: string | null;
  submission_date: string | null;
  closure_date: string | null;
  reference_number: string | null;
  amount: number | null;
  next_action: string | null;
  notes: string | null;
};

const initialState: TaxEventActionState = {};

export function TaxEventUpdateForm({
  taxEvent,
  filingRecordOptions,
  revalidateTarget,
}: {
  taxEvent: TaxEventFormRecord;
  filingRecordOptions: FilingRecordOption[];
  revalidateTarget: string;
}) {
  const updateTaxEventWithId = updateTaxEventAction.bind(null, taxEvent.id);
  const [state, formAction, isPending] = useActionState(updateTaxEventWithId, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
      <input type="hidden" name="clientId" value={taxEvent.client_id} />
      <input type="hidden" name="assessmentYearId" value={taxEvent.assessment_year_id} />
      <input type="hidden" name="revalidateTarget" value={revalidateTarget} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Type</span>
          <select
            name="eventType"
            defaultValue={taxEvent.event_type}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            {TAX_EVENT_TYPES.map((eventType) => (
              <option key={eventType} value={eventType}>
                {formatTaxEventType(eventType)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Category</span>
          <input
            type="text"
            name="category"
            defaultValue={taxEvent.category}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Status</span>
          <select
            name="status"
            defaultValue={taxEvent.status}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            {TAX_EVENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatTaxEventStatus(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Issue date</span>
          <input
            type="date"
            name="issueDate"
            defaultValue={taxEvent.issue_date ?? ""}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Received date</span>
          <input
            type="date"
            name="receivedDate"
            defaultValue={taxEvent.received_date ?? ""}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Response due date</span>
          <input
            type="date"
            name="responseDueDate"
            defaultValue={taxEvent.response_due_date ?? ""}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Amount / demand</span>
          <input
            type="number"
            name="amount"
            min="0"
            step="0.01"
            defaultValue={taxEvent.amount ?? ""}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Submission date</span>
          <input
            type="date"
            name="submissionDate"
            defaultValue={taxEvent.submission_date ?? ""}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Closure date</span>
          <input
            type="date"
            name="closureDate"
            defaultValue={taxEvent.closure_date ?? ""}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Submission / reference number</span>
          <input
            type="text"
            name="referenceNumber"
            defaultValue={taxEvent.reference_number ?? ""}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Linked filing record</span>
          <select
            name="filingRecordId"
            defaultValue={taxEvent.filing_record_id ?? ""}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="">No filing linked</option>
            {filingRecordOptions.map((filingRecord) => (
              <option key={filingRecord.id} value={filingRecord.id}>
                {filingRecord.filing_kind}
                {filingRecord.acknowledgement_number ? ` • ${filingRecord.acknowledgement_number}` : ""}
                {filingRecord.filing_date ? ` • ${filingRecord.filing_date}` : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-secondary">
          Upload supporting files from the Documents tab. This record keeps the due action and filing response joined to the case.
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Next action</span>
          <textarea
            name="nextAction"
            rows={3}
            defaultValue={taxEvent.next_action ?? ""}
            className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Notes</span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={taxEvent.notes ?? ""}
            className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

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

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Save update
        </Button>
      </div>
    </form>
  );
}
