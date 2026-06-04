"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Minus, Plus, Loader2, CreditCard, Ticket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/features/auth/session-storage";
import { listPaymentMethods } from "@/features/payments/api";
import {
  checkoutTickets,
  completeTicketPurchase,
  confirmCardPaymentIfNeeded,
} from "@/features/ticket-purchases/api";
import type { PublicEvent, TicketTypeRow } from "@/features/events/api";
import { ApiError } from "@/lib/api/errors";
import { toastApiError } from "@/lib/toasts";
import { toast } from "sonner";

type TicketPurchaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: PublicEvent;
  onPurchaseSuccess?: () => void;
};

type Quantities = Record<string, number>;

function ticketPrice(price: number | string) {
  const n = typeof price === "number" ? price : Number(price);
  return Number.isFinite(n) ? n : 0;
}

function availableCount(t: TicketTypeRow) {
  const sold = t.quantitySold ?? 0;
  return Math.max(0, t.quantityTotal - sold);
}

export function TicketPurchaseDialog({
  open,
  onOpenChange,
  event,
  onPurchaseSuccess,
}: TicketPurchaseDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [quantities, setQuantities] = React.useState<Quantities>({});
  const [checkingPayment, setCheckingPayment] = React.useState(false);
  const [purchasing, setPurchasing] = React.useState(false);
  const [paymentBlocked, setPaymentBlocked] = React.useState(false);
  const [defaultCardLabel, setDefaultCardLabel] = React.useState<string | null>(null);

  const ticketTypes = React.useMemo(
    () => (event.ticketTypes ?? []).filter((t) => t.id && availableCount(t) > 0),
    [event.ticketTypes],
  );

  React.useEffect(() => {
    if (!open) {
      setQuantities({});
      setPaymentBlocked(false);
      setDefaultCardLabel(null);
      return;
    }

    const initial: Quantities = {};
    for (const t of ticketTypes) {
      if (t.id) initial[t.id] = 0;
    }
    setQuantities(initial);
  }, [open, ticketTypes]);

  React.useEffect(() => {
    if (!open || !getAccessToken()) return;

    let cancelled = false;
    setCheckingPayment(true);

    listPaymentMethods()
      .then((methods) => {
        if (cancelled) return;
        const def = methods.find((m) => m.isDefault) ?? methods[0];
        if (!def) {
          setPaymentBlocked(true);
          setDefaultCardLabel(null);
        } else {
          setPaymentBlocked(false);
          const brand = def.brand ? def.brand.toUpperCase() : "Card";
          setDefaultCardLabel(`${brand} •••• ${def.last4}`);
        }
      })
      .catch(() => {
        if (!cancelled) setPaymentBlocked(true);
      })
      .finally(() => {
        if (!cancelled) setCheckingPayment(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const lineItems = React.useMemo(() => {
    return ticketTypes
      .filter((t) => t.id && (quantities[t.id] ?? 0) > 0)
      .map((t) => {
        const qty = quantities[t.id!] ?? 0;
        const price = ticketPrice(t.price);
        return {
          ticketTypeId: t.id!,
          name: t.name,
          quantity: qty,
          unitPrice: price,
          subtotal: price * qty,
          currency: t.currency,
          available: availableCount(t),
        };
      });
  }, [ticketTypes, quantities]);

  const orderTotal = lineItems.reduce((sum, l) => sum + l.subtotal, 0);
  const currency = lineItems[0]?.currency ?? ticketTypes[0]?.currency ?? "USD";

  const setQty = (ticketTypeId: string, delta: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[ticketTypeId] ?? 0;
      const next = Math.min(max, Math.max(0, current + delta));
      return { ...prev, [ticketTypeId]: next };
    });
  };

  const handlePurchase = async () => {
    if (!getAccessToken()) {
      const redirect = encodeURIComponent(pathname || `/events/${event.slug}`);
      router.push(`/login?redirect=${redirect}`);
      return;
    }

    if (paymentBlocked) {
      toast.error("Add a payment method before purchasing tickets.");
      return;
    }

    if (lineItems.length === 0) {
      toast.error("Select at least one ticket.");
      return;
    }

    setPurchasing(true);
    try {
      const result = await checkoutTickets(
        event.id,
        lineItems.map((l) => ({
          ticketTypeId: l.ticketTypeId,
          quantity: l.quantity,
        })),
      );

      if (result.status === "requires_action") {
        await confirmCardPaymentIfNeeded(result.clientSecret);
        await completeTicketPurchase(result.orderGroupId, result.paymentIntentId);
      }

      toast.success("Tickets purchased successfully!", {
        description:
          "A confirmation email has been sent to you. The event organizer was notified as well.",
      });
      onOpenChange(false);
      onPurchaseSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        const code = (err as ApiError & { code?: string }).code;
        if (code === "PAYMENT_METHOD_REQUIRED") {
          setPaymentBlocked(true);
          toast.error("Add a payment method in your dashboard to continue.");
          return;
        }
      }
      toastApiError(err);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Get tickets</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {event.eventName}
            </DialogDescription>
          </DialogHeader>

          {ticketTypes.length === 0 ? (
            <p className="text-sm text-zinc-400">No tickets are currently available.</p>
          ) : (
            <div className="space-y-4">
              <ul className="space-y-4">
                {ticketTypes.map((t) => {
                  const id = t.id!;
                  const max = availableCount(t);
                  const qty = quantities[id] ?? 0;
                  const price = ticketPrice(t.price);

                  return (
                    <li
                      key={id}
                      className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            <Ticket className="h-4 w-4 text-primary" />
                            {t.name}
                          </div>
                          <p className="mt-1 text-sm text-zinc-400">
                            {t.currency} {price.toFixed(2)} each · {max} left
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {t.currency} {(price * qty).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-zinc-500">Quantity</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-zinc-600"
                            disabled={qty <= 0 || purchasing}
                            onClick={() => setQty(id, -1, max)}
                            aria-label={`Decrease ${t.name}`}
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
                            onClick={() => setQty(id, 1, max)}
                            aria-label={`Increase ${t.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-zinc-700 pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">
                    {currency} {orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {checkingPayment ? (
                <p className="flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking payment method…
                </p>
              ) : paymentBlocked ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  <p className="text-amber-200">
                    You need a saved payment method before you can purchase tickets.
                  </p>
                  <Button asChild variant="link" className="mt-1 h-auto p-0 text-primary">
                    <Link href="/userDashboard/payment">Add payment method</Link>
                  </Button>
                </div>
              ) : defaultCardLabel ? (
                <p className="flex items-center gap-2 text-sm text-zinc-400">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Pay with {defaultCardLabel}
                </p>
              ) : null}

              <Button
                className="w-full bg-pink-500 hover:bg-pink-600"
                disabled={
                  purchasing ||
                  checkingPayment ||
                  paymentBlocked ||
                  lineItems.length === 0
                }
                onClick={() => void handlePurchase()}
              >
                {purchasing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  `Pay ${currency} ${orderTotal.toFixed(2)}`
                )}
              </Button>
            </div>
          )}
        </DialogContent>
    </Dialog>
  );
}

export function openTicketPurchaseFlow(options: {
  isAuthenticated: boolean;
  pathname: string;
  slug: string;
  onOpen: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  if (!options.isAuthenticated) {
    const redirect = encodeURIComponent(options.pathname || `/events/${options.slug}`);
    options.router.push(`/login?redirect=${redirect}`);
    return;
  }
  options.onOpen();
}
