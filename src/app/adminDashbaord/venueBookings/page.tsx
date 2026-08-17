"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { ManageVenueBookingSales } from "@/components/sales/ManageVenueBookingSales";
import { DashboardPageShell } from "@/components/dashboard/dashboard-ui";

export default function AdminVenueBookingsPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <DashboardPageShell>
        <ManageVenueBookingSales scope="platform" syncWithUrl />
      </DashboardPageShell>
    </RoleGuard>
  );
}
