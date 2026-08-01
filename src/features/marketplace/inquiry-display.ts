import type {
  ServiceInquiry,
  ServiceInquirySelection,
  ServiceLocation,
} from "@/features/marketplace/types";
import { decimalToNumber } from "@/features/marketplace/utils";

export function formatInquiryEventDate(
  start: string | Date,
  end: string | Date,
): string {
  const s = String(start).slice(0, 10);
  const e = String(end).slice(0, 10);
  return s === e ? s : `${s} → ${e}`;
}

export function asInquiryLocation(
  value: ServiceInquiry["location"],
): ServiceLocation | null {
  if (!value || typeof value !== "object") return null;
  return value as ServiceLocation;
}

export function asInquirySelection(
  value: ServiceInquiry["selection"],
): ServiceInquirySelection | null {
  if (!value || typeof value !== "object") return null;
  return value as ServiceInquirySelection;
}

export function inquiryLocationLabel(inquiry: ServiceInquiry): string | null {
  const location = asInquiryLocation(inquiry.location);
  if (!location) return null;
  // Prefer city/country on lists — street address stays off inquiry views.
  const parts = [
    location.city?.trim(),
    location.country?.trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export function inquiryEstimateAmount(inquiry: ServiceInquiry): number | null {
  const snap = inquiry.estimateSnapshot;
  if (snap && typeof snap === "object") {
    const raw =
      "amount" in snap
        ? snap.amount
        : "total" in snap
          ? snap.total
          : undefined;
    if (raw != null && raw !== "") {
      const n = decimalToNumber(raw as number | string);
      if (Number.isFinite(n)) return n;
    }
  }
  if ("estimateAmount" in inquiry && inquiry.estimateAmount != null) {
    const n = decimalToNumber(
      inquiry.estimateAmount as number | string,
    );
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export type InquiryEstimateLine = {
  lineType: string;
  label: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export function inquiryEstimateLines(
  inquiry: ServiceInquiry,
): InquiryEstimateLine[] {
  const snap = inquiry.estimateSnapshot;
  if (!snap || typeof snap !== "object" || !("lines" in snap)) return [];
  const lines = snap.lines;
  if (!Array.isArray(lines)) return [];
  return lines
    .map((line) => {
      if (!line || typeof line !== "object") return null;
      const row = line as Record<string, unknown>;
      const label = typeof row.label === "string" ? row.label : null;
      if (!label) return null;
      return {
        lineType: String(row.lineType ?? ""),
        label,
        quantity: Number(row.quantity ?? 1) || 1,
        unitPrice: decimalToNumber(
          (row.unitPrice as number | string | null | undefined) ?? 0,
        ),
        amount: decimalToNumber(
          (row.amount as number | string | null | undefined) ?? 0,
        ),
      };
    })
    .filter(Boolean) as InquiryEstimateLine[];
}

export function inquiryAddOnNames(inquiry: ServiceInquiry): string[] {
  const selection = asInquirySelection(inquiry.selection);
  const ids = selection?.addOnIds ?? [];
  if (!ids.length) return [];
  const catalog = inquiry.service?.addOns ?? [];
  return ids.map((id) => {
    const match = catalog.find((item) => item.id === id);
    return match?.name ?? id.slice(0, 8);
  });
}

export function inquiryMenuSelectionLabels(
  inquiry: ServiceInquiry,
): Array<{ course: string; items: string[] }> {
  const selection = asInquirySelection(inquiry.selection);
  const rows = selection?.menuSelections ?? [];
  if (!rows.length) return [];
  const catalog = inquiry.service?.menuItems ?? [];
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

export function inquiryHours(inquiry: ServiceInquiry): number | null {
  const selection = asInquirySelection(inquiry.selection);
  const hours = selection?.hours;
  if (hours == null) return null;
  const n = Number(hours);
  return Number.isFinite(n) && n > 0 ? n : null;
}
