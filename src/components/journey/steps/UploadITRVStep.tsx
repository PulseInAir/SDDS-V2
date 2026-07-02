'use client';

import React, { useState, useTransition } from "react";
import { uploadDocumentAction } from "@/lib/actions/documents";
import { Button } from "@/components/ui/Button";
import { Loader2, Upload, FileText, CheckCircle } from "lucide-react";

interface UploadITRVStepProps {
  clientId: string;
  selectedAyId: string;
  onComplete: () => void;
  existingItrvDoc?: { id: string; original_filename: string } | null;
}

export function UploadITRVStep({ clientId, selectedAyId, onComplete, existingItrvDoc }: UploadITRVStepProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await uploadDocumentAction({}, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(res.success || "Document uploaded successfully!");
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Upload ITR-V Acknowledgement</h3>
        <p className="text-sm text-text-muted mt-0.5">
          Upload the government-issued ITR-V PDF. The system will auto-extract filing details and claimed refund.
        </p>
      </div>

      {existingItrvDoc ? (
        <div className="p-4 rounded-[var(--radius-panel)] border border-emerald-500/30 bg-emerald-950/20 max-w-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500 flex items-center justify-center text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">ITR-V Uploaded</p>
              <p className="text-sm text-text-primary font-medium truncate mt-0.5">{existingItrvDoc.original_filename}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          </div>
          
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="secondary" onClick={onComplete}>
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
