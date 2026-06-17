"use client";

import { useActionState } from "react";
import { CalendarRange, Loader2, Plus } from "lucide-react";

import { createAssessmentYearAction, type SettingsActionState } from "@/lib/actions/settings";
import { Button } from "@/components/ui/Button";

const initialState: SettingsActionState = {};

function buildDefaultAssessmentYear() {
  const today = new Date();
  const startYear = today.getUTCMonth() >= 3 ? today.getUTCFullYear() : today.getUTCFullYear() - 1;
  const endYear = startYear + 1;

  return {
    label: `${endYear}-${String(endYear + 1).slice(-2)}`,
    startDate: `${endYear}-04-01`,
    endDate: `${endYear + 1}-03-31`,
  };
}

export function AssessmentYearCreateForm() {
  const defaults = buildDefaultAssessmentYear();
  const [state, formAction, isPending] = useActionState(createAssessmentYearAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Add assessment year</h2>
          <p className="mt-1 text-sm text-text-muted">
            Configure the AY list used in the shell, filing cases, follow-up rollover checks, and invoice sequencing.
          </p>
        </div>
        <CalendarRange className="h-5 w-5 text-text-muted" aria-hidden="true" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">AY label</span>
          <input
            type="text"
            name="label"
            defaultValue={defaults.label}
            placeholder="2027-28"
            required
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Start date</span>
          <input
            type="date"
            name="startDate"
            defaultValue={defaults.startDate}
            required
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">End date</span>
          <input
            type="date"
            name="endDate"
            defaultValue={defaults.endDate}
            required
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-start gap-3 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-3 py-3 text-sm text-text-secondary">
          <input type="checkbox" name="makeCurrent" className="mt-1 h-4 w-4 rounded border-border-subtle text-brand-600 focus:ring-brand-600" />
          <span>
            <span className="block font-medium text-text-primary">Mark as current</span>
            <span className="block text-xs">This becomes the default operational year across the workspace.</span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-[var(--radius-input)] border border-border-subtle bg-surface-muted px-3 py-3 text-sm text-text-secondary">
          <input type="checkbox" name="isOpen" defaultChecked className="mt-1 h-4 w-4 rounded border-border-subtle text-brand-600 focus:ring-brand-600" />
          <span>
            <span className="block font-medium text-text-primary">Keep it open</span>
            <span className="block text-xs">Open years stay available for live case, invoice, and follow-up work.</span>
          </span>
        </label>
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
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="mr-2 h-4 w-4" aria-hidden="true" />}
          Save assessment year
        </Button>
      </div>
    </form>
  );
}

