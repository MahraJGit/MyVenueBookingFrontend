"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { VenueSetupWizard } from "@/components/venues/VenueSetupWizard";

export default function AdminNewVenuePage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <VenueSetupWizard dashboardScope="admin" />
    </RoleGuard>
  );
}
