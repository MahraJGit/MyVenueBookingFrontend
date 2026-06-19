"use client";

import ManageTickets from "@/app/adminDashbaord/manageTickets/page";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function VendorTicketsPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageTickets />
    </RoleGuard>
  );
}
