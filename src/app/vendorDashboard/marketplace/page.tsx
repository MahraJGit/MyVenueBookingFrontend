"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { ManageMarketplaceServicesContent } from "@/components/marketplace/ManageMarketplaceServicesContent";

export default function VendorMarketplacePage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageMarketplaceServicesContent />
    </RoleGuard>
  );
}
