import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";
import { assertApiConfigured } from "@/lib/env";
import { refreshAuthTokens } from "@/features/auth/api";
import { clearAuthSession, getAccessToken, updateAccessToken } from "@/features/auth/session-storage";

const VENDOR_DOCS_FOLDER = "vendor-documents";

type UploadSingleViaApiResponse = {
  success: boolean;
  data: {
    url: string;
  };
};

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
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(
    `/api/uploads/single?folder=${encodeURIComponent(VENDOR_DOCS_FOLDER)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
      networkErrorMessage: "Network error while uploading file.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  const parsed = data as UploadSingleViaApiResponse;
  return parsed.data.url;
}

function uploadVendorDocumentViaBackendWithProgress(
  file: File,
  onProgress?: (progress: number) => void,
  authAttempt = 0,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const baseUrl = assertApiConfigured();
    const url = `${baseUrl}/api/uploads/single?folder=${encodeURIComponent(VENDOR_DOCS_FOLDER)}`;
    const token = getAccessToken();
    if (!token) {
      reject(new ApiError(401, "Please login to continue."));
      return;
    }

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Accept", "application/json");

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const progress = Math.min(
        100,
        Math.round((event.loaded / event.total) * 100),
      );
      onProgress(progress);
    };

    xhr.onerror = () => {
      reject(new ApiError(0, "Network error while uploading file to storage."));
    };

    xhr.onload = () => {
      if (xhr.status === 401 && authAttempt === 0) {
        refreshAuthTokens()
          .then((data) => {
            updateAccessToken(data.accessToken);
            return uploadVendorDocumentViaBackendWithProgress(
              file,
              onProgress,
              1,
            );
          })
          .then(resolve)
          .catch(() => {
            clearAuthSession();
            reject(new ApiError(401, "Please login to continue."));
          });
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        try {
          const parsed = JSON.parse(xhr.responseText) as UploadSingleViaApiResponse;
          resolve(parsed.data.url);
        } catch {
          reject(new ApiError(xhr.status, "Invalid response from server."));
        }
        return;
      }

      try {
        const errBody = JSON.parse(xhr.responseText) as unknown;
        reject(ApiError.fromUnknown(xhr.status, errBody));
      } catch {
        reject(
          new ApiError(
            xhr.status,
            "Failed to upload file to storage. Please try again.",
          ),
        );
      }
    };

    xhr.send(formData);
  });
}

export async function uploadSingleVendorDocument(file: File): Promise<string> {
  return uploadVendorDocumentViaBackend(file);
}

export async function uploadSingleVendorDocumentWithProgress(
  file: File,
  options?: UploadOptions,
): Promise<string> {
  const maxRetries = options?.maxRetries ?? 2;
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await uploadVendorDocumentViaBackendWithProgress(
        file,
        options?.onProgress,
      );
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        options?.onProgress?.(0);
      }
    }
  }

  throw lastError;
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

