"use client";

import ManageAttractionTickets from "@/app/adminDashbaord/manageAttractionTickets/page";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function VendorAttractionTicketsPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageAttractionTickets />
    </RoleGuard>
  );
}
