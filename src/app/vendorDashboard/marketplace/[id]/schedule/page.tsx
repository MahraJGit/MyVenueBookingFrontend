"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { ManageServiceScheduleContent } from "@/components/marketplace/ManageServiceScheduleContent";

export default function MarketplaceServiceSchedulePage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageServiceScheduleContent />
    </RoleGuard>
  );
}
