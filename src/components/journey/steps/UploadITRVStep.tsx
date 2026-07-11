'use client';

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-light text-white tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Upload ITR-V
        </h3>
      </div>

      {existingItrvDoc && !isReuploading ? (
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 max-w-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">Document Uploaded</p>
              <p className="text-sm text-white/80 font-medium truncate mt-0.5">{existingItrvDoc.original_filename}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          </div>

          <div className="mt-5 flex justify-end gap-3 border-t border-emerald-500/10 pt-4">
            <Button size="sm" variant="ghost" className="text-white/60 hover:text-white" onClick={() => setIsReuploading(true)}>
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
            <div className="p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-xs bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 rounded-xl">
              {success}
            </div>
          )}

          {/* Form fields */}
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="assessmentYearId" value={selectedAyId} />
          <input type="hidden" name="documentType" value="ITR-V" />
          <input type="hidden" name="checklistStatus" value="received" />
          <input type="hidden" name="revalidateTarget" value={`/clients/${clientId}/journey`} />

          <div className="flex flex-col gap-5">
            <AnimatePresence mode="wait">
              {selectedFile ? (
                <motion.div
                  key="file-attached"
                  initial={{ opacity: 0, scale: 0.96, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -5 }}
                  className="relative p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/5 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.03)] border-solid"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/90 truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
                      <p className="text-[11px] text-emerald-400/80 font-mono mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="px-3 py-1 rounded-full border border-white/5 hover:border-red-500/30 bg-white/[0.02] hover:bg-red-500/10 text-[9px] uppercase tracking-wider font-bold text-white/50 hover:text-red-400 transition-all duration-300"
                  >
                    Clear File
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="drag-drop"
                  animate={{
                    scale: isDragOver ? 1.01 : 1,
                    borderColor: isDragOver ? "rgba(245, 158, 11, 0.5)" : "rgba(255, 255, 255, 0.05)",
                    backgroundColor: isDragOver ? "rgba(245, 158, 11, 0.04)" : "rgba(255, 255, 255, 0.01)",
                    boxShadow: isDragOver ? "0 0 25px rgba(245, 158, 11, 0.1)" : "none",
                  }}
                  transition={{ duration: 0.2 }}
                  className="relative group border border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center hover:border-white/10 transition-colors"
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
                  <div className="flex flex-col items-center justify-center gap-3">
                    <motion.div
                      animate={isDragOver ? { y: [-3, 3, -3] } : {}}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/40 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all"
                    >
                      <Upload className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <span className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
                        {isDragOver ? "Drop ITR-V PDF here" : "Select ITR-V PDF file"}
                      </span>
                      <span className="block text-[10px] text-white/30 mt-1.5 font-mono">Accepts only Indian ITR-V (PDF)</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end pt-2">
              <motion.button
                type="submit"
                disabled={isPending || !selectedFile}
                whileHover={!isPending && selectedFile ? { scale: 1.02, boxShadow: "0 0 25px rgba(245, 158, 11, 0.35)" } : {}}
                whileTap={!isPending && selectedFile ? { scale: 0.97 } : {}}
                className={classNames(
                  "relative h-12 px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest overflow-hidden transition-all duration-500",
                  isPending
                    ? "bg-amber-950/30 text-amber-500/40 border border-amber-500/10 cursor-not-allowed w-full sm:w-auto"
                    : !selectedFile
                    ? "bg-white/[0.02] text-white/20 border border-white/5 cursor-not-allowed w-full sm:w-auto"
                    : "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 bg-[size:200%_auto] hover:bg-[right_center] text-black shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-[background-position] duration-700 w-full sm:w-auto"
                )}
              >
                {/* Scanner sweep line */}
                {isPending && (
                  <motion.div
                    className="absolute inset-x-0 h-[2px] bg-amber-400 shadow-[0_0_10px_#f59e0b] z-20"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                      <span>Extracting ITR-V...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload & Auto-Extract</span>
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
