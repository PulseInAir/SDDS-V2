"use client";

import { useActionState } from "react";
import { Loader2, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  reactivateFollowUpAction,
  updateFollowUpAction,
  type FollowUpActionState,
} from "@/lib/actions/follow-ups";
import { FOLLOW_UP_STATUSES, formatFollowUpStatus } from "@/lib/utils/follow-ups";

type FollowUpRecord = {
  id: string;
  client_id: string;
  status: string;
  due_date: string;
  next_action: string | null;
  notes: string | null;
  exclusion_reason: string | null;
};

const initialState: FollowUpActionState = {};

export function FollowUpUpdateForm({
  followUp,
  revalidateTarget,
}: {
  followUp: FollowUpRecord;
  revalidateTarget: string;
}) {
  const updateFollowUpWithId = updateFollowUpAction.bind(null, followUp.id);
  const reactivateFollowUpWithId = reactivateFollowUpAction.bind(null, followUp.id, revalidateTarget);
  const [state, formAction, isPending] = useActionState(updateFollowUpWithId, initialState);
  const [reactivateState, reactivateAction, isReactivating] = useActionState(reactivateFollowUpWithId, initialState);

  return (
    <div className="space-y-4 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
      {followUp.status === "excluded" ? (
        <form action={reactivateAction} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Reactivate this follow-up</p>
            <p className="mt-1 text-xs text-text-muted">
              Keep the due date, clear the exclusion state, and move the record back into the live queue.
            </p>
          </div>
          <Button type="submit" variant="secondary" disabled={isReactivating}>
            {isReactivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <PlayCircle className="mr-2 h-4 w-4" aria-hidden="true" />}
            Reactivate
          </Button>
        </form>
      ) : null}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="revalidateTarget" value={revalidateTarget} />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Status</span>
            <select
              name="status"
              defaultValue={followUp.status}
              className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            >
              {FOLLOW_UP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatFollowUpStatus(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Due date</span>
            <input
              type="date"
              name="dueDate"
              defaultValue={followUp.due_date}
              className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>

          <label className="space-y-1 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Exclusion reason</span>
            <input
              type="text"
              name="exclusionReason"
              defaultValue={followUp.exclusion_reason ?? ""}
              placeholder="Required only when excluding"
              className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <label className="space-y-1 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Next action</span>
            <textarea
              name="nextAction"
              rows={3}
              defaultValue={followUp.next_action ?? ""}
              className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>

          <label className="space-y-1 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Notes</span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={followUp.notes ?? ""}
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

        {reactivateState.error ? (
          <p className="rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {reactivateState.error}
          </p>
        ) : null}

        {reactivateState.success ? (
          <p className="rounded-[var(--radius-input)] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {reactivateState.success}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Save update
          </Button>
        </div>
      </form>
    </div>
  );
}
