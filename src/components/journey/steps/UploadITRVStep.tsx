'use client';

import React, { useState, useTransition } from "react";
import { uploadDocumentAction } from "@/lib/actions/documents";
import { Button } from "@/components/ui/Button";
import { Loader2, Upload, FileText, CheckCircle, RefreshCw } from "lucide-react";

interface UploadITRVStepProps {
  clientId: string;
  selectedAyId: string;
  onComplete: (uploadedDocId?: string) => void;
  existingItrvDoc?: { id: string; original_filename: string } | null;
  /** Compact mode renders just a button + hidden form for re-uploading inside
   *  Window B of Step 3 (after the ITR-V has already been received once). */
  compact?: boolean;
}

export function UploadITRVStep({ clientId, selectedAyId, onComplete, existingItrvDoc, compact = false }: UploadITRVStepProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isReuploading, setIsReuploading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await uploadDocumentAction({}, formData);
      if (res.error) {
        setError(res.error);
        return;
      }

      setSuccess(res.success || "Document uploaded successfully!");

      // Find the uploaded document id from the documents table so we can
      // immediately run extraction against it. Re-fires refresh so that the
      // charges auto-populate from filing_cases.return_category +
      // filing_cases.refund_claimed_amount.
      try {
        const docsRes = await fetch(`/api/documents?clientId=${clientId}&assessmentYearId=${selectedAyId}`);
        if (docsRes.ok) {
          const docs = await docsRes.json();
          const itrvDocs = (docs.data || []).filter((d: any) => d.document_type === "ITR-V" && !d.archived_at);
          itrvDocs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const latest = itrvDocs[0];
          if (latest?.id) {
            await fetch(`/api/documents/${latest.id}/extract`, { method: "POST" });
          }
        }
      } catch {
        // Non-fatal — the parent refresh + ClientJourneyPage effect will retry.
      }

      setTimeout(() => {
        onComplete();
        if (compact) setIsReuploading(false);
      }, 600);
    });
  }

  // Compact mode: just a "Re-upload ITR-V" pill + a click-to-replace form.
  if (compact) {
    return (
      <div className="flex flex-col items-end gap-2">
        {!isReuploading ? (
          <button
            type="button"
            onClick={() => setIsReuploading(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-amber-500/40 text-xs font-medium text-white/70 hover:text-amber-400 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-upload ITR-V
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col items-end gap-2 max-w-sm">
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="assessmentYearId" value={selectedAyId} />
            <input type="hidden" name="documentType" value="ITR-V" />
            <input type="hidden" name="checklistStatus" value="received" />
            <input type="hidden" name="revalidateTarget" value={`/clients/${clientId}/journey`} />

            <div className="relative w-full">
              <input
                type="file"
                name="file"
                accept="application/pdf"
                required
                className="block w-full text-[11px] text-white/60 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-black hover:file:bg-amber-400 file:cursor-pointer file:transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setIsReuploading(false)} className="h-8 px-3 text-white/60 hover:text-white">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="h-8 px-4">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Re-upload & Extract"}
              </Button>
            </div>
            {error && (
              <span className="text-[10px] text-red-400 font-mono">{error}</span>
            )}
            {success && (
              <span className="text-[10px] text-emerald-400 font-mono">{success}</span>
            )}
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Upload ITR-V Acknowledgement</h3>
      </div>

      {existingItrvDoc && !isReuploading ? (
        <div className="p-4 rounded-[var(--radius-panel)] border border-emerald-500/30 bg-emerald-950/20 max-w-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500 flex items-center justify-center text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">Document Uploaded</p>
              <p className="text-sm text-text-primary font-medium truncate mt-0.5">{existingItrvDoc.original_filename}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button size="sm" variant="ghost" className="text-text-muted hover:text-white" onClick={() => setIsReuploading(true)}>
              Re-upload ITR-V
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onComplete()}>
              Continue to Charges
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          {error && (
            <div className="p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-[var(--radius-input)]">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-xs bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 rounded-[var(--radius-input)]">
              {success}
            </div>
          )}

          {/* Form fields */}
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="assessmentYearId" value={selectedAyId} />
          <input type="hidden" name="documentType" value="ITR-V" />
          <input type="hidden" name="checklistStatus" value="received" />
          <input type="hidden" name="revalidateTarget" value={`/clients/${clientId}/journey`} />

          <div className="flex flex-col gap-4">
            <div className="relative group border border-dashed border-neutral-800 hover:border-brand-500/50 rounded-[var(--radius-panel)] p-6 bg-neutral-950/20 transition-all duration-300 text-center">
              <input
                type="file"
                name="file"
                accept="application/pdf"
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-neutral-900/60 border border-neutral-800 flex items-center justify-center text-text-muted group-hover:text-brand-400 group-hover:border-brand-500/30 transition-all">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-sm font-medium text-text-primary">Click to select PDF or drag and drop</span>
                  <span className="block text-[10px] text-text-muted mt-1 font-mono">Accepts only Indian ITR-V (PDF)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="active:scale-95 transition-transform">
                {isPending ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading & Extracting...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Upload & Auto-Extract
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
