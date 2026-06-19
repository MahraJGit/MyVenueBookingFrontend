import { Suspense } from "react";
import AddEventsContentPage from "@/app/adminDashbaord/addEvents/addEventsContent";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function VendorAddEventPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <AddEventsContentPage />
      </Suspense>
    </RoleGuard>
  );
}
