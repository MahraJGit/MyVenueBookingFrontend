"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { ManageVenueBookings } from "@/components/bookings/ManageVenueBookings";

export default function VendorBookingsPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageVenueBookings scope="vendor" />
    </RoleGuard>
  );
}
