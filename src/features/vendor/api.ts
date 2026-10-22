import { ApiError } from "@/lib/api/errors";
import { apiGet } from "@/lib/api/client";
import { authFetch } from "@/lib/api/auth-fetch";
import { uploadSingleFile } from "@/features/uploads/upload-single";

const VENDOR_DOCS_FOLDER = "vendor-documents";

type UploadOptions = {
  onProgress?: (progress: number) => void;
  maxRetries?: number;
};

export type VendorServiceType =
  | "EVENTS"
  | "ATTRACTIONS"
  | "MARKETPLACE"
  | "VENUES";

export type CreateVendorProfileBody = {
  vendorName: string;
  businessType: "INDIVIDUAL" | "COMPANY";
  ownerName: string;
  countryCode: string;
  city: string;
  idType: string;
  idNumber: string;
  idDocumentUrl: string;
  tradeLicenseNumber: string;
  tradeLicenseCopyUrl: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  annualRevenueRange: string;
  financialStatementUrl: string;
  serviceTypes: VendorServiceType[];
  acceptedCommission: true;
  acceptedTerms: true;
  acceptedPrivacy: true;
  logoUrl?: string;
  coverImageUrl?: string;
  bio?: string | null;
  websiteUrl?: string | null;
};

type CreateVendorProfileResponse = {
  success: boolean;
  data: unknown;
};

export type VendorVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type VendorIdVerificationStatus =
  | "PENDING_MANUAL"
  | "FORMAT_CHECKED"
  | "MANUAL_APPROVED"
  | "API_VERIFIED"
  | "REJECTED";

export type VendorServiceEnrollment = {
  id: string;
  serviceType: VendorServiceType;
  status: VendorVerificationStatus;
  commissionPercent: number;
  rejectedReason?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
};

export type VendorProfile = {
  id?: string;
  slug?: string;
  vendorName?: string;
  businessType?: "INDIVIDUAL" | "COMPANY" | "PARTNERSHIP";
  ownerName?: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  bio?: string | null;
  websiteUrl?: string | null;
  publicPhone?: string | null;
  publicEmail?: string | null;
  email?: string;
  phone?: string;
  address?: string;
  countryCode?: string | null;
  city?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  idDocumentUrl?: string | null;
  tradeLicenseNumber?: string | null;
  tradeLicenseCopyUrl?: string | null;
  annualRevenueRange?: string | null;
  financialStatementUrl?: string | null;
  verificationStatus: VendorVerificationStatus;
  isPlatformProfile?: boolean;
  eidNumber?: string;
  eidExpiry?: string;
  legalEntityName?: string;
  taxId?: string;
  paymentTerms?: "NET_15" | "NET_30" | "NET_60";
  rejectedReason?: string | null;
  services?: VendorServiceEnrollment[];
  enabledServices?: VendorServiceType[];
  createdAt?: string;
  updatedAt?: string;
};

type GetMyVendorProfileResponse = {
  success: boolean;
  data: VendorProfile | null;
};

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, "Invalid response from server");
  }
}

async function uploadVendorDocumentViaBackend(file: File): Promise<string> {
  return uploadSingleFile(file, VENDOR_DOCS_FOLDER);
}

export async function uploadSingleVendorDocument(file: File): Promise<string> {
  return uploadVendorDocumentViaBackend(file);
}

export async function uploadSingleVendorDocumentWithProgress(
  file: File,
  options?: UploadOptions,
): Promise<string> {
  return uploadSingleFile(file, VENDOR_DOCS_FOLDER, {
    onProgress: options?.onProgress,
    maxRetries: options?.maxRetries,
  });
}

export async function sendVendorPhoneOtp(phone: string) {
  const res = await authFetch("/api/vendors/phone/send-otp", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone }),
    networkErrorMessage: "Network error while sending phone verification code.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return data as { success: boolean; message: string; phone: string };
}

export async function verifyVendorPhoneOtp(phone: string, code: string) {
  const res = await authFetch("/api/vendors/phone/verify-otp", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone, code }),
    networkErrorMessage: "Network error while verifying phone code.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return data as { success: boolean; message: string; phone: string };
}

