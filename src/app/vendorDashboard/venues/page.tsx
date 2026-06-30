"use client";

import ManageVenues from "@/app/adminDashbaord/manageVenues/page";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function VendorVenuesPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageVenues />
    </RoleGuard>
  );
}
