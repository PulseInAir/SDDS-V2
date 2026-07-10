'use client';

import React, { useState, useEffect } from "react";
import { saveCaseChargesAction } from "@/lib/actions/journey";
import { Button } from "@/components/ui/Button";
import { Calculator, Check, Loader2 } from "lucide-react";

interface ChargesStepProps {
  caseId: string;
  clientId: string;
  rateCard: Record<string, number>;
  refundChargePercentage: number;
  defaultItrForm: string;
  initialRefundClaimed?: number;
  initialItrCharges?: number;
  initialRefundCharges?: number;
  onComplete: () => void;
}

export function ChargesStep({
  caseId,
  clientId,
  rateCard,
  refundChargePercentage,
  defaultItrForm,
  initialRefundClaimed = 0,
  initialItrCharges,
  initialRefundCharges,
  onComplete,
}: ChargesStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States
  const [itrForm, setItrForm] = useState(defaultItrForm || "ITR-1");
  const [itrFilingCharges, setItrFilingCharges] = useState(() => {
    if (initialItrCharges !== undefined && initialItrCharges !== null) {
      return initialItrCharges;
    }
    return rateCard[defaultItrForm] ?? rateCard["ITR-V"] ?? 500;
  });

  const [refundClaimedAmount, setRefundClaimedAmount] = useState(initialRefundClaimed);
  const [refundClaimCharges, setRefundClaimCharges] = useState(() => {
    if (initialRefundCharges !== undefined && initialRefundCharges !== null) {
      return initialRefundCharges;
    }
    return Math.round((initialRefundClaimed * refundChargePercentage) / 100);
  });

  const [isEditing, setIsEditing] = useState(false);

  const totalCharges = Number(itrFilingCharges) + Number(refundClaimCharges);

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    const res = await saveCaseChargesAction({
      caseId,
      clientId,
      itrFilingCharges,
      refundClaimedAmount,
      refundClaimCharges,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to save charges.");
    } else {
      onComplete();
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Filing Charges & Fees</h3>
        <p className="text-sm text-text-muted mt-0.5">
          Verify or customize the billing charges for this filing.
        </p>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-[var(--radius-input)] max-w-md">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); setIsEditing(false); }} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
          <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">ITR Form type</span>
            <select
              value={itrForm}
              onChange={(e) => {
                const newForm = e.target.value;
                setItrForm(newForm);
                const defaultFee = rateCard[newForm] ?? rateCard["ITR-V"] ?? 500;
                setItrFilingCharges(defaultFee);
              }}
              className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            >
              {["ITR-1", "ITR-2", "ITR-3", "ITR-4", "ITR-5", "ITR-6", "ITR-7", "ITR-V"].map((form) => (
                <option key={form} value={form}>{form}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">ITR Filing Charges (₹)</span>
            <input
              type="number"
              value={itrFilingCharges}
              onChange={(e) => setItrFilingCharges(Math.max(0, parseInt(e.target.value) || 0))}
              className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Refund Claimed (₹)</span>
            <input
              type="number"
              value={refundClaimedAmount}
              onChange={(e) => {
                const newAmount = Math.max(0, parseInt(e.target.value) || 0);
                setRefundClaimedAmount(newAmount);
                const defaultRefundFee = Math.round((newAmount * refundChargePercentage) / 100);
                setRefundClaimCharges(defaultRefundFee);
              }}
              className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Refund service fee charges (₹)</span>
            <input
              type="number"
              value={refundClaimCharges}
              onChange={(e) => setRefundClaimCharges(Math.max(0, parseInt(e.target.value) || 0))}
              className="h-10 rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>

          <div className="md:col-span-2 pt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Done Editing
            </Button>
          </div>
        </form>
      ) : (
        <div className="max-w-md rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel/40 p-5 shadow-xs relative overflow-hidden group">
          
          {/* Subtle Decorative Aura */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl group-hover:bg-brand-500/10 transition-all duration-500" />
          
          <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-brand-400" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Charges Summary</span>
            </div>
            <button 
              onClick={() => setIsEditing(true)} 
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
            >
              Modify Charges
            </button>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">ITR Form type</span>
              <span className="font-medium text-text-primary font-mono">{itrForm}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-text-secondary">ITR Filing Fee</span>
              <span className="font-semibold text-text-primary font-mono">₹{itrFilingCharges.toLocaleString()}</span>
            </div>

            {refundClaimedAmount > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Refund Claimed</span>
                  <span className="font-semibold text-text-primary font-mono text-emerald-400">₹{refundClaimedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Refund Service Fee ({refundChargePercentage}%)</span>
                  <span className="font-semibold text-text-primary font-mono">₹{refundClaimCharges.toLocaleString()}</span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center border-t border-border-subtle pt-3.5 font-bold">
              <span className="text-text-primary text-base">Total Estimated Invoice</span>
              <span className="text-text-primary text-lg font-mono text-brand-400">₹{totalCharges.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button 
              onClick={handleConfirm} 
              disabled={loading}
              className="w-full justify-center relative overflow-hidden active:scale-98 transition-all"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Check className="h-4 w-4 mr-1.5" />
              )}
              Confirm Charges & Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
