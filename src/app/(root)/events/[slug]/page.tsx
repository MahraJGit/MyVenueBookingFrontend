"use client";

import { useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { CalendarDays, Clock, MapPin, Phone, Globe, Share2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { getPublicEventBySlug, type PublicEvent } from "@/features/events/api";
import { formatEventDate } from "@/features/events/utils";
import {
  TicketPurchaseDialog,
  openTicketPurchaseFlow,
} from "@/components/events/ticket-purchase-dialog";
import { getAccessToken } from "@/features/auth/session-storage";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function TicketProgress({ sold, total }: { sold: number; total: number }) {
  const percent = total > 0 ? (sold / total) * 100 : 0;
  const available = total - sold;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">Total Quantity</span>
        <span className="font-semibold text-white">{total}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">Sold</span>
        <span className="font-semibold text-primary">{sold}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">Available</span>
        <span className="font-semibold text-white">{available}</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500 text-right">{percent.toFixed(1)}% Sold</p>
    </div>
  );
}

function EventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      <div className="h-[400px] bg-zinc-900 animate-pulse" />
      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="h-8 w-64 bg-zinc-800 animate-pulse rounded" />
        <div className="h-40 bg-zinc-800 animate-pulse rounded" />
        <div className="h-60 bg-zinc-800 animate-pulse rounded" />
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);

  const { data: event, isLoading, isError, error } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: () => getPublicEventBySlug(slug),
    enabled: Boolean(slug),
  });

  if (isLoading) return <EventDetailSkeleton />;

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="text-zinc-400">
            {error instanceof Error ? error.message : "The event you are looking for does not exist."}
          </p>
        </div>
      </div>
    );
  }

  const coverUrl = event.coverImage?.trim() || "/images/card-img-2.jpg";
  const galleryImages = event.gallery?.length ? event.gallery : [];
  const hasGallery = galleryImages.length > 0;
  const fullAddress = [event.address, event.city, event.state, event.zipCode]
    .filter(Boolean)
    .join(", ");
  const lat = Number(event.latitude);
  const lng = Number(event.longitude);
  const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0);
  const mapEmbedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : null;
  const ticketPrice = (price: number | string) => {
    const n = typeof price === "number" ? price : Number(price);
    return n.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      {/* Hero / Cover */}
      <section className="relative h-[420px] md:h-[520px] overflow-hidden">
        <Image
          src={coverUrl}
          alt={event.eventName}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/50 to-transparent" />

        {/* Share button — top right */}
        <button
          className="absolute top-6 right-6 z-10 p-2.5 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm hover:border-primary transition-colors"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: event.eventName, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
        >
          <Share2 size={18} />
        </button>

        {/* Centered content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-[0.15em] uppercase mb-8">
            {event.eventName}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-300">
            <span className="flex items-center gap-2">
              <CalendarDays size={16} className="text-primary" />
              {formatEventDate(event.startDateTime)}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              {event.venueName || event.city}...
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
            </span>
            {event.category && (
              <span className="flex items-center gap-2">
                <Ticket size={16} className="text-primary" />
                {event.category}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Gallery Slider */}
      {hasGallery && (
        <section className="container mx-auto px-4 -mt-4 relative z-10">
          <Carousel opts={{ loop: true, align: "start" }} className="w-full">
            <CarouselContent className="-ml-3">
              {galleryImages.map((img, i) => (
                <CarouselItem key={i} className="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4">
                  <div className="relative h-[120px] md:h-[150px] rounded-xl overflow-hidden">
                    <Image
                      src={img}
                      alt={`Gallery ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 h-9 w-9 border-white/20 bg-black/60 text-white hover:bg-black/80 hover:text-white" />
            <CarouselNext className="right-2 h-9 w-9 border-white/20 bg-black/60 text-white hover:bg-black/80 hover:text-white" />
          </Carousel>
        </section>
      )}

      {/* Event Description */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-primary mb-6">Event Description</h2>
        <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed whitespace-pre-line">
          {event.eventDescription || "No description provided."}
        </div>
      </section>

      {/* Venue Information */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-primary mb-8">Venue Information</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Venue Details Card */}
          <div className="bg-[#1B1B1B] border border-[#303030] rounded-2xl p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {event.venueName || event.eventName}
              </h3>
              <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                <MapPin size={14} /> {event.city}{event.state ? `, ${event.state}` : ""}
              </p>
            </div>

            <div className="border-t border-[#303030] pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-white">Contact Details</h4>

              {event.venuePhone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Phone size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Phone</p>
                    <p className="text-sm text-white">{event.venuePhone}</p>
                  </div>
                </div>
              )}

              {event.venueWebsite && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Globe size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Website</p>
                    <a
                      href={event.venueWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {event.venueWebsite}
                    </a>
                  </div>
                </div>
              )}

              {fullAddress && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <MapPin size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Address</p>
                    <p className="text-sm text-white">{fullAddress}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="bg-[#1B1B1B] border border-[#303030] rounded-2xl overflow-hidden flex flex-col">
            <div className="px-6 pt-4 pb-2">
              <h4 className="text-sm font-semibold text-white">Location Map</h4>
            </div>
            <div className="flex-1 min-h-[280px] relative">
              {mapEmbedUrl ? (
                <iframe
                  src={mapEmbedUrl}
                  className="w-full h-full min-h-[280px] border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Event Location"
                />
              ) : (
                <div className="w-full h-full min-h-[280px] flex items-center justify-center text-zinc-500">
                  <MapPin size={32} className="mr-2" />
                  <span>Map not available</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tags */}
      {event.tags?.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-primary mb-6">Tags</h2>
          <div className="flex flex-wrap gap-3">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="text-sm py-2 px-5 rounded-full border border-[#303030] bg-[#1B1B1B] text-zinc-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Tickets */}
      {event.ticketTypes?.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-primary mb-8">Tickets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {event.ticketTypes.map((t) => {
              const sold = t.quantitySold ?? 0;
              const total = t.quantityTotal;
              return (
                <div
                  key={t.id ?? t.name}
                  className="bg-[#1B1B1B] border border-[#303030] rounded-2xl p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket size={18} className="text-primary" />
                      <h4 className="font-semibold text-white">{t.name}</h4>
                    </div>
                    <span className="text-sm font-bold text-primary border border-primary rounded-full px-3 py-0.5">
                      ${ticketPrice(t.price)}
                    </span>
                  </div>
                  <TicketProgress sold={sold} total={total} />
                </div>
              );
            })}
          </div>

          {/* Get Tickets CTA */}
          <div className="bg-[#1B1B1B] border border-[#303030] rounded-2xl p-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Ticket size={18} className="text-primary" />
              <h4 className="font-semibold text-white">Tickets</h4>
            </div>
            <p className="text-sm text-zinc-400">
              Tickets available at the box office and online
            </p>
            <Button
              variant="outline"
              size="lg"
              className="mt-2 border-primary text-primary hover:bg-primary hover:text-white rounded-full px-10"
              onClick={() =>
                openTicketPurchaseFlow({
                  isAuthenticated: Boolean(getAccessToken()),
                  pathname: pathname ?? `/events/${slug}`,
                  slug: slug ?? "",
                  onOpen: () => setTicketDialogOpen(true),
                  router,
                })
              }
            >
              Get Tickets
            </Button>
            <TicketPurchaseDialog
              open={ticketDialogOpen}
              onOpenChange={setTicketDialogOpen}
              event={event}
              onPurchaseSuccess={() => {
                void queryClient.invalidateQueries({ queryKey: ["public-event", slug] });
              }}
            />
          </div>
        </section>
      )}
    </div>
  );
}
