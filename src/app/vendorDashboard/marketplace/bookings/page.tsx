"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { ManageMarketplaceBookings } from "@/components/marketplace/ManageMarketplaceBookings";

export default function VendorMarketplaceBookingsPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageMarketplaceBookings scope="vendor" />
    </RoleGuard>
  );
}
