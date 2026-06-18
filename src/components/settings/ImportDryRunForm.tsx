"use client";

import { useActionState } from "react";

import { createImportDryRunAction, type ImportActionState } from "@/lib/actions/imports";
import { Button } from "@/components/ui/Button";

const initialState: ImportActionState = {};

export function ImportDryRunForm() {
  const [state, formAction, isPending] = useActionState(createImportDryRunAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Start CSV dry-run</h2>
        <p className="mt-1 text-sm text-text-muted">
          Upload the locked filing-case template to validate rows, check duplicates, and save an auditable job before any business data is written.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm text-text-primary">
        <span className="font-medium">CSV file</span>
        <input
          type="file"
          name="csvFile"
          accept=".csv,text/csv"
          className="block w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 py-2 text-sm text-text-primary file:mr-4 file:rounded-[var(--radius-input)] file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-800"
          required
        />
      </label>

      {state.error ? (
        <p className="rounded-[var(--radius-input)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-muted">The current import flow accepts one filing case per row with optional filing, invoice, and single-payment history.</p>
        <Button type="submit" isLoading={isPending}>
          Run dry-run
        </Button>
      </div>
    </form>
  );
}
