import { Suspense } from "react";
import AddEventsContentPage from "@/app/adminDashbaord/addEvents/addEventsContent";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoadingFallback } from "@/components/i18n/LoadingFallback";

export default function VendorAddEventPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <Suspense fallback={<LoadingFallback className="text-white" />}>
        <AddEventsContentPage />
      </Suspense>
    </RoleGuard>
  );
}
