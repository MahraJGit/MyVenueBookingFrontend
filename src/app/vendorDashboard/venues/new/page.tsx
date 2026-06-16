"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { VenueSetupWizard } from "@/components/venues/VenueSetupWizard";

export default function NewVenuePage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <VenueSetupWizard />
    </RoleGuard>
  );
}
