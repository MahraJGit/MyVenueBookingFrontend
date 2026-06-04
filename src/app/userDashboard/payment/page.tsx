"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddCardForm } from "@/components/payments/add-card-form";
import {
  deletePaymentMethod,
  listPaymentMethods,
  setDefaultPaymentMethod,
  type SavedPaymentMethod,
} from "@/features/payments/api";
import { getStripePublishableKey } from "@/lib/stripe";
import { toastApiError } from "@/lib/toasts";
import { toast } from "sonner";

const PAYMENT_METHODS_KEY = ["payment-methods"] as const;

function formatBrand(brand: string | null) {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function formatExpiry(month: number, year: number) {
  const mm = String(month).padStart(2, "0");
  const yy = String(year).slice(-2);
  return `${mm} / ${yy}`;
}

function CardPreview({ method }: { method: SavedPaymentMethod | null }) {
  if (!method) {
    return (
      <div className="relative flex h-52 w-full items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-800/50 p-6 text-muted-foreground">
        <div className="flex flex-col items-center gap-2 text-center">
          <CreditCard className="h-8 w-8 opacity-60" />
          <p className="text-sm">No card saved yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl bg-linear-to-br from-pink-500 via-purple-600 to-zinc-900 p-6 text-white shadow-lg">
      <div className="mb-5 flex justify-between">
        <span className="text-sm opacity-80">Credit Card</span>
        <span className="text-sm uppercase">{formatBrand(method.brand)}</span>
      </div>
      <div className="flex items-center gap-4">
        <Image src="/svg/cardsim.svg" alt="Chip" width={40} height={30} />
        <h4 className="uppercase">{formatBrand(method.brand)}</h4>
      </div>
      <div className="mt-5 text-lg tracking-widest">
        •••• •••• •••• {method.last4}
      </div>
      <div className="mt-6 flex justify-between text-sm">
        <div>
          <p className="opacity-70">Default card</p>
          <p>{method.isDefault ? "Yes" : "No"}</p>
        </div>
        <div>
          <p className="opacity-70">Expiry date</p>
          <p>{formatExpiry(method.expMonth, method.expYear)}</p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = React.useState(false);
  const stripeConfigured = Boolean(getStripePublishableKey());

  const { data: methods = [], isLoading, isError, refetch } = useQuery({
    queryKey: PAYMENT_METHODS_KEY,
    queryFn: listPaymentMethods,
    enabled: stripeConfigured,
  });

  const defaultMethod =
    methods.find((m) => m.isDefault) ?? methods[0] ?? null;

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: (data) => {
      queryClient.setQueryData(PAYMENT_METHODS_KEY, data);
      toast.success("Default card updated.");
    },
    onError: toastApiError,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: (data) => {
      queryClient.setQueryData(PAYMENT_METHODS_KEY, data);
      toast.success("Card removed.");
    },
    onError: toastApiError,
  });

  const handleCardAdded = () => {
    setAddOpen(false);
    void queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEY });
  };

  if (!stripeConfigured) {
    return (
      <div className="rounded-2xl bg-[#121212] p-8">
        <p className="text-sm text-muted-foreground">
          Stripe is not configured. Add{" "}
          <code className="text-pink-400">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
          to <code className="text-pink-400">.env.local</code> and restart the dev
          server.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#121212] p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Payment methods</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cards are stored securely by Stripe. Your card details never touch our
          servers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading saved cards…
            </div>
          ) : isError ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                Could not load payment methods.
              </p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : methods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add a card to use it when purchasing tickets.
            </p>
          ) : (
            <ul className="space-y-3">
              {methods.map((method) => (
                <li
                  key={method.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/80 p-4"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-pink-400" />
                    <div>
                      <p className="font-medium">
                        {formatBrand(method.brand)} •••• {method.last4}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires {formatExpiry(method.expMonth, method.expYear)}
                        {method.isDefault ? " · Default" : ""}
                      </p>
                    </div>
                    {method.isDefault ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {!method.isDefault ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-600"
                        disabled={setDefaultMutation.isPending}
                        onClick={() =>
                          setDefaultMutation.mutate(method.id)
                        }
                      >
                        Set default
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(method.id)}
                      aria-label="Remove card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="text-sm text-muted-foreground">
            Your default card will be used when you purchase tickets.
          </p>
        </div>

        <div className="space-y-6">
          <CardPreview method={defaultMethod} />

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Card
                role="button"
                className="flex h-40 cursor-pointer items-center justify-center border-dashed border-zinc-700 bg-zinc-800 transition hover:border-pink-500"
              >
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span>Add payment method</span>
                </div>
              </Card>
            </DialogTrigger>

            <DialogContent className="border-zinc-800 bg-zinc-900 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add new card</DialogTitle>
              </DialogHeader>
              {addOpen ? (
                <AddCardForm
                  onSuccess={handleCardAdded}
                  onCancel={() => setAddOpen(false)}
                />
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
