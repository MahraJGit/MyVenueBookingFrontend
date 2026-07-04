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
  const { isReady, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    if (isAuthenticated && user && isAppRole(user.role)) {
      const cookieRole = getAuthRoleFromDocument();
      if (cookieRole !== user.role) {
        setAuthRoleCookie(user.role);
      }
      return;
    }

    clearAuthRoleCookie();
  }, [isReady, isAuthenticated, user]);

  return null;
}
