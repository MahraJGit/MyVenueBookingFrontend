import { ApiError } from "@/lib/api/errors";
import { apiGet } from "@/lib/api/client";
import { authFetch } from "@/lib/api/auth-fetch";
import { uploadSingleFile } from "@/features/uploads/upload-single";
import type {
  CreateMarketplaceServicePayload,
  ListManagedMarketplaceServicesResult,
  ListPublicMarketplaceServicesResult,
  ManagedMarketplaceService,
  MarketplaceServiceStatusPayload,
  PublicMarketplaceService,
  ServiceAvailabilityResult,
  ServiceBlock,
  ServiceBlockPayload,
  ServiceCategory,
  ServicePricingModel,
  ServiceSchedule,
  ServiceSchedulesPayload,
  UpdateMarketplaceServicePayload,
  EntityStatus,
  AcceptServiceProposalResult,
  CreateMarketplaceServiceReviewInput,
  CreateServiceInquiryPayload,
  CreateServiceProposalPayload,
  ListServiceBookingsResult,
  ListServiceInquiriesResult,
  ListServiceProposalsResult,
  MarketplaceServiceReview,
  MarketplaceServiceReviewSummary,
  PaginationMeta,
  ReviseServiceProposalPayload,
  ServiceBooking,
  ServiceBookingCheckoutResult,
  ServiceInquiry,
  ServiceProposal,
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

async function authVoid(
  path: string,
  init: RequestInit & { networkErrorMessage: string },
): Promise<void> {
  const res = await authFetch(path, init);
  if (!res.ok) {
    const json = await parseJson<unknown>(res);
    throw ApiError.fromUnknown(res.status, json);
  }
}

// ─── Categories ────────────────────────────────────────────────

export async function listServiceCategories(params?: {
  search?: string;
  isActive?: boolean;
  rootsOnly?: boolean;
  parentId?: string;
}): Promise<ServiceCategory[]> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.isActive !== undefined) sp.set("isActive", String(params.isActive));
  if (params?.rootsOnly !== undefined) sp.set("rootsOnly", String(params.rootsOnly));
  if (params?.parentId) sp.set("parentId", params.parentId);
  const qs = sp.toString();
  const json = await apiGet<SuccessEnvelope<ServiceCategory[]>>(
    `/api/service-categories${qs ? `?${qs}` : ""}`,
  );
  return unwrapEnvelope(json);
}

export async function getServiceCategory(id: string): Promise<ServiceCategory> {
  const json = await apiGet<SuccessEnvelope<ServiceCategory>>(
    `/api/service-categories/${encodeURIComponent(id)}`,
  );
  return unwrapEnvelope(json);
}

export async function createServiceCategory(body: {
  name: string;
  description?: string | null;
  parentId?: string | null;
  isActive?: boolean;
}): Promise<ServiceCategory> {
  return authJson<ServiceCategory>("/api/service-categories", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while creating service category.",
  });
}

export async function updateServiceCategory(
  id: string,
  body: {
    name?: string;
    description?: string | null;
    parentId?: string | null;
    isActive?: boolean;
  },
): Promise<ServiceCategory> {
  return authJson<ServiceCategory>(`/api/service-categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while updating service category.",
  });
}

export async function deleteServiceCategory(id: string): Promise<void> {
  return authVoid(`/api/service-categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while deleting service category.",
  });
}

// ─── Public marketplace services ───────────────────────────────

export async function listPublicMarketplaceServices(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  countryCode?: string;
  city?: string;
  pricingModel?: ServicePricingModel;
  sortBy?: "createdAt" | "title" | "basePrice";
  sortOrder?: "asc" | "desc";
}): Promise<ListPublicMarketplaceServicesResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 10));
  if (params?.search) sp.set("search", params.search);
  if (params?.categoryId) sp.set("categoryId", params.categoryId);
  if (params?.countryCode) sp.set("countryCode", params.countryCode);
  if (params?.city) sp.set("city", params.city);
  if (params?.pricingModel) sp.set("pricingModel", params.pricingModel);
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortOrder) sp.set("sortOrder", params.sortOrder);

  const json = await apiGet<SuccessEnvelope<ListPublicMarketplaceServicesResult>>(
    `/api/marketplace-services?${sp.toString()}`,
  );
  return unwrapEnvelope(json);
}

