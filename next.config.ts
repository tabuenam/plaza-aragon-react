import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
  {
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/**",
  },
  {
    protocol: "http",
    hostname: "127.0.0.1",
    pathname: "/storage/v1/**",
  },
  {
    protocol: "http",
    hostname: "localhost",
    pathname: "/storage/v1/**",
  },
];

if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    const protocol = (url.protocol.replace(":", "") || "https") as "http" | "https";
    const hostname = url.hostname;
    if (!remotePatterns.some((p) => p.hostname === hostname && p.protocol === protocol)) {
      remotePatterns.push({
        protocol,
        hostname,
        pathname: "/storage/v1/**",
      });
    }
  } catch {
    // Ignore invalid URL
  }
}

const isLocalSupabase =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("127.0.0.1") ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("localhost"));

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns,
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production" || isLocalSupabase,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4.5mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
