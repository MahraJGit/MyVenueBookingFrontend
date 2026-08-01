"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { MarketplaceCoverImage } from "@/components/marketplace/MarketplaceCoverImage";
import type { PublicMarketplaceService } from "@/features/marketplace/types";
import {
  getServiceFromPrice,
  servicePricingModelLabel,
} from "@/features/marketplace/utils";

type Props = { service: PublicMarketplaceService };

export function MarketplaceServiceCard({ service }: Props) {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const price = getServiceFromPrice(service);
  const location =
    service.baseCity ||
    (service.citiesServed && service.citiesServed.length
      ? service.citiesServed.slice(0, 2).join(", ")
      : null);

  return (
    <div className="card group relative flex h-full flex-col items-center">
      <Link
        href={`/marketplace/${encodeURIComponent(service.slug)}`}
        className="relative flex h-full w-full cursor-pointer flex-col items-center"
      >
        <MarketplaceCoverImage
          coverImage={service.coverImage}
          serviceTitle={service.title}
          seed={service.id}
        />
        <div className="card-body relative z-0 -mt-10 flex w-full max-w-[92%] flex-1 flex-col rounded-2xl border border-[#303030] bg-[#1B1B1B] transition-all duration-300 ease-in-out">
          <div className="flex h-full flex-col gap-3 p-4">
            <h4 className="line-clamp-1" dir="auto">
              {service.title}
            </h4>

            <div className="flex h-6 min-h-6 flex-nowrap items-center gap-1.5 overflow-hidden">
              {service.category?.name ? (
                <span
                  className="max-w-[55%] shrink-0 truncate rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                  dir="auto"
                >
                  {service.category.name}
                </span>
              ) : null}
              <span className="shrink-0 truncate rounded-full border border-[#303030] bg-[#242424] px-2 py-0.5 text-[11px] text-[#B3B3B3]">
                {servicePricingModelLabel(service.pricingModel)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="line-clamp-1 text-xs text-[#B3B3B3]" dir="auto">
                {service.vendor?.vendorName || t("vendorFallback")}
              </span>
              <span className="line-clamp-1 text-end text-xs" dir="auto">
                {location || "—"}
              </span>
            </div>

            <div className="price text-md mt-auto font-bold text-primary">
              {price.amount != null ? (
                <>
                  {tCommon("from")}{" "}
                  <span>
                    <DisplayPrice
                      amount={price.amount}
                      currency={price.currency}
                    />
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-zinc-400">
                  {t("priceOnRequest")}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
