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
