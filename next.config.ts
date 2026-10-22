import type { NextConfig } from "next";
const config: NextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    cpus: 1,
  },
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'" +
              (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "") +
              "; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/precos", destination: "/#section-hero", permanent: false },
      { source: "/recursos", destination: "/#section-recursos", permanent: false },
      { source: "/ajuda", destination: "/#section-hero", permanent: false },
    ];
  },
};
export default config;
