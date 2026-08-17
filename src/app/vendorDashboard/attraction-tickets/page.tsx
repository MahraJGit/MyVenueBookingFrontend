"use client";

import { ManageAttractionTicketSales } from "@/components/sales/ManageAttractionTicketSales";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function VendorAttractionTicketsPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageAttractionTicketSales scope="workspace" />
    </RoleGuard>
  );
}
