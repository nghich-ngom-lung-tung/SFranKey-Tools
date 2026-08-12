import type { NextConfig } from "next";

const developmentScriptSource = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

const nextConfig: NextConfig = {
  transpilePackages: ["@sfrankey/shared", "@sfrankey/tool-core", "@sfrankey/ui", "@sfrankey/i18n"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(self), microphone=()" },
      { key: "Content-Security-Policy", value: `default-src 'self'; img-src 'self' data: blob: https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'${developmentScriptSource} https://plausible.io https://challenges.cloudflare.com; connect-src 'self' https:; frame-src 'self' https://challenges.cloudflare.com; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` }
    ] }];
  }
};
export default nextConfig;
