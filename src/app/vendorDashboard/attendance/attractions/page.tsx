"use client";

import { ManageTicketAttendance } from "@/components/attendance/ManageTicketAttendance";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function VendorAttractionAttendancePage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageTicketAttendance scope="vendor" resourceType="attraction" />
    </RoleGuard>
  );
}
