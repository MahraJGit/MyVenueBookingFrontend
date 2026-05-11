/**
 * Browser-accessible API base URL (no trailing slash).
 * Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` — see `.env.example`.
 */
export function getPublicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return raw ? raw.replace(/\/+$/, "") : "";
}

export function assertApiConfigured(): string {
  const base = getPublicApiBaseUrl();
  if (!base) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE_URL. Add it to .env.local (see .env.example).",
    );
  }
  return base;
}
