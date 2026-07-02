'use client';

import React, { useState } from "react";
import { createCaseAndFilingAction } from "@/lib/actions/journey";
import { Button } from "@/components/ui/Button";
import { CalendarDays, FileSpreadsheet, Loader2, ArrowRight } from "lucide-react";

interface CreateCaseStepProps {
  clientId: string;
  selectedAyId: string;
  assessmentYears: { id: string; label: string }[];
  onComplete: () => void;
}

export function CreateCaseStep({ clientId, selectedAyId, assessmentYears, onComplete }: CreateCaseStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filingDate, setFilingDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [ackNumber, setAckNumber] = useState("");
  const [filingKind, setFilingKind] = useState("Original");
  const [returnCategory, setReturnCategory] = useState("ITR-1");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ackNumber) {
      setError("Acknowledgement Number is required.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await createCaseAndFilingAction({
      clientId,
      assessmentYearId: selectedAyId,
      filingDate,
      ackNumber,
      filingKind,
      returnCategory,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to save filing case.");
    } else {
      onComplete();
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Record Filing Case</h3>
        <p className="text-sm text-text-muted mt-0.5">
          Initialize this year's case and record the return filing acknowledgement details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
        {error && (
          <div className="md:col-span-2 p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-[var(--radius-input)]">
            {error}
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">ITR Return Category</span>
          <select
            value={returnCategory}
            onChange={(e) => setReturnCategory(e.target.value)}
            className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary shadow-xs outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            {["ITR-1", "ITR-2", "ITR-3", "ITR-4", "ITR-5", "ITR-6", "ITR-7"].map((form) => (
              <option key={form} value={form}>{form}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">Filing Kind</span>
          <select
            value={filingKind}
            onChange={(e) => setFilingKind(e.target.value)}
            className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary shadow-xs outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            {["Original", "Revised", "Updated", "Belated"].map((kind) => (
              <option key={kind} value={kind}>{kind} Return</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">Filing Date</span>
          <input
            type="date"
            value={filingDate}
            onChange={(e) => setFilingDate(e.target.value)}
            required
            className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary shadow-xs outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">Acknowledgement Number</span>
          <input
            type="text"
            placeholder="e.g. 502014940210626"
            value={ackNumber}
            onChange={(e) => setAckNumber(e.target.value)}
            required
            className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary shadow-xs outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <div className="md:col-span-2 pt-2 flex justify-end">
          <Button 
            type="submit" 
            disabled={loading}
            className="relative overflow-hidden group active:scale-95 transition-transform"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" /> Recording...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Record & Open Case <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
