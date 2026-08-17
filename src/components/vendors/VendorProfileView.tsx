"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  ExternalLink,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SecureStoredImage } from "@/components/uploads/SecureStoredImage";
import { DashboardScrollableTabs } from "@/components/userDashboard/DashboardScrollableTabs";
import {
  getPublicOrganizerListings,
  type PublicOrganizerListing,
  type PublicOrganizerListingTab,
  type PublicOrganizerProfile,
} from "@/features/vendor/api";

type ProfileTab = "about" | PublicOrganizerListingTab;

type VendorProfileViewProps = {
  profile: PublicOrganizerProfile;
  adminBadge?: ReactNode;
  adminActions?: ReactNode;
  adminContent?: ReactNode;
  enablePublicListings?: boolean;
};

const listingTabs: PublicOrganizerListingTab[] = [
  "upcoming",
  "past",
  "venues",
  "attractions",
  "services",
];

export function VendorProfileView({
  profile,
  adminBadge,
  adminActions,
  adminContent,
  enablePublicListings = true,
}: VendorProfileViewProps) {
  const t = useTranslations("organizer");
  const tCommon = useTranslations("common");
  const [tab, setTab] = useState<ProfileTab>("about");
  const [page, setPage] = useState(1);
  const activeListingTab = tab === "about" ? null : tab;
  const availableListingTabs = enablePublicListings
    ? listingTabs.filter((item) => (profile.listingCounts?.[item] ?? 0) > 0)
    : [];

  const listingsQuery = useQuery({
    queryKey: [
      "public-organizer-listings",
      profile.slug,
      activeListingTab,
      page,
    ],
    queryFn: () =>
      activeListingTab
        ? getPublicOrganizerListings(profile.slug, activeListingTab, page)
        : Promise.resolve({
            success: true,
            data: [],
            meta: { total: 0, page: 1, limit: 12, totalPages: 1 },
          }),
    enabled: Boolean(activeListingTab && enablePublicListings),
  });

  const selectTab = (value: ProfileTab) => {
    setTab(value);
    setPage(1);
  };

  const contactItems = [
    profile.websiteUrl
      ? {
          icon: Globe2,
          label: profile.websiteUrl,
          href: profile.websiteUrl,
        }
      : null,
    profile.email
      ? { icon: Mail, label: profile.email, href: `mailto:${profile.email}` }
      : null,
    profile.phone
      ? { icon: Phone, label: profile.phone, href: `tel:${profile.phone}` }
      : null,
    profile.address
      ? { icon: MapPin, label: profile.address, href: null }
      : null,
  ].filter(Boolean) as Array<{
    icon: typeof Globe2;
    label: string;
    href: string | null;
  }>;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#303030] bg-[#0f0f0f] text-white">
      <div className="relative h-44 bg-gradient-to-br from-primary/25 via-[#202020] to-[#111] sm:h-64">
        {profile.coverImageUrl ? (
          <SecureStoredImage
            src={profile.coverImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
      </div>

      <div className="relative px-4 pb-6 sm:px-8">
        <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#0f0f0f] bg-[#1b1b1b] shadow-xl sm:h-32 sm:w-32">
            {profile.logoUrl ? (
              <SecureStoredImage
                src={profile.logoUrl}
                alt={profile.vendorName}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-12 w-12 text-primary" />
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-3xl font-bold sm:text-4xl">
                {profile.vendorName}
              </h1>
              {adminBadge}
            </div>
            <p className="mt-1 text-zinc-400">
              {t("managedBy", { name: profile.ownerName })}
            </p>
            {profile.reviewSummary.count > 0 ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-semibold">
                  {profile.reviewSummary.averageRating ?? "—"}
                </span>
                <span className="text-zinc-400">
                  {t("reviewCount", { count: profile.reviewSummary.count })}
                </span>
              </div>
            ) : null}
          </div>

          {adminActions ? (
            <div className="flex shrink-0 flex-wrap gap-2 pb-1">
              {adminActions}
            </div>
          ) : null}
        </div>

        <div className="mt-7">
          <DashboardScrollableTabs
            value={tab}
            onValueChange={(value) => selectTab(value as ProfileTab)}
            items={[
              { value: "about", label: t("about") },
              ...availableListingTabs.map((value) => ({
                value,
                label: `${t(value)} (${profile.listingCounts[value]})`,
              })),
            ]}
          />
        </div>

        <div className="mt-7 min-h-52">
          {tab === "about" ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="rounded-xl border border-[#303030] bg-[#151515] p-5">
                <h2 className="text-lg font-semibold">{t("about")}</h2>
                <p className="mt-3 whitespace-pre-wrap leading-7 text-zinc-300">
                  {profile.bio || t("noBio")}
                </p>
              </section>

              <aside className="rounded-xl border border-[#303030] bg-[#151515] p-5">
                <h2 className="text-lg font-semibold">{t("contact")}</h2>
                <div className="mt-4 space-y-3">
                  {contactItems.length ? (
                    contactItems.map(({ icon: Icon, label, href }) => {
                      const content = (
                        <>
                          <Icon className="h-4 w-4 shrink-0 text-primary" />
                          <span className="min-w-0 break-words">{label}</span>
                        </>
                      );
                      return href ? (
                        <a
                          key={label}
                          href={href}
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel={href.startsWith("http") ? "noreferrer" : undefined}
                          className="flex items-start gap-3 text-sm text-zinc-300 hover:text-primary"
                        >
                          {content}
                        </a>
                      ) : (
                        <div
                          key={label}
                          className="flex items-start gap-3 text-sm text-zinc-300"
                        >
                          {content}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-zinc-500">{t("noContact")}</p>
                  )}
                </div>
              </aside>
            </div>
          ) : listingsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : listingsQuery.data?.data.length ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {listingsQuery.data.data.map((listing) => (
                  <VendorListingCard
                    key={listing.id}
                    listing={listing}
                    type={tab}
                  />
                ))}
              </div>

              {(listingsQuery.data.meta.totalPages ?? 1) > 1 ? (
                <div className="mt-7 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || listingsQuery.isFetching}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    {tCommon("previous")}
                  </Button>
                  <span className="text-sm text-zinc-400">
                    {page} / {listingsQuery.data.meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={
                      page >= listingsQuery.data.meta.totalPages ||
                      listingsQuery.isFetching
                    }
                    onClick={() => setPage((current) => current + 1)}
                  >
                    {tCommon("next")}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-[#303030] py-16 text-center text-zinc-500">
              {t("emptyTab")}
            </div>
          )}
        </div>

        {adminContent ? (
          <div className="mt-8 border-t border-[#303030] pt-8">
            {adminContent}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VendorListingCard({
  listing,
  type,
}: {
  listing: PublicOrganizerListing;
  type: PublicOrganizerListingTab;
}) {
  const t = useTranslations("organizer");
  const title =
    listing.eventName ?? listing.name ?? listing.title ?? t("listing");
  const href =
    type === "venues"
      ? `/venues/${listing.id}`
      : type === "services"
        ? `/marketplace/${listing.slug}`
        : type === "attractions"
          ? `/attractions/${listing.slug}`
          : `/events/${listing.slug}`;
  const image = listing.thumbnail?.trim() || listing.coverImage?.trim();
  const date = listing.startDateTime
    ? new Date(listing.startDateTime).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-[#303030] bg-[#1b1b1b] transition hover:-translate-y-0.5 hover:border-primary/50"
    >
      <div className="h-48 overflow-hidden bg-[#242424]">
        {image ? (
          <SecureStoredImage
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-10 w-10 text-zinc-600" />
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-semibold">{title}</h3>
          <ExternalLink className="h-4 w-4 shrink-0 text-zinc-500 transition group-hover:text-primary" />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
          {date ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {date}
            </span>
          ) : null}
          {listing.city ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {listing.city}
            </span>
          ) : null}
        </div>
        {listing.basePrice != null ? (
          <Badge variant="secondary">
            {listing.currency ?? ""} {String(listing.basePrice)}
          </Badge>
        ) : null}
      </div>
    </Link>
  );
}
