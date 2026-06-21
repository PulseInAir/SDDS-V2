"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Settings2 } from "lucide-react";

import { updateInvoiceSettingsAction, type SettingsActionState } from "@/lib/actions/settings";
import { Button } from "@/components/ui/Button";

type SettingsData = {
  rate_card: Record<string, number>;
  refund_charge_percentage: number;
  pdf_extraction_settings: {
    page_scope: string;
    itr_form_pattern: string;
    refund_amount_pattern: string;
  };
};

const initialState: SettingsActionState = {};

export function InvoiceSettingsForm({ settings }: { settings: SettingsData }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateInvoiceSettingsAction, initialState);
  const lastSuccessMessage = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.success && state.success !== lastSuccessMessage.current) {
      lastSuccessMessage.current = state.success;
      router.refresh();
    }
  }, [router, state.success]);

  const rates = settings?.rate_card ?? {};
  const refundPercent = settings?.refund_charge_percentage ?? 10;
  const extraction = settings?.pdf_extraction_settings ?? {
    page_scope: "first_page",
    itr_form_pattern: "ITR-\\d[A-Z]?|ITR-V",
    refund_amount_pattern: "refund\\s*due|refund|refundable"
  };

  const itrFormsList = ["ITR-1", "ITR-2", "ITR-3", "ITR-4", "ITR-5", "ITR-6", "ITR-7", "ITR-V"];

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Invoice Defaults & PDF Extraction Settings</h2>
          <p className="mt-1 text-sm text-text-muted">
            Configure default billing rates, refund service fees, and pdf parsing rules. These directly drive autofill calculations in invoice creation.
          </p>
        </div>
        <Settings2 className="h-5 w-5 text-text-muted" aria-hidden="true" />
      </div>

      {/* Section 1: ITR Rate Card */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">ITR Rate Card (Rs.)</h3>
        <p className="text-xs text-text-muted">Set flat billing fees for each specific type of Indian ITR filing.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {itrFormsList.map((formType) => (
            <label key={formType} className="space-y-1 text-xs text-text-secondary">
              <span className="font-medium text-text-primary">{formType} Fee</span>
              <input
                type="number"
                name={`rate_${formType}`}
                min="0"
                step="0.01"
                defaultValue={rates[formType] ?? 500}
                className="h-9 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-2.5 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Section 2: Refund Processing Charge */}
      <div className="border-t border-border-subtle pt-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Refund service fee percentage (%)</h3>
        <p className="text-xs text-text-muted">Percentage commission charged on the extracted refund amount.</p>
        <label className="block max-w-xs space-y-1 text-xs text-text-secondary">
          <span className="font-medium text-text-primary">Commission Rate (%)</span>
          <input
            type="number"
            name="refundChargePercentage"
            min="0"
            max="100"
            step="0.01"
            defaultValue={refundPercent}
            className="h-9 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-2.5 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      {/* Section 3: PDF Extraction Rules */}
      <div className="border-t border-border-subtle pt-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">PDF Data Extraction Settings</h3>
          <p className="text-xs text-text-muted">Customize how values are scraped from client uploaded PDFs.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs text-text-secondary">
            <span className="font-medium text-text-primary">Target Page Scope</span>
            <select
              name="pageScope"
              defaultValue={extraction.page_scope}
              className="h-9 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-2 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            >
              <option value="first_page">First Page Only (Recommended for ITR-V)</option>
              <option value="all_pages">Scan All Pages (Slower)</option>
            </select>
          </label>

          <label className="space-y-1 text-xs text-text-secondary">
            <span className="font-medium text-text-primary">ITR Form Regex Pattern</span>
            <input
              type="text"
              name="itrFormPattern"
              defaultValue={extraction.itr_form_pattern}
              placeholder="ITR-\d[A-Z]?|ITR-V"
              className="h-9 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-2.5 text-sm text-text-primary font-mono shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>

          <label className="md:col-span-2 space-y-1 text-xs text-text-secondary">
            <span className="font-medium text-text-primary">Refund Amount Regex Keyword(s)</span>
            <input
              type="text"
              name="refundAmountPattern"
              defaultValue={extraction.refund_amount_pattern}
              placeholder="refund\s*due|refund|refundable"
              className="h-9 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-2.5 text-sm text-text-primary font-mono shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>
        </div>
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

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Save invoice defaults
        </Button>
      </div>
    </form>
  );
}
