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
