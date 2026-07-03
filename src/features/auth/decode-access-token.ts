export type AccessTokenClaims = {
  id: string;
  role: string;
  exp?: number;
};

export function decodeAccessTokenPayload(
  token: string,
): AccessTokenClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as {
      id?: unknown;
      role?: unknown;
      exp?: unknown;
    };
    if (typeof decoded.id === "string" && typeof decoded.role === "string") {
      return {
        id: decoded.id,
        role: decoded.role,
        exp: typeof decoded.exp === "number" ? decoded.exp : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function isAccessTokenStillValid(token: string, skewMs = 10_000): boolean {
  const claims = decodeAccessTokenPayload(token);
  if (!claims) return false;
  if (!claims.exp) return true;
  return claims.exp * 1000 > Date.now() + skewMs;
}
