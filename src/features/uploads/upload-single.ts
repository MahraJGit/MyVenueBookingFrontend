import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";
import { assertApiConfigured } from "@/lib/env";
import { refreshAndApplySession } from "@/features/auth/coordinated-refresh";
import { getAccessToken } from "@/features/auth/session-storage";
import {
  getUploadFileTooLargeMessageForFile,
  isUploadFileTooLarge,
  validateUploadFile,
} from "./validation";

type UploadSingleResponse = {
  success?: boolean;
  data?: { url?: string };
  message?: string;
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

function uploadViaFetch(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  return authFetch(`/api/uploads/single?folder=${encodeURIComponent(folder)}`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
    networkErrorMessage:
      "Could not reach the server while uploading. Check your connection and try again.",
  }).then(async (res) => {
    const json = await parseJson<UploadSingleResponse>(res);
    if (!res.ok) {
      throw ApiError.fromUnknown(res.status, json);
    }
    const url = json.data?.url;
    if (!url) {
      throw new ApiError(res.status, "Upload response missing URL");
    }
    return url;
  });
}

function uploadViaXhr(
  file: File,
  folder: string,
  onProgress?: (progress: number) => void,
  authAttempt = 0,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const baseUrl = assertApiConfigured();
    const url = `${baseUrl}/api/uploads/single?folder=${encodeURIComponent(folder)}`;
    const token = getAccessToken();
    if (!token) {
      reject(new ApiError(401, "Please sign in to continue."));
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
      onProgress(
        Math.min(100, Math.round((event.loaded / event.total) * 100)),
      );
    };

    xhr.onerror = () => {
      reject(
        new ApiError(
          0,
          isUploadFileTooLarge(file)
            ? getUploadFileTooLargeMessageForFile(file)
            : "Could not reach the server while uploading. Check your connection and try again.",
        ),
      );
    };

    xhr.onload = () => {
      if (xhr.status === 401 && authAttempt === 0) {
        refreshAndApplySession()
          .then((refreshed) => {
            if (!refreshed) {
              throw new ApiError(401, "Please sign in to continue.");
            }
            return uploadViaXhr(file, folder, onProgress, 1);
          })
          .then(resolve)
          .catch((error) => {
            reject(
              error instanceof ApiError
                ? error
                : new ApiError(401, "Please sign in to continue."),
            );
          });
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        try {
          const parsed = JSON.parse(xhr.responseText) as UploadSingleResponse;
          const uploadedUrl = parsed.data?.url;
          if (!uploadedUrl) {
            reject(new ApiError(xhr.status, "Upload response missing URL"));
            return;
          }
          resolve(uploadedUrl);
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
            xhr.status === 413
              ? getUploadFileTooLargeMessageForFile(file)
              : "Failed to upload file. Please try again.",
          ),
        );
      }
    };

    xhr.send(formData);
  });
}

export type UploadSingleFileOptions = {
  onProgress?: (progress: number) => void;
  maxRetries?: number;
};

export async function uploadSingleFile(
  file: File,
  folder: string,
  options?: UploadSingleFileOptions,
): Promise<string> {
  validateUploadFile(file);

  if (options?.onProgress) {
    const maxRetries = options.maxRetries ?? 2;
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        return await uploadViaXhr(file, folder, options.onProgress);
      } catch (error) {
        lastError = error;
        if (error instanceof ApiError && error.statusCode === 413) {
          throw error;
        }
        if (attempt < maxRetries) {
          options.onProgress(0);
        }
      }
    }
    throw lastError;
  }

  return uploadViaFetch(file, folder);
}
