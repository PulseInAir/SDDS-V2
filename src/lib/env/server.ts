export function getServerEnv() {
  const encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY?.trim();

  if (!encryptionKey) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY is not configured.");
  }

  // 32 bytes (256 bits) encoded as hex = 64 characters
  if (!/^[a-fA-F0-9]{64}$/.test(encryptionKey)) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY must be a 64-character hex string.");
  }

  return {
    encryptionKey,
  } as const;
}
