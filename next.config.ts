import type { NextConfig } from "next";

const PRIVATE_NO_STORE_HEADER = {
  key: "Cache-Control",
  value: "private, no-store",
};

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/economic-documents/[id]/issue": [
      "./lib/economic-documents/fonts/**/*",
      "./node_modules/pdfkit/js/standard-fonts/**/*",
    ],
    "/api/clinical-tools/[toolId]/materials/[materialId]": [
      "./private/clinical-tools/originals/**/*",
    ],
  },
  async headers() {
    return [
      { source: "/api/:path*", headers: [PRIVATE_NO_STORE_HEADER] },
      { source: "/calendar/:path*", headers: [PRIVATE_NO_STORE_HEADER] },
    ];
  },
};

export default nextConfig;
