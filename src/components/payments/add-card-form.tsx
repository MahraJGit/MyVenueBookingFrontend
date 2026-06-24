"use client";

import * as React from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getStripe } from "@/lib/stripe";
import { createSetupIntent } from "@/features/payments/api";
import { toastApiError } from "@/lib/toasts";
import { toast } from "sonner";

type AddCardFormProps = {
  onSuccess: () => void;
  onCancel?: () => void;
};

function SetupCardForm({ onSuccess, onCancel }: AddCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("addCardForm");
  const tCommon = useTranslations("common");
  const tUser = useTranslations("userDashboard");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/userDashboard/payment`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message ?? t("couldNotSaveCard"));
        return;
      }

      toast.success(t("cardSaved"));
      onSuccess();
    } catch (err) {
      toastApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      <div className="flex gap-2">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-zinc-700"
            onClick={onCancel}
            disabled={submitting}
          >
            {tCommon("cancel")}
          </Button>
        ) : null}
        <Button
          type="submit"
          className="flex-1 bg-pink-500 hover:bg-pink-600"
          disabled={!stripe || !elements || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            tUser("addCard")
          )}
        </Button>
      </div>
    </form>
  );
}

export function AddCardForm(props: AddCardFormProps) {
  const t = useTranslations("addCardForm");
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const { clientSecret: secret } = await createSetupIntent();
        if (!cancelled) {
          setClientSecret(secret);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("initFailed"),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {t("preparingForm")}
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <p className="text-sm text-destructive">
        {error ?? t("loadFailed")}
      </p>
    );
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#ec4899",
            colorBackground: "#18181b",
            colorText: "#fafafa",
            borderRadius: "8px",
          },
        },
      }}
    >
      <SetupCardForm {...props} />
    </Elements>
  );
}
