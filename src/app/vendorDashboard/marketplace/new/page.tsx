"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { MarketplaceServiceForm } from "@/components/marketplace/MarketplaceServiceForm";

function NewServiceContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("id") ?? undefined;
  return <MarketplaceServiceForm serviceId={serviceId} />;
}

export default function NewMarketplaceServicePage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <NewServiceContent />
      </Suspense>
    </RoleGuard>
  );
}
