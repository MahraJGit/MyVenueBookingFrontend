"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { logoutAccount } from "@/features/auth/api";
import { postAuthBroadcast, subscribeAuthBroadcast } from "@/features/auth/auth-broadcast";
import { resetAuthQueryCache } from "@/features/auth/auth-cache";
import { restoreAuthSession } from "@/features/auth/restore-session";
import { teardownClientAuth } from "@/features/auth/teardown-client-auth";
import type { AuthUser } from "@/features/auth/types";
import { buildDisplayName, buildInitials } from "@/features/auth/auth-display";
import {
  AUTH_CHANGED_EVENT,
  AUTH_SESSION_EXPIRED_EVENT,
  clearAuthSession,
  getAccessToken,
  getAuthUser,
  persistAuthSession,
} from "@/features/auth/session-storage";
import { disconnectChatSocket } from "@/features/chat/use-chat-socket";

export type DashboardLinkLabelKey =
  | "customerDashboard"
  | "vendorDashboard"
  | "adminDashboard"
  | "dashboard";

export type DashboardLink = {
  labelKey: DashboardLinkLabelKey;
  href: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  /** True while checking HttpOnly refresh cookie (no local session yet). */
  isRestoring: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  dashboardLinks: DashboardLink[];
  displayName: string;
  initials: string;
  establishSession: (session: { accessToken: string; user: AuthUser }) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthSession =
  | { user: null; isAuthenticated: false }
  | { user: AuthUser; isAuthenticated: true };

function readSession(): AuthSession {
  const token = getAccessToken();
  const user = getAuthUser();
  if (!token || !user) {
    return { user: null, isAuthenticated: false };
  }
  return { user, isAuthenticated: true };
}

export function getDashboardLinksForRole(role: string): DashboardLink[] {
  const customerDashboard: DashboardLink = {
    labelKey: "customerDashboard",
    href: "/userDashboard/tickets",
  };
  const vendorDashboard: DashboardLink = {
    labelKey: "vendorDashboard",
    href: "/vendorDashboard",
  };
  const adminDashboard: DashboardLink = {
    labelKey: "adminDashboard",
    href: "/adminDashbaord/manageEvents",
  };

  if (role === "VENDOR") {
    return [customerDashboard, vendorDashboard];
  }
  if (role === "ADMIN") {
    return [adminDashboard];
  }
  return [{ labelKey: "dashboard", href: customerDashboard.href }];
}

const EMPTY_SESSION: AuthSession = { user: null, isAuthenticated: false };

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const tAuth = useTranslations("auth");
  // Never read sessionStorage in initial state — it breaks SSR hydration.
  const [session, setSession] = useState<AuthSession>(EMPTY_SESSION);
  const [isReady, setIsReady] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const syncFromStorage = useCallback(() => {
    setSession(readSession());
  }, []);

  const establishSession = useCallback(
    (next: { accessToken: string; user: AuthUser }) => {
      persistAuthSession(next);
      setSession({ user: next.user, isAuthenticated: true });
      setIsReady(true);
      setIsRestoring(false);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    syncFromStorage();
    setIsReady(true);

    if (!readSession().isAuthenticated) {
      setIsRestoring(true);
    }

    void (async () => {
      await restoreAuthSession();
      if (cancelled) return;
      syncFromStorage();
      setIsRestoring(false);
    })();

    const onAuthChanged = () => {
      syncFromStorage();
      setIsReady(true);
    };
    const onSessionExpired = () => {
      resetAuthQueryCache(queryClient);
      disconnectChatSocket();
      syncFromStorage();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired);
    window.addEventListener("storage", onAuthChanged);

    const unsubscribeBroadcast = subscribeAuthBroadcast((message) => {
      if (message.type === "logout") {
        teardownClientAuth(queryClient);
        syncFromStorage();
        return;
      }

      void (async () => {
        clearAuthSession();
        await restoreAuthSession();
        resetAuthQueryCache(queryClient);
        syncFromStorage();
      })();
    });

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired);
      window.removeEventListener("storage", onAuthChanged);
      unsubscribeBroadcast();
    };
  }, [queryClient, syncFromStorage]);

  const logout = useCallback(async () => {
    try {
      await logoutAccount();
    } catch {
      // Clear local session even if the server logout call fails.
    } finally {
      postAuthBroadcast({ type: "logout" });
      teardownClientAuth(queryClient);
      syncFromStorage();
      router.replace("/");
    }
  }, [queryClient, router, syncFromStorage]);

  const value = useMemo<AuthContextValue>(() => {
    const user = session.user;
    const role = user?.role ?? "";
    return {
      user,
      isAuthenticated: session.isAuthenticated,
      isReady,
      isRestoring,
      isVendor: role === "VENDOR",
      isAdmin: role === "ADMIN",
      dashboardLinks: user ? getDashboardLinksForRole(role) : [],
      displayName: user
        ? buildDisplayName(user) || tAuth("account")
        : "",
      initials: user ? buildInitials(user) : "?",
      establishSession,
      logout,
    };
  }, [session, isReady, isRestoring, establishSession, logout, tAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
