import type { NextConfig } from "next";

const developmentScriptSource =
  process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";
const sourceOrigin = (value?: string) => { if (!value) return ""; try { return new URL(value).origin; } catch { return ""; } };
// `next.config` is evaluated before a root-level .env is made available in every
// workspace invocation. Keep the local API origin explicit in development so the
// restrictive CSP does not silently block the normal `npm run dev` topology.
const developmentApiOrigin = process.env.NODE_ENV === "production" ? "" : "http://localhost:4000";
const connectSources = ["'self'", developmentApiOrigin, sourceOrigin(process.env.NEXT_PUBLIC_API_URL), sourceOrigin(process.env.NEXT_PUBLIC_IPV4_ENDPOINT), sourceOrigin(process.env.NEXT_PUBLIC_IPV6_ENDPOINT), process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? "https://plausible.io" : "", "https://challenges.cloudflare.com"].filter(Boolean).join(" ");
const probeImageSource = process.env.NEXT_PUBLIC_PROBE_IMAGE_SOURCE ?? "";
const isPreview = process.env.NEXT_PUBLIC_PREVIEW === "true";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@sfrankey/shared",
    "@sfrankey/tool-core",
    "@sfrankey/ui",
    "@sfrankey/i18n",
    "geist",
  ],
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=()" },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; img-src 'self' data: blob: https://challenges.cloudflare.com ${probeImageSource}; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${developmentScriptSource} https://plausible.io https://challenges.cloudflare.com; worker-src 'self'; connect-src ${connectSources}; frame-src 'self' https://challenges.cloudflare.com; font-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
          },
          ...(isPreview ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] : []),
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};
export default nextConfig;
