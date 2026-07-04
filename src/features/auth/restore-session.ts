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

function hasPersistedSession() {
  return Boolean(getAccessToken() && getAuthUser());
}

/** Avoid wiping a session established while cookie-restore was in flight (e.g. login). */
function clearSessionUnlessEstablished() {
  if (hasPersistedSession()) return true;
  clearAuthSession();
  return false;
}

async function buildUserFromProfile(
  claims: { id: string; role: string },
): Promise<AuthUser> {
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

  return user;
}

async function restoreFromRefreshCookie(): Promise<boolean> {
  if (hasPersistedSession()) {
    return true;
  }

  try {
    const data = await coordinatedRefreshTokens();
    if (hasPersistedSession()) {
      if (data?.accessToken) {
        updateAccessToken(data.accessToken);
      }
      return true;
    }
    if (!data) {
      return clearSessionUnlessEstablished();
    }

    const claims = decodeAccessTokenPayload(data.accessToken);
    if (!claims) {
      return clearSessionUnlessEstablished();
    }

    const user = await buildUserFromProfile(claims);
    if (hasPersistedSession()) {
      updateAccessToken(data.accessToken);
      return true;
    }

    persistAuthSession({ accessToken: data.accessToken, user });
    return true;
  } catch {
    return clearSessionUnlessEstablished();
  }
}

/** Restore session from HttpOnly refresh cookie when tab sessionStorage is empty. */
export async function restoreAuthSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (hasPersistedSession()) {
    return true;
  }

  if (!restoreInFlight) {
    restoreInFlight = restoreFromRefreshCookie().finally(() => {
      restoreInFlight = null;
    });
  }

  const restored = await restoreInFlight;
  return restored || hasPersistedSession();
}
