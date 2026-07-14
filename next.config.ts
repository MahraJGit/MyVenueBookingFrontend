import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Absolute path to this Next.js app (not the monorepo or user-home lockfile root)
const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: frontendRoot,
  },
  images: {
    localPatterns: [
      // Static assets in public/images (logos, blog cards, fallbacks, etc.)
      {
        pathname: "/images/**",
        search: "",
      },
      // Auth cookie media proxy — query string carries the S3 URL
      {
        pathname: "/api/media",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
