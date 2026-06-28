import type { NextRequest } from "next/server";
import { resolveProxyAccess } from "@/lib/proxy/resolve-access";

export function proxy(request: NextRequest) {
  return resolveProxyAccess(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
