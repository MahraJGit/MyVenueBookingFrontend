"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Inbox, Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
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
import { getDashboardPaths } from "@/features/dashboard/paths";
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
const paths = getDashboardPaths("vendor");

function VendorInquiriesContent() {
  const t = useTranslations("vendorMarketplace");
  const tCommon = useTranslations("common");
  const tUser = useTranslations("userDashboard");
  const { user, isAuthenticated, isReady } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("all");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: marketplaceKeys.inquiries(user?.id, { scope: "vendor" }),
    queryFn: () => listServiceInquiries({ limit: 50, scope: "vendor" }),
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
    if (isError) toastApiError(error, t("couldNotLoadInquiries"));
  }, [isError, error, t]);

  return (
    <DashboardPageShell>
      <div className={dashboardEyebrowClass}>
        <Inbox className="h-3.5 w-3.5" />
        {t("marketplaceEyebrow")}
      </div>
      <DashboardPageHeader
        title={t("inquiriesTitle")}
        description={t("inquiriesDesc")}
      />

      <DashboardPanel className="mt-4 space-y-0">
        <DashboardScrollableTabs
          value={activeTab}
          onValueChange={setActiveTab}
          items={TABS.map((value) => ({
            value,
            label: (
              <>
                {value === "all"
                  ? tCommon("all")
                  : tUser(`serviceInquiryStatus.${value}`)}
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
              {t("noInquiries")}
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
  const t = useTranslations("vendorMarketplace");
  const tUser = useTranslations("userDashboard");
  const buyerName = inquiry.buyer
    ? `${inquiry.buyer.firstName} ${inquiry.buyer.lastName}`.trim()
    : t("buyerFallback");
  const estimate = inquiryEstimateAmount(inquiry);
  const location = inquiryLocationLabel(inquiry);
  const hours = inquiryHours(inquiry);
  const metaParts = [
    formatInquiryEventDate(inquiry.startDate, inquiry.endDate),
    inquiry.package?.name,
    inquiry.guestCount != null && inquiry.guestCount > 0
      ? `${inquiry.guestCount} ${tUser("guests").toLowerCase()}`
      : null,
    hours != null ? `${hours} ${tUser("hours").toLowerCase()}` : null,
    location,
    `${tUser("inquiryBuyer")}: ${buyerName}`,
  ].filter(Boolean);

  return (
    <li>
      <Link
        href={paths.marketplaceInquiry(inquiry.id)}
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
            {tUser(
              `serviceInquiryStatus.${inquiry.status}` as "serviceInquiryStatus.PENDING",
            )}
          </span>
        </div>
      </Link>
    </li>
  );
}

export default function VendorMarketplaceInquiriesPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <VendorInquiriesContent />
    </RoleGuard>
  );
}
