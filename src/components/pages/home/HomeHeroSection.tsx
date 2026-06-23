"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Tag,
  Undo2,
} from "lucide-react";
import { listPublicEventCategories } from "@/features/event-categories/api";
import { listVenueTypes } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    description: "Encrypted payments & protected data",
  },
  {
    icon: Undo2,
    title: "Flexible refunds",
    description: "Eligible tickets refunded with ease",
  },
  {
    icon: Tag,
    title: "Smart deals",
    description: "Exclusive offers on top experiences",
  },
] as const;

export function HomeHeroSection() {
  const { data: eventCategories = [] } = useQuery({
    queryKey: ["public-event-categories", "hero"],
    queryFn: () => listPublicEventCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: venueTypes = [] } = useQuery({
    queryKey: venueKeys.types(),
    queryFn: listVenueTypes,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-glow hero-glow--left" aria-hidden />
      <div className="hero-glow hero-glow--right" aria-hidden />
      <div className="hero-grid" aria-hidden />

      <div className="hero-shell container relative z-10 mx-auto flex flex-1 flex-col px-4 sm:px-6 lg:px-8">
        <div className="inner flex flex-col items-center gap-8 sm:gap-10 md:gap-12">
          {/* Copy block */}
          <div className="description mx-auto max-w-4xl text-center">

            <h1
              id="hero-heading"
              className="hero-title mb-6 md:mb-8"
            >
              Book{" "}
              <span className="text-gradient-accent">Event Tickets</span>
              {" & "}
              <span className="text-gradient-accent">Venues</span>
              {" "}Online
            </h1>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#B3B3B3] md:text-lg">
              From sold-out concerts and championship sports to wedding halls and
              corporate spaces — discover what&apos;s on, compare options, and
              confirm your booking in minutes.
            </p>
          </div>

          {/* Trust row */}
          <ul className="hero-trust grid w-full max-w-4xl gap-3 sm:grid-cols-3 sm:gap-4">
            {TRUST_ITEMS.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="hero-trust-item flex items-start gap-3 rounded-xl border border-[#252525] bg-[#121212]/80 px-4 py-3.5 backdrop-blur-sm"
              >
                <span className="hero-trust-icon shrink-0">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[#7A7A7A]">
                    {description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
