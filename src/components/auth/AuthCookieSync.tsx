"use client";

import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  clearAuthRoleCookie,
  getAuthRoleFromDocument,
  setAuthRoleCookie,
} from "@/features/auth/auth-cookies";
import { isAppRole } from "@/features/auth/roles";

/** Keeps proxy-readable auth cookies aligned with the restored auth session. */
export function AuthCookieSync() {
  const { isReady, isRestoring, isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Never clear the role cookie while restore is in flight — that would make the
    // Next.js proxy treat a still-valid session as logged out across navigations.
    if (!isReady || isRestoring) return;

    if (isAuthenticated && user && isAppRole(user.role)) {
      const cookieRole = getAuthRoleFromDocument();
      if (cookieRole !== user.role) {
        setAuthRoleCookie(user.role);
      }
      return;
    }

    clearAuthRoleCookie();
  }, [isReady, isRestoring, isAuthenticated, user]);

  return null;
}
