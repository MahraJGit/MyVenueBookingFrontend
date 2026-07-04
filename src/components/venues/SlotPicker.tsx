"use client";

import { useTranslations } from "next-intl";
import type { AvailabilitySlot } from "@/features/venues/types";
import { isSlotSelected } from "@/features/venues/slot-selection";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SlotPickerProps = {
  slots: AvailabilitySlot[];
  currency: string;
  selectedSlots: AvailabilitySlot[];
  onToggleSlot: (slot: AvailabilitySlot) => void;
  className?: string;
};

export function SlotPicker({
  slots,
  currency,
  selectedSlots,
  onToggleSlot,
  className,
}: SlotPickerProps) {
  const t = useTranslations("venues");

  if (slots.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#303030] px-4 py-6 text-center text-sm text-zinc-500">
        {t("noSlotsForDay")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">{t("multiSlotHintSingle")}</p>
      <div
        className={cn(
          "grid w-full min-w-0 max-w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2",
          className,
        )}
        role="listbox"
        aria-label={t("selectSlot")}
        aria-multiselectable
      >
        {slots.map((slot) => {
          const isSelected = isSlotSelected(selectedSlots, slot);
          const label = slot.name
            ? `${slot.name} (${slot.startTime}–${slot.endTime})`
            : `${slot.startTime} – ${slot.endTime}`;

          return (
            <Button
              key={`${slot.startTime}-${slot.endTime}`}
              type="button"
              role="option"
              aria-selected={isSelected}
              variant={isSelected ? "default" : "outline"}
              disabled={!slot.available}
              onClick={() => onToggleSlot(slot)}
              className={cn(
                "h-auto min-h-11 w-full min-w-0 max-w-full whitespace-normal break-words",
                "flex-col items-start gap-1 rounded-xl border-[#303030] px-3 py-3 text-left transition-colors",
                !slot.available && "opacity-40",
                !isSelected && slot.available && "hover:border-primary/40 hover:bg-primary/5",
                isSelected && "border-primary bg-primary text-white shadow-md shadow-primary/20",
              )}
            >
              <span className="w-full text-xs font-medium leading-snug">{label}</span>
              <span className={cn("text-xs", isSelected ? "text-white/90" : "text-primary")}>
                <DisplayPrice
                  amount={slot.price}
                  currency={currency}
                  className={cn("text-xs", isSelected ? "text-white/90" : "text-primary")}
                />
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
