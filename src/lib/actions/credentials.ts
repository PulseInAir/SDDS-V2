"use server";

import { getAuthenticatedWorkspaceSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { encryptCredential, decryptCredential, ENCRYPTION_VERSION, type EncryptedEnvelope } from "@/lib/encryption/crypto";

export async function updateCredential(clientId: string, payload: Record<string, string>) {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const encryptedEnvelope = encryptCredential(payload);

  // Check if active credential exists
  const { data: existing } = await supabase
    .from("client_credentials")
    .select("id")
    .eq("workspace_id", session.workspace.id)
    .eq("client_id", clientId)
    .is("archived_at", null)
    .single();

  let saveError;
  if (existing) {
    const { error } = await supabase
      .from("client_credentials")
      .update({
        encrypted_payload: encryptedEnvelope as unknown,
        encryption_version: ENCRYPTION_VERSION,
        updated_by: session.user.id,
      })
      .eq("id", existing.id);
    saveError = error;
  } else {
    const { error } = await supabase
      .from("client_credentials")
      .insert({
        workspace_id: session.workspace.id,
        client_id: clientId,
        encrypted_payload: encryptedEnvelope as unknown,
        encryption_version: ENCRYPTION_VERSION,
        updated_by: session.user.id,
      });
    saveError = error;
  }

  if (saveError) {
    throw new Error("Failed to save credential: " + saveError.message);
  }

  // Log to activity_events
  const { error: auditError } = await supabase
    .from("activity_events")
    .insert({
      workspace_id: session.workspace.id,
      actor_id: session.user.id,
      client_id: clientId,
      entity_type: "client",
      entity_id: clientId,
      action: "credential_updated",
      message: "Portal credentials were updated",
      metadata: { encryption_version: ENCRYPTION_VERSION },
    });

  if (auditError) {
    console.error("Failed to log credential update:", auditError);
  }

  return { success: true };
}

export async function revealCredential(clientId: string) {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const { data: credential, error: fetchError } = await supabase
    .from("client_credentials")
    .select("encrypted_payload, encryption_version")
    .eq("workspace_id", session.workspace.id)
    .eq("client_id", clientId)
    .is("archived_at", null)
    .single();

  if (fetchError || !credential) {
    throw new Error("Failed to fetch credential or none exists.");
  }

  let decryptedPayload: Record<string, unknown>;
  try {
    decryptedPayload = decryptCredential(credential.encrypted_payload as unknown as EncryptedEnvelope);
  } catch {
    throw new Error("Failed to decrypt credential.");
  }

  // Log to activity_events
  const { error: auditError } = await supabase
    .from("activity_events")
    .insert({
      workspace_id: session.workspace.id,
      actor_id: session.user.id,
      client_id: clientId,
      entity_type: "client",
      entity_id: clientId,
      action: "credential_revealed",
      message: "Portal credentials were revealed",
      metadata: { encryption_version: credential.encryption_version },
    });

  if (auditError) {
    console.error("Failed to log credential reveal:", auditError);
  }

  return decryptedPayload;
}

export async function hasCredential(clientId: string) {
  const session = await getAuthenticatedWorkspaceSession();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("client_credentials")
    .select("id")
    .eq("workspace_id", session.workspace.id)
    .eq("client_id", clientId)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    console.error("Failed to check credential existence:", error);
    return false;
  }

  return !!data;
}
