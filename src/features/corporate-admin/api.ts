import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";

export type OrganizationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type OrganizationDocumentType =
  | "TRADE_LICENSE"
  | "MEMORANDUM"
  | "VAT_CERTIFICATE"
  | "OTHER";

export type CorporateOrgDocument = {
  id: string;
  organizationId: string;
  type: OrganizationDocumentType;
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
  uploadedAt: string;
};

export type CorporateOrgOwner = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
};

export type AdminCorporateOrganization = {
  id: string;
  name: string;
  slug: string;
  tradeLicenseNumber: string;
  tradeLicenseExpiry: string | null;
  legalEntityName: string | null;
  vatTrnNumber: string | null;
  logoUrl: string | null;
  about: string | null;
  billingEmail: string | null;
  billingAddress: string | null;
  preferredCurrency: string;
  timezone: string;
  fiscalYearStartMonth: number;
  industry: string | null;
  companySize: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  status: OrganizationStatus;
  submissionCount: number;
  rejectedReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documents: CorporateOrgDocument[];
  members: Array<{
    id: string;
    role: string;
    corporateUser: CorporateOrgOwner;
  }>;
};

type ListResponse = {
  success: boolean;
  data: AdminCorporateOrganization[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    maxSubmissions: number;
  };
};

type DetailResponse = {
  success: boolean;
  data: AdminCorporateOrganization;
  meta: {
    maxSubmissions: number;
    remainingSubmissions: number;
  };
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

export async function listAdminCorporateOrganizations(params: {
  page: number;
  limit: number;
  status?: OrganizationStatus;
}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("limit", String(params.limit));
  if (params.status) search.set("status", params.status);

  const res = await authFetch(
    `/api/corporate/organizations/admin/list?${search.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading corporate organizations.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);

  const envelope = data as ListResponse;
  return { data: envelope.data, meta: envelope.meta };
}

export async function getAdminCorporateOrganization(id: string) {
  const res = await authFetch(
    `/api/corporate/organizations/admin/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading organization details.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);

  const envelope = data as DetailResponse;
  return { organization: envelope.data, meta: envelope.meta };
}

export async function approveAdminCorporateOrganization(id: string) {
  const res = await authFetch(
    `/api/corporate/organizations/admin/${encodeURIComponent(id)}/approve`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while approving organization.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);

  return data as { success: boolean; message: string; data: AdminCorporateOrganization };
}

export async function rejectAdminCorporateOrganization(
  id: string,
  reason: string,
) {
  const res = await authFetch(
    `/api/corporate/organizations/admin/${encodeURIComponent(id)}/reject`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
      networkErrorMessage: "Network error while rejecting organization.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);

  return data as {
    success: boolean;
    message: string;
    data: AdminCorporateOrganization;
    meta?: { suspended?: boolean };
  };
}
