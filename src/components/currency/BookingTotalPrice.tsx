"use client";

import type { Booking } from "@/features/bookings/types";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { decimalToNumber } from "@/features/venues/utils";
import { getBookingCurrency } from "@/components/bookings/user-booking-utils";

type BookingTotalPriceProps = {
  booking: Booking;
  className?: string;
};

export function BookingTotalPrice({ booking, className }: BookingTotalPriceProps) {
  return (
    <DisplayPrice
      amount={decimalToNumber(booking.totalAmount)}
      currency={getBookingCurrency(booking)}
      className={className}
    />
  );
}
