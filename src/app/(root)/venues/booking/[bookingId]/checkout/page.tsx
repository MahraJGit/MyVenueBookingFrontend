"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { CountdownTimer } from "@/components/venues/CountdownTimer";
import { Button } from "@/components/ui/button";
import {
  checkoutBooking,
  confirmCardPaymentIfNeeded,
  getBooking,
} from "@/features/bookings/api";
import { listPaymentMethods } from "@/features/payments/api";
import { bookingKeys } from "@/features/venues/query-keys";
import { formatInVenueTimezone } from "@/features/venues/timezone";
import { decimalToNumber, formatVenuePrice } from "@/features/venues/utils";
import { toastApiError } from "@/lib/toasts";

export default function VenueBookingCheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const router = useRouter();
  const [cardLabel, setCardLabel] = useState<string | null>(null);
  const [checkingCard, setCheckingCard] = useState(true);

  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: bookingKeys.detail(bookingId),
    queryFn: () => getBooking(bookingId),
  });

  useEffect(() => {
    listPaymentMethods()
      .then((methods) => {
        const def = methods.find((m) => m.isDefault) ?? methods[0];
        if (def) {
          const brand = def.brand ? def.brand.toUpperCase() : "Card";
          setCardLabel(`${brand} •••• ${def.last4}`);
        }
      })
      .catch(() => setCardLabel(null))
      .finally(() => setCheckingCard(false));
  }, []);

  const checkoutMut = useMutation({
    mutationFn: () => checkoutBooking(bookingId, {}),
    onSuccess: async (result) => {
      if (result.status === "requires_action") {
        try {
          await confirmCardPaymentIfNeeded(result.clientSecret);
          toast.success("Payment confirmed!");
          router.push(`/userDashboard/bookings/${bookingId}`);
        } catch (e) {
          toastApiError(e, "Payment authentication failed");
        }
        return;
      }
      toast.success("Booking confirmed!");
      router.push(`/userDashboard/bookings/${bookingId}`);
    },
    onError: (e) => toastApiError(e),
  });

  useEffect(() => {
    if (booking?.status === "CONFIRMED") {
      router.replace(`/userDashboard/bookings/${bookingId}`);
    }
  }, [booking?.status, bookingId, router]);

  if (isLoading || !booking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (booking.status === "CONFIRMED") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currency =
    (booking.pricingSnapshot as { currency?: string } | null)?.currency ?? "AED";
  const tz = booking.venue.timezone;

  return (
    <RoleGuard allowedRoles={["BUYER", "ADMIN"]}>
      <div className="container mx-auto max-w-lg px-4 pb-16 pt-28">
        <div className="space-y-6 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-6">
          <h1 className="text-2xl font-bold text-white">Complete your booking</h1>

          {booking.expiresAt && (
            <CountdownTimer expiresAt={booking.expiresAt} onExpire={() => refetch()} />
          )}

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Venue</dt>
              <dd className="text-white">{booking.venue.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">When</dt>
              <dd className="text-right text-white">
                {formatInVenueTimezone(booking.startTime, tz)}
                <br />
                to {formatInVenueTimezone(booking.endTime, tz)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-[#303030] pt-2">
              <dt className="font-medium text-white">Total</dt>
              <dd className="text-lg font-bold text-primary">
                {formatVenuePrice(decimalToNumber(booking.totalAmount), currency)}
              </dd>
            </div>
          </dl>

          {checkingCard ? (
            <p className="text-sm text-muted-foreground">Loading payment method...</p>
          ) : cardLabel ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" /> Pay with {cardLabel}
            </p>
          ) : (
            <p className="text-sm text-destructive">
              Add a payment method in your{" "}
              <Link href="/userDashboard/payment" className="text-primary underline">
                dashboard
              </Link>{" "}
              first.
            </p>
          )}

          <Button
            className="w-full bg-primary"
            disabled={checkoutMut.isPending || !cardLabel || booking.status !== "HOLD"}
            onClick={() => checkoutMut.mutate(undefined)}
          >
            {checkoutMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay now
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link href={`/venues/${booking.venueId}`}>Back to venue</Link>
          </Button>
        </div>
      </div>
    </RoleGuard>
  );
}
