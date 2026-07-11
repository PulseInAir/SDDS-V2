'use client';

import React, { useState, useTransition, useRef, useEffect } from "react";
import { uploadDocumentAction } from "@/lib/actions/documents";
import { Button } from "@/components/ui/Button";
import { Loader2, Upload, FileText, CheckCircle, RefreshCw } from "lucide-react";
import { classNames } from "@/lib/utils/styles";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Mouse tracking for interactive panel spotlight
  const panelRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    panelRef.current.style.setProperty('--mouse-x', `${x}px`);
    panelRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById("itrv-file-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    if (selectedFile) {
      formData.set("file", selectedFile);
    }

    startTransition(async () => {
      const res = await uploadDocumentAction({}, formData);
      if (res.error) {
        setError(res.error);
        return;
      }

      setSuccess(res.success || "Document uploaded successfully!");

      if (res.documentId) {
        try {
          await fetch(`/api/documents/${res.documentId}/extract`, { method: "POST" });
        } catch (err) {
          console.error("[Extract] Direct trigger failed:", err);
        }
      }

      setTimeout(() => {
        onComplete(res.documentId);
        setSelectedFile(null);
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
            className="flex items-center gap-1.5 px-3 h-8 rounded-full border border-border-subtle bg-surface-panel hover:bg-surface-hover hover:border-brand-500/40 text-xs font-medium text-text-secondary hover:text-brand-400 transition-all"
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
                className="block w-full text-[11px] text-text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500 file:cursor-pointer file:transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setIsReuploading(false)} className="h-8 px-3">
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
              <span className="text-[10px] text-brand-400 font-mono">{success}</span>
            )}
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-light text-text-primary tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Upload ITR-V
        </h3>
      </div>

      {existingItrvDoc && !isReuploading ? (
        <div className="interactive-panel p-5 rounded-[var(--radius-panel)] border border-brand-500/30 max-w-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-950/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-brand-400 font-semibold uppercase tracking-wide">Document Uploaded</p>
              <p className="text-sm text-text-primary font-medium truncate mt-0.5">{existingItrvDoc.original_filename}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-brand-400 flex-shrink-0" />
          </div>

          <div className="mt-5 flex justify-end gap-3 border-t border-border-subtle pt-4">
            <Button size="sm" variant="ghost" onClick={() => setIsReuploading(true)}>
              Re-upload ITR-V
            </Button>
            <Button size="sm" variant="primary" onClick={() => onComplete()}>
              Continue to Invoice
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
          {error && (
            <div className="p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-input">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-xs bg-brand-950/20 border border-brand-500/30 text-brand-400 rounded-input">
              {success}
            </div>
          )}

          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="assessmentYearId" value={selectedAyId} />
          <input type="hidden" name="documentType" value="ITR-V" />
          <input type="hidden" name="checklistStatus" value="received" />
          <input type="hidden" name="revalidateTarget" value={`/clients/${clientId}/journey`} />

          <div className="flex flex-col gap-6">
            {!selectedFile ? (
              <div 
                ref={panelRef}
                onMouseMove={handleMouseMove}
                className={classNames(
                  "interactive-panel relative group border border-dashed rounded-[var(--radius-panel)] p-12 text-center flex flex-col items-center justify-center min-h-[240px] transition-all duration-300",
                  isDragOver ? "border-brand-500 bg-brand-900/5 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-[1.02]" : "border-border-subtle bg-surface-panel/30"
                )}
              >
                <input
                  type="file"
                  id="itrv-file-input"
                  name="file"
                  accept="application/pdf"
                  required
                  onChange={handleFileChange}
                  onDragEnter={() => setIsDragOver(true)}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={() => setIsDragOver(false)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-4 relative z-0">
                  <div 
                    className={classNames(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
                      isDragOver ? "bg-brand-500/20 text-brand-400 border border-brand-500/50 scale-110" : "bg-surface-hover text-text-muted border border-border-subtle group-hover:text-brand-400 group-hover:border-brand-500/30"
                    )}
                  >
                    <Upload className={classNames("h-6 w-6 transition-transform duration-300", isDragOver ? "-translate-y-1" : "")} />
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-text-primary tracking-wide">
                      {isDragOver ? "Drop ITR-V PDF here" : "Click or drag ITR-V PDF here"}
                    </span>
                    <span className="block text-xs text-text-muted mt-2 font-mono">Supports: PDF up to 10MB</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="interactive-panel relative p-6 rounded-[var(--radius-panel)] border border-brand-500/30 flex items-center justify-between shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-text-primary truncate max-w-[250px] sm:max-w-sm">{selectedFile.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                      <p className="text-xs text-text-muted font-mono">{(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="px-4 py-2 rounded-full border border-border-subtle hover:border-red-500/30 bg-surface-hover hover:bg-red-500/10 text-xs font-semibold text-text-muted hover:text-red-400 transition-all duration-300"
                >
                  Clear File
                </button>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                size="lg"
                variant="primary"
                disabled={isPending || !selectedFile}
                isLoading={isPending}
                className={classNames(
                  "font-semibold tracking-wide shadow-[0_0_20px_rgba(59,130,246,0.2)]",
                  !selectedFile ? "opacity-50" : "hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-shadow duration-300"
                )}
              >
                {!isPending && <Upload className="mr-2 h-4 w-4" />}
                {isPending ? "Extracting ITR-V..." : "Upload & Auto-Extract"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
