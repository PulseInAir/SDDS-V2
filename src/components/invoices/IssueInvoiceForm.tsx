"use client";

import { useActionState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";

import { issueInvoiceAction, type InvoiceActionState } from "@/lib/actions/invoices";
import { Button } from "@/components/ui/Button";

const initialState: InvoiceActionState = {};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function plusThirtyDays() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

export function IssueInvoiceForm({ invoiceId }: { invoiceId: string }) {
  const boundAction = issueInvoiceAction.bind(null, invoiceId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Issue invoice</h3>
          <p className="mt-1 text-xs text-text-muted">Once issued, line items and discount stay locked while payments reconcile the status.</p>
        </div>
        <CalendarDays className="h-4 w-4 text-text-muted" aria-hidden="true" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Issue date</span>
          <input
            type="date"
            name="issueDate"
            defaultValue={today()}
            required
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Due date</span>
          <input
            type="date"
            name="dueDate"
            defaultValue={plusThirtyDays()}
            required
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      {state?.error ? (
        <p className="rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-[var(--radius-input)] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Issue invoice
        </Button>
      </div>
    </form>
  );
}
