'use client';

import React, { useState } from "react";
import { recordClientStatusAction } from "@/lib/actions/journey";
import { Loader2 } from "lucide-react";

interface ClientStatusStepProps {
  clientId: string;
  selectedAyId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filingCase?: any;
  onComplete: (status: string) => void;
}

export function ClientStatusStep({ clientId, selectedAyId, filingCase, onComplete }: ClientStatusStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [status, setStatus] = useState(
    filingCase?.case_status === "Filed" ? "Filed" : "Filing Queue"
  );
  const [returnCategory, setReturnCategory] = useState(filingCase?.return_category || "ITR-1");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(
    filingCase?.expected_completion_date ? filingCase.expected_completion_date.split('T')[0] : ""
  );
  const [dueDate, setDueDate] = useState(
    filingCase?.due_date ? filingCase.due_date.split('T')[0] : ""
  );
  const [nextAction, setNextAction] = useState(filingCase?.next_action || "");
  const [blockerCode, setBlockerCode] = useState(filingCase?.blocker_code || "");
  const [blockerNote, setBlockerNote] = useState(filingCase?.blocker_note || "");
  const [followUpExcluded, setFollowUpExcluded] = useState(!!filingCase?.follow_up_excluded);
  const [refundAmount, setRefundAmount] = useState(filingCase?.refund_claimed_amount || "");
  
  // Use today's date if filingDate doesn't exist on the record.
  // Wait, the journey action Upserts filing record for the date. We will default to today.
  const [filingDate, setFilingDate] = useState(() => new Date().toISOString().split("T")[0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await recordClientStatusAction({
      clientId,
      assessmentYearId: selectedAyId,
      status,
      returnCategory,
      filingDate,
      refundAmount: refundAmount ? Number(refundAmount) : null,
      expectedCompletionDate,
      dueDate,
      nextAction,
      blockerCode,
      blockerNote,
      followUpExcluded,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to save client status.");
    } else {
      onComplete(status);
    }
  }

  return (
    <div className="space-y-4 w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-[var(--radius-input)]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs text-white/60">
            <span className="font-semibold text-white/80">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 shadow-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              <option value="Filing Queue" className="bg-neutral-900">Filing Queue</option>
              <option value="Filed" className="bg-neutral-900">Filed</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs text-white/60">
            <span className="font-semibold text-white/80">ITR No. / Return Category</span>
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
            <span className="font-semibold text-white/80">Filing Date (if filed)</span>
            <input
              type="date"
              value={filingDate}
              onChange={(e) => setFilingDate(e.target.value)}
              required={status === "Filed"}
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

          <label className="flex flex-col gap-1.5 text-xs text-white/60">
            <span className="font-semibold text-white/80">Expected Completion</span>
            <input
              type="date"
              value={expectedCompletionDate}
              onChange={(e) => setExpectedCompletionDate(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 shadow-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs text-white/60">
            <span className="font-semibold text-white/80">Due Date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 shadow-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs text-white/60">
            <span className="font-semibold text-white/80">Next Action</span>
            <input
              type="text"
              placeholder="e.g. Request form 16"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 shadow-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs text-white/60">
            <span className="font-semibold text-white/80">Blocker Code</span>
            <input
              type="text"
              placeholder="e.g. MISSING_DOCS"
              value={blockerCode}
              onChange={(e) => setBlockerCode(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 shadow-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs text-white/60 sm:col-span-2">
            <span className="font-semibold text-white/80">Blocker Note</span>
            <input
              type="text"
              placeholder="Describe what is blocking the case"
              value={blockerNote}
              onChange={(e) => setBlockerNote(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 shadow-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </label>
        </div>

        <div className="flex items-center">
          <input
            id="follow-up-excluded"
            type="checkbox"
            checked={followUpExcluded}
            onChange={(e) => setFollowUpExcluded(e.target.checked)}
            className="h-4 w-4 rounded-[4px] border-white/10 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 bg-white/5"
          />
          <label htmlFor="follow-up-excluded" className="ml-2 block text-sm text-white/80">
            Exclude from follow-up queue
          </label>
        </div>

        <div className="pt-2 max-w-xl mx-auto">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#0a0700] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Status {status === "Filed" ? "& Proceed →" : ""}
          </button>
        </div>
      </form>
    </div>
  );
}