export async function getPublicMarketplaceService(
  id: string,
): Promise<PublicMarketplaceService> {
  const json = await apiGet<SuccessEnvelope<PublicMarketplaceService>>(
    `/api/marketplace-services/${encodeURIComponent(id)}`,
  );
  return unwrapEnvelope(json);
}

export async function getPublicMarketplaceServiceBySlug(
  slug: string,
): Promise<PublicMarketplaceService> {
  const json = await apiGet<SuccessEnvelope<PublicMarketplaceService>>(
    `/api/marketplace-services/slug/${encodeURIComponent(slug)}`,
  );
  return unwrapEnvelope(json);
}

export async function getPreviewMarketplaceService(
  id: string,
): Promise<ManagedMarketplaceService> {
  return authJson<ManagedMarketplaceService>(
    `/api/marketplace-services/preview/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading service preview.",
    },
  );
}

export async function checkServiceAvailability(
  serviceId: string,
  startDate: string,
  endDate: string,
): Promise<ServiceAvailabilityResult> {
  const sp = new URLSearchParams({ startDate, endDate });
  const json = await apiGet<SuccessEnvelope<ServiceAvailabilityResult>>(
    `/api/marketplace-services/${encodeURIComponent(serviceId)}/availability?${sp.toString()}`,
  );
  return unwrapEnvelope(json);
}

// ─── Managed ───────────────────────────────────────────────────

export async function listManagedMarketplaceServices(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  city?: string;
  pricingModel?: ServicePricingModel;
  status?: EntityStatus;
  sortBy?: "createdAt" | "title" | "basePrice";
  sortOrder?: "asc" | "desc";
}): Promise<ListManagedMarketplaceServicesResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 10));
  if (params?.search) sp.set("search", params.search);
  if (params?.categoryId) sp.set("categoryId", params.categoryId);
  if (params?.city) sp.set("city", params.city);
  if (params?.pricingModel) sp.set("pricingModel", params.pricingModel);
  if (params?.status) sp.set("status", params.status);
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortOrder) sp.set("sortOrder", params.sortOrder);

  return authJson<ListManagedMarketplaceServicesResult>(
    `/api/marketplace-services/manage?${sp.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading marketplace services.",
    },
  );
}

export async function getManagedMarketplaceService(
  id: string,
): Promise<ManagedMarketplaceService> {
  return authJson<ManagedMarketplaceService>(
    `/api/marketplace-services/manage/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading marketplace service.",
    },
  );
}

export async function createMarketplaceService(
  body: CreateMarketplaceServicePayload,
): Promise<ManagedMarketplaceService> {
  return authJson<ManagedMarketplaceService>("/api/marketplace-services", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while creating marketplace service.",
  });
}

export async function updateMarketplaceService(
  id: string,
  body: UpdateMarketplaceServicePayload,
): Promise<ManagedMarketplaceService> {
  return authJson<ManagedMarketplaceService>(
    `/api/marketplace-services/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while updating marketplace service.",
    },
  );
}

export async function deleteMarketplaceService(id: string): Promise<void> {
  return authVoid(`/api/marketplace-services/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while deactivating marketplace service.",
  });
}

export async function submitMarketplaceServiceForReview(
  id: string,
): Promise<ManagedMarketplaceService> {
  return authJson<ManagedMarketplaceService>(
    `/api/marketplace-services/${encodeURIComponent(id)}/submit`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while submitting marketplace service.",
    },
  );
}

export async function updateMarketplaceServiceStatus(
  id: string,
  body: MarketplaceServiceStatusPayload,
): Promise<ManagedMarketplaceService> {
  return authJson<ManagedMarketplaceService>(
    `/api/marketplace-services/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while updating marketplace service status.",
    },
  );
}

