"use client";

import type { PricingModel, Currency } from "@/features/venues/types";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldClassName } from "@/lib/form-validation";
import { FormField } from "@/components/ui/form-field";

const CURRENCIES: Currency[] = ["AED", "PKR", "USD", "EUR", "GBP", "SAR", "QAR"];

/** Pricing models available in the venue setup UI. */
export type ActivePricingModel = Exclude<PricingModel, "FLAT_RATE">;

export type PricingFormState = {
  modelType: PricingModel;
  basePrice: number;
  currency: Currency;
  taxRate: number;
  config: Record<string, unknown>;
};

type PricingModelFieldsProps = {
  value: PricingFormState;
  onChange: (value: PricingFormState) => void;
  showErrors?: boolean;
};

const HOURLY_SLOT_MINUTES = 60;

export function defaultPricingForm(model: ActivePricingModel = "HOURLY"): PricingFormState {
  const configs: Record<ActivePricingModel, Record<string, unknown>> = {
    HOURLY: { slotDurationMinutes: HOURLY_SLOT_MINUTES, bufferMinutes: 15 },
    NAMED_SLOTS: {
      slots: [{ name: "Morning", startTime: "09:00", endTime: "13:00", price: 500 }],
      bufferMinutes: 0,
    },
    DAILY_BLOCK: {
      pricePerDay: 1000,
      minBookingDays: 1,
      dayStartTime: "00:00",
      dayEndTime: "23:59",
    },
  };
  const basePrices: Record<ActivePricingModel, number> = {
    HOURLY: 100,
    NAMED_SLOTS: 100,
    DAILY_BLOCK: 1000,
  };
  return {
    modelType: model,
    basePrice: basePrices[model],
    currency: "AED",
    taxRate: 5,
    config: configs[model],
  };
}

/** Normalize pricing payload before save (fixed hourly slot, daily times, etc.). */
export function normalizePricingForSave(pricing: PricingFormState): PricingFormState {
  if (pricing.modelType === "HOURLY") {
    return {
      ...pricing,
      config: {
        ...pricing.config,
        slotDurationMinutes: HOURLY_SLOT_MINUTES,
        bufferMinutes: Number(pricing.config.bufferMinutes) || 0,
      },
    };
  }

  if (pricing.modelType === "DAILY_BLOCK") {
    const pricePerDay =
      Number(pricing.config.pricePerDay) > 0
        ? Number(pricing.config.pricePerDay)
        : pricing.basePrice;
    return {
      ...pricing,
      basePrice: pricePerDay,
      config: {
        ...pricing.config,
        pricePerDay,
        minBookingDays: Number(pricing.config.minBookingDays) || 1,
        dayStartTime: String(pricing.config.dayStartTime || "00:00"),
        dayEndTime: String(pricing.config.dayEndTime || "23:59"),
      },
    };
  }

  return pricing;
}

