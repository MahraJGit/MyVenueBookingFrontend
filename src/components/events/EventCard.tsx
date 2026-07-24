"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { PublicEvent } from "@/features/events/api";
import { EventCoverImage } from "@/components/events/EventCoverImage";
import { EventSaleBadge } from "@/components/events/EventSaleBadge";
import {
  computeEventSalePhase,
  formatCountdownToEnd,
  formatEventDate,
  getEventCountdownTargetIso,
  getMinTicketPrice,
} from "@/features/events/utils";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { getIntlLocale } from "@/i18n/locales";

type EventCardProps = {
  event: PublicEvent;
  href?: string;
  hideFavorite?: boolean;
};

export function EventCard({ event, href, hideFavorite }: EventCardProps) {
  const tEvents = useTranslations("events");
  const tCommon = useTranslations("common");
  const { locale } = useLocaleContext();
  const intlLocale = getIntlLocale(locale);
  const [countdown, setCountdown] = useState<string | null>(null);
  const salePhase = computeEventSalePhase(event);
  const minTicket = getMinTicketPrice(event);
  const location = [event.city, event.state].filter(Boolean).join(", ");
  const tags = (event.tags ?? []).filter((tag) => tag.trim()).slice(0, 3);
  const linkHref = href ?? `/events/${event.slug}`;

  useEffect(() => {
    const tick = () =>
      setCountdown(formatCountdownToEnd(getEventCountdownTargetIso(event)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [event]);

  return (
    <div className="card group relative flex h-full flex-col items-center">
      {!hideFavorite ? (
        <FavoriteButton
          type="event"
          id={event.id}
          className="absolute top-3 right-3 z-20"
        />
      ) : null}
      <Link
        href={linkHref}
        className="relative flex h-full w-full cursor-pointer flex-col items-center"
      >
        <EventCoverImage
          coverImage={event.coverImage}
          thumbnail={event.thumbnail}
          eventName={event.eventName}
          seed={event.id}
        />
        <div className="card-body relative z-0 -mt-10 flex w-full max-w-[92%] flex-1 flex-col rounded-2xl border border-[#303030] bg-[#1B1B1B] transition-all duration-300 ease-in-out group-hover:rounded-t-none">
          <div className="timer absolute -top-10 right-0 left-0 z-10 flex max-h-0 justify-between overflow-hidden rounded-t-2xl bg-[#850D06] px-4 py-2 opacity-0 transition-all duration-300 ease-in-out group-hover:visible group-hover:max-h-10 group-hover:opacity-100">
            <span>
              {salePhase === "not_started"
                ? tEvents("saleStartsIn")
                : tEvents("timeToEnd")}
            </span>
            <span>{countdown ?? "--:--:--"}</span>
          </div>
          <div className="flex h-full flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <h4 className="line-clamp-1 flex-1" dir="auto">
                {event.eventName}
              </h4>
              <EventSaleBadge phase={salePhase} />
            </div>

            <div className="flex h-6 min-h-6 flex-nowrap items-center gap-1.5 overflow-hidden">
              {event.category ? (
                <span
                  className="max-w-[45%] shrink-0 truncate rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                  dir="auto"
                >
                  {event.category}
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
                {formatEventDate(event.startDateTime, intlLocale, event.timezone)}
              </span>
              <span className="line-clamp-1 text-end text-xs" dir="auto">
                {location || "—"}
              </span>
            </div>
            <div className="price text-md mt-auto font-bold text-primary">
              {minTicket ? (
                <>
                  {tCommon("from")}{" "}
                  <span>
                    <DisplayPrice
                      amount={minTicket.price}
                      currency={minTicket.currency}
                    />
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-zinc-400">
                  {tEvents(getSalePhaseLabelKey(salePhase))}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function getSalePhaseLabelKey(phase: ReturnType<typeof computeEventSalePhase>) {
  switch (phase) {
    case "open":
      return "saleOpen";
    case "not_started":
      return "saleNotStarted";
    case "sold_out":
      return "soldOut";
    default:
      return "saleEnded";
  }
}
