"use client";

import { ManageVenueScheduleContent } from "@/components/venues/ManageVenueScheduleContent";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function ManageVenueSchedulePage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageVenueScheduleContent />
    </RoleGuard>
  );
}
