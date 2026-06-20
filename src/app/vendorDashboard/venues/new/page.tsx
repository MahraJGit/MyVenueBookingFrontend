"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { VenueSetupWizard } from "@/components/venues/VenueSetupWizard";
import { Loader2 } from "lucide-react";

function NewVenueContent() {
  const searchParams = useSearchParams();
  const venueId = searchParams.get("id") ?? undefined;

  return <VenueSetupWizard venueId={venueId} dashboardScope="vendor" />;
}

export default function NewVenuePage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <NewVenueContent />
      </Suspense>
    </RoleGuard>
  );
}
