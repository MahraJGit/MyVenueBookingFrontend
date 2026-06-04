import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";
import { getStripe } from "@/lib/stripe";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export type CheckoutLineItem = {
  ticketTypeId: string;
  quantity: number;
};

export type CheckoutTicketResponse =
  | {
      status: "succeeded";
      orderGroupId: string;
      total: number;
      currency: string;
      items: Array<{
        id: string;
        ticketTypeId: string;
        ticketName: string;
        quantity: number;
        unitPrice: number;
        totalAmount: number;
        status: string;
      }>;
    }
  | {
      status: "requires_action";
      orderGroupId: string;
      paymentIntentId: string;
      clientSecret: string;
      total: number;
      currency: string;
      lines: Array<{
        ticketTypeId: string;
        name: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        currency: string;
      }>;
    };

type ApiEnvelope<T> = { success: boolean; data: T };

type ErrorBody = {
  message?: string;
  errors?: { code?: string; clientSecret?: string };
};

export function getApiErrorCode(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const errors = (body as ErrorBody).errors;
  if (typeof errors === "object" && errors !== null && typeof errors.code === "string") {
    return errors.code;
  }
  return undefined;
}

export type TicketOrderTabStatus = "pending" | "canceled" | "completed";

export type MyTicketOrder = {
  orderGroupId: string;
  orderCode: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  eventStartDateTime: string;
  eventImage: string | null;
  venueName: string | null;
  city: string;
  orderDate: string;
  totalAmount: number;
  currency: string;
  ticketCount: number;
  status: TicketOrderTabStatus;
  items: Array<{
    id: string;
    ticketTypeId: string;
    ticketName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    status: string;
  }>;
};

export type MyTicketOrderDetail = MyTicketOrder & {
  eventEndDateTime: string;
  state: string | null;
  address: string | null;
};

export async function getMyTicketOrder(orderGroupId: string) {
  const res = await authFetch(
    `/api/ticket-purchases/my-orders/${encodeURIComponent(orderGroupId)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading ticket details.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiEnvelope<MyTicketOrderDetail>).data;
}

export type TicketSaleStatusFilter =
  | "CONFIRMED"
  | "PENDING"
  | "CANCELLED"
  | "REFUNDED"
  | "ALL";

export type EventTicketSalesSummary = {
  eventId: string;
  eventName: string;
  eventSlug: string;
  eventStartDateTime: string;
  vendorName: string | null;
  totalTicketsSold: number;
  totalRevenue: number;
  currency: string;
  ticketTypes: Array<{
    ticketTypeId: string;
    name: string;
    currency: string;
    quantityTotal: number;
    quantitySold: number;
    ticketsSoldInFilter: number;
    revenueInFilter: number;
  }>;
};

export type TicketSaleRecord = {
  id: string;
  orderGroupId: string | null;
  orderCode: string | null;
  eventId: string;
  eventName: string;
  eventSlug: string;
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  status: string;
  purchasedAt: string;
  vendorName: string | null;
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type TicketSalesResponse = {
  summary: EventTicketSalesSummary[];
  records: TicketSaleRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    eventId: string | null;
    status: TicketSaleStatusFilter;
  };
};

export type ListTicketSalesParams = {
  eventId?: string;
  status?: TicketSaleStatusFilter;
  page?: number;
  limit?: number;
};

export async function getTicketSales(params: ListTicketSalesParams = {}) {
  const search = new URLSearchParams();
  if (params.eventId) search.set("eventId", params.eventId);
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  const res = await authFetch(
    `/api/ticket-purchases/sales${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading ticket sales.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiEnvelope<TicketSalesResponse>).data;
}

export async function getMyTicketOrders() {
  const res = await authFetch("/api/ticket-purchases/my-orders", {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading your tickets.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiEnvelope<MyTicketOrder[]>).data;
}

export async function checkoutTickets(eventId: string, items: CheckoutLineItem[]) {
  const res = await authFetch("/api/ticket-purchases/checkout", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ eventId, items }),
    networkErrorMessage: "Network error while processing checkout.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    const err = ApiError.fromUnknown(res.status, data);
    (err as ApiError & { code?: string }).code = getApiErrorCode(data);
    throw err;
  }

  return (data as ApiEnvelope<CheckoutTicketResponse>).data;
}

export async function completeTicketPurchase(
  orderGroupId: string,
  paymentIntentId: string,
) {
  const res = await authFetch("/api/ticket-purchases/complete", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderGroupId, paymentIntentId }),
    networkErrorMessage: "Network error while confirming payment.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiEnvelope<CheckoutTicketResponse & { status?: string }>).data;
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
