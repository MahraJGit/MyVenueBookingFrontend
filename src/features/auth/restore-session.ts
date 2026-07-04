import {
  coordinatedRefreshTokens,
  TransientRefreshError,
} from "@/features/auth/coordinated-refresh";
import { decodeAccessTokenPayload } from "@/features/auth/decode-access-token";
import type { AuthUser } from "@/features/auth/types";
import { getMyProfile } from "@/features/users/api";
import {
  clearAuthSession,
  hasPersistedAuthSession,
  persistAuthSession,
  updateAccessToken,
} from "@/features/auth/session-storage";

let restoreInFlight: Promise<boolean> | null = null;

/** Avoid wiping a session established while cookie-restore was in flight (e.g. login). */
function clearSessionUnlessEstablished() {
  if (hasPersistedAuthSession()) return true;
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
  if (hasPersistedAuthSession()) {
    return true;
  }

  try {
    const data = await coordinatedRefreshTokens();
    if (hasPersistedAuthSession()) {
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

    // Persist token before profile fetch so authFetch does not trigger another refresh.
    const minimalUser: AuthUser = {
      id: claims.id,
      email: "",
      role: claims.role,
    };
    persistAuthSession({ accessToken: data.accessToken, user: minimalUser });

    const user = await buildUserFromProfile(claims);
    persistAuthSession({ accessToken: data.accessToken, user });
    return true;
  } catch (error) {
    // Transient refresh failures must not clear a session that may still be valid.
    if (error instanceof TransientRefreshError) {
      return hasPersistedAuthSession();
    }
    return clearSessionUnlessEstablished();
  }
}

/** Restore session from HttpOnly refresh cookie when local auth storage is empty. */
export async function restoreAuthSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (hasPersistedAuthSession()) {
    return true;
  }

  if (!restoreInFlight) {
    restoreInFlight = restoreFromRefreshCookie().finally(() => {
      restoreInFlight = null;
    });
  }

  const restored = await restoreInFlight;
  return restored || hasPersistedAuthSession();
}
