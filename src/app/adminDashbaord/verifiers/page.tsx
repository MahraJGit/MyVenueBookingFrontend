"use client";

import ManageVerifiers from "@/components/verifiers/ManageVerifiers";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminVerifiersPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <ManageVerifiers scope="admin" />
    </RoleGuard>
  );
}
