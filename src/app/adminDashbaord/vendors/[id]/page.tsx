"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ExternalLink, Loader2 } from "lucide-react";
import { VendorProfileView } from "@/components/vendors/VendorProfileView";
import {
  getAdminVendorDetail,
  getPublicOrganizerProfile,
  type PublicOrganizerProfile,
} from "@/features/vendor/api";
import {
  DashboardPageShell,
  DashboardPanel,
  dashboardOutlineButtonClass,
} from "@/components/dashboard/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPresignedViewUrl } from "@/features/uploads/api";
import { toastApiError } from "@/lib/toasts";

function formatDate(dateString: string) {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString();
}

export default function AdminVendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("adminVendors");
  const tCommon = useTranslations("common");
  const tRequests = useTranslations("adminVendorRequests");
  const vendorQuery = useQuery({
    queryKey: ["admin-vendor-detail", id],
    queryFn: () => getAdminVendorDetail(id),
  });
  const vendor = vendorQuery.data;

  const publicProfileQuery = useQuery({
    queryKey: ["public-organizer", vendor?.slug],
    queryFn: () => getPublicOrganizerProfile(vendor!.slug!),
    enabled:
      Boolean(vendor?.slug) && vendor?.verificationStatus === "APPROVED",
  });

  if (vendorQuery.isLoading) {
    return (
      <DashboardPageShell>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardPageShell>
    );
  }

  if (vendorQuery.isError || !vendor) {
    return (
      <DashboardPageShell>
        <DashboardPanel>{t("notFound")}</DashboardPanel>
      </DashboardPageShell>
    );
  }

  const profile: PublicOrganizerProfile =
    publicProfileQuery.data ?? {
      id: vendor.id,
      slug: vendor.slug ?? "",
      vendorName: vendor.vendorName,
      businessType: vendor.businessType,
      ownerName: vendor.ownerName,
      logoUrl: vendor.logoUrl ?? null,
      coverImageUrl: vendor.coverImageUrl ?? null,
      bio: vendor.bio ?? null,
      websiteUrl: vendor.websiteUrl ?? null,
      phone: vendor.publicPhone || vendor.phone,
      email: vendor.publicEmail || vendor.email,
      address: vendor.address,
      reviewSummary: vendor.reviewSummary,
      listingCounts: {
        upcoming: 0,
        past: 0,
        venues: 0,
        attractions: 0,
        services: 0,
        reviews: vendor.reviewSummary.count,
      },
    };

  return (
    <DashboardPageShell>
      <VendorProfileView
        profile={profile}
        enablePublicListings={
          vendor.verificationStatus === "APPROVED" &&
          Boolean(publicProfileQuery.data)
        }
        adminBadge={
          <Badge
            variant={
              vendor.verificationStatus === "APPROVED"
                ? "default"
                : vendor.verificationStatus === "REJECTED"
                  ? "destructive"
                  : "secondary"
            }
          >
            {vendor.verificationStatus}
          </Badge>
        }
        adminActions={
          vendor.slug && vendor.verificationStatus === "APPROVED" ? (
            <Button
              asChild
              variant="outline"
              className={dashboardOutlineButtonClass}
            >
              <Link href={`/organizers/${vendor.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("publicPreview")}
              </Link>
            </Button>
          ) : null
        }
        adminContent={
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <DashboardPanel className="space-y-3">
                <h2 className="text-lg font-semibold">{t("listings")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <MetricLink
                    href={`/adminDashbaord/manageTickets?vendorId=${vendor.id}`}
                    label={t("events")}
                    value={vendor.counts.events}
                    hint={t("viewSales")}
                  />
                  <MetricLink
                    href={`/adminDashbaord/manageAttractionTickets?vendorId=${vendor.id}`}
                    label={t("attractions")}
                    value={vendor.counts.attractions}
                    hint={t("viewSales")}
                  />
                  <MetricLink
                    href={`/adminDashbaord/venueBookings?vendorId=${vendor.id}`}
                    label={t("venues")}
                    value={vendor.counts.venues}
                    hint={t("viewBookings")}
                  />
                  <MetricLink
                    href={`/adminDashbaord/marketplaceBookings?vendorId=${vendor.id}`}
                    label={t("services")}
                    value={vendor.counts.marketplaceServices}
                    hint={t("viewBookings")}
                  />
                </div>
              </DashboardPanel>

              <DashboardPanel className="space-y-3">
                <h2 className="text-lg font-semibold">{t("compliance")}</h2>
                <Detail
                  label={t("legalEntity")}
                  value={vendor.legalEntityName}
                />
                <Detail label={t("taxId")} value={vendor.taxId} />
                <Detail label={t("address")} value={vendor.address} />
                <Detail label={tCommon("email")} value={vendor.email} />
                <Detail label={tCommon("phone")} value={vendor.phone} />
              </DashboardPanel>
            </div>

            <DashboardPanel className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {tRequests("detailsTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tRequests("detailsDesc")}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <DetailRow
                  label={tCommon("businessType")}
                  value={vendor.businessType}
                />
                <DetailRow
                  label={tRequests("ownerName")}
                  value={vendor.ownerName}
                />
                <DetailRow
                  label={tRequests("eidNumber")}
                  value={vendor.eidNumber}
                />
                <DetailRow
                  label={tRequests("eidExpiry")}
                  value={formatDate(vendor.eidExpiry)}
                />
                <DetailRow
                  label={tRequests("passportNumber")}
                  value={vendor.passportNumber}
                />
                <DetailRow
                  label={tRequests("passportExpiry")}
                  value={formatDate(vendor.passportExpiry)}
                />
                <DetailRow
                  label={tRequests("incorporationDate")}
                  value={formatDate(vendor.incorporationDate)}
                />
                <DetailRow
                  label={tRequests("tradeLicenseNo")}
                  value={vendor.tradeLicenseNumber}
                />
                <DetailRow
                  label={tRequests("tradeLicenseExpiry")}
                  value={formatDate(vendor.tradeLicenseExpiry)}
                />
                <DetailRow
                  label={tRequests("paymentTerms")}
                  value={vendor.paymentTerms}
                />
                <DetailRow
                  label={tRequests("submittedAt")}
                  value={formatDate(vendor.createdAt)}
                />

                {vendor.rejectedReason ? (
                  <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-200 md:col-span-2">
                    <p className="font-semibold">
                      {tRequests("rejectionReason")}
                    </p>
                    <p className="mt-1">{vendor.rejectedReason}</p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 rounded-md border border-[#303030] p-3">
                <p className="font-semibold">{tRequests("uploadedFiles")}</p>
                <FileLink
                  label={tRequests("eidCopy")}
                  url={vendor.eidCopyUrl}
                  notProvided={tCommon("notProvided")}
                  openError={tRequests("couldNotOpenDoc")}
                />
                <FileLink
                  label={tRequests("passportCopy")}
                  url={vendor.passportCopyUrl}
                  notProvided={tCommon("notProvided")}
                  openError={tRequests("couldNotOpenDoc")}
                />
                <FileLink
                  label={tRequests("tradeLicenseCopy")}
                  url={vendor.tradeLicenseCopyUrl}
                  notProvided={tCommon("notProvided")}
                  openError={tRequests("couldNotOpenDoc")}
                />
                {vendor.verificationDocuments.map((fileUrl, index) => (
                  <FileLink
                    key={`${fileUrl}-${index}`}
                    label={tRequests("verificationDocument", { n: index + 1 })}
                    url={fileUrl}
                    notProvided={tCommon("notProvided")}
                    openError={tRequests("couldNotOpenDoc")}
                  />
                ))}
              </div>
            </DashboardPanel>
          </div>
        }
      />
    </DashboardPageShell>
  );
}

function MetricLink({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-[#303030] bg-[#151515] p-4 transition hover:border-primary/50 hover:bg-[#1a1a1a]"
    >
      <p className="text-2xl font-semibold text-primary">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xs text-primary">{hint}</p>
    </Link>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-muted-foreground">{label}:</span> {value || "—"}
    </p>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#303030] p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm">{value || "—"}</p>
    </div>
  );
}

function FileLink({
  label,
  url,
  notProvided,
  openError,
}: {
  label: string;
  url: string;
  notProvided: string;
  openError: string;
}) {
  const [loading, setLoading] = useState(false);

  const openSecure = useCallback(async () => {
    try {
      setLoading(true);
      const viewUrl = await getPresignedViewUrl(url);
      window.open(viewUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toastApiError(err, openError);
    } finally {
      setLoading(false);
    }
  }, [url, openError]);

  if (!url?.trim()) {
    return (
      <p className="text-sm text-zinc-500">
        {label}: <span className="text-zinc-600">{notProvided}</span>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void openSecure()}
      disabled={loading}
      className="flex items-center gap-2 text-left text-sm text-primary hover:underline disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <ExternalLink className="h-4 w-4 shrink-0" />
      )}
      {label}
    </button>
  );
}
