"use client";

import { ManageTicketSales } from "@/components/sales/ManageTicketSales";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function VendorTicketsPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageTicketSales scope="workspace" />
    </RoleGuard>
  );
}