export function PricingModelFields({ value, onChange, showErrors }: PricingModelFieldsProps) {
  const t = useTranslations("pricingModelFields");
  const set = (patch: Partial<PricingFormState>) => onChange({ ...value, ...patch });

  const setConfig = (key: string, val: unknown) =>
    onChange({ ...value, config: { ...value.config, [key]: val } });

  const slots = (value.config.slots as Array<Record<string, unknown>>) ?? [];

  const inputClass = "bg-input/50 border-border w-full";
  const selectTriggerClass = cn(inputClass, "w-full");

  const basePriceError =
    showErrors && value.basePrice <= 0 ? t("priceMustBePositive") : null;

  const activeModel: ActivePricingModel =
    value.modelType === "FLAT_RATE" ? "HOURLY" : value.modelType;

  function switchModel(model: ActivePricingModel) {
    onChange(defaultPricingForm(model));
  }

  function setDailyPricePerDay(price: number) {
    onChange({
      ...value,
      basePrice: price,
      config: { ...value.config, pricePerDay: price },
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("intro")}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="w-full space-y-2 sm:col-span-2">
          <Label>{t("pricingModel")}</Label>
          <Select value={activeModel} onValueChange={(v) => switchModel(v as ActivePricingModel)}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HOURLY">{t("hourly")}</SelectItem>
              <SelectItem value="DAILY_BLOCK">{t("daily")}</SelectItem>
              <SelectItem value="NAMED_SLOTS">{t("namedSlots")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full space-y-2">
          <Label>{t("currency")}</Label>
          <Select
            value={value.currency}
            onValueChange={(v) => set({ currency: v as Currency })}
          >
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FormField
          label={value.modelType === "DAILY_BLOCK" ? t("pricePerDay") : t("basePrice")}
          required
          error={basePriceError}
        >
          <NumberInput
            min={0}
            value={value.basePrice}
            onValueChange={(price) => {
              const next = price ?? 0;
              if (value.modelType === "DAILY_BLOCK") {
                setDailyPricePerDay(next);
              } else {
                set({ basePrice: next });
              }
            }}
            aria-invalid={!!basePriceError}
            className={fieldClassName(inputClass, !!basePriceError)}
          />
        </FormField>

        <div className="space-y-2 sm:col-span-2">
          <Label>{t("taxRate")}</Label>
          <NumberInput
            min={0}
            max={100}
            value={value.taxRate}
            defaultOnBlur={0}
            onValueChange={(taxRate) => set({ taxRate: taxRate ?? 0 })}
            className={inputClass}
          />
        </div>
      </div>

      {value.modelType === "HOURLY" && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <span className="text-muted-foreground">{t("slotDuration")} </span>
            <span className="font-medium text-foreground">{t("slotDurationMinutes")}</span>
            <span className="text-muted-foreground"> {t("fixed")}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buffer-minutes">{t("bufferTime")}</Label>
            <NumberInput
              id="buffer-minutes"
              min={0}
              integer
              value={
                value.config.bufferMinutes === undefined || value.config.bufferMinutes === null
                  ? undefined
                  : Number(value.config.bufferMinutes)
              }
              defaultOnBlur={0}
              onValueChange={(minutes) => setConfig("bufferMinutes", minutes ?? 0)}
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground">{t("bufferHint")}</p>
          </div>
        </div>
      )}

      {value.modelType === "DAILY_BLOCK" && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
            {t("dailyBlockInfo")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="day-start">{t("dailyBookingStarts")}</Label>
              <Input
                id="day-start"
                type="time"
                value={String(value.config.dayStartTime ?? "00:00")}
                onChange={(e) => setConfig("dayStartTime", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="day-end">{t("dailyBookingEnds")}</Label>
              <Input
                id="day-end"
                type="time"
                value={String(value.config.dayEndTime ?? "23:59")}
                onChange={(e) => setConfig("dayEndTime", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="min-days">{t("minDaysPerBooking")}</Label>
              <NumberInput
                id="min-days"
                min={1}
                integer
                value={
                  value.config.minBookingDays === undefined || value.config.minBookingDays === null
                    ? undefined
                    : Number(value.config.minBookingDays)
                }
                defaultOnBlur={1}
                onValueChange={(days) => setConfig("minBookingDays", days ?? 1)}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {value.modelType === "NAMED_SLOTS" && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>{t("namedSlotsLabel")}</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-border"
              onClick={() =>
                setConfig("slots", [
                  ...slots,
                  {
                    name: t("defaultSlotName"),
                    startTime: "09:00",
                    endTime: "12:00",
                    price: value.basePrice,
                  },
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" /> {t("addSlot")}
            </Button>
          </div>
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded-lg border border-border bg-background p-3 sm:grid-cols-5"
            >
              <Input
                placeholder={t("namePlaceholder")}
                value={String(slot.name ?? "")}
                onChange={(e) => {
                  const next = [...slots];
                  next[idx] = { ...next[idx], name: e.target.value };
                  setConfig("slots", next);
                }}
                className={cn(inputClass, "sm:col-span-2")}
              />
              <Input
                type="time"
                value={String(slot.startTime ?? "")}
                onChange={(e) => {
                  const next = [...slots];
                  next[idx] = { ...next[idx], startTime: e.target.value };
                  setConfig("slots", next);
                }}
                className={inputClass}
              />
              <Input
                type="time"
                value={String(slot.endTime ?? "")}
                onChange={(e) => {
                  const next = [...slots];
                  next[idx] = { ...next[idx], endTime: e.target.value };
                  setConfig("slots", next);
                }}
                className={inputClass}
              />
              <div className="flex gap-2">
                <NumberInput
                  min={0}
                  placeholder={t("pricePlaceholder")}
                  value={Number(slot.price) || 0}
                  onValueChange={(price) => {
                    const next = [...slots];
                    next[idx] = { ...next[idx], price: price ?? 0 };
                    setConfig("slots", next);
                  }}
                  className={inputClass}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setConfig("slots", slots.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.modelType === "FLAT_RATE" && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground">
          {t("flatRateDeprecated")}
        </div>
      )}
    </div>
  );
}
