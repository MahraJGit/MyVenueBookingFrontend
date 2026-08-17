"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { ManageMarketplaceBookings } from "@/components/marketplace/ManageMarketplaceBookings";

export default function MarketplaceBookingsAdminRoute() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <ManageMarketplaceBookings scope="platform" syncWithUrl />
    </RoleGuard>
  );
}
