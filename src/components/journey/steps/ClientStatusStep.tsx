'use client';

import React, { useState } from "react";
import { recordClientStatusAction } from "@/lib/actions/journey";
import { Loader2 } from "lucide-react";

interface ClientStatusStepProps {
  clientId: string;
  selectedAyId: string;
  filingCase?: {
    case_status?: string;
    return_category?: string;
  };
  onComplete: (status: string) => void;
}

export function ClientStatusStep({ clientId, selectedAyId, filingCase, onComplete }: ClientStatusStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(
    filingCase?.case_status === "Filed" ? "Filed" : "Filing Queue"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await recordClientStatusAction({
      clientId,
      assessmentYearId: selectedAyId,
      status,
      returnCategory: filingCase?.return_category || "ITR-1",
      refundAmount: null,
      expectedCompletionDate: null,
      dueDate: null,
      nextAction: null,
      blockerCode: null,
      blockerNote: null,
      followUpExcluded: false,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to save client status.");
    } else {
      onComplete(status);
    }
  }

  return (
    <div className="space-y-8 w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-3 text-base bg-red-950/20 border border-red-500/30 text-red-400 rounded-[var(--radius-input)]">
            {error}
          </div>
        )}

        {/* Two status toggle buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStatus("Filing Queue")}
            className={`h-14 rounded-xl border text-base font-medium transition-all duration-200 ${
              status === "Filing Queue"
                ? "bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "bg-white/5 text-white/60 border-white/10 hover:border-white/30 hover:text-white/80"
            }`}
          >
            Filing Queue
          </button>
          <button
            type="button"
            onClick={() => setStatus("Filed")}
            className={`h-14 rounded-xl border text-base font-medium transition-all duration-200 ${
              status === "Filed"
                ? "bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "bg-white/5 text-white/60 border-white/10 hover:border-white/30 hover:text-white/80"
            }`}
          >
            Filed
          </button>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-amber-500 text-black font-semibold text-base shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#0a0700] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "Filed" ? "Save & Proceed →" : "Save"}
        </button>
      </form>
    </div>
  );
}
