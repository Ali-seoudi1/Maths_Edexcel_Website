import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "no-referrer",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep the PDF dependency filesystem-backed, then include the files resolved
  // through PDFKit's private package import map in each PDF function.
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/app/api/admin/reports/pdf": ["./node_modules/pdfkit/js/standard-fonts/*.cjs"],
    "/app/api/admin/reports/combined/[id]/pdf": ["./node_modules/pdfkit/js/standard-fonts/*.cjs"],
    "/app/api/reports/published/pdf": ["./node_modules/pdfkit/js/standard-fonts/*.cjs"],
    "/app/api/reports/combined/[id]/pdf": ["./node_modules/pdfkit/js/standard-fonts/*.cjs"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
