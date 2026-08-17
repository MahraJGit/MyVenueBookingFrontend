"use client";

import Link from "next/link";
import { Building2, Mail, MapPin, Phone, User } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicVendorProfile } from "@/features/events/api";

type EventOrganizerSectionProps = {
  vendor: PublicVendorProfile & { slug?: string };
};

function formatBusinessType(
  value: string,
  t: (key: "businessTypeIndividual" | "businessTypeCompany" | "businessTypePartnership") => string,
): string {
  if (value === "INDIVIDUAL") return t("businessTypeIndividual");
  if (value === "COMPANY") return t("businessTypeCompany");
  if (value === "PARTNERSHIP") return t("businessTypePartnership");
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function EventOrganizerSection({ vendor }: EventOrganizerSectionProps) {
  const t = useTranslations("events");
  const organizerHref = vendor.slug ? `/organizers/${vendor.slug}` : undefined;

  return (
    <section className="container mx-auto px-4 py-12 sm:px-6">
      <h2 className="mb-8 text-xl font-bold text-primary">{t("organizer")}</h2>
      <div className="max-w-2xl">
        <div className="flex min-w-0 flex-col gap-6 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 sm:p-6">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Building2 size={22} className="text-primary" />
              </div>
              <div className="min-w-0">
                {organizerHref ? (
                  <Link href={organizerHref} className="hover:underline">
                    <h3 className="break-words text-lg font-semibold text-white" dir="auto">
                      {vendor.vendorName}
                    </h3>
                  </Link>
                ) : (
                  <h3 className="break-words text-lg font-semibold text-white" dir="auto">
                    {vendor.vendorName}
                  </h3>
                )}
                <p className="text-sm text-zinc-400">
                  {formatBusinessType(vendor.businessType, t)}
                </p>
              </div>
            </div>
            {vendor.ownerName ? (
              <p className="flex items-center gap-2 text-sm text-zinc-400">
                <User size={14} className="shrink-0 text-primary" />
                <span>{t("organizerOwner", { name: vendor.ownerName })}</span>
              </p>
            ) : null}
            {organizerHref ? (
              <Link
                href={organizerHref}
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                {t("viewOrganizerProfile")}
              </Link>
            ) : null}
          </div>

          <div className="space-y-4 border-t border-[#303030] pt-4">
            <h4 className="text-sm font-semibold text-white">{t("contactDetails")}</h4>

            {vendor.phone ? (
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Phone size={14} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500">{t("phone")}</p>
                  <p className="break-all text-sm text-white">{vendor.phone}</p>
                </div>
              </div>
            ) : null}

            {vendor.email ? (
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Mail size={14} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500">{t("email")}</p>
                  <a
                    href={`mailto:${vendor.email}`}
                    className="break-all text-sm text-primary hover:underline"
                  >
                    {vendor.email}
                  </a>
                </div>
              </div>
            ) : null}

            {vendor.address ? (
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <MapPin size={14} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500">{t("address")}</p>
                  <p className="break-words text-sm text-white">{vendor.address}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
