"use client";

import { useEffect } from "react";
import {
  AUTH_CHANGED_EVENT,
  getAccessToken,
  getAuthUser,
} from "@/features/auth/session-storage";
import {
  clearAuthRoleCookie,
  setAuthRoleCookie,
} from "@/features/auth/auth-cookies";
import { isAppRole } from "@/features/auth/roles";

/** Keeps proxy-readable auth cookies aligned with sessionStorage. */
export function AuthCookieSync() {
  useEffect(() => {
    const sync = () => {
      const token = getAccessToken();
      const user = getAuthUser();
      if (token && user && isAppRole(user.role)) {
        setAuthRoleCookie(user.role);
        return;
      }
      clearAuthRoleCookie();
    };

    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, []);

  return null;
}
