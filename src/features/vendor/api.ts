import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";
import { uploadSingleFile } from "@/features/uploads/upload-single";

const VENDOR_DOCS_FOLDER = "vendor-documents";

type UploadOptions = {
  onProgress?: (progress: number) => void;
  maxRetries?: number;
};

type CreateVendorProfileBody = {
  vendorName: string;
  businessType: "INDIVIDUAL" | "COMPANY" | "PARTNERSHIP";
  ownerName: string;
  eidNumber: string;
  eidExpiry: string;
  eidCopyUrl: string;
  passportNumber: string;
  passportExpiry: string;
  passportCopyUrl: string;
  legalEntityName: string;
  incorporationDate: string;
  tradeLicenseNumber: string;
  tradeLicenseExpiry: string;
  tradeLicenseCopyUrl: string;
  verificationDocuments: string[];
  email: string;
  phone: string;
  address: string;
  taxId: string;
  paymentTerms: "NET_15" | "NET_30" | "NET_60";
};

type CreateVendorProfileResponse = {
  success: boolean;
  data: unknown;
};

export type VendorVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type VendorProfile = {
  verificationStatus: VendorVerificationStatus;
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
  vendorName: string;
  businessType: "INDIVIDUAL" | "COMPANY" | "PARTNERSHIP";
  ownerName: string;
  eidNumber: string;
  eidExpiry: string;
  eidCopyUrl: string;
  passportNumber: string;
  passportExpiry: string;
  passportCopyUrl: string;
  legalEntityName: string;
  incorporationDate: string;
  tradeLicenseNumber: string;
  tradeLicenseExpiry: string;
  tradeLicenseCopyUrl: string;
  verificationDocuments: string[];
  email: string;
  phone: string;
  address: string;
  taxId: string;
  paymentTerms: "NET_15" | "NET_30" | "NET_60";
  verificationStatus: VendorVerificationStatus;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListAdminVendorsResponse = {
  success: boolean;
  data: AdminVendorProfile[];
};

export async function listAdminVendorProfiles(
  filter: "ALL" | VendorVerificationStatus,
) {
  const qs =
    filter !== "ALL"
      ? `?status=${encodeURIComponent(filter)}`
      : "";
  const res = await authFetch(`/api/vendors${qs}`, {
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

  return (data as ListAdminVendorsResponse).data;
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

