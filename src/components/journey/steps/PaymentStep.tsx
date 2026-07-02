'use client';

import React, { useState } from "react";
import { recordPaymentAction } from "@/lib/actions/journey";
import { Button } from "@/components/ui/Button";
import { DollarSign, Check, Loader2 } from "lucide-react";

interface PaymentStepProps {
  clientId: string;
  invoiceId: string;
  balanceAmount: number;
  onComplete: () => void;
}

export function PaymentStep({ clientId, invoiceId, balanceAmount, onComplete }: PaymentStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState(balanceAmount);
  const [mode, setMode] = useState<"Cash" | "UPI">("Cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await recordPaymentAction({
      clientId,
      invoiceId,
      amount,
      mode,
      reference,
      note,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to record payment.");
    } else {
      onComplete();
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Collect Payment</h3>
        <p className="text-sm text-text-muted mt-0.5">
          Record a client payment for this invoice. Outstanding balance is <span className="font-semibold font-mono text-amber-400">₹{balanceAmount.toLocaleString()}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
        {error && (
          <div className="md:col-span-2 p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-[var(--radius-input)]">
            {error}
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">Payment Amount (₹)</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
            required
            className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">Payment Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "Cash" | "UPI")}
            className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI / Digital</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">Reference Number (Optional)</span>
          <input
            type="text"
            placeholder="e.g. UPI Transaction ID"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">Internal Notes (Optional)</span>
          <input
            type="text"
            placeholder="e.g. Paid by brother"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <div className="md:col-span-2 pt-2 flex justify-end">
          <Button type="submit" disabled={loading} className="active:scale-95 transition-transform">
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" /> Recording...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Record Payment
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
