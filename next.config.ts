import type { NextConfig } from "next";

const PRIVATE_NO_STORE_HEADER = {
  key: "Cache-Control",
  value: "private, no-store",
};

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/api/:path*", headers: [PRIVATE_NO_STORE_HEADER] },
      { source: "/calendar/:path*", headers: [PRIVATE_NO_STORE_HEADER] },
    ];
  },
};

export default nextConfig;
