"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { ManageVenueBookings } from "@/components/bookings/ManageVenueBookings";

export default function AdminVenueBookingsPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <ManageVenueBookings scope="admin" />
    </RoleGuard>
  );
}
