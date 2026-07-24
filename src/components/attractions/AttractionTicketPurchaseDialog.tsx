"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Minus, Plus, Loader2, CreditCard, Ticket, Clock3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModalHeroBanner } from "@/components/ui/modal-hero-banner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { listPaymentMethods } from "@/features/payments/api";
import {
  checkoutAttractionTickets,
  completeAttractionTicketPurchase,
  confirmCardPaymentIfNeeded,
} from "@/features/attraction-ticket-purchases/api";
import { getPublicOccurrence } from "@/features/attractions/api";
import {
  getAttractionOccurrenceSeating,
  holdAttractionSeats,
  releaseAttractionSeats,
  type PublicSeat,
  type PublicSeatSection,
} from "@/features/attraction-seating/api";
import { SeatMap } from "@/components/seating/SeatMap";
import { ApiError } from "@/lib/api/errors";
import { toastApiError } from "@/lib/toasts";
import { toast } from "sonner";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { CheckoutPrice } from "@/components/currency/CheckoutPrice";
import { PlatformDisclaimer } from "@/components/legal/PlatformDisclaimer";
import { useDisplayPrice, useCurrency } from "@/features/currency/currency-context";

type AttractionTicketPurchaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occurrenceId: string;
  attractionName: string;
  coverImage?: string | null;
  seatingEnabled: boolean;
  onSuccess?: () => void;
};

type Quantities = Record<string, number>;

type SelectedSeat = {
  seat: PublicSeat;
  section: PublicSeatSection;
};

function ticketPrice(price: number | string) {
  const n = typeof price === "number" ? price : Number(price);
  return Number.isFinite(n) ? n : 0;
}

