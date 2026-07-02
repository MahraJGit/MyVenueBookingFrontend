import { coordinatedRefreshTokens } from "@/features/auth/coordinated-refresh";
import { decodeAccessTokenPayload } from "@/features/auth/decode-access-token";
import type { AuthUser } from "@/features/auth/types";
import { getMyProfile } from "@/features/users/api";
import {
  clearAuthSession,
  getAccessToken,
  getAuthUser,
  persistAuthSession,
  updateAccessToken,
} from "@/features/auth/session-storage";

let restoreInFlight: Promise<boolean> | null = null;

async function restoreFromRefreshCookie(): Promise<boolean> {
  try {
    const data = await coordinatedRefreshTokens();
    if (!data) {
      clearAuthSession();
      return false;
    }

    const claims = decodeAccessTokenPayload(data.accessToken);
    if (!claims) {
      clearAuthSession();
      return false;
    }

    updateAccessToken(data.accessToken);

    let user: AuthUser = {
      id: claims.id,
      email: "",
      role: claims.role,
    };

    try {
      const profile = await getMyProfile();
      user = {
        id: profile.id,
        email: profile.email ?? "",
        role: profile.role ?? claims.role,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone ?? undefined,
        phoneCountryCode: profile.phoneCountryCode,
        avatarUrl: profile.avatarUrl,
      };
    } catch {
      // JWT claims are enough to restore a usable session.
    }

    persistAuthSession({ accessToken: data.accessToken, user });
    return true;
  } catch {
    clearAuthSession();
    return false;
  }
}

/** Restore session from HttpOnly refresh cookie when tab sessionStorage is empty. */
export async function restoreAuthSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (getAccessToken() && getAuthUser()) {
    return true;
  }

  if (!restoreInFlight) {
    restoreInFlight = restoreFromRefreshCookie().finally(() => {
      restoreInFlight = null;
    });
  }

  return restoreInFlight;
}
