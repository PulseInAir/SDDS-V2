import crypto from "node:crypto";
import { getServerEnv } from "../env/server";

export const ENCRYPTION_VERSION = 1;

/**
 * Envelope format:
 * {
 *   "v": 1,
 *   "iv": "base64",
 *   "tag": "base64",
 *   "data": "base64"
 * }
 */
export type EncryptedEnvelope = {
  v: number;
  iv: string;
  tag: string;
  data: string;
};

function getKey(): Buffer {
  const { encryptionKey } = getServerEnv();
  return Buffer.from(encryptionKey, "hex");
}

/**
 * Encrypts a JSON payload using AES-256-GCM.
 */
export function encryptCredential(payload: Record<string, unknown>): EncryptedEnvelope {
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit nonce for GCM

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const jsonPayload = JSON.stringify(payload);

  let encrypted = cipher.update(jsonPayload, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag();

  return {
    v: ENCRYPTION_VERSION,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted,
  };
}

/**
 * Decrypts a previously encrypted envelope back to a JSON object.
 */
export function decryptCredential(envelope: EncryptedEnvelope): Record<string, unknown> {
  if (envelope.v !== ENCRYPTION_VERSION) {
    throw new Error(`Unsupported encryption version: ${envelope.v}`);
  }

  const key = getKey();
  const iv = Buffer.from(envelope.iv, "base64");
  const tag = Buffer.from(envelope.tag, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(envelope.data, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}
