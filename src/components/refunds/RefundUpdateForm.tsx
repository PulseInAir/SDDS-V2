"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { updateRefundAction, type RefundActionState } from "@/lib/actions/refunds";
import { REFUND_STATUSES, formatRefundStatus, toDateTimeLocalValue } from "@/lib/utils/refunds";

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

export function RefundUpdateForm({
  refund,
  filingRecordOptions,
  revalidateTarget,
}: {
  refund: RefundFormRecord;
  filingRecordOptions: FilingRecordOption[];
  revalidateTarget: string;
}) {
  const updateRefundWithId = updateRefundAction.bind(null, refund.id);
  const [state, formAction, isPending] = useActionState(updateRefundWithId, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
      <input type="hidden" name="clientId" value={refund.client_id} />
      <input type="hidden" name="assessmentYearId" value={refund.assessment_year_id} />
      <input type="hidden" name="revalidateTarget" value={revalidateTarget} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Status</span>
          <select
            name="status"
            defaultValue={refund.status}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            {REFUND_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatRefundStatus(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Expected amount</span>
          <input
            type="number"
            name="expectedAmount"
            min="0"
            step="0.01"
            defaultValue={refund.expected_amount ?? ""}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Expected date</span>
          <input
            type="date"
            name="expectedDate"
            defaultValue={refund.expected_date ?? ""}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Last checked</span>
          <input
            type="datetime-local"
            name="lastCheckedAt"
            defaultValue={toDateTimeLocalValue(refund.last_checked_at)}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Received amount</span>
          <input
            type="number"
            name="receivedAmount"
            min="0"
            step="0.01"
            defaultValue={refund.received_amount ?? ""}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Received date</span>
          <input
            type="date"
            name="receivedDate"
            defaultValue={refund.received_date ?? ""}
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary xl:col-span-2">
          <span className="font-medium text-text-primary">Linked filing record</span>
          <select
            name="filingRecordId"
            defaultValue={refund.filing_record_id ?? ""}
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
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Next action</span>
          <textarea
            name="nextAction"
            rows={3}
            defaultValue={refund.next_action ?? ""}
            className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Notes</span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={refund.notes ?? ""}
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
