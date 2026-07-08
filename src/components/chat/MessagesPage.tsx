"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { ChatInbox } from "@/components/chat/ChatInbox";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { DashboardPageShell } from "@/components/dashboard/dashboard-ui";
import type { ChatInboxContext } from "@/features/chat/inbox-context";

function MessagesPageContent({
  basePath,
  context,
}: {
  basePath: string;
  context: ChatInboxContext;
}) {
  const t = useTranslations("chat");
  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title={<span dir="auto">{t("title")}</span>}
        description={<span dir="auto">{t("subtitle")}</span>}
      />
      <ChatInbox basePath={basePath} context={context} />
    </DashboardPageShell>
  );
}

export function MessagesPage({
  basePath,
  context,
}: {
  basePath: string;
  context: ChatInboxContext;
}) {
  return (
    <Suspense fallback={null}>
      <MessagesPageContent basePath={basePath} context={context} />
    </Suspense>
  );
}
