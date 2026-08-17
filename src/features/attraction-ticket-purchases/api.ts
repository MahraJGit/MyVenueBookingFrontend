import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";
import {
  confirmCardPaymentIfNeeded,
  getApiErrorCode,
  type CheckoutTicketResponse,
  type TicketSaleStatusFilter,
} from "@/features/ticket-purchases/api";

export { confirmCardPaymentIfNeeded, getApiErrorCode };
export type { TicketSaleStatusFilter };

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

type ApiEnvelope<T> = { success: boolean; data: T };

export type AttractionCheckoutLineItem = {
  inventoryId: string;
  quantity: number;
};

export type AttractionTicketSalesSummary = {
  attractionId: string;
  attractionName: string;
  attractionSlug: string;
  city: string;
  timezone?: string | null;
  vendorId: string | null;
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

export type AttractionTicketSaleRecord = {
  id: string;
  orderGroupId: string | null;
  orderCode: string | null;
  attractionId: string;
  attractionName: string;
  attractionSlug: string;
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  status: string;
  purchasedAt: string;
  occurrenceStartDateTime: string | null;
  timezone: string | null;
  vendorId: string | null;
  vendorName: string | null;
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type AttractionTicketSalesResponse = {
  summary: AttractionTicketSalesSummary[];
  records: AttractionTicketSaleRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    attractionId: string | null;
    status: TicketSaleStatusFilter;
    search: string | null;
  };
};

export type ListAttractionTicketSalesParams = {
  scope?: "workspace" | "platform";
  attractionId?: string;
  vendorId?: string;
  status?: TicketSaleStatusFilter;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export async function getAttractionTicketSales(
  params: ListAttractionTicketSalesParams = {},
) {
  const search = new URLSearchParams();
  if (params.scope) search.set("scope", params.scope);
  if (params.attractionId) search.set("attractionId", params.attractionId);
  if (params.vendorId) search.set("vendorId", params.vendorId);
  if (params.status) search.set("status", params.status);
  if (params.search) search.set("search", params.search);
  if (params.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params.dateTo) search.set("dateTo", params.dateTo);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  const res = await authFetch(
    `/api/attraction-ticket-purchases/sales${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading attraction ticket sales.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiEnvelope<AttractionTicketSalesResponse>).data;
}

export async function checkoutAttractionTickets(
  occurrenceId: string,
  items?: AttractionCheckoutLineItem[],
  seatIds?: string[],
  paymentMethodId?: string,
) {
  const body: Record<string, unknown> = { occurrenceId };
  if (seatIds?.length) {
    body.seatIds = seatIds;
  } else if (items?.length) {
    body.items = items;
  }
  if (paymentMethodId) {
    body.paymentMethodId = paymentMethodId;
  }

  const res = await authFetch("/api/attraction-ticket-purchases/checkout", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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

export async function completeAttractionTicketPurchase(
  orderGroupId: string,
  paymentIntentId: string,
) {
  const res = await authFetch("/api/attraction-ticket-purchases/complete", {
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
