import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("G23 workspace follow-up route wires the contact form and queue view", async () => {
  const page = await read("src/app/(app)/follow-up/page.tsx");

  assert.match(page, /CommunicationLogForm/);
  assert.match(page, /FollowUpPageContent/);
  assert.match(page, /getFollowUpsModuleData/);
});

test("G23 client communications tab replaces the placeholder with the real follow-up and activity view", async () => {
  const page = await read("src/app/(app)/clients/[clientId]/communications/page.tsx");

  assert.match(page, /getClientCommunicationModuleData/);
  assert.match(page, /CommunicationLogForm/);
  assert.match(page, /FollowUpPageContent/);
  assert.doesNotMatch(page, /This module will log client contacts, system activity events, and follow-ups/);
});

test("G23 case completion requires next-year follow-up creation before closing", async () => {
  const casesAction = await read("src/lib/actions/cases.ts");

  assert.match(casesAction, /ensureNextYearFollowUpForCase/);
  assert.match(casesAction, /toStatus === 'Completed'/);
});

test("G23 follow-up content exposes exclusion, reactivation, WhatsApp launch, and contact logging", async () => {
  const content = await read("src/components/follow-up/FollowUpPageContent.tsx");
  const updateForm = await read("src/components/follow-up/FollowUpUpdateForm.tsx");
  const communicationForm = await read("src/components/follow-up/CommunicationLogForm.tsx");

  assert.match(content, /WhatsApp/);
  assert.match(updateForm, /exclusionReason/);
  assert.match(updateForm, /Reactivate/);
  assert.match(communicationForm, /summary/);
  assert.match(communicationForm, /channel/);
});
