import { isPrivateS3Url } from "./s3-url";

/** Same-origin proxy route — works in <img> tags with refresh cookie auth. */
export function getMediaProxyUrl(storedUrl: string): string {
  const trimmed = storedUrl.trim();
  if (!trimmed) return "";
  if (!isPrivateS3Url(trimmed)) return trimmed;
  return `/api/media?url=${encodeURIComponent(trimmed)}`;
}
