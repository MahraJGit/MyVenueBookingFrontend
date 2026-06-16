"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";

type RoleGuardProps = {
  allowedRoles: Array<"BUYER" | "VENDOR" | "ADMIN">;
  children: React.ReactNode;
  redirectTo?: string;
};

export function RoleGuard({
  allowedRoles,
  children,
  redirectTo = "/login",
}: RoleGuardProps) {
  const { user, isReady, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || !user) {
      router.replace(redirectTo);
      return;
    }
    if (!allowedRoles.includes(user.role as "BUYER" | "VENDOR" | "ADMIN")) {
      router.replace("/");
    }
  }, [isReady, isAuthenticated, user, allowedRoles, router, redirectTo]);

  if (!isReady || !isAuthenticated || !user || !allowedRoles.includes(user.role as "BUYER" | "VENDOR" | "ADMIN")) {
    return null;
  }

  return <>{children}</>;
}
