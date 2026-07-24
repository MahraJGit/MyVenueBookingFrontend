"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PublicAttraction } from "@/features/attractions/api";
import { AttractionCoverImage } from "@/components/attractions/AttractionCoverImage";
import { formatEventDate } from "@/features/events/utils";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { getIntlLocale } from "@/i18n/locales";

type AttractionCardProps = {
  attraction: PublicAttraction;
  href?: string;
  hideFavorite?: boolean;
};

export function AttractionCard({
  attraction,
  href,
  hideFavorite,
}: AttractionCardProps) {
  const t = useTranslations("attractions");
  const tCommon = useTranslations("common");
  const { locale } = useLocaleContext();
  const intlLocale = getIntlLocale(locale);
  const location = [attraction.city, attraction.state].filter(Boolean).join(", ");
  const tags = (attraction.tags ?? []).filter((tag) => tag.trim()).slice(0, 3);
  const linkHref = href ?? `/attractions/${attraction.slug}`;
  const nextDate = attraction.nextOccurrence?.startDateTime;

  return (
    <div className="card group relative flex h-full flex-col items-center">
      {!hideFavorite ? (
        <FavoriteButton
          type="attraction"
          id={attraction.id}
          className="absolute top-3 right-3 z-20"
        />
      ) : null}
      <Link
        href={linkHref}
        className="relative flex h-full w-full cursor-pointer flex-col items-center"
      >
        <AttractionCoverImage
          coverImage={attraction.coverImage}
          thumbnail={attraction.thumbnail}
          attractionName={attraction.name}
          seed={attraction.id}
        />
        <div className="card-body relative z-0 -mt-10 flex w-full max-w-[92%] flex-1 flex-col rounded-2xl border border-[#303030] bg-[#1B1B1B] transition-all duration-300 ease-in-out group-hover:rounded-t-none">
          <div className="flex h-full flex-col gap-3 p-4">
            <h4 className="line-clamp-1" dir="auto">
              {attraction.name}
            </h4>

            <div className="flex h-6 min-h-6 flex-nowrap items-center gap-1.5 overflow-hidden">
              {attraction.category ? (
                <span
                  className="max-w-[45%] shrink-0 truncate rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                  dir="auto"
                >
                  {attraction.category}
                </span>
              ) : null}
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="shrink-0 truncate rounded-full border border-[#303030] bg-[#242424] px-2 py-0.5 text-[11px] text-[#B3B3B3]"
                  dir="auto"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs">
                {nextDate
                  ? formatEventDate(nextDate, intlLocale, attraction.timezone)
                  : t("badge")}
              </span>
              <span className="line-clamp-1 text-end text-xs" dir="auto">
                {location || "—"}
              </span>
            </div>
            <div className="price text-md mt-auto font-bold text-primary">
              {attraction.fromPrice != null ? (
                <>
                  {tCommon("from")}{" "}
                  <span>
                    <DisplayPrice
                      amount={attraction.fromPrice}
                      currency={
                        attraction.ticketTypes.find((tt) => tt.isActive !== false)
                          ?.currency || "USD"
                      }
                    />
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-zinc-400">—</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