export async function listServiceSchedules(id: string): Promise<ServiceSchedule[]> {
  return authJson<ServiceSchedule[]>(
    `/api/marketplace-services/${encodeURIComponent(id)}/schedules`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading service schedules.",
    },
  );
}

export async function replaceServiceSchedules(
  id: string,
  body: ServiceSchedulesPayload,
): Promise<ServiceSchedule[]> {
  return authJson<ServiceSchedule[]>(
    `/api/marketplace-services/${encodeURIComponent(id)}/schedules`,
    {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while saving service schedules.",
    },
  );
}

export async function listServiceBlocks(id: string): Promise<ServiceBlock[]> {
  return authJson<ServiceBlock[]>(
    `/api/marketplace-services/${encodeURIComponent(id)}/blocks`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading service blocks.",
    },
  );
}

export async function addServiceBlock(
  id: string,
  body: ServiceBlockPayload,
): Promise<ServiceBlock> {
  return authJson<ServiceBlock>(
    `/api/marketplace-services/${encodeURIComponent(id)}/blocks`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while adding service block.",
    },
  );
}

export async function removeServiceBlock(
  serviceId: string,
  blockId: string,
): Promise<void> {
  return authVoid(
    `/api/marketplace-services/${encodeURIComponent(serviceId)}/blocks/${encodeURIComponent(blockId)}`,
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while removing service block.",
    },
  );
}

export async function uploadMarketplaceMedia(file: File): Promise<string> {
  return uploadSingleFile(file, "marketplace");
}

// ─── Service inquiries ─────────────────────────────────────────

export async function listServiceInquiries(params?: {
  page?: number;
  limit?: number;
  status?: string;
  scope?: "buyer" | "vendor";
  serviceId?: string;
}): Promise<ListServiceInquiriesResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 20));
  if (params?.status) sp.set("status", params.status);
  if (params?.scope) sp.set("scope", params.scope);
  if (params?.serviceId) sp.set("serviceId", params.serviceId);

  return authJson<ListServiceInquiriesResult>(
    `/api/service-inquiries?${sp.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading service inquiries.",
    },
  );
}

export async function getServiceInquiry(id: string): Promise<ServiceInquiry> {
  return authJson<ServiceInquiry>(
    `/api/service-inquiries/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading service inquiry.",
    },
  );
}

export async function createServiceInquiry(
  body: CreateServiceInquiryPayload,
): Promise<ServiceInquiry> {
  return authJson<ServiceInquiry>("/api/service-inquiries", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while creating service inquiry.",
  });
}

// ─── Service proposals ─────────────────────────────────────────

export async function listServiceProposals(params?: {
  page?: number;
  limit?: number;
  status?: string;
  inquiryId?: string;
  scope?: "buyer" | "vendor";
}): Promise<ListServiceProposalsResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 20));
  if (params?.status) sp.set("status", params.status);
  if (params?.inquiryId) sp.set("inquiryId", params.inquiryId);
  sp.set("scope", params?.scope ?? "buyer");

  return authJson<ListServiceProposalsResult>(
    `/api/service-proposals?${sp.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading service proposals.",
    },
  );
}

export async function getServiceProposal(id: string): Promise<ServiceProposal> {
  return authJson<ServiceProposal>(
    `/api/service-proposals/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading service proposal.",
    },
  );
}

export async function createServiceProposal(
  body: CreateServiceProposalPayload,
): Promise<ServiceProposal> {
  return authJson<ServiceProposal>("/api/service-proposals", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while creating service proposal.",
  });
}

export async function sendServiceProposal(id: string): Promise<ServiceProposal> {
  return authJson<ServiceProposal>(
    `/api/service-proposals/${encodeURIComponent(id)}/send`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while sending service proposal.",
    },
  );
}

