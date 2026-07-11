import React, { useState, useTransition } from "react";
import { Download, Trash2, FileText, Loader2 } from "lucide-react";
import { formatDocumentSize } from "@/lib/utils/documents";
import { archiveDocumentAction } from "@/lib/actions/documents";

interface DocumentRegisterProps {
  documents: any[];
  onRefresh: () => void;
}

export function DocumentRegister({ documents, onRefresh }: DocumentRegisterProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (docId: string) => {
    setDeletingId(docId);
    startTransition(async () => {
      await archiveDocumentAction(docId);
      onRefresh();
      setDeletingId(null);
    });
  };

  if (!documents || documents.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-white/80">Uploaded Document Register</h4>
      <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
        <table className="min-w-full divide-y divide-white/5 text-sm">
          <thead className="bg-white/[0.02]">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-white/40">File</th>
              <th className="px-4 py-3 text-left font-medium text-white/40">Type</th>
              <th className="px-4 py-3 text-left font-medium text-white/40">Uploaded</th>
              <th className="px-4 py-3 text-right font-medium text-white/40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-white/40" />
                    <span className="text-white/80 font-medium">{doc.original_filename}</span>
                    <span className="text-white/40 text-xs">({formatDocumentSize(doc.size_bytes)})</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/60 border border-white/10">
                    {doc.document_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/40 text-xs">
                  {new Date(doc.uploaded_at || doc.created_at || Date.now()).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={isPending && deletingId === doc.id}
                      className="p-1.5 rounded-md hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      {isPending && deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
