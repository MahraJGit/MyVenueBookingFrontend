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
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { logoutAccount } from "@/features/auth/api";
import type { AuthUser } from "@/features/auth/types";
import {
  AUTH_CHANGED_EVENT,
  clearAuthSession,
  getAccessToken,
  getAuthUser,
} from "@/features/auth/session-storage";

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
  isVendor: boolean;
  isAdmin: boolean;
  dashboardLinks: DashboardLink[];
  displayName: string;
  initials: string;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession() {
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

function buildDisplayName(user: AuthUser): string {
  const fullName = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return fullName || user.email?.trim() || "";
}

function buildInitials(user: AuthUser): string {
  const first = user.firstName?.trim().charAt(0) ?? "";
  const last = user.lastName?.trim().charAt(0) ?? "";
  const fromName = `${first}${last}`.toUpperCase();
  if (fromName) return fromName;
  const emailInitial = user.email?.trim().charAt(0).toUpperCase();
  return emailInitial || "?";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const tAuth = useTranslations("auth");
  const [session, setSession] = useState(() => readSession());
  const [isReady, setIsReady] = useState(false);

  const syncFromStorage = useCallback(() => {
    setSession(readSession());
  }, []);

  useEffect(() => {
    syncFromStorage();
    setIsReady(true);

    const onAuthChanged = () => syncFromStorage();
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    window.addEventListener("storage", onAuthChanged);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
    };
  }, [syncFromStorage]);

  const logout = useCallback(async () => {
    try {
      await logoutAccount();
    } catch {
      // Clear local session even if the server logout call fails.
    } finally {
      clearAuthSession();
      syncFromStorage();
      router.replace("/");
    }
  }, [router, syncFromStorage]);

  const value = useMemo<AuthContextValue>(() => {
    const user = session.user;
    const role = user?.role ?? "";
    return {
      user,
      isAuthenticated: session.isAuthenticated,
      isReady,
      isVendor: role === "VENDOR",
      isAdmin: role === "ADMIN",
      dashboardLinks: user ? getDashboardLinksForRole(role) : [],
      displayName: user
        ? buildDisplayName(user) || tAuth("account")
        : "",
      initials: user ? buildInitials(user) : "?",
      logout,
    };
  }, [session, isReady, logout, tAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
