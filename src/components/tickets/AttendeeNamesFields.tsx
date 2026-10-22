"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type AttendeeNameSlot = {
  key: string;
  label: string;
  ticketTypeId?: string;
  inventoryId?: string;
  seatId?: string;
};

type AttendeeNamesFieldsProps = {
  slots: AttendeeNameSlot[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Highlight empty required fields after submit attempt. */
  showErrors?: boolean;
};

export function AttendeeNamesFields({
  slots,
  values,
  onChange,
  disabled = false,
  className,
  showErrors = false,
}: AttendeeNamesFieldsProps) {
  const t = useTranslations("ticketPurchase");

  if (slots.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-medium text-white">{t("attendeeNamesTitle")}</p>
        <p className="mt-1 text-xs text-zinc-500">{t("attendeeNamesHint")}</p>
      </div>
      <ul className="space-y-3">
        {slots.map((slot, index) => {
          const value = values[slot.key] ?? "";
          const empty = !value.trim();
          return (
            <li key={slot.key} className="space-y-1.5">
              <Label
                htmlFor={`attendee-${slot.key}`}
                className="text-xs font-medium text-zinc-400"
              >
                {t("attendeeNameLabel", {
                  n: index + 1,
                  ticket: slot.label,
                })}
              </Label>
              <Input
                id={`attendee-${slot.key}`}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(slot.key, e.target.value)}
                placeholder={t("attendeeNamePlaceholder")}
                autoComplete="name"
                className={cn(
                  "border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-600",
                  showErrors && empty ? "border-destructive" : undefined,
                )}
              />
              {showErrors && empty ? (
                <p className="text-xs text-destructive">{t("attendeeNameRequired")}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function buildAttendeesFromSlots(
  slots: AttendeeNameSlot[],
  values: Record<string, string>,
) {
  return slots.map((slot) => ({
    fullName: (values[slot.key] ?? "").trim(),
    ticketTypeId: slot.ticketTypeId,
    inventoryId: slot.inventoryId,
    seatId: slot.seatId,
  }));
}

export function allAttendeeNamesFilled(
  slots: AttendeeNameSlot[],
  values: Record<string, string>,
) {
  return slots.every((slot) => Boolean((values[slot.key] ?? "").trim()));
}
