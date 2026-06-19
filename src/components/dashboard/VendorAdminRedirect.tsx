"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { getVendorRedirectForAdminPath } from "@/features/dashboard/paths";

/**
 * Vendors should use /vendorDashboard — redirect them away from /adminDashbaord routes.
 */
export function VendorAdminRedirect({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isVendorOnly = isReady && user?.role === "VENDOR";

  useEffect(() => {
    if (!isVendorOnly) return;

    const search = searchParams.toString();
    const target = getVendorRedirectForAdminPath(
      pathname,
      search ? `?${search}` : "",
    );
    if (target) {
      router.replace(target);
    }
  }, [isVendorOnly, pathname, router, searchParams]);

  if (isVendorOnly) {
    return null;
  }

  return <>{children}</>;
}
