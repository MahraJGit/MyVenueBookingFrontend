export type AccessTokenClaims = {
  id: string;
  role: string;
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
    };
    if (typeof decoded.id === "string" && typeof decoded.role === "string") {
      return { id: decoded.id, role: decoded.role };
    }
    return null;
  } catch {
    return null;
  }
}
