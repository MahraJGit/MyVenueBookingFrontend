"use client";

import ManageVerifiers from "@/components/verifiers/ManageVerifiers";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function VendorVerifiersPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ManageVerifiers scope="vendor" />
    </RoleGuard>
  );
}
