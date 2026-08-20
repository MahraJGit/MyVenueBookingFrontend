"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import {
  DashboardPageShell,
  DashboardPanel,
  DashboardScrollableTabs,
  dashboardEyebrowClass,
  dashboardTabCountClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { listServiceInquiries } from "@/features/marketplace/api";
import {
  formatInquiryEventDate,
  inquiryEstimateAmount,
  inquiryHours,
  inquiryLocationLabel,
} from "@/features/marketplace/inquiry-display";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import type { ServiceInquiry } from "@/features/marketplace/types";
import { useAuth } from "@/features/auth/auth-context";
import { toastApiError } from "@/lib/toasts";

const TABS = [
  "all",
  "PENDING",
  "PROPOSAL_SENT",
  "ACCEPTED",
  "DECLINED",
  "CANCELLED",
  "EXPIRED",
] as const;

function customerInquiryStatusLabel(
  value: string,
  t: ReturnType<typeof useTranslations>,
) {
  if (value === "PROPOSAL_SENT") return t("proposalReceived");
  return t(`serviceInquiryStatus.${value}` as "serviceInquiryStatus.PENDING");
}

export default function UserServiceInquiriesPage() {
  const t = useTranslations("userDashboard");
  const tCommon = useTranslations("common");
  const { user, isAuthenticated, isReady } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("all");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: marketplaceKeys.inquiries(user?.id, { scope: "buyer" }),
    queryFn: () => listServiceInquiries({ limit: 50, scope: "buyer" }),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const inquiries = data?.items ?? [];

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: inquiries.length };
    for (const row of inquiries) {
      base[row.status] = (base[row.status] ?? 0) + 1;
    }
    return base;
  }, [inquiries]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return inquiries;
    return inquiries.filter((row) => row.status === activeTab);
  }, [inquiries, activeTab]);

  useEffect(() => {
    if (isError) toastApiError(error, t("couldNotLoadServiceInquiriesToast"));
  }, [isError, error, t]);

  return (
    <DashboardPageShell>
      <div className={dashboardEyebrowClass}>
        <Briefcase className="h-3.5 w-3.5" />
        {t("quoteMarketplaceSection")}
      </div>
      <DashboardPageHeader
        title={t("myServiceInquiries")}
        description={t("serviceInquiriesSubtitle")}
      />

      <DashboardPanel className="mt-4 space-y-0">
        <DashboardScrollableTabs
          value={activeTab}
          onValueChange={setActiveTab}
          items={TABS.map((value) => ({
            value,
            label: (
              <>
                {value === "all" ? tCommon("all") : customerInquiryStatusLabel(value, t)}
                <span className={dashboardTabCountClass}>{counts[value] ?? 0}</span>
              </>
            ),
          }))}
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-zinc-800 bg-transparent">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("noServiceInquiries")}
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href="/marketplace">{t("browseMarketplace")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {filtered.map((inquiry) => (
              <InquiryRow key={inquiry.id} inquiry={inquiry} />
            ))}
          </ul>
        )}
      </DashboardPanel>
    </DashboardPageShell>
  );
}

function InquiryRow({ inquiry }: { inquiry: ServiceInquiry }) {
  const t = useTranslations("userDashboard");
  const estimate = inquiryEstimateAmount(inquiry);
  const location = inquiryLocationLabel(inquiry);
  const hours = inquiryHours(inquiry);
  const metaParts = [
    formatInquiryEventDate(inquiry.startDate, inquiry.endDate),
    inquiry.package?.name,
    inquiry.guestCount != null && inquiry.guestCount > 0
      ? `${inquiry.guestCount} ${t("guests").toLowerCase()}`
      : null,
    hours != null ? `${hours} ${t("hours").toLowerCase()}` : null,
    location,
    inquiry.service?.vendor?.vendorName
      ? `${t("inquiryVendor")}: ${inquiry.service.vendor.vendorName}`
      : null,
  ].filter(Boolean);

  return (
    <li>
      <Link
        href={`/userDashboard/service-inquiries/${inquiry.id}`}
        className="flex flex-col gap-2 px-1 py-4 transition hover:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-white">
            {inquiry.service?.title ?? t("serviceFallback")}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {metaParts.join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          {estimate != null ? (
            <span className="text-sm font-semibold text-primary">
              <DisplayPrice
                amount={estimate}
                currency={inquiry.service?.currency ?? "AED"}
              />
            </span>
          ) : null}
          <span className="inline-flex w-fit rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
            {customerInquiryStatusLabel(inquiry.status, t)}
          </span>
        </div>
      </Link>
    </li>
  );
}
