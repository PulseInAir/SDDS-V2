import type { DocumentRecord } from "@/types/documents";

export const DOCUMENT_CHECKLIST_STATUSES = [
  "required",
  "requested",
  "received",
  "verified",
  "rejected",
  "replacement_needed",
  "not_applicable",
] as const;

export const DOCUMENT_EXCEPTION_STATUSES = new Set([
  "required",
  "requested",
  "rejected",
  "replacement_needed",
]);

export function generateSafeFilename(originalFilename: string): string {
  const safe = originalFilename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  if (safe === "." || safe === ".." || !safe.trim()) {
    return `doc_${Date.now()}`;
  }
  return safe;
}

export function buildDocumentStoragePath(
  workspaceId: string,
  clientId: string,
  documentId: string,
  safeFilename: string
): string {
  return `${workspaceId}/${clientId}/${documentId}/${safeFilename}`;
}

export function formatDocumentSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDocumentChecklistStatus(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getDocumentStatusVariant(status: string) {
  switch (status) {
    case "verified":
      return "success" as const;
    case "received":
      return "info" as const;
    case "required":
    case "requested":
      return "warning" as const;
    case "rejected":
    case "replacement_needed":
      return "error" as const;
    default:
      return "neutral" as const;
  }
}

export type DocumentVersionChain = {
  rootId: string;
  latest: DocumentRecord;
  versions: DocumentRecord[];
};

export function groupDocumentVersions(documents: DocumentRecord[]): DocumentVersionChain[] {
  const byId = new Map(documents.map((document) => [document.id, document]));

  const chains = new Map<string, DocumentRecord[]>();

  for (const document of documents) {
    let rootId = document.id;
    let cursor: DocumentRecord | undefined = document;

    while (cursor?.replaces_document_id) {
      const previous = byId.get(cursor.replaces_document_id);
      if (!previous) break;
      rootId = previous.id;
      cursor = previous;
    }

    const chain = chains.get(rootId) ?? [];
    chain.push(document);
    chains.set(rootId, chain);
  }

  return Array.from(chains.entries())
    .map(([rootId, versions]) => {
      const sortedVersions = [...versions].sort((left, right) => right.version - left.version);

      return {
        rootId,
        latest: sortedVersions[0],
        versions: sortedVersions,
      };
    })
    .sort((left, right) =>
      new Date(right.latest.uploaded_at).getTime() - new Date(left.latest.uploaded_at).getTime()
    );
}