export async function reviseServiceProposal(
  id: string,
  body: ReviseServiceProposalPayload,
): Promise<ServiceProposal> {
  return authJson<ServiceProposal>(
    `/api/service-proposals/${encodeURIComponent(id)}/revise`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while revising service proposal.",
    },
  );
}

export async function acceptServiceProposal(
  id: string,
): Promise<AcceptServiceProposalResult> {
  return authJson<AcceptServiceProposalResult>(
    `/api/service-proposals/${encodeURIComponent(id)}/accept`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while accepting proposal.",
    },
  );
}

export async function requestServiceProposalChanges(
  id: string,
  body: { message: string },
): Promise<{ proposal: ServiceProposal; requestedChanges: boolean }> {
  return authJson(`/api/service-proposals/${encodeURIComponent(id)}/request-changes`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while requesting proposal changes.",
  });
}

export async function declineServiceProposal(
  id: string,
  body?: { reason?: string | null },
): Promise<ServiceProposal> {
  return authJson<ServiceProposal>(
    `/api/service-proposals/${encodeURIComponent(id)}/decline`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      networkErrorMessage: "Network error while declining proposal.",
    },
  );
}

// ─── Service bookings ──────────────────────────────────────────

export async function listServiceBookings(params?: {
  page?: number;
  limit?: number;
  status?: string;
  scope?: "buyer" | "vendor";
}): Promise<ListServiceBookingsResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 20));
  if (params?.status) sp.set("status", params.status);
  sp.set("scope", params?.scope ?? "buyer");

  return authJson<ListServiceBookingsResult>(
    `/api/service-bookings?${sp.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading service bookings.",
    },
  );
}

export async function getServiceBooking(id: string): Promise<ServiceBooking> {
  return authJson<ServiceBooking>(
    `/api/service-bookings/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading service booking.",
    },
  );
}

export async function checkoutServiceBooking(
  id: string,
  body: { paymentMethodId?: string } = {},
): Promise<ServiceBookingCheckoutResult> {
  return authJson<ServiceBookingCheckoutResult>(
    `/api/service-bookings/${encodeURIComponent(id)}/checkout`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while processing service checkout.",
    },
  );
}

export async function completeServiceBookingCheckout(
  id: string,
  paymentIntentId: string,
): Promise<Extract<ServiceBookingCheckoutResult, { status: "succeeded" }>> {
  return authJson<Extract<ServiceBookingCheckoutResult, { status: "succeeded" }>>(
    `/api/service-bookings/${encodeURIComponent(id)}/complete`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
      networkErrorMessage: "Network error while confirming service payment.",
    },
  );
}

export async function cancelServiceBooking(id: string): Promise<ServiceBooking> {
  return authJson<ServiceBooking>(
    `/api/service-bookings/${encodeURIComponent(id)}/cancel`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while cancelling service booking.",
    },
  );
}

// ─── Marketplace service reviews ───────────────────────────────

export async function getMarketplaceServiceReviewSummary(
  serviceId: string,
): Promise<MarketplaceServiceReviewSummary> {
  const json = await apiGet<SuccessEnvelope<MarketplaceServiceReviewSummary>>(
    `/api/reviews/marketplace-services/${encodeURIComponent(serviceId)}/summary`,
  );
  return unwrapEnvelope(json);
}

export async function listMarketplaceServiceReviews(
  serviceId: string,
  page = 1,
  limit = 10,
): Promise<{
  data: MarketplaceServiceReview[];
  meta: PaginationMeta;
}> {
  const json = await apiGet<
    SuccessEnvelope<{ data: MarketplaceServiceReview[]; meta: PaginationMeta }>
  >(
    `/api/reviews/marketplace-services/${encodeURIComponent(serviceId)}?page=${page}&limit=${limit}`,
  );
  return unwrapEnvelope(json);
}

export async function createMarketplaceServiceReview(
  input: CreateMarketplaceServiceReviewInput,
): Promise<{
  id: string;
  serviceId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}> {
  return authJson("/api/reviews/marketplace-service", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(input),
    networkErrorMessage: "Network error while submitting service review.",
  });
}
