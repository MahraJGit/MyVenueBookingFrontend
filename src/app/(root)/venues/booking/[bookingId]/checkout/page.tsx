"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { CountdownTimer } from "@/components/venues/CountdownTimer";
import { AddCardForm } from "@/components/payments/add-card-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  checkoutBooking,
  completeBookingCheckout,
  confirmCardPaymentIfNeeded,
  getBooking,
} from "@/features/bookings/api";
import type { Booking } from "@/features/bookings/types";
import { listPaymentMethods, type SavedPaymentMethod } from "@/features/payments/api";
import { bookingKeys } from "@/features/venues/query-keys";
import { useAuth } from "@/features/auth/auth-context";
import { formatInVenueTimezone } from "@/features/venues/timezone";
import { decimalToNumber } from "@/features/venues/utils";
import { CheckoutPrice } from "@/components/currency/CheckoutPrice";
import { BookingLineItems } from "@/components/bookings/BookingLineItems";
import { PlatformDisclaimer } from "@/components/legal/PlatformDisclaimer";
import { useDisplayPrice } from "@/features/currency/currency-context";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { ApiError } from "@/lib/api/errors";
import { toastApiError } from "@/lib/toasts";

const PAYMENT_METHODS_KEY = ["payment-methods"] as const;

function formatCardBrand(brand: string | null, fallback: string) {
  if (!brand) return fallback;
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function pickDefaultMethod(methods: SavedPaymentMethod[]) {
  return methods.find((m) => m.isDefault) ?? methods[0] ?? null;
}

export default function VenueBookingCheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const tVenueCheckout = useTranslations("venueCheckout");
  const tBooking = useTranslations("booking");
  const tCheckout = useTranslations("checkout");
  const tUserDashboard = useTranslations("userDashboard");
  const tCommon = useTranslations("common");
  const { user, isAuthenticated, isReady } = useAuth();
  const { locale } = useLocaleContext();

  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: bookingKeys.detail(user?.id, bookingId),
    queryFn: () => getBooking(bookingId),
    enabled: isAuthenticated && isReady && !!user?.id,
    refetchOnMount: "always",
  });

  const {
    data: paymentMethods = [],
    isLoading: checkingCard,
    refetch: refetchPaymentMethods,
  } = useQuery({
    queryKey: PAYMENT_METHODS_KEY,
    queryFn: listPaymentMethods,
    refetchOnWindowFocus: true,
  });

  const selectedMethod = pickDefaultMethod(paymentMethods);

  const syncBookingCache = async (confirmed: Booking) => {
    if (!user?.id) return;
    queryClient.setQueryData(bookingKeys.detail(user.id, bookingId), confirmed);
    await queryClient.invalidateQueries({ queryKey: bookingKeys.all });
  };

  const checkoutMut = useMutation({
    mutationFn: () =>
      checkoutBooking(bookingId, {
        paymentMethodId: selectedMethod?.stripePaymentMethodId,
      }),
    onSuccess: async (result) => {
      if (result.status === "requires_action") {
        try {
          const paymentIntentId = await confirmCardPaymentIfNeeded(result.clientSecret);
          const completed = await completeBookingCheckout(bookingId, paymentIntentId);
          await syncBookingCache(completed.booking);
          toast.success(tVenueCheckout("paymentConfirmed"));
          router.push(`/userDashboard/bookings/${bookingId}`);
        } catch (e) {
          toastApiError(e, tVenueCheckout("paymentAuthFailed"));
        }
        return;
      }
      await syncBookingCache(result.booking);
      toast.success(tBooking("bookingConfirmed"));
      router.push(`/userDashboard/bookings/${bookingId}`);
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        const code = (e as ApiError & { code?: string }).code;
        if (code === "PAYMENT_METHOD_REQUIRED") {
          void refetchPaymentMethods();
          toast.error(tVenueCheckout("addPaymentToContinue"));
          return;
        }
      }
      toastApiError(e);
    },
  });

  useEffect(() => {
    if (booking?.status === "CONFIRMED") {
      router.replace(`/userDashboard/bookings/${bookingId}`);
    }
  }, [booking?.status, bookingId, router]);

  const handleCardAdded = () => {
    void queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEY }).then(() => {
      void refetchPaymentMethods();
    });
  };

  const currency =
    (booking?.pricingSnapshot as { currency?: string } | null)?.currency ?? "AED";
  const totalAmount = decimalToNumber(booking?.totalAmount ?? 0);
  const { chargeFormatted } = useDisplayPrice(totalAmount, currency);

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

  const tz = booking.venue.timezone;
  const canPay = Boolean(selectedMethod) && booking.status === "HOLD";

  return (
    <RoleGuard allowedRoles={["BUYER", "VENDOR", "ADMIN"]}>
      <div className="container mx-auto max-w-6xl px-4 pb-16 pt-28">
        <div className="mb-6">
          <Link
            href={`/venues/${booking.venueId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {tVenueCheckout("backToVenue")}
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/40">
          <div className="border-b border-zinc-800 bg-linear-to-r from-zinc-900 via-zinc-900 to-zinc-800/80 px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  {tVenueCheckout("secureCheckout")}
                </p>
                <h1 className="mt-1 text-xl font-bold text-white sm:text-3xl">
                  {tVenueCheckout("completeBooking")}
                </h1>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {tVenueCheckout("completeBookingDesc")}
                </p>
              </div>
              {booking.expiresAt ? (
                <CountdownTimer
                  expiresAt={booking.expiresAt}
                  onExpire={() => refetch()}
                  className="shrink-0 border-amber-500/30 bg-amber-500/10"
                />
              ) : null}
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {tVenueCheckout("bookingSummary")}
              </h2>

              <div className="flex gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                  {booking.venue.coverImage ? (
                    <Image
                      src={booking.venue.coverImage}
                      alt={booking.venue.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-500">
                      <MapPin className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="font-semibold text-white">{booking.venue.name}</p>
                    {booking.venue.address ? (
                      <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {booking.venue.address}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-start gap-2 text-sm text-zinc-300">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p>{formatInVenueTimezone(booking.startTime, tz, locale)}</p>
                      <p className="text-muted-foreground">
                        {tVenueCheckout("toTime", {
                          time: formatInVenueTimezone(booking.endTime, tz, locale),
                        })}
                      </p>
                    </div>
                  </div>

                  {booking.numGuests ? (
                    <p className="text-sm text-muted-foreground">
                      {booking.numGuests}{" "}
                      {booking.numGuests !== 1 ? tCommon("guests") : tCommon("guest")}
                    </p>
                  ) : null}
                </div>
              </div>

              <BookingLineItems
                booking={booking}
                className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
              />
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {tCheckout("paymentMethod")}
                </h2>
                <AddCardDialog onSuccess={handleCardAdded} />
              </div>

              {checkingCard ? (
                <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tUserDashboard("loadingCards")}
                </div>
              ) : selectedMethod ? (
                <div className="flex items-center justify-between rounded-xl border border-zinc-700 bg-linear-to-r from-zinc-900 to-zinc-800/80 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {formatCardBrand(selectedMethod.brand, tVenueCheckout("cardFallback"))} ••••{" "}
                        {selectedMethod.last4}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tUserDashboard("expires")}{" "}
                        {String(selectedMethod.expMonth).padStart(2, "0")}/
                        {String(selectedMethod.expYear).slice(-2)}
                        {selectedMethod.isDefault ? tUserDashboard("defaultSuffix") : ""}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/userDashboard/payment"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {tVenueCheckout("manage")}
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 px-4 py-6 text-center">
                  <CreditCard className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-white">
                    {tVenueCheckout("noPaymentMethod")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tVenueCheckout("addCardToBook")}
                  </p>
                  <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                    <AddCardDialog onSuccess={handleCardAdded} variant="button" />
                    <Button asChild variant="outline" size="sm" className="border-zinc-700">
                      <Link href="/userDashboard/payment">
                        {tVenueCheckout("goToPaymentSettings")}
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <span className="text-base font-medium text-white">
                  {tVenueCheckout("totalDue")}
                </span>
                <CheckoutPrice
                  amount={totalAmount}
                  currency={currency}
                  className="text-right"
                  amountClassName="text-xl"
                />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                {tVenueCheckout("stripeSecure")}
              </p>
            </section>

            <div className="space-y-3 pt-2">
              <PlatformDisclaimer />
              <Button
                className="h-12 w-full bg-primary text-base font-semibold hover:bg-primary/90"
                disabled={checkoutMut.isPending || !canPay}
                onClick={() => checkoutMut.mutate(undefined)}
              >
                {checkoutMut.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tCheckout("processing")}
                  </>
                ) : (
                  tVenueCheckout("payAmount", { amount: chargeFormatted })
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {tVenueCheckout("agreePolicies")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

function AddCardDialog({
  onSuccess,
  variant = "link",
}: {
  onSuccess: () => void;
  variant?: "link" | "button";
}) {
  const [open, setOpen] = useState(false);
  const tUserDashboard = useTranslations("userDashboard");

  const handleSuccess = () => {
    setOpen(false);
    onSuccess();
  };

  return (
    <>
      {variant === "button" ? (
        <Button
          type="button"
          size="sm"
          className="bg-primary hover:bg-primary/90"
          onClick={() => setOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {tUserDashboard("addCard")}
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          {tUserDashboard("addCard")}
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tUserDashboard("addPaymentMethod")}</DialogTitle>
          </DialogHeader>
          {open ? (
            <AddCardForm onSuccess={handleSuccess} onCancel={() => setOpen(false)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
