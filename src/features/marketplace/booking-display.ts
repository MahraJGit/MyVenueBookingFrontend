import type {
  ServiceBooking,
  ServiceInquirySelection,
  ServiceProposal,
} from "@/features/marketplace/types";
import { decimalToNumber } from "@/features/marketplace/utils";

export function isInstantServiceBooking(booking: ServiceBooking): boolean {
  const snap = booking.pricingSnapshot;
  if (snap && typeof snap === "object" && snap.instantBooking === true) {
    return true;
  }
  const selection = asBookingSelection(booking.inquiry?.selection);
  return selection?.instantBooking === true;
}

export function asBookingSelection(
  value: unknown,
): ServiceInquirySelection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as ServiceInquirySelection;
}

export type BookingPriceLine = {
  id?: string;
  lineType?: string;
  label: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export function bookingPriceLines(booking: ServiceBooking): BookingPriceLine[] {
  const fromProposal = (booking.proposal?.lines ?? [])
    .map((line, idx) => {
      const label = line.label?.trim();
      if (!label) return null;
      const quantity = Number(line.quantity ?? 1) || 1;
      const unitPrice = decimalToNumber(line.unitPrice ?? 0);
      const amount = decimalToNumber(line.amount ?? unitPrice * quantity);
      return {
        id: line.id ?? `proposal-${idx}`,
        lineType: String(line.lineType ?? ""),
        label,
        quantity,
        unitPrice,
        amount,
      };
    })
    .filter(Boolean) as BookingPriceLine[];

  if (fromProposal.length > 0) return fromProposal;

  const snap = booking.pricingSnapshot;
  if (!snap || typeof snap !== "object" || !("lines" in snap)) return [];
  const lines = snap.lines;
  if (!Array.isArray(lines)) return [];

  return lines
    .map((line, idx) => {
      if (!line || typeof line !== "object") return null;
      const row = line as Record<string, unknown>;
      const label = typeof row.label === "string" ? row.label.trim() : "";
      if (!label) return null;
      const quantity = Number(row.quantity ?? 1) || 1;
      const unitPrice = decimalToNumber(
        (row.unitPrice as number | string | null | undefined) ?? 0,
      );
      const amount = decimalToNumber(
        (row.amount as number | string | null | undefined) ??
          unitPrice * quantity,
      );
      return {
        id: typeof row.id === "string" ? row.id : `snap-${idx}`,
        lineType: String(row.lineType ?? ""),
        label,
        quantity,
        unitPrice,
        amount,
      };
    })
    .filter(Boolean) as BookingPriceLine[];
}

export function bookingSelectionHours(
  booking: ServiceBooking,
): number | null {
  const hours = asBookingSelection(booking.inquiry?.selection)?.hours;
  if (hours == null) return null;
  const n = Number(hours);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function bookingAddOnNames(booking: ServiceBooking): string[] {
  const ids = asBookingSelection(booking.inquiry?.selection)?.addOnIds ?? [];
  if (!ids.length) return [];
  const catalog = booking.service?.addOns ?? [];
  return ids.map((id) => {
    const match = catalog.find((item) => item.id === id);
    return match?.name ?? id.slice(0, 8);
  });
}

export function bookingMenuSelectionLabels(
  booking: ServiceBooking,
): Array<{ course: string; items: string[] }> {
  const rows =
    asBookingSelection(booking.inquiry?.selection)?.menuSelections ?? [];
  if (!rows.length) return [];
  const catalog = booking.service?.menuItems ?? [];
  return rows
    .map((row) => {
      const items = (row.menuItemIds ?? []).map((id) => {
        const match = catalog.find((item) => item.id === id);
        return match?.name ?? id.slice(0, 8);
      });
      if (!items.length) return null;
      return { course: row.course, items };
    })
    .filter(Boolean) as Array<{ course: string; items: string[] }>;
}

/** Narrow proposal type for pages that only need lines. */
export type BookingProposalLines = Pick<
  ServiceProposal,
  "lines" | "currency" | "totalAmount"
>;
