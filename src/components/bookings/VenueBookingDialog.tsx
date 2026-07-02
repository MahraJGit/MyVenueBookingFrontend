"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AmenityPicker,
  selectionsToPayload,
  type AmenitySelection,
} from "@/components/venues/AmenityPicker";
import { createHold } from "@/features/bookings/api";
import type { PublicVenue } from "@/features/venues/types";
import { slotRangeToUtc } from "@/features/venues/timezone";
import { useAuth } from "@/features/auth/auth-context";
import { toastApiError } from "@/lib/toasts";

type VenueBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue: PublicVenue;
  dateStr: string;
  slot: { startTime: string; endTime: string };
};

export function VenueBookingDialog({
  open,
  onOpenChange,
  venue,
  dateStr,
  slot,
}: VenueBookingDialogProps) {
  const router = useRouter();
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isReady } = useAuth();

  const [numGuests, setNumGuests] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [amenitySelections, setAmenitySelections] = useState<AmenitySelection[]>([]);

  const holdMut = useMutation({
    mutationFn: async () => {
      const range = slotRangeToUtc(
        dateStr,
        slot.startTime,
        slot.endTime,
        venue.timezone,
      );
      return createHold({
        venueId: venue.id,
        startTime: range.startTime,
        endTime: range.endTime,
        numGuests: numGuests ? Number(numGuests) : undefined,
        specialRequests: specialRequests || undefined,
        bookingAmenities: selectionsToPayload(amenitySelections),
      });
    },
    onSuccess: (booking) => {
      toast.success(t("slotReserved"));
      onOpenChange(false);
      router.push(`/venues/booking/${booking.id}/checkout`);
    },
    onError: (e) => toastApiError(e),
  });

  const handleSubmit = () => {
    if (!isReady || !isAuthenticated) {
      toast.error(t("loginToBook"));
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    holdMut.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#303030] bg-[#1B1B1B] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("bookVenue", { name: venue.name })}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {dateStr} · {slot.startTime} – {slot.endTime} ({venue.timezone})
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("numberOfGuests")}</Label>
            <Input
              type="number"
              min={1}
              value={numGuests}
              onChange={(e) => setNumGuests(e.target.value)}
              className="border-[#303030] bg-black"
              placeholder={
                venue.capacityMax
                  ? t("maxGuests", { max: venue.capacityMax })
                  : tCommon("optional")
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t("specialRequests")}</Label>
            <Textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="border-[#303030] bg-black min-h-20"
            />
          </div>

          {(venue.amenities?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <Label>{t("addOns")}</Label>
              <AmenityPicker
                amenities={venue.amenities ?? []}
                selections={amenitySelections}
                onChange={setAmenitySelections}
                currency={venue.pricing?.currency ?? "AED"}
              />
            </div>
          )}

          <Button
            className="w-full bg-primary"
            onClick={handleSubmit}
            disabled={holdMut.isPending}
          >
            {holdMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("reserveAndCheckout")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
