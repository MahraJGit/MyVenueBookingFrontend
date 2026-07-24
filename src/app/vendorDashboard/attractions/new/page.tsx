import { Suspense } from "react";
import AddAttractionsContentPage from "@/app/adminDashbaord/addAttractions/addAttractionsContent";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoadingFallback } from "@/components/i18n/LoadingFallback";

export default function VendorAddAttractionPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <Suspense fallback={<LoadingFallback className="text-white" />}>
        <AddAttractionsContentPage />
      </Suspense>
    </RoleGuard>
  );
}
