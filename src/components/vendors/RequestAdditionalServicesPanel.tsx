"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  requestVendorServices,
  type VendorServiceEnrollment,
  type VendorServiceType,
} from "@/features/vendor/api";
import { getRequestableVendorServices } from "@/features/vendor/vendor-services";
import { toastApiError } from "@/lib/toasts";

type Props = {
  enrollments?: VendorServiceEnrollment[];
  onSubmitted?: () => void | Promise<void>;
  className?: string;
};

export function RequestAdditionalServicesPanel({
  enrollments,
  onSubmitted,
  className,
}: Props) {
  const t = useTranslations("affiliateJoin");
  const [selection, setSelection] = useState<VendorServiceType[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const available = getRequestableVendorServices(enrollments);

  if (available.length === 0) return null;

  const toggle = (serviceType: VendorServiceType, checked: boolean) => {
    setSelection((prev) =>
      checked
        ? [...prev, serviceType]
        : prev.filter((x) => x !== serviceType),
    );
  };

  const submit = async () => {
    if (selection.length === 0) {
      toast.error(t("errors.servicesRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await requestVendorServices(selection);
      toast.success(t("extraServicesRequested"));
      setSelection([]);
      await onSubmitted?.();
    } catch (err) {
      toastApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <p className="text-sm font-medium text-white">{t("requestMoreServices")}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("requestMoreServicesHint")}
      </p>
      <div className="mt-3 space-y-2">
        {available.map((service) => {
          const checked = selection.includes(service.apiType);
          return (
            <label
              key={service.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#303030] bg-[#242424]/40 p-3"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(value) =>
                  toggle(service.apiType, value === true)
                }
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm text-white">
                  {t(service.titleKey)}
                </span>
                <span className="mt-0.5 block text-xs text-gray-400">
                  {t(service.descKey)}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <Button
        type="button"
        disabled={submitting || selection.length === 0}
        onClick={() => void submit()}
        className="mt-3 w-full bg-pink-600 hover:bg-pink-500"
      >
        {submitting ? t("submitting") : t("submitExtraServices")}
      </Button>
    </div>
  );
}
