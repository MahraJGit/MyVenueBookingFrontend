"use client";

import { ManageTicketAttendance } from "@/components/attendance/ManageTicketAttendance";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminEventAttendancePage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <ManageTicketAttendance scope="admin" resourceType="event" />
    </RoleGuard>
  );
}
