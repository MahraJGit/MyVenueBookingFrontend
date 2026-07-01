import { ApiError } from "@/lib/api/errors";
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

/** Matches GET /api/users/me `data` (user-management fields only). */
export type UserProfile = {
  id: string;
  email: string | null;
  phone: string | null;
  phoneCountryCode: string | null;
  firstName: string;
  lastName: string;
  dob: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  avatarUrl: string | null;
};

export type UpdateUserProfileBody = {
  firstName?: string;
  lastName?: string;
  dob?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  avatarUrl?: string;
};

type UserProfileResponse = {
  success: boolean;
  data: UserProfile;
};

export async function getMyProfile() {
  const res = await authFetch("/api/users/me", {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading your profile.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as UserProfileResponse).data;
}

export async function updateMyProfile(body: UpdateUserProfileBody) {
  const res = await authFetch("/api/users/me", {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while saving your profile.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as UserProfileResponse).data;
}

const AVATAR_UPLOAD_FOLDER = "user-avatars";

/** Upload avatar image; returns URL to pass as `avatarUrl` on profile update. */
export async function uploadUserAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(
    `/api/uploads/single?folder=${encodeURIComponent(AVATAR_UPLOAD_FOLDER)}`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
      networkErrorMessage: "Network error while uploading avatar.",
    },
  );

  const json = await parseJson<{
    success?: boolean;
    data?: { url?: string };
  }>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  const url = json.data?.url;
  if (!url) {
    throw new ApiError(res.status, "Upload response missing URL");
  }
  return url;
}

export type UserRole = "BUYER" | "VENDOR" | "ADMIN";
export type UserAccountStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";

export type AdminUser = {
  id: string;
  email: string | null;
  phone: string | null;
  phoneCountryCode: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserAccountStatus;
  createdAt: string;
  updatedAt: string;
};

export type ListAdminUsersResult = {
  data: AdminUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ListAdminUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | "ALL";
  status?: UserAccountStatus | "ALL";
  sortBy?: "createdAt" | "email" | "firstName" | "lastName";
  sortOrder?: "asc" | "desc";
};

export type AdminUpdateUserBody = {
  role?: UserRole;
  status?: UserAccountStatus;
};

type AdminUsersListResponse = {
  success: boolean;
  data: ListAdminUsersResult;
};

type AdminUserResponse = {
  success: boolean;
  data: AdminUser;
};

export async function listAdminUsers(
  params?: ListAdminUsersParams,
): Promise<ListAdminUsersResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 10));
  if (params?.search) sp.set("search", params.search);
  if (params?.role && params.role !== "ALL") sp.set("role", params.role);
  if (params?.status && params.status !== "ALL") sp.set("status", params.status);
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortOrder) sp.set("sortOrder", params.sortOrder);

  const res = await authFetch(`/api/users?${sp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading users.",
  });

  const json = await parseJson<AdminUsersListResponse>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return json.data;
}

export async function updateUserByAdmin(
  id: string,
  body: AdminUpdateUserBody,
): Promise<AdminUser> {
  const res = await authFetch(`/api/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while updating user.",
  });

  const json = await parseJson<AdminUserResponse>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return json.data;
}
