"use client";

import { useTranslations } from "next-intl";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { getBookingCurrency } from "@/components/bookings/user-booking-utils";
import type { Booking } from "@/features/bookings/types";
import { decimalToNumber } from "@/features/venues/utils";

type BookingLineItemsProps = {
  booking: Booking;
  className?: string;
};

export function BookingLineItems({ booking, className }: BookingLineItemsProps) {
  const t = useTranslations("booking");
  const currency = getBookingCurrency(booking);
  const baseAmount = decimalToNumber(booking.baseAmount);
  const amenities = booking.bookingAmenities ?? [];
  const amenitiesTotal = amenities.reduce(
    (sum, line) => sum + decimalToNumber(line.calculatedAmount),
    0,
  );
  const totalAmount = decimalToNumber(booking.totalAmount);
  const taxAmount = Math.max(0, totalAmount - baseAmount - amenitiesTotal);
  const snapshot = booking.pricingSnapshot as { taxRate?: number } | null;
  const taxRate = snapshot?.taxRate;

  return (
    <div className={className}>
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{t("baseAmount")}</dt>
          <dd className="text-foreground">
            <DisplayPrice amount={baseAmount} currency={currency} />
          </dd>
        </div>

        {amenities.map((line) => (
          <div key={line.id} className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">
              {line.venueAmenity?.catalog?.name ?? t("addOns")}
              {line.quantity && line.quantity > 1 ? ` × ${line.quantity}` : ""}
            </dt>
            <dd className="text-foreground">
              <DisplayPrice
                amount={decimalToNumber(line.calculatedAmount)}
                currency={currency}
              />
            </dd>
          </div>
        ))}

        {amenities.length > 0 && amenitiesTotal > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2">
            <dt className="text-muted-foreground">{t("amenitiesTotal")}</dt>
            <dd className="text-foreground">
              <DisplayPrice amount={amenitiesTotal} currency={currency} />
            </dd>
          </div>
        ) : null}

        {taxAmount > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">
              {taxRate != null ? `${t("tax")} (${taxRate}%)` : t("tax")}
            </dt>
            <dd className="text-foreground">
              <DisplayPrice amount={taxAmount} currency={currency} />
            </dd>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-2 font-semibold">
          <dt className="text-foreground">{t("totalAmount")}</dt>
          <dd className="text-primary">
            <DisplayPrice amount={totalAmount} currency={currency} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
