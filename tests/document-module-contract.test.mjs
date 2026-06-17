import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const documentsRoute = readFileSync("src/app/(app)/documents/page.tsx", "utf8");
const clientDocumentsRoute = readFileSync("src/app/(app)/clients/[clientId]/documents/page.tsx", "utf8");
const documentsAction = readFileSync("src/lib/actions/documents.ts", "utf8");
const downloadRoute = readFileSync("src/app/api/documents/[documentId]/download/route.ts", "utf8");

test("G19 adds the dedicated /documents route and shared module content", () => {
  assert.match(documentsRoute, /title:\s*"Documents - SDDS"/);
  assert.match(documentsRoute, /DocumentUploadForm/);
  assert.match(documentsRoute, /DocumentsPageContent/);
});

test("client document tab no longer uses the placeholder implementation", () => {
  assert.doesNotMatch(clientDocumentsRoute, /This module will manage private uploads/);
  assert.match(clientDocumentsRoute, /getClientDocumentsModuleData/);
  assert.match(clientDocumentsRoute, /replacementOptions/);
});

test("document actions provide scoped module data, uploads, and checklist updates", () => {
  assert.match(documentsAction, /export async function getDocumentsModuleData/);
  assert.match(documentsAction, /export async function uploadDocumentAction/);
  assert.match(documentsAction, /export async function updateDocumentChecklistStatus/);
  assert.match(documentsAction, /createSignedUrl/);
});

test("signed downloads run through an authorised route handler", () => {
  assert.match(downloadRoute, /getSignedDownloadUrl/);
  assert.match(downloadRoute, /NextResponse\.redirect/);
});
