import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, "Invalid response from server");
  }
}

/**
 * Opens private S3 objects: backend validates access and returns a short-lived GET URL.
 */
export async function getPresignedViewUrl(fileUrl: string): Promise<string> {
  const res = await authFetch("/api/uploads/presigned-get", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileUrl }),
    networkErrorMessage: "Network error while requesting file access.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  const viewUrl = (data as { success?: boolean; data?: { viewUrl?: string } }).data
    ?.viewUrl;
  if (typeof viewUrl !== "string" || !viewUrl) {
    throw new ApiError(res.status, "Invalid presigned URL response");
  }
  return viewUrl;
}
