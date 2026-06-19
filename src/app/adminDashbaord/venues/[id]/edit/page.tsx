"use client";

import { use } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { VenueSetupWizard } from "@/components/venues/VenueSetupWizard";

export default function AdminEditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <VenueSetupWizard venueId={id} dashboardScope="admin" />
    </RoleGuard>
  );
}
