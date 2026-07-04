import { getPublicApiBaseUrl } from "@/lib/env";
import type { OAuthProviderId } from "./providers";

export function buildOAuthStartUrl(provider: OAuthProviderId, redirectPath: string): string {
  const api = getPublicApiBaseUrl();
  if (!api) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }

  const redirect = encodeURIComponent(redirectPath);
  return `${api}/api/auth/oauth/${provider}?redirect=${redirect}`;
}

export function startOAuthLogin(provider: OAuthProviderId, redirectPath = "/"): void {
  window.location.href = buildOAuthStartUrl(provider, redirectPath);
}