function formatHoldCountdown(expiresAt: string | null) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "0:00";
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function AttractionTicketPurchaseDialog({
  open,
  onOpenChange,
  occurrenceId,
  attractionName,
  coverImage,
  seatingEnabled,
  onSuccess,
}: AttractionTicketPurchaseDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tTicket = useTranslations("ticketPurchase");
  const tEvents = useTranslations("events");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isReady } = useAuth();
  const { formatChargePrice } = useCurrency();
  const [quantities, setQuantities] = React.useState<Quantities>({});
  const [selectedSeats, setSelectedSeats] = React.useState<SelectedSeat[]>([]);
  const [holdId, setHoldId] = React.useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = React.useState<string | null>(null);
  const [holding, setHolding] = React.useState(false);
  const [nowTick, setNowTick] = React.useState(0);
  const [checkingPayment, setCheckingPayment] = React.useState(false);
  const [purchasing, setPurchasing] = React.useState(false);
  const [paymentBlocked, setPaymentBlocked] = React.useState(false);
  const [defaultCardLabel, setDefaultCardLabel] = React.useState<string | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = React.useState(false);

  const occurrenceQuery = useQuery({
    queryKey: ["attraction-occurrence", occurrenceId],
    queryFn: () => getPublicOccurrence(occurrenceId),
    enabled: open && Boolean(occurrenceId),
  });

  const effectiveSeating =
    occurrenceQuery.data?.seatingEnabled ?? seatingEnabled;

  const seatingQuery = useQuery({
    queryKey: ["attraction-occurrence-seating", occurrenceId],
    queryFn: () => getAttractionOccurrenceSeating(occurrenceId),
    enabled: open && effectiveSeating,
    refetchInterval: open && effectiveSeating ? 15_000 : false,
  });

  const inventories = React.useMemo(
    () =>
      (occurrenceQuery.data?.inventories ?? []).filter(
        (inv) => inv.isActive !== false && inv.remaining > 0,
      ),
    [occurrenceQuery.data],
  );

  React.useEffect(() => {
    if (!open) {
      setQuantities({});
      setSelectedSeats([]);
      setHoldId(null);
      setHoldExpiresAt(null);
      setPaymentBlocked(false);
      setDefaultCardLabel(null);
      setDisclaimerAccepted(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!holdExpiresAt) return;
    const id = window.setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [holdExpiresAt]);

  React.useEffect(() => {
    if (!holdExpiresAt) return;
    if (new Date(holdExpiresAt).getTime() <= Date.now()) {
      setHoldId(null);
      setHoldExpiresAt(null);
      setSelectedSeats([]);
      toast.error("Your seat hold expired. Please select seats again.");
      void seatingQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowTick, holdExpiresAt]);

  React.useEffect(() => {
    if (!open || !isReady) return;
    if (!isAuthenticated) {
      setPaymentBlocked(true);
      return;
    }

    let cancelled = false;
    setCheckingPayment(true);
    void listPaymentMethods()
      .then((methods) => {
        if (cancelled) return;
        const defaultMethod = methods.find((m) => m.isDefault) ?? methods[0];
        if (!defaultMethod) {
          setPaymentBlocked(true);
          setDefaultCardLabel(null);
          return;
        }
        setPaymentBlocked(false);
        setDefaultCardLabel(
          `${defaultMethod.brand ?? "Card"} •••• ${defaultMethod.last4}`,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setPaymentBlocked(true);
          setDefaultCardLabel(null);
        }
      })
      .finally(() => {
        if (!cancelled) setCheckingPayment(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, isAuthenticated, isReady]);

  const lineItems = React.useMemo(() => {
    if (effectiveSeating) {
      const byType = new Map<
        string,
        { inventoryId: string; name: string; quantity: number; unitPrice: number; currency: string }
      >();
      for (const selected of selectedSeats) {
        const tt = selected.section.ticketType;
        const existing = byType.get(tt.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          byType.set(tt.id, {
            inventoryId: tt.id,
            name: tt.name,
            quantity: 1,
            unitPrice: ticketPrice(tt.price),
            currency: tt.currency,
          });
        }
      }
      return [...byType.values()];
    }

    return inventories
      .filter((inv) => (quantities[inv.id] ?? 0) > 0)
      .map((inv) => {
        const qty = quantities[inv.id] ?? 0;
        return {
          inventoryId: inv.id,
          name: inv.name,
          quantity: qty,
          unitPrice: ticketPrice(inv.price),
          currency: inv.currency || "USD",
        };
      });
  }, [effectiveSeating, selectedSeats, inventories, quantities]);

  const orderTotal = lineItems.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const currency = lineItems[0]?.currency ?? inventories[0]?.currency ?? "USD";
  const { formatted: chargeFormatted } = useDisplayPrice(orderTotal, currency);

  const setQty = (inventoryId: string, delta: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[inventoryId] ?? 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [inventoryId]: next };
    });
  };

  const handleToggleSeat = async (seat: PublicSeat, section: PublicSeatSection) => {
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirect}`);
      return;
    }

    const already = selectedSeats.some((s) => s.seat.id === seat.id);
    let nextSelected: SelectedSeat[];
    if (already) {
      nextSelected = selectedSeats.filter((s) => s.seat.id !== seat.id);
    } else {
      if (selectedSeats.length >= 10) {
        toast.error("You can select up to 10 seats per order.");
        return;
      }
      if (seat.status !== "available" && seat.status !== "held_by_me") {
        return;
      }
      nextSelected = [...selectedSeats, { seat, section }];
    }

    setSelectedSeats(nextSelected);
    const seatIds = nextSelected.map((s) => s.seat.id);

    if (seatIds.length === 0) {
      if (holdId) {
        void releaseAttractionSeats(occurrenceId, { holdId }).catch(() => undefined);
      }
      setHoldId(null);
      setHoldExpiresAt(null);
      void seatingQuery.refetch();
      return;
    }

    setHolding(true);
    try {
      if (holdId) {
        await releaseAttractionSeats(occurrenceId, { holdId }).catch(() => undefined);
      }
      const hold = await holdAttractionSeats(occurrenceId, seatIds);
      setHoldId(hold.holdId);
      setHoldExpiresAt(hold.expiresAt);
      void seatingQuery.refetch();
    } catch (err) {
      setSelectedSeats(selectedSeats);
      toastApiError(err);
      void seatingQuery.refetch();
    } finally {
      setHolding(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirect}`);
      return;
    }

    if (paymentBlocked) {
      toast.error(tTicket("addPaymentBeforePurchase"));
      return;
    }

    if (lineItems.length === 0) {
      toast.error(
        effectiveSeating ? "Select at least one seat." : tTicket("selectAtLeastOne"),
      );
      return;
    }

    if (effectiveSeating && !holdId) {
      toast.error("Please wait for your seats to be held, then try again.");
      return;
    }

    if (!disclaimerAccepted) return;

    setPurchasing(true);
    try {
      const result = await checkoutAttractionTickets(
        occurrenceId,
        effectiveSeating
          ? undefined
          : lineItems.map((l) => ({
              inventoryId: l.inventoryId,
              quantity: l.quantity,
            })),
        effectiveSeating ? selectedSeats.map((s) => s.seat.id) : undefined,
      );

      if (result.status === "requires_action") {
        await confirmCardPaymentIfNeeded(result.clientSecret);
        await completeAttractionTicketPurchase(
          result.orderGroupId,
          result.paymentIntentId,
        );
      }

      toast.success(tTicket("purchaseSuccess"), {
        description: tTicket("purchaseSuccessDesc"),
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        const code = (err as ApiError & { code?: string }).code;
        if (code === "PAYMENT_METHOD_REQUIRED") {
          setPaymentBlocked(true);
          toast.error(tTicket("addPaymentInDashboard"));
          return;
        }
        if (code === "HOLD_EXPIRED" || code === "SEAT_HELD" || code === "SEAT_SOLD") {
          setSelectedSeats([]);
          setHoldId(null);
          setHoldExpiresAt(null);
          void seatingQuery.refetch();
        }
      }
      toastApiError(err);
    } finally {
      setPurchasing(false);
    }
  };

  const holdCountdown = formatHoldCountdown(holdExpiresAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-zinc-800 bg-zinc-900 p-0 text-white sm:max-w-3xl"
        closeButtonClassName="rounded-full border border-white/20 bg-black/40 text-white opacity-100 backdrop-blur-md hover:bg-black/60 hover:opacity-100"
      >
        <DialogTitle className="sr-only">{tTicket("title")}</DialogTitle>

        <div className="flex-1 overflow-y-auto">
          <ModalHeroBanner
            src={coverImage?.trim() || "/images/card-img-2.jpg"}
            alt={attractionName}
            title={attractionName}
            gradientClassName="from-zinc-900 via-zinc-900/55"
          />

          {occurrenceQuery.isLoading ? (
            <p className="flex items-center gap-2 px-6 py-6 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tickets…
            </p>
          ) : effectiveSeating ? (
            <div className="relative z-10 space-y-4 px-6 pb-4 pt-2 sm:-mt-6">
              {seatingQuery.isLoading ? (
                <p className="flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading seating map…
                </p>
              ) : seatingQuery.isError ? (
                <p className="text-sm text-red-300">Could not load the seating map.</p>
              ) : (
                <SeatMap
                  sections={seatingQuery.data?.sections ?? []}
                  selectedIds={selectedSeats.map((s) => s.seat.id)}
                  onToggleSeat={(seat, section) => {
                    void handleToggleSeat(seat, section);
                  }}
                  disabled={purchasing || holding}
                />
              )}

              {selectedSeats.length > 0 ? (
                <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">
                      Selected: {selectedSeats.map((s) => s.seat.label).join(", ")}
                    </p>
                    {holdCountdown ? (
                      <p className="inline-flex items-center gap-1.5 text-amber-200">
                        <Clock3 className="h-3.5 w-3.5" />
                        Hold {holdCountdown}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : inventories.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-zinc-400">
              {tTicket("noTicketsAvailable")}
            </p>
          ) : (
            <ul className="relative z-10 -mt-8 space-y-4 px-6 sm:-mt-10">
              {inventories.map((inv) => {
                const max = inv.remaining;
                const qty = quantities[inv.id] ?? 0;
                const price = ticketPrice(inv.price);
                const ticketCurrency = inv.currency || currency;

                return (
                  <li
                    key={inv.id}
                    className="rounded-xl border border-zinc-700 bg-zinc-800 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <Ticket className="h-4 w-4 text-primary" />
                          {inv.name}
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">
                          {tTicket("eachLeft", {
                            price: formatChargePrice(price, ticketCurrency),
                            count: max,
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        <DisplayPrice amount={price * qty} currency={ticketCurrency} />
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">{tEvents("quantity")}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-zinc-600"
                          disabled={qty <= 0 || purchasing}
                          onClick={() => setQty(inv.id, -1, max)}
                          aria-label={tTicket("decreaseQuantity", { name: inv.name })}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{qty}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-zinc-600"
                          disabled={qty >= max || purchasing}
                          onClick={() => setQty(inv.id, 1, max)}
                          aria-label={tTicket("increaseQuantity", { name: inv.name })}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {(effectiveSeating || inventories.length > 0) && (
            <div className="space-y-4 px-6 pb-6 pt-4">
              <div className="border-t border-zinc-700 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-lg font-semibold">{tCommon("total")}</span>
                  <CheckoutPrice
                    amount={orderTotal}
                    currency={currency}
                    chargeLabel="event"
                    amountClassName="text-lg"
                  />
                </div>
              </div>

              {checkingPayment ? (
                <p className="flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tTicket("checkingPayment")}
                </p>
              ) : paymentBlocked ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  <p className="text-amber-200">{tTicket("paymentRequired")}</p>
                  <Button asChild variant="link" className="mt-1 h-auto p-0 text-primary">
                    <Link href="/userDashboard/payment">{tTicket("addPaymentMethod")}</Link>
                  </Button>
                </div>
              ) : defaultCardLabel ? (
                <p className="flex items-center gap-2 text-sm text-zinc-400">
                  <CreditCard className="h-4 w-4 text-primary" />
                  {tTicket("payWith", { card: defaultCardLabel })}
                </p>
              ) : null}

              <PlatformDisclaimer
                accepted={disclaimerAccepted}
                onAcceptedChange={setDisclaimerAccepted}
              />

              <Button
                className="w-full bg-pink-500 hover:bg-pink-600"
                disabled={
                  purchasing ||
                  holding ||
                  checkingPayment ||
                  paymentBlocked ||
                  lineItems.length === 0 ||
                  !disclaimerAccepted
                }
                onClick={() => void handlePurchase()}
              >
                {purchasing || holding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {holding ? "Holding seats…" : tTicket("processing")}
                  </>
                ) : (
                  tTicket("payAmount", { amount: chargeFormatted })
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
