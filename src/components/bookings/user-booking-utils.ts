import type { Booking, BookingStatus } from "@/features/bookings/types";
import { decimalToNumber, formatVenuePrice } from "@/features/venues/utils";

export type BookingTabValue = "all" | BookingStatus;

export type BookingSortOption = "newest" | "oldest" | "amount-high" | "amount-low";

export function bookingStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    DRAFT: "Draft",
    HOLD: "On hold",
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
  };
  return labels[status] ?? status;
}

export function bookingStatusBadgeClass(status: BookingStatus): string {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return "border-green-500/50 bg-green-500/10 text-green-400";
    case "HOLD":
    case "PENDING":
      return "border-amber-500/50 bg-amber-500/10 text-amber-400";
    case "CANCELLED":
      return "border-red-500/50 bg-red-500/10 text-red-400";
    default:
      return "border-zinc-600 bg-zinc-800/50 text-zinc-300";
  }
}

export function getBookingCurrency(booking: Booking): string {
  return (
    (booking.pricingSnapshot as { currency?: string } | null)?.currency ??
    booking.venue.pricing?.currency ??
    "AED"
  );
}

export function formatBookingTotal(booking: Booking): string {
  return formatVenuePrice(decimalToNumber(booking.totalAmount), getBookingCurrency(booking));
}

export function sortBookings(bookings: Booking[], sort: BookingSortOption): Booking[] {
  const copy = [...bookings];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
    case "amount-high":
      return copy.sort(
        (a, b) => decimalToNumber(b.totalAmount) - decimalToNumber(a.totalAmount),
      );
    case "amount-low":
      return copy.sort(
        (a, b) => decimalToNumber(a.totalAmount) - decimalToNumber(b.totalAmount),
      );
    case "newest":
    default:
      return copy.sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );
  }
}

export function filterBookingsByTab(
  bookings: Booking[],
  tab: BookingTabValue,
): Booking[] {
  if (tab === "all") return bookings;
  return bookings.filter((b) => b.status === tab);
}

export function countBookingsByTab(bookings: Booking[]) {
  return {
    all: bookings.length,
    HOLD: bookings.filter((b) => b.status === "HOLD").length,
    CONFIRMED: bookings.filter((b) => b.status === "CONFIRMED").length,
    CANCELLED: bookings.filter((b) => b.status === "CANCELLED").length,
    COMPLETED: bookings.filter((b) => b.status === "COMPLETED").length,
    PENDING: bookings.filter((b) => b.status === "PENDING").length,
    DRAFT: bookings.filter((b) => b.status === "DRAFT").length,
  };
}
