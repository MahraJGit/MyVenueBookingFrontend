"use client";

import type { AvailabilitySlot } from "@/features/venues/types";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SlotPickerProps = {
  slots: AvailabilitySlot[];
  currency: string;
  selected?: { startTime: string; endTime: string } | null;
  onSelect: (slot: AvailabilitySlot) => void;
  className?: string;
};

export function SlotPicker({
  slots,
  currency,
  selected,
  onSelect,
  className,
}: SlotPickerProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No time slots for this day. Try another date or check back later.
      </p>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      {slots.map((slot) => {
        const isSelected =
          selected?.startTime === slot.startTime && selected?.endTime === slot.endTime;
        const label = slot.name
          ? `${slot.name} (${slot.startTime}–${slot.endTime})`
          : `${slot.startTime} – ${slot.endTime}`;

        return (
          <Button
            key={`${slot.startTime}-${slot.endTime}`}
            type="button"
            variant={isSelected ? "default" : "outline"}
            disabled={!slot.available}
            onClick={() => onSelect(slot)}
            className={cn(
              "h-auto flex-col items-start gap-1 border-[#303030] py-3 text-left",
              !slot.available && "opacity-40",
              isSelected && "bg-primary text-white",
            )}
          >
            <span className="text-xs font-medium">{label}</span>
            <span className={cn("text-xs", isSelected ? "text-white" : "text-primary")}>
              <DisplayPrice
                amount={slot.price}
                currency={currency}
                className={cn("text-xs", isSelected ? "text-white" : "text-primary")}
              />
            </span>
          </Button>
        );
      })}
    </div>
  );
}
