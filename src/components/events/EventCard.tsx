"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicEvent } from "@/features/events/api";
import { EventCoverImage } from "@/components/events/EventCoverImage";
import {
  formatCountdownToEnd,
  formatEventDate,
  formatTicketPrice,
  getMinTicketPrice,
} from "@/features/events/utils";

type EventCardProps = {
  event: PublicEvent;
};

export function EventCard({ event }: EventCardProps) {
  const [countdown, setCountdown] = useState(() =>
    formatCountdownToEnd(event.endDateTime),
  );
  const minTicket = getMinTicketPrice(event);
  const location = [event.city, event.state].filter(Boolean).join(", ");

  useEffect(() => {
    const tick = () => setCountdown(formatCountdownToEnd(event.endDateTime));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [event.endDateTime]);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="card group relative flex h-full cursor-pointer flex-col items-center"
    >
      <EventCoverImage
        coverImage={event.coverImage}
        thumbnail={event.thumbnail}
        eventName={event.eventName}
        seed={event.id}
      />
      <div className="card-body relative z-0 -mt-10 flex w-full max-w-[92%] flex-1 flex-col rounded-2xl border border-[#303030] bg-[#1B1B1B] transition-all duration-300 ease-in-out group-hover:rounded-t-none">
        <div className="timer flex justify-between bg-[#850D06] rounded-t-2xl py-2 px-4 opacity-0 group-hover:opacity-100 visibility-hidden group-hover:visible max-h-0 group-hover:max-h-10 overflow-hidden absolute -top-10 left-0 right-0 z-10 transition-all duration-300 ease-in-out">
          <span>Time to end</span>
          <span>{countdown}</span>
        </div>
        <div className="flex h-full flex-col gap-4 p-4">
          <h4 className="line-clamp-1">{event.eventName}</h4>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs">{formatEventDate(event.startDateTime)}</span>
            <span className="line-clamp-1 text-right text-xs">{location || "—"}</span>
          </div>
          <div className="price text-md mt-auto font-bold text-primary">
            {minTicket ? (
              <>
                from{" "}
                <span>
                  {formatTicketPrice(minTicket.price, minTicket.currency)}
                </span>
              </>
            ) : (
              <span>Tickets coming soon</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
