const SUPABASE_URL_NAME = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY_NAME =
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

function requireValue(name: string, value: string | undefined): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${name} is not configured.`);
  }

  return normalized;
}

function validateSupabaseUrl(value: string): string {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${SUPABASE_URL_NAME} must be a valid URL.`);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${SUPABASE_URL_NAME} must use HTTP or HTTPS.`);
  }

  return parsed.toString().replace(/\/$/, "");
}

export function getSupabasePublicEnv() {
  const url = validateSupabaseUrl(
    requireValue(SUPABASE_URL_NAME, process.env.NEXT_PUBLIC_SUPABASE_URL),
  );
  const publishableKey = requireValue(
    SUPABASE_PUBLISHABLE_KEY_NAME,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return { url, publishableKey } as const;
}
