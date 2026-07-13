import { NextRequest, NextResponse } from "next/server";

import { getPublicApiBaseUrl } from "@/lib/env";
import { isPrivateS3Url } from "@/features/uploads/s3-url";
import {
  mediaRefreshCookieOptions,
  resolveMediaAuth,
} from "@/lib/api/server-media-auth";

/**
 * Proxies private S3 images through Next.js so <img> tags can load them
 * using the HttpOnly refresh cookie (no Authorization header needed).
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")?.trim();
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  if (!isPrivateS3Url(url)) {
    return NextResponse.redirect(url);
  }

  const apiBase = getPublicApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const headers: HeadersInit = {};
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const auth = await resolveMediaAuth(refreshToken);
  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  const imageRes = await fetch(
    `${apiBase}/api/uploads/image?url=${encodeURIComponent(url)}`,
    { headers, cache: "no-store" },
  );

  if (!imageRes.ok) {
    return NextResponse.json({ error: "Image unavailable" }, { status: imageRes.status });
  }

  const contentType = imageRes.headers.get("content-type") || "image/jpeg";
  const buffer = await imageRes.arrayBuffer();

  const response = new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });

  if (auth?.newRefreshToken) {
    response.cookies.set(
      "refreshToken",
      auth.newRefreshToken,
      mediaRefreshCookieOptions(),
    );
  }

  return response;
}
