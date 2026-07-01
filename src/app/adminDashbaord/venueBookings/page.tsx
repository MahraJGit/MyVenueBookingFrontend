"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { ManageVenueBookings } from "@/components/bookings/ManageVenueBookings";
import { DashboardPageShell } from "@/components/dashboard/dashboard-ui";

export default function AdminVenueBookingsPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <DashboardPageShell>
        <ManageVenueBookings scope="admin" />
      </DashboardPageShell>
    </RoleGuard>
  );
}
