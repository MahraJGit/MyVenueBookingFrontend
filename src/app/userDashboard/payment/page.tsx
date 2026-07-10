"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
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
import {
  DashboardPanel,
  DashboardPageShell,
  dashboardSurfaceClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS_KEY = ["payment-methods"] as const;

function formatBrand(brand: string | null, fallback: string) {
  if (!brand) return fallback;
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function formatExpiry(month: number, year: number) {
  const mm = String(month).padStart(2, "0");
  const yy = String(year).slice(-2);
  return `${mm} / ${yy}`;
}

function CardPreview({
  method,
  isRefreshing,
}: {
  method: SavedPaymentMethod | null;
  isRefreshing?: boolean;
}) {
  const t = useTranslations("userDashboard");
  const tCommon = useTranslations("common");

  if (isRefreshing && !method) {
    return (
      <div className="relative flex h-52 w-full items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-800/50 p-6 text-muted-foreground">
        <div className="flex flex-col items-center gap-2 text-center">
          <Loader2 className="h-8 w-8 animate-spin opacity-60" />
          <p className="text-sm">{t("addingCard")}</p>
        </div>
      </div>
    );
  }

  if (!method) {
    return (
      <div className="relative flex h-52 w-full items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-800/50 p-6 text-muted-foreground">
        <div className="flex flex-col items-center gap-2 text-center">
          <CreditCard className="h-8 w-8 opacity-60" />
          <p className="text-sm">{t("noCardSaved")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl bg-linear-to-br from-pink-500 via-purple-600 to-zinc-900 p-6 text-white shadow-lg">
      <div className="mb-5 flex justify-between">
        <span className="text-sm opacity-80">{t("creditCard")}</span>
        <span className="text-sm uppercase">{formatBrand(method.brand, t("card"))}</span>
      </div>
      <div className="flex items-center gap-4">
        <Image src="/svg/cardsim.svg" alt={t("chipAlt")} width={40} height={30} />
        <h4 className="uppercase">{formatBrand(method.brand, t("card"))}</h4>
      </div>
      <div className="mt-5 text-lg tracking-widest">
        •••• •••• •••• {method.last4}
      </div>
      <div className="mt-6 flex justify-between text-sm">
        <div>
          <p className="opacity-70">{t("defaultCard")}</p>
          <p>{method.isDefault ? tCommon("yes") : tCommon("no")}</p>
        </div>
        <div>
          <p className="opacity-70">{t("expiryDate")}</p>
          <p>{formatExpiry(method.expMonth, method.expYear)}</p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const t = useTranslations("userDashboard");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = React.useState(false);
  const [formKey, setFormKey] = React.useState(0);
  const [isAddingCard, setIsAddingCard] = React.useState(false);
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
      toast.success(t("defaultCardUpdated"));
    },
    onError: toastApiError,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: (data) => {
      queryClient.setQueryData(PAYMENT_METHODS_KEY, data);
      toast.success(t("cardRemoved"));
    },
    onError: toastApiError,
  });

  const handleCardAdded = () => {
    setIsAddingCard(true);
    setAddOpen(false);
    void queryClient
      .invalidateQueries({ queryKey: PAYMENT_METHODS_KEY })
      .finally(() => {
        setIsAddingCard(false);
      });
  };

  const handleAddOpenChange = (open: boolean) => {
    setAddOpen(open);
    if (open) {
      setFormKey((key) => key + 1);
    }
  };

  if (!stripeConfigured) {
    return (
      <DashboardPageShell>
        <DashboardPanel>
        <p className="text-sm text-muted-foreground">
          {t("stripeNotConfigured")}
        </p>
        </DashboardPanel>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title={t("paymentMethods")}
        description={t("paymentMethodsDesc")}
      />
      <DashboardPanel>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loadingCards")}
            </div>
          ) : isError ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                {t("couldNotLoadCards")}
              </p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                {tCommon("tryAgain")}
              </Button>
            </div>
          ) : methods.length === 0 ? (
            isAddingCard ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("addingCard")}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("addCardHint")}
              </p>
            )
          ) : (
            <ul className="space-y-3">
              {methods.map((method) => (
                <li
                  key={method.id}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-700 bg-zinc-800/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <CreditCard className="h-5 w-5 text-pink-400" />
                    <div>
                      <p className="font-medium">
                        {formatBrand(method.brand, t("card"))} •••• {method.last4}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("expires")} {formatExpiry(method.expMonth, method.expYear)}
                        {method.isDefault ? t("defaultSuffix") : ""}
                      </p>
                    </div>
                    {method.isDefault ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : null}
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
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
                        {t("setDefault")}
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(method.id)}
                      aria-label={t("removeCard")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="text-sm text-muted-foreground">
            {t("defaultCardCheckoutHint")}
          </p>
        </div>

        <div className="space-y-6">
          <CardPreview
            method={defaultMethod}
            isRefreshing={isLoading || isAddingCard}
          />

          <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
            <DialogTrigger asChild>
              <Card
                role="button"
                className="flex h-40 cursor-pointer items-center justify-center border-dashed border-zinc-700 bg-zinc-800 transition hover:border-pink-500"
              >
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span>{t("addPaymentMethod")}</span>
                </div>
              </Card>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("addNewCard")}</DialogTitle>
              </DialogHeader>
              {addOpen ? (
                <AddCardForm
                  key={formKey}
                  onSuccess={handleCardAdded}
                  onCancel={() => setAddOpen(false)}
                />
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      </DashboardPanel>
    </DashboardPageShell>
  );
}
