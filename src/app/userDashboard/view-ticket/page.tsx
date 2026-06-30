"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { dashboardSurfaceClass } from "@/components/dashboard/dashboard-ui";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import ViewTicketContent from "./ViewTicketContent";

function ViewTicketFallback() {
  const t = useTranslations("viewTicket");

  return (
    <Card className={cn(dashboardSurfaceClass, "flex flex-col items-center gap-4 py-16")}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{t("loadingOrder")}</p>
    </Card>
  );
}

export default function ViewTicketPage() {
  return (
    <Suspense fallback={<ViewTicketFallback />}>
      <ViewTicketContent />
    </Suspense>
  );
}
