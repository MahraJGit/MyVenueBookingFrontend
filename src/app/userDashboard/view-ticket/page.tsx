"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { DashboardContentPanel } from "@/components/dashboard/dashboard-shared";
import ViewTicketContent from "./ViewTicketContent";

function ViewTicketFallback() {
  const t = useTranslations("viewTicket");

  return (
    <DashboardContentPanel>
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("loadingOrder")}</p>
      </div>
    </DashboardContentPanel>
  );
}

export default function ViewTicketPage() {
  return (
    <Suspense fallback={<ViewTicketFallback />}>
      <ViewTicketContent />
    </Suspense>
  );
}
