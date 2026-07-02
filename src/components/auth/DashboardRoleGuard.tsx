"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import {
  getDefaultDashboardForRole,
  hasAnyRole,
  type AppRole,
} from "@/features/auth/roles";

type DashboardRoleGuardProps = {
  allowedRoles: readonly AppRole[];
  children: ReactNode;
};

/** Client-side guard — API remains the real security boundary. */
export function DashboardRoleGuard({
  allowedRoles,
  children,
}: DashboardRoleGuardProps) {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuth();

  const isAllowed =
    isAuthenticated && user && hasAnyRole(user.role, allowedRoles);

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user && !hasAnyRole(user.role, allowedRoles)) {
      router.replace(getDefaultDashboardForRole(user.role as AppRole));
    }
  }, [allowedRoles, isAuthenticated, isReady, router, user]);

  if (!isReady) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}
