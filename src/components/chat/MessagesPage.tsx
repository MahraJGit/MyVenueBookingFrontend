"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { ChatInbox } from "@/components/chat/ChatInbox";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { DashboardPageShell } from "@/components/dashboard/dashboard-ui";

function MessagesPageContent({ basePath }: { basePath: string }) {
  const t = useTranslations("chat");
  return (
    <DashboardPageShell>
      <DashboardPageHeader title={t("title")} description={t("subtitle")} />
      <ChatInbox basePath={basePath} />
    </DashboardPageShell>
  );
}

export function MessagesPage({ basePath }: { basePath: string }) {
  return (
    <Suspense fallback={null}>
      <MessagesPageContent basePath={basePath} />
    </Suspense>
  );
}
