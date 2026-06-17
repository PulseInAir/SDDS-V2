"use client";

import { useActionState } from "react";
import { Loader2, Upload } from "lucide-react";

import type { DocumentActionState } from "@/lib/actions/documents";
import { uploadDocumentAction } from "@/lib/actions/documents";
import { DOCUMENT_CHECKLIST_STATUSES, formatDocumentChecklistStatus } from "@/lib/utils/documents";
import { Button } from "@/components/ui/Button";

type Option = {
  id: string;
  label: string;
};

type ReplacementOption = {
  id: string;
  label: string;
};

const initialState: DocumentActionState = {};

export function DocumentUploadForm({
  revalidateTarget,
  clients,
  assessmentYears,
  defaultClientId,
  replacementOptions = [],
}: {
  revalidateTarget: string;
  clients: Option[];
  assessmentYears: Option[];
  defaultClientId?: string;
  replacementOptions?: ReplacementOption[];
}) {
  const [state, formAction, isPending] = useActionState(uploadDocumentAction, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Record document</h2>
          <p className="mt-1 text-sm text-text-muted">
            Upload a private file and attach its checklist state to the client and AY context.
          </p>
        </div>
        <Upload className="h-5 w-5 text-text-muted" aria-hidden="true" />
      </div>

      <input type="hidden" name="revalidateTarget" value={revalidateTarget} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Client</span>
          <select
            name="clientId"
            defaultValue={defaultClientId ?? ""}
            required
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Assessment year</span>
          <select
            name="assessmentYearId"
            defaultValue=""
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="">No AY link</option>
            {assessmentYears.map((assessmentYear) => (
              <option key={assessmentYear.id} value={assessmentYear.id}>
                {assessmentYear.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Document type</span>
          <input
            name="documentType"
            type="text"
            required
            placeholder="ITR-V, AIS, Form 16..."
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </label>

        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Checklist status</span>
          <select
            name="checklistStatus"
            defaultValue="received"
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            {DOCUMENT_CHECKLIST_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatDocumentChecklistStatus(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {replacementOptions.length > 0 ? (
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Replace existing document</span>
          <select
            name="replacesDocumentId"
            defaultValue=""
            className="h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white px-3 text-sm text-text-primary shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="">Upload as a new document</option>
            {replacementOptions.map((document) => (
              <option key={document.id} value={document.id}>
                {document.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="space-y-1 text-sm text-text-secondary">
        <span className="font-medium text-text-primary">File</span>
        <input
          name="file"
          type="file"
          required
          className="block w-full rounded-[var(--radius-input)] border border-dashed border-border-subtle bg-surface-muted px-3 py-2 text-sm text-text-primary file:mr-3 file:rounded-[var(--radius-input)] file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
      </label>

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
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Upload document
        </Button>
      </div>
    </form>
  );
}
