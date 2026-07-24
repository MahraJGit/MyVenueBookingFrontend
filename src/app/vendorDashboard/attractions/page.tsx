"use client";

import ManageAttractions from "@/app/adminDashbaord/manageAttractions/page";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function VendorAttractionsPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageAttractions />
    </RoleGuard>
  );
}
