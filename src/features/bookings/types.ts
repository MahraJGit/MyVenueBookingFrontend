export type BookingStatus =
  | "DRAFT"
  | "HOLD"
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type BookingAmenityLine = {
  id: string;
  venueAmenityId: string;
  quantity?: number | null;
  calculatedAmount: number | string;
  venueAmenity?: {
    id: string;
    catalog?: { name: string };
  };
};

export type BookingVenueSummary = {
  id: string;
  name: string;
  address?: string;
  coverImage?: string | null;
  timezone: string;
  pricing?: { currency?: string } | null;
  vendor?: { userId?: string; vendorName?: string; email?: string } | null;
};

export type BookingBuyer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type BookingPayment = {
  id: string;
  amount: number | string;
  currency: string;
  status: string;
  transactionId?: string | null;
};

export type Booking = {
  id: string;
  buyerId: string;
  venueId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: number | string;
  baseAmount: number | string;
  pricingSnapshot?: Record<string, unknown> | null;
  expiresAt?: string | null;
  numGuests?: number | null;
  specialRequests?: string | null;
  createdAt: string;
  updatedAt: string;
  venue: BookingVenueSummary;
  buyer?: BookingBuyer;
  bookingAmenities?: BookingAmenityLine[];
  payments?: BookingPayment[];
};

export type PaginatedMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListBookingsResult = {
  data: Booking[];
  meta: PaginatedMeta;
};

export type BookingAmenitySelection = {
  venueAmenityId: string;
  quantity?: number;
  selectedConfig?: Record<string, unknown>;
};

export type CreateHoldPayload = {
  venueId: string;
  startTime: string;
  endTime: string;
  numGuests?: number;
  specialRequests?: string;
  bookingAmenities?: BookingAmenitySelection[];
};

export type CheckoutPayload = {
  paymentMethodId?: string;
};

export type CheckoutResult =
  | {
      status: "succeeded";
      booking: Booking;
    }
  | {
      status: "requires_action";
      bookingId: string;
      paymentIntentId: string;
      clientSecret: string;
      total: number;
      currency: string;
    };

export type ReschedulePayload = {
  startTime: string;
  endTime: string;
};
