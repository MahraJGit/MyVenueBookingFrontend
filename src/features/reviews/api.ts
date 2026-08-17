import { ApiError } from "@/lib/api/errors";
import { apiGet } from "@/lib/api/client";
import { authFetch } from "@/lib/api/auth-fetch";

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

function unwrapApiGet<T>(json: unknown): T {
  if (typeof json === "object" && json !== null && "data" in json) {
    return (json as ApiEnvelope<T>).data;
  }
  return json as T;
}

export type VendorReview = {
  id: string;
  vendorId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type PublicVendorReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
  };
};

export type VendorReviewSummary = {
  averageRating: number | null;
  count: number;
};

export type VenueReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
  };
};

export type VenueReviewSummary = {
  averageRating: number | null;
  count: number;
};

export type CreateVendorReviewInput = {
  vendorId: string;
  eventId: string;
  rating: number;
  comment?: string;
};

export type CreateEventReviewInput = {
  eventId: string;
  rating: number;
  comment?: string;
};

export type CreateAttractionReviewInput = {
  attractionId: string;
  rating: number;
  comment?: string;
};

export type ListingReview = PublicVendorReview;
export type ListingReviewSummary = VendorReviewSummary;

export type CreateVenueReviewResult = {
  id: string;
  venueId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type CreateVenueReviewInput = {
  venueId: string;
  bookingId: string;
  rating: number;
  comment?: string;
};

export async function createEventReview(
  input: CreateEventReviewInput,
): Promise<{ id: string; eventId: string; rating: number; comment: string | null; createdAt: string }> {
  const res = await authFetch("/api/reviews/event", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    networkErrorMessage: "Network error while submitting your review.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiEnvelope<{ id: string; eventId: string; rating: number; comment: string | null; createdAt: string }>).data;
}

export async function createAttractionReview(
  input: CreateAttractionReviewInput,
): Promise<{ id: string; attractionId: string; rating: number; comment: string | null; createdAt: string }> {
  const res = await authFetch("/api/reviews/attraction", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    networkErrorMessage: "Network error while submitting your review.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiEnvelope<{ id: string; attractionId: string; rating: number; comment: string | null; createdAt: string }>).data;
}

export async function createVendorReview(
  input: CreateVendorReviewInput,
): Promise<VendorReview> {
  const res = await authFetch("/api/reviews/vendor", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    networkErrorMessage: "Network error while submitting your review.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiEnvelope<VendorReview>).data;
}

export async function createVenueReview(
  input: CreateVenueReviewInput,
): Promise<CreateVenueReviewResult> {
  const res = await authFetch("/api/reviews/venue", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    networkErrorMessage: "Network error while submitting your review.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiEnvelope<CreateVenueReviewResult>).data;
}

export async function getEventReviewSummary(eventId: string): Promise<ListingReviewSummary> {
  const json = await apiGet<unknown>(
    `/api/reviews/events/${encodeURIComponent(eventId)}/summary`,
  );
  return unwrapApiGet<ListingReviewSummary>(json);
}

export async function getEventReviews(eventId: string, page = 1, limit = 10) {
  const json = await apiGet<unknown>(
    `/api/reviews/events/${encodeURIComponent(eventId)}?page=${page}&limit=${limit}`,
  );
  return unwrapApiGet<{
    data: ListingReview[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(json);
}

export async function getAttractionReviewSummary(attractionId: string): Promise<ListingReviewSummary> {
  const json = await apiGet<unknown>(
    `/api/reviews/attractions/${encodeURIComponent(attractionId)}/summary`,
  );
  return unwrapApiGet<ListingReviewSummary>(json);
}

export async function getAttractionReviews(attractionId: string, page = 1, limit = 10) {
  const json = await apiGet<unknown>(
    `/api/reviews/attractions/${encodeURIComponent(attractionId)}?page=${page}&limit=${limit}`,
  );
  return unwrapApiGet<{
    data: ListingReview[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(json);
}

export async function getVendorReviewSummary(
  vendorId: string,
): Promise<VendorReviewSummary> {
  const json = await apiGet<unknown>(
    `/api/reviews/vendors/${encodeURIComponent(vendorId)}/summary`,
  );
  return unwrapApiGet<VendorReviewSummary>(json);
}

export async function getVendorReviews(vendorId: string, page = 1, limit = 10) {
  const json = await apiGet<unknown>(
    `/api/reviews/vendors/${encodeURIComponent(vendorId)}?page=${page}&limit=${limit}`,
  );
  return unwrapApiGet<{
    data: PublicVendorReview[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(json);
}

export async function getVenueReviewSummary(
  venueId: string,
): Promise<VenueReviewSummary> {
  const json = await apiGet<unknown>(
    `/api/reviews/venues/${encodeURIComponent(venueId)}/summary`,
  );
  return unwrapApiGet<VenueReviewSummary>(json);
}

export async function getVenueReviews(venueId: string, page = 1, limit = 10) {
  const json = await apiGet<unknown>(
    `/api/reviews/venues/${encodeURIComponent(venueId)}?page=${page}&limit=${limit}`,
  );
  return unwrapApiGet<{
    data: VenueReview[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(json);
}

export type MarketplaceServiceReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
  };
};

export type MarketplaceServiceReviewSummary = {
  averageRating: number | null;
  count: number;
};

export type CreateMarketplaceServiceReviewInput = {
  serviceId: string;
  bookingId: string;
  rating: number;
  comment?: string;
};

export type CreateMarketplaceServiceReviewResult = {
  id: string;
  serviceId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export async function createMarketplaceServiceReview(
  input: CreateMarketplaceServiceReviewInput,
): Promise<CreateMarketplaceServiceReviewResult> {
  const res = await authFetch("/api/reviews/marketplace-service", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    networkErrorMessage: "Network error while submitting your review.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiEnvelope<CreateMarketplaceServiceReviewResult>).data;
}

export async function getMarketplaceServiceReviewSummary(
  serviceId: string,
): Promise<MarketplaceServiceReviewSummary> {
  const json = await apiGet<unknown>(
    `/api/reviews/marketplace-services/${encodeURIComponent(serviceId)}/summary`,
  );
  return unwrapApiGet<MarketplaceServiceReviewSummary>(json);
}

export async function getMarketplaceServiceReviews(
  serviceId: string,
  page = 1,
  limit = 10,
) {
  const json = await apiGet<unknown>(
    `/api/reviews/marketplace-services/${encodeURIComponent(serviceId)}?page=${page}&limit=${limit}`,
  );
  return unwrapApiGet<{
    data: MarketplaceServiceReview[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(json);
}
