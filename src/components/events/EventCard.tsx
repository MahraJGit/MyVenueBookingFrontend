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
      className="card flex flex-col items-center group relative cursor-pointer"
    >
      <EventCoverImage
        coverImage={event.coverImage}
        thumbnail={event.thumbnail}
        eventName={event.eventName}
        seed={event.id}
      />
      <div className="card-body max-w-[92%] w-full border border-[#303030] rounded-2xl bg-[#1B1B1B] -mt-10 relative z-0 group-hover:rounded-t-none transition-all duration-300 ease-in-out">
        <div className="timer flex justify-between bg-[#850D06] rounded-t-2xl py-2 px-4 opacity-0 group-hover:opacity-100 visibility-hidden group-hover:visible max-h-0 group-hover:max-h-10 overflow-hidden absolute -top-10 left-0 right-0 z-10 transition-all duration-300 ease-in-out">
          <span>Time to end</span>
          <span>{countdown}</span>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <h4>{event.eventName}</h4>
          <div className="flex justify-between items-center">
            <span className="text-xs">{formatEventDate(event.startDateTime)}</span>
            <span className="text-xs">{location || "—"}</span>
          </div>
          <div className="price text-md font-bold text-primary">
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
