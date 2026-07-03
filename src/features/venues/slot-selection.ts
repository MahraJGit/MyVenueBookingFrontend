import type { AvailabilitySlot } from "./types";

function slotKey(slot: AvailabilitySlot): string {
  return `${slot.startTime}-${slot.endTime}`;
}

export function sortSlotsByStart(slots: AvailabilitySlot[]): AvailabilitySlot[] {
  return [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function areConsecutiveSlots(
  allSlots: AvailabilitySlot[],
  selected: AvailabilitySlot[],
): boolean {
  if (selected.length <= 1) return true;
  const sorted = sortSlotsByStart(allSlots);
  const indices = selected
    .map((s) => sorted.findIndex((x) => slotKey(x) === slotKey(s)))
    .sort((a, b) => a - b);
  if (indices.some((i) => i < 0)) return false;
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) return false;
  }
  return true;
}

export function toggleSlotSelection(
  allSlots: AvailabilitySlot[],
  selected: AvailabilitySlot[],
  slot: AvailabilitySlot,
): AvailabilitySlot[] {
  if (!slot.available) return selected;

  const sorted = sortSlotsByStart(allSlots);
  const isSelected = selected.some((s) => slotKey(s) === slotKey(slot));

  if (isSelected) {
    const next = selected.filter((s) => slotKey(s) !== slotKey(slot));
    return sortSlotsByStart(next);
  }

  if (selected.length === 0) {
    return [slot];
  }

  const next = sortSlotsByStart([...selected, slot]);
  if (areConsecutiveSlots(sorted, next)) {
    return next;
  }

  return [slot];
}

export function selectSlotRange(
  allSlots: AvailabilitySlot[],
  anchor: AvailabilitySlot,
  target: AvailabilitySlot,
): AvailabilitySlot[] {
  const sorted = sortSlotsByStart(allSlots);
  const anchorIdx = sorted.findIndex((s) => slotKey(s) === slotKey(anchor));
  const targetIdx = sorted.findIndex((s) => slotKey(s) === slotKey(target));
  if (anchorIdx < 0 || targetIdx < 0) return [];

  const start = Math.min(anchorIdx, targetIdx);
  const end = Math.max(anchorIdx, targetIdx);
  const range = sorted.slice(start, end + 1);
  if (range.some((s) => !s.available)) return [];
  return range;
}

export function combinedSlotRange(slots: AvailabilitySlot[]): {
  startTime: string;
  endTime: string;
} | null {
  if (slots.length === 0) return null;
  const sorted = sortSlotsByStart(slots);
  return {
    startTime: sorted[0].startTime,
    endTime: sorted[sorted.length - 1].endTime,
  };
}

export function selectedSlotsTotalPrice(slots: AvailabilitySlot[]): number {
  return slots.reduce((sum, s) => sum + s.price, 0);
}

export function isSlotSelected(
  selected: AvailabilitySlot[],
  slot: AvailabilitySlot,
): boolean {
  return selected.some((s) => slotKey(s) === slotKey(slot));
}
