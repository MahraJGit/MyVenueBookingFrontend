"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Minus, Plus, Loader2, CreditCard, Ticket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { listPaymentMethods } from "@/features/payments/api";
import {
  checkoutTickets,
  completeTicketPurchase,
  confirmCardPaymentIfNeeded,
} from "@/features/ticket-purchases/api";
import type { PublicEvent, TicketTypeRow } from "@/features/events/api";
import { getPurchasableTicketTypes } from "@/features/events/utils";
import { ApiError } from "@/lib/api/errors";
import { toastApiError } from "@/lib/toasts";
import { toast } from "sonner";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { CheckoutPrice } from "@/components/currency/CheckoutPrice";
import { useDisplayPrice, useCurrency } from "@/features/currency/currency-context";

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
  const tTicket = useTranslations("ticketPurchase");
  const tEvents = useTranslations("events");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isReady } = useAuth();
  const { formatChargePrice } = useCurrency();
  const [quantities, setQuantities] = React.useState<Quantities>({});
  const [checkingPayment, setCheckingPayment] = React.useState(false);
  const [purchasing, setPurchasing] = React.useState(false);
  const [paymentBlocked, setPaymentBlocked] = React.useState(false);
  const [defaultCardLabel, setDefaultCardLabel] = React.useState<string | null>(null);

  const ticketTypes = React.useMemo(
    () => getPurchasableTicketTypes(event),
    [event],
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
    if (!open || !isReady || !isAuthenticated) return;

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
          const brand = def.brand ? def.brand.toUpperCase() : tTicket("cardLabel");
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
  }, [open, isReady, isAuthenticated, tTicket]);

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
  const { chargeFormatted } = useDisplayPrice(orderTotal, currency);

  const setQty = (ticketTypeId: string, delta: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[ticketTypeId] ?? 0;
      const next = Math.min(max, Math.max(0, current + delta));
      return { ...prev, [ticketTypeId]: next };
    });
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(pathname || `/events/${event.slug}`);
      router.push(`/login?redirect=${redirect}`);
      return;
    }

    if (paymentBlocked) {
      toast.error(tTicket("addPaymentBeforePurchase"));
      return;
    }

    if (lineItems.length === 0) {
      toast.error(tTicket("selectAtLeastOne"));
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

      toast.success(tTicket("purchaseSuccess"), {
        description: tTicket("purchaseSuccessDesc"),
      });
      onOpenChange(false);
      onPurchaseSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        const code = (err as ApiError & { code?: string }).code;
        if (code === "PAYMENT_METHOD_REQUIRED") {
          setPaymentBlocked(true);
          toast.error(tTicket("addPaymentInDashboard"));
          return;
        }
        if (code === "SALES_NOT_STARTED") {
          toast.error(tTicket("salesNotStarted"));
          return;
        }
        if (code === "SALES_ENDED") {
          toast.error(tTicket("salesEnded"));
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
            <DialogTitle>{tTicket("title")}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {event.eventName}
            </DialogDescription>
          </DialogHeader>

          {ticketTypes.length === 0 ? (
            <p className="text-sm text-zinc-400">{tTicket("noTicketsAvailable")}</p>
          ) : (
            <div className="space-y-4">
              <ul className="space-y-4">
                {ticketTypes.map((ticket) => {
                  const id = ticket.id!;
                  const max = availableCount(ticket);
                  const qty = quantities[id] ?? 0;
                  const price = ticketPrice(ticket.price);
                  const ticketCurrency = ticket.currency || currency;

                  return (
                    <li
                      key={id}
                      className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            <Ticket className="h-4 w-4 text-primary" />
                            {ticket.name}
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
                            onClick={() => setQty(id, -1, max)}
                            aria-label={tTicket("decreaseQuantity", { name: ticket.name })}
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
                            aria-label={tTicket("increaseQuantity", { name: ticket.name })}
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
                    {tTicket("processing")}
                  </>
                ) : (
                  tTicket("payAmount", { amount: chargeFormatted })
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
