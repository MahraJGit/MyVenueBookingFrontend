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
