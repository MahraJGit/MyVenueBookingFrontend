import type { PricingFormState } from "@/components/venues/PricingModelFields";

export type NamedPricingSlot = {
  name?: string;
  startTime: string;
  endTime: string;
  price?: number;
};

export type ScheduleHours = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
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

export function slotWithinOperatingHours(
  startTime: string,
  endTime: string,
  openTime: string,
  closeTime: string,
): boolean {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const openMinutes = parseTimeToMinutes(openTime);
  const closeMinutes = parseTimeToMinutes(closeTime);
  return (
    Number.isFinite(startMinutes) &&
    Number.isFinite(endMinutes) &&
    Number.isFinite(openMinutes) &&
    Number.isFinite(closeMinutes) &&
    startMinutes >= openMinutes &&
    endMinutes <= closeMinutes &&
    startMinutes < endMinutes
  );
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

/**
 * Named slots must fit inside every open schedule day.
 * Skips when there are no open days yet (schedule not configured).
 */
export function validateNamedSlotsAgainstSchedules(
  slots: NamedPricingSlot[],
  schedules: ScheduleHours[],
  t: Translate,
  dayNames: readonly string[],
): string | null {
  const openDays = schedules.filter((day) => day.isOpen);
  if (openDays.length === 0 || slots.length === 0) {
    return null;
  }

  for (const [index, slot] of slots.entries()) {
    for (const day of openDays) {
      if (
        !slotWithinOperatingHours(
          String(slot.startTime ?? ""),
          String(slot.endTime ?? ""),
          day.openTime,
          day.closeTime,
        )
      ) {
        return t("slotOutsideScheduleHours", {
          name: namedSlotLabel(slot, index),
          start: String(slot.startTime ?? ""),
          end: String(slot.endTime ?? ""),
          day: dayNames[day.dayOfWeek] ?? `day ${day.dayOfWeek}`,
          open: day.openTime,
          close: day.closeTime,
        });
      }
    }
  }

  return null;
}

export function validatePricingForm(
  pricing: PricingFormState,
  t: Translate,
  options?: {
    schedules?: ScheduleHours[];
    dayNames?: readonly string[];
  },
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

    if (options?.schedules && options.dayNames) {
      const scheduleError = validateNamedSlotsAgainstSchedules(
        slots,
        options.schedules,
        t,
        options.dayNames,
      );
      if (scheduleError) return scheduleError;
    }
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
