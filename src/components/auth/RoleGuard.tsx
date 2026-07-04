"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  const { user, isReady, isRestoring, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady || isRestoring) return;
    if (!isAuthenticated || !user) {
      router.replace(redirectTo);
      return;
    }
    if (!allowedRoles.includes(user.role as "BUYER" | "VENDOR" | "ADMIN")) {
      router.replace("/");
    }
  }, [isReady, isRestoring, isAuthenticated, user, allowedRoles, router, redirectTo]);

  if (!isReady || isRestoring) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (
    !isAuthenticated ||
    !user ||
    !allowedRoles.includes(user.role as "BUYER" | "VENDOR" | "ADMIN")
  ) {
    return null;
  }

  return <>{children}</>;
}
