'use client';

import React, { useState } from "react";
import { updateRefundStatusAction } from "@/lib/actions/journey";
import { Button } from "@/components/ui/Button";
import { ArrowRight, CheckCircle, Clock3, Loader2 } from "lucide-react";

interface RefundTrackingStepProps {
  caseId: string;
  clientId: string;
  expectedAmount: number;
  initialStatus?: string;
  initialReceivedAmount?: number;
  initialReceivedDate?: string;
  onComplete: () => void;
}

export function RefundTrackingStep({
  caseId,
  clientId,
  expectedAmount,
  initialStatus = "Pending",
  initialReceivedAmount,
  initialReceivedDate,
  onComplete,
}: RefundTrackingStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState(initialStatus);
  const [receivedAmount, setReceivedAmount] = useState(() => {
    return initialReceivedAmount || expectedAmount;
  });
  const [receivedDate, setReceivedDate] = useState(() => {
    return initialReceivedDate || new Date().toISOString().split("T")[0];
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await updateRefundStatusAction({
      caseId,
      clientId,
      status,
      receivedAmount: status === "Received" ? receivedAmount : undefined,
      receivedDate: status === "Received" ? receivedDate : undefined,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to update refund status.");
    } else {
      onComplete();
    }
  }

  const isReceived = status === "Received";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Refund Tracking</h3>
        <p className="text-sm text-text-muted mt-0.5">
          Expected refund claim: <span className="font-semibold font-mono text-emerald-400">₹{expectedAmount.toLocaleString()}</span>.
          Update the tracking status when credit is received.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {error && (
          <div className="p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-[var(--radius-input)]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs text-text-secondary sm:col-span-2">
            <span className="font-semibold text-text-primary">Refund Credit Status</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("Pending")}
                className={`h-10 rounded-[var(--radius-input)] border flex items-center justify-center gap-1.5 text-sm font-semibold transition-all duration-300 ${
                  status === "Pending"
                    ? "border-amber-500 bg-amber-950/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    : "border-border-subtle bg-surface-panel text-text-secondary hover:bg-surface-hover"
                }`}
              >
                <Clock3 className="h-4 w-4" /> Pending Credit
              </button>
              <button
                type="button"
                onClick={() => setStatus("Received")}
                className={`h-10 rounded-[var(--radius-input)] border flex items-center justify-center gap-1.5 text-sm font-semibold transition-all duration-300 ${
                  status === "Received"
                    ? "border-emerald-500 bg-emerald-950/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                    : "border-border-subtle bg-surface-panel text-text-secondary hover:bg-surface-hover"
                }`}
              >
                <CheckCircle className="h-4 w-4" /> Credit Received
              </button>
            </div>
          </label>

          {isReceived && (
            <>
              <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">Received Amount (₹)</span>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  required
                  className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">Received Date</span>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  required
                  className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </label>
            </>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" disabled={loading} className="active:scale-95 transition-transform">
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Update Status <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
