import "dotenv/config";
import { z } from "zod";
const booleanValue = z.preprocess((value) => typeof value === "string" ? value.toLowerCase() === "true" : value, z.boolean());
const schema = z.object({
  API_PORT: z.coerce.number().int().positive().default(4000), API_VERSION: z.string().default("0.2.0"),
  API_CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3100"), API_TRUST_PROXY_CIDRS: z.string().default(""), API_EXPECT_PROXY_HEADERS: booleanValue.default(false),
  NETWORK_TOOLS_ENABLED: booleanValue.default(true), NETWORK_REQUIRE_TURNSTILE: booleanValue.default(false),
  TURNSTILE_SECRET_KEY: z.string().optional(), SMTP_HOST: z.string().optional(), SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(), SMTP_PASSWORD: z.string().optional(), FEEDBACK_TO_EMAIL: z.string().email().optional(),
  IPINFO_TOKEN: z.string().optional(), IPINFO_BASE_URL: z.string().url().default("https://api.ipinfo.io"), IPINFO_TIMEOUT_MS: z.coerce.number().int().positive().default(4000), IPINFO_REQUIRE_PRIVACY_CAPABILITY: booleanValue.default(true),
  DNS_DOH_ENDPOINT: z.string().url().default("https://cloudflare-dns.com/dns-query"), DNS_DOH_TIMEOUT_MS: z.coerce.number().int().positive().default(4000),
  PROBE_CONTROL_URL: z.string().url().optional(), PROBE_CONTROL_TOKEN: z.string().optional(), NETWORK_STUN_URL: z.string().default(""),
  NETWORK_IPV4_ENDPOINT: z.string().url().optional(), NETWORK_IPV6_ENDPOINT: z.string().url().optional()
});
export const env = schema.parse(process.env);
export const corsOrigins = env.API_CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
export const trustProxyCidrs = env.API_TRUST_PROXY_CIDRS.split(",").map((value) => value.trim()).filter(Boolean);
if (env.NETWORK_TOOLS_ENABLED && env.NETWORK_REQUIRE_TURNSTILE && !env.TURNSTILE_SECRET_KEY) throw new Error("TURNSTILE_SECRET_KEY is required when network tools require Turnstile.");
if (env.API_EXPECT_PROXY_HEADERS && trustProxyCidrs.length === 0) throw new Error("API_TRUST_PROXY_CIDRS is required when proxy headers are expected.");
