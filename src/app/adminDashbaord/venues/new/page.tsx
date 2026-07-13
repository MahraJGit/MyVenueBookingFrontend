"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { VenueSetupWizard } from "@/components/venues/VenueSetupWizard";
import { DashboardPageShell } from "@/components/dashboard/dashboard-ui";
import { Loader2 } from "lucide-react";

function NewVenueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const venueId = searchParams.get("id") ?? undefined;

  useEffect(() => {
    if (venueId) {
      router.replace("/adminDashbaord/manageVenues");
    }
  }, [venueId, router]);

  if (venueId) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <VenueSetupWizard dashboardScope="admin" />;
}

export default function AdminNewVenuePage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <DashboardPageShell>
        <Suspense
          fallback={
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <NewVenueContent />
        </Suspense>
      </DashboardPageShell>
    </RoleGuard>
  );
}