export async function createVendorProfile(body: CreateVendorProfileBody) {
  const res = await authFetch("/api/vendors", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while submitting vendor profile.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return data as CreateVendorProfileResponse;
}

export async function resubmitVendorProfile(body: CreateVendorProfileBody) {
  const res = await authFetch("/api/vendors/me/resubmit", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while resubmitting vendor profile.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return data as CreateVendorProfileResponse;
}

export async function getVendorCommissionRates() {
  const data = await apiGet<{
    success: boolean;
    data: Record<VendorServiceType, number>;
  }>("/api/vendors/commission-rates");
  return data.data;
}

export async function requestVendorServices(serviceTypes: VendorServiceType[]) {
  const res = await authFetch("/api/vendors/me/services", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ serviceTypes }),
    networkErrorMessage: "Network error while requesting vendor services.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }
  return data;
}

export async function updateVendorServiceEnrollment(
  vendorId: string,
  serviceType: VendorServiceType,
  body: {
    status: VendorVerificationStatus;
    rejectedReason?: string;
    commissionPercent?: number;
  },
) {
  const res = await authFetch(
    `/api/vendors/${encodeURIComponent(vendorId)}/services/${encodeURIComponent(serviceType)}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while updating service enrollment.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }
  return data;
}

export type AdminVendorServiceRequest = {
  id: string;
  serviceType: VendorServiceType;
  status: VendorVerificationStatus;
  commissionPercent: number;
  rejectedReason?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  vendorProfileId: string;
  vendor: {
    id: string;
    vendorName: string;
    ownerName: string;
    email: string;
    phone: string;
    verificationStatus: VendorVerificationStatus;
  };
};

export async function listAdminVendorServiceRequests(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: VendorVerificationStatus;
  sortOrder?: "asc" | "desc";
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.search) search.set("search", params.search);
  if (params?.status) search.set("status", params.status);
  if (params?.sortOrder) search.set("sortOrder", params.sortOrder);
  const qs = search.toString();

  const res = await authFetch(
    `/api/vendors/service-requests${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading service requests.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return data as {
    success: boolean;
    data: AdminVendorServiceRequest[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  };
}

export async function getMyVendorProfile() {
  const res = await authFetch("/api/vendors/me", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    networkErrorMessage: "Network error while checking vendor request status.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as GetMyVendorProfileResponse).data;
}

export type AdminVendorProfile = {
  id: string;
  userId: string;
  slug?: string;
  vendorName: string;
  businessType: "INDIVIDUAL" | "COMPANY" | "PARTNERSHIP";
  ownerName: string;
  bio?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  websiteUrl?: string | null;
  publicPhone?: string | null;
  publicEmail?: string | null;
  countryCode?: string | null;
  city?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  idDocumentUrl?: string | null;
  idVerificationStatus?: VendorIdVerificationStatus | null;
  idVerificationProvider?: string | null;
  idVerifiedAt?: string | null;
  eidNumber?: string | null;
  eidExpiry?: string | null;
  eidCopyUrl?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  passportCopyUrl?: string | null;
  legalEntityName?: string | null;
  incorporationDate?: string | null;
  tradeLicenseNumber: string;
  tradeLicenseExpiry?: string | null;
  tradeLicenseCopyUrl: string;
  annualRevenueRange?: string | null;
  financialStatementUrl?: string | null;
  verificationDocuments: string[];
  email: string;
  phone: string;
  address: string;
  taxId: string;
  paymentTerms: "NET_15" | "NET_30" | "NET_60";
  verificationStatus: VendorVerificationStatus;
  rejectedReason: string | null;
  services?: VendorServiceEnrollment[];
  enabledServices?: VendorServiceType[];
  createdAt: string;
  updatedAt: string;
};

type ListAdminVendorsResponse = {
  success: boolean;
  data: AdminVendorProfile[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function listAdminVendorProfiles(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: VendorVerificationStatus | "ALL";
  sortBy?: "createdAt" | "vendorName" | "ownerName";
  sortOrder?: "asc" | "desc";
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.search) search.set("search", params.search);
  if (params?.status && params.status !== "ALL") {
    search.set("status", params.status);
  }
  if (params?.sortBy) search.set("sortBy", params.sortBy);
  if (params?.sortOrder) search.set("sortOrder", params.sortOrder);
  const qs = search.toString();

  const res = await authFetch(`/api/vendors${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    networkErrorMessage: "Network error while loading vendor requests.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  const envelope = data as ListAdminVendorsResponse;
  return {
    data: envelope.data,
    meta: envelope.meta,
  };
}

type UpdateVendorVerificationBody = {
  verificationStatus: VendorVerificationStatus;
  rejectedReason?: string;
};

export async function updateVendorVerification(
  id: string,
  body: UpdateVendorVerificationBody,
) {
  const res = await authFetch(
    `/api/vendors/${encodeURIComponent(id)}/verification`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while updating vendor status.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as { success: boolean; data: AdminVendorProfile }).data;
}

type UpdateVendorIdVerificationBody = {
  status: VendorIdVerificationStatus;
  rejectedReason?: string;
};

export async function updateVendorIdVerification(
  id: string,
  body: UpdateVendorIdVerificationBody,
) {
  const res = await authFetch(
    `/api/vendors/${encodeURIComponent(id)}/id-verification`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while updating ID verification.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as { success: boolean; data: AdminVendorProfile }).data;
}

export type UpdateVendorPublicProfileBody = {
  vendorName?: string;
  slug?: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  bio?: string | null;
  websiteUrl?: string | null;
  publicPhone?: string | null;
  publicEmail?: string | null;
};

export async function updateMyVendorPublicProfile(body: UpdateVendorPublicProfileBody) {
  const res = await authFetch("/api/vendors/me/public", {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while updating vendor profile.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as { success: boolean; data: VendorProfile }).data;
}

export type PublicOrganizerProfile = {
  id: string;
  slug: string;
  vendorName: string;
  businessType: string;
  ownerName: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  bio: string | null;
  websiteUrl: string | null;
  phone: string;
  email: string;
  address: string;
  reviewSummary: {
    averageRating: number | null;
    count: number;
  };
  listingCounts: Record<PublicOrganizerListingTab, number>;
};

export type PublicOrganizerListingTab =
  | "upcoming"
  | "past"
  | "venues"
  | "attractions"
  | "services"
  | "reviews";

export type PublicOrganizerReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
  };
};

export type PublicOrganizerListing = {
  id: string;
  slug?: string;
  eventName?: string;
  name?: string;
  title?: string;
  city?: string | null;
  countryCode?: string | null;
  coverImage?: string | null;
  thumbnail?: string | null;
  startDateTime?: string;
  endDateTime?: string;
  capacityMax?: number | null;
  basePrice?: number | string | null;
  currency?: string | null;
};

export async function getPublicOrganizerProfile(slug: string) {
  const json = await apiGet<{ success: boolean; data: PublicOrganizerProfile }>(
    `/api/vendors/public/${encodeURIComponent(slug)}`,
  );
  return json.data;
}

export type VendorDirectoryItem = {
  id: string;
  slug: string;
  vendorName: string;
  ownerName: string;
  email: string;
  phone: string;
  verificationStatus: VendorVerificationStatus;
  isPlatformProfile: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
  } | null;
  counts: {
    venues: number;
    events: number;
    attractions: number;
    marketplaceServices: number;
  };
  reviewSummary: {
    averageRating: number | null;
    count: number;
  };
};

export async function listVendorDirectory(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: VendorVerificationStatus;
  sortBy?: "createdAt" | "vendorName";
  sortOrder?: "asc" | "desc";
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.search) search.set("search", params.search);
  if (params?.status) search.set("status", params.status);
  if (params?.sortBy) search.set("sortBy", params.sortBy);
  if (params?.sortOrder) search.set("sortOrder", params.sortOrder);
  const qs = search.toString();

  const res = await authFetch(`/api/vendors/directory${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading vendors.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return data as {
    success: boolean;
    data: VendorDirectoryItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  };
}

export async function getAdminVendorDetail(id: string) {
  const res = await authFetch(`/api/vendors/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading vendor details.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as { success: boolean; data: AdminVendorProfile & {
    reviewSummary: { averageRating: number | null; count: number };
    counts: { venues: number; events: number; attractions: number; marketplaceServices: number };
  } }).data;
}

export async function getPublicOrganizerListings(
  slug: string,
  tab: PublicOrganizerListingTab,
  page = 1,
  limit = 12,
) {
  return apiGet<{
    success: boolean;
    data: PublicOrganizerListing[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(
    `/api/vendors/public/${encodeURIComponent(slug)}/${tab}?page=${page}&limit=${limit}`,
  );
}

export async function getPublicOrganizerReviews(
  slug: string,
  page = 1,
  limit = 12,
) {
  return apiGet<{
    success: boolean;
    data: PublicOrganizerReview[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(
    `/api/vendors/public/${encodeURIComponent(slug)}/reviews?page=${page}&limit=${limit}`,
  );
}

