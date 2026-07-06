import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";
import { getStripe } from "@/lib/stripe";
import type {
  Booking,
  BookingStatus,
  CheckoutPayload,
  CheckoutResult,
  CreateHoldPayload,
  ListBookingsResult,
  ReschedulePayload,
} from "./types";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, "Invalid response from server");
  }
}

type SuccessEnvelope<T> = {
  status?: string;
  message?: string;
  data: T;
};

function unwrapEnvelope<T>(json: SuccessEnvelope<T>): T {
  return json.data;
}

async function authJson<T>(
  path: string,
  init: RequestInit & { networkErrorMessage: string },
): Promise<T> {
  const res = await authFetch(path, init);
  const json = await parseJson<SuccessEnvelope<T>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function listBookings(params?: {
  page?: number;
  limit?: number;
  status?: BookingStatus;
}): Promise<ListBookingsResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 10));
  if (params?.status) sp.set("status", params.status);

  return authJson<ListBookingsResult>(`/api/bookings?${sp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading bookings.",
  });
}

export async function getBooking(id: string): Promise<Booking> {
  return authJson<Booking>(`/api/bookings/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading booking.",
  });
}

export async function createHold(body: CreateHoldPayload): Promise<Booking> {
  return authJson<Booking>("/api/bookings/hold", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while creating booking hold.",
  });
}

export async function checkoutBooking(
  id: string,
  body: CheckoutPayload = {},
): Promise<CheckoutResult> {
  return authJson<CheckoutResult>(`/api/bookings/${encodeURIComponent(id)}/checkout`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while processing checkout.",
  });
}

export async function completeBookingCheckout(
  id: string,
  paymentIntentId: string,
): Promise<Extract<CheckoutResult, { status: "succeeded" }>> {
  return authJson<Extract<CheckoutResult, { status: "succeeded" }>>(
    `/api/bookings/${encodeURIComponent(id)}/complete`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
      networkErrorMessage: "Network error while confirming payment.",
    },
  );
}

export async function cancelBooking(id: string): Promise<Booking> {
  return authJson<Booking>(`/api/bookings/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while cancelling booking.",
  });
}

export async function rescheduleBooking(
  id: string,
  body: ReschedulePayload,
): Promise<Booking> {
  return authJson<Booking>(`/api/bookings/${encodeURIComponent(id)}/reschedule`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while rescheduling booking.",
  });
}

export async function confirmCardPaymentIfNeeded(clientSecret: string) {
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);
  if (error) {
    throw new Error(error.message ?? "Card authentication failed.");
  }
  if (!paymentIntent?.id) {
    throw new Error("Payment could not be confirmed.");
  }
  return paymentIntent.id;
}
