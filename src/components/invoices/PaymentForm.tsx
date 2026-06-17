"use client";

import { useActionState } from "react";
import { Loader2, Wallet } from "lucide-react";

import { recordPaymentAction, type InvoiceActionState } from "@/lib/actions/invoices";
import { Button } from "@/components/ui/Button";

const initialState: InvoiceActionState = {};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentForm({
  invoiceId,
  maxAmount,
}: {
  invoiceId: string;
  maxAmount: number;
}) {
  const boundAction = recordPaymentAction.bind(null, invoiceId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Record payment</h3>
          <p className="mt-1 text-xs text-text-muted">Cash and UPI are the only MVP settlement modes. Overpayment is blocked.</p>
        </div>
        <Wallet className="h-4 w-4 text-text-muted" aria-hidden="true" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Payment date</span>
          <input
            type="date"
            name="paymentDate"
            defaultValue={today()}
            required
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Amount</span>
          <input
            type="number"
            name="amount"
            min="0.01"
            max={maxAmount}
            step="0.01"
            required
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Mode</span>
          <select
            name="mode"
            defaultValue="upi"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Reference</span>
          <input
            type="text"
            name="reference"
            placeholder="UPI reference or receipt note"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      <label className="space-y-1 text-sm text-text-secondary">
        <span className="font-medium text-text-primary">Note</span>
        <textarea
          name="note"
          rows={3}
          placeholder="Optional payment note."
          className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
        />
      </label>

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
          Record payment
        </Button>
      </div>
    </form>
  );
}
