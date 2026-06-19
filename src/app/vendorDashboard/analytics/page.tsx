"use client";

import AnalyticsPage from "@/app/adminDashbaord/analytics/page";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function VendorAnalyticsPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <AnalyticsPage />
    </RoleGuard>
  );
}
