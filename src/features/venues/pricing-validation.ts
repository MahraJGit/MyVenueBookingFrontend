import type { PricingFormState } from "@/components/venues/PricingModelFields";

export type NamedPricingSlot = {
  name?: string;
  startTime: string;
  endTime: string;
  price?: number;
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function namedSlotLabel(slot: NamedPricingSlot, index: number): string {
  const name = String(slot.name ?? "").trim();
  return name || `Slot ${index + 1}`;
}

export function timeRangesOverlapMinutes(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && endA > startB;
}

export function getNamedSlotRowErrors(
  slots: NamedPricingSlot[],
  t: Translate,
): Record<number, string[]> {
  const rowErrors: Record<number, string[]> = {};
  const addError = (index: number, message: string) => {
    rowErrors[index] = [...(rowErrors[index] ?? []), message];
  };

  const parsed = slots.map((slot, index) => ({
    index,
    slot,
    start: parseTimeToMinutes(String(slot.startTime ?? "")),
    end: parseTimeToMinutes(String(slot.endTime ?? "")),
  }));

  for (const { index, slot, start, end } of parsed) {
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      addError(
        index,
        t("slotEndAfterStart", { name: namedSlotLabel(slot, index) }),
      );
    }
  }

  for (let i = 0; i < parsed.length; i += 1) {
    for (let j = i + 1; j < parsed.length; j += 1) {
      const a = parsed[i];
      const b = parsed[j];
      if (a.end <= a.start || b.end <= b.start) continue;
      if (timeRangesOverlapMinutes(a.start, a.end, b.start, b.end)) {
        const message = t("slotsOverlap", {
          nameA: namedSlotLabel(a.slot, a.index),
          nameB: namedSlotLabel(b.slot, b.index),
        });
        addError(a.index, message);
        addError(b.index, message);
      }
    }
  }

  return rowErrors;
}

export function validatePricingForm(
  pricing: PricingFormState,
  t: Translate,
): string | null {
  if (pricing.basePrice <= 0) {
    return t("priceMustBePositive");
  }

  if (pricing.modelType === "NAMED_SLOTS") {
    const slots = (pricing.config.slots as NamedPricingSlot[]) ?? [];
    if (!slots.length) {
      return t("namedSlotsRequired");
    }

    const rowErrors = getNamedSlotRowErrors(slots, t);
    const firstError = Object.values(rowErrors).flat()[0];
    if (firstError) return firstError;
  }

  if (pricing.modelType === "DAILY_BLOCK") {
    const minBookingDays = Number(pricing.config.minBookingDays) || 1;
    const maxBookingDays = pricing.config.maxBookingDays;
    if (
      maxBookingDays !== undefined &&
      maxBookingDays !== null &&
      Number(maxBookingDays) < minBookingDays
    ) {
      return t("minDaysExceedsMax");
    }
  }

  return null;
}
