"use client";

import ManageEvents from "@/app/adminDashbaord/manageEvents/page";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function VendorEventsPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageEvents />
    </RoleGuard>
  );
}
