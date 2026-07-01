"use client"

import { useTranslations } from "next-intl"
import {
  DashboardComingSoon,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-shared"
import { DashboardPanel, DashboardPageShell } from "@/components/dashboard/dashboard-ui"

export default function AttendeesPage() {
  const t = useTranslations("adminAttendees")

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader title={t("title")} />
        <DashboardComingSoon title={t("title")} description={t("comingSoon")} />
      </DashboardPanel>
    </DashboardPageShell>
  )
}
