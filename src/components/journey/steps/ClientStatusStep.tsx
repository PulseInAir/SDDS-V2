'use client';

import React, { useState } from "react";
import { recordClientStatusAction } from "@/lib/actions/journey";
import { Loader2 } from "lucide-react";

interface ClientStatusStepProps {
  clientId: string;
  selectedAyId: string;
  onComplete: () => void;
}

export function ClientStatusStep({ clientId, selectedAyId, onComplete }: ClientStatusStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [returnCategory, setReturnCategory] = useState("ITR-1");
  const [filingDate, setFilingDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [refundAmount, setRefundAmount] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await recordClientStatusAction({
      clientId,
      assessmentYearId: selectedAyId,
      returnCategory,
      filingDate,
      refundAmount: refundAmount ? Number(refundAmount) : null,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to save client status.");
    } else {
      onComplete();
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
        {error && (
          <div className="p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-[var(--radius-input)]">
            {error}
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-xs text-white/60">
          <span className="font-semibold text-white/80">ITR No.</span>
          <select
            value={returnCategory}
            onChange={(e) => setReturnCategory(e.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 shadow-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          >
            {["ITR-1", "ITR-2", "ITR-3", "ITR-4", "ITR-5", "ITR-6", "ITR-7"].map((form) => (
              <option key={form} value={form} className="bg-neutral-900">{form}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-white/60">
          <span className="font-semibold text-white/80">Filing Date</span>
          <input
            type="date"
            value={filingDate}
            onChange={(e) => setFilingDate(e.target.value)}
            required
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 shadow-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-white/60">
          <span className="font-semibold text-white/80">Refund Amount (if any)</span>
          <input
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder="e.g. 15000"
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 shadow-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </label>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#0a0700] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Status & Proceed →
          </button>
        </div>
      </form>
    </div>
  );
}
