import { z } from "zod";
import type {
  DnsLookupResult,
  DnsRecord,
  DnsRecordType,
  IpProfile,
  PrivacyAssessment,
  ProviderCapabilities,
} from "@sfrankey/shared";
import { normalizeHostname, normalizeIp } from "@sfrankey/tool-core/network";
import { ApiError } from "./api-error";

const unknown = "unknown" as const;
const emptyCapabilities: ProviderCapabilities = {
  country: false,
  city: false,
  asn: false,
  networkType: false,
  privacy: false,
  residentialProxy: false,
};

let ipinfoFailures = 0;
let ipinfoCircuitOpenUntil = 0;

const ipinfoSchema = z
  .object({
    ip: z.string().optional(),
    hostname: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    country_code: z.string().optional(),
    timezone: z.string().optional(),
    org: z.string().optional(),
    geo: z
      .object({
        city: z.string().optional(),
        region: z.string().optional(),
        country: z.string().optional(),
        country_code: z.string().optional(),
        timezone: z.string().optional(),
      })
      .passthrough()
      .optional(),
    asn: z
      .object({
        asn: z.string().optional(),
        name: z.string().optional(),
        domain: z.string().optional(),
        type: z.string().optional(),
      })
      .passthrough()
      .optional(),
    privacy: z
      .object({
        vpn: z.boolean().optional(),
        proxy: z.boolean().optional(),
        tor: z.boolean().optional(),
        relay: z.boolean().optional(),
        hosting: z.boolean().optional(),
        service: z.string().optional(),
      })
      .passthrough()
      .optional(),
    is_vpn: z.boolean().optional(),
    is_proxy: z.boolean().optional(),
    is_tor: z.boolean().optional(),
    is_relay: z.boolean().optional(),
    is_hosting: z.boolean().optional(),
    is_mobile: z.boolean().optional(),
    is_anonymous: z.boolean().optional(),
    is_residential_proxy: z.boolean().optional(),
    is_anycast: z.boolean().optional(),
  })
  .passthrough();

function state(value: unknown) {
  return typeof value === "boolean" ? (value ? ("detected" as const) : ("not-detected" as const)) : unknown;
}

async function providerJson(url: URL, timeoutMs: number, maxBytes = 65_536) {
  let response: Response;
  try {
    response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    throw new ApiError(503, "PROVIDER_UNAVAILABLE", "The data provider is unavailable.");
  }
  if (!response.ok) throw new ApiError(response.status === 429 ? 503 : 502, "PROVIDER_UNAVAILABLE", "The data provider is unavailable.");
  const text = await response.text();
  if (Buffer.byteLength(text) > maxBytes) throw new ApiError(502, "PROVIDER_UNAVAILABLE", "The provider returned an invalid response.");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(502, "PROVIDER_UNAVAILABLE", "The provider returned an invalid response.");
  }
}

async function ipinfo(ip: string) {
  const token = process.env.IPINFO_TOKEN;
  const baseUrl = process.env.IPINFO_BASE_URL ?? "https://ipinfo.io";
  const timeoutMs = Number(process.env.IPINFO_TIMEOUT_MS ?? "3000");

  if (!token) throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "IP intelligence is not configured.");
  if (Date.now() < ipinfoCircuitOpenUntil) throw new ApiError(503, "PROVIDER_UNAVAILABLE", "IP intelligence is temporarily unavailable.");

  const url = new URL(`/lookup/${encodeURIComponent(ip)}`, baseUrl);
  url.searchParams.set("token", token);
  try {
    const parsed = ipinfoSchema.safeParse(await providerJson(url, timeoutMs));
    if (!parsed.success) throw new ApiError(502, "PROVIDER_UNAVAILABLE", "The provider returned an invalid response.");
    ipinfoFailures = 0;
    ipinfoCircuitOpenUntil = 0;
    return parsed.data;
  } catch (error) {
    ipinfoFailures += 1;
    if (ipinfoFailures >= 5) {
      ipinfoCircuitOpenUntil = Date.now() + 30_000;
      ipinfoFailures = 0;
    }
    throw error;
  }
}

export async function lookupMyIp(remoteIp?: string): Promise<IpProfile> {
  let targetIp = remoteIp;
  if (!targetIp || normalizeIp(targetIp).scope !== "public") {
    try {
      const publicEcho = await fetch("https://api64.ipify.org?format=json", { signal: AbortSignal.timeout(2500) });
      if (publicEcho.ok) {
        const payload = (await publicEcho.json()) as { ip?: string };
        if (payload.ip) {
          targetIp = payload.ip;
        }
      }
    } catch {
      // offline / private network fallback
    }
  }
  return lookupIp(targetIp ?? "127.0.0.1");
}

export async function lookupIp(ip: string): Promise<IpProfile> {
  const normalized = normalizeIp(ip);
  const token = process.env.IPINFO_TOKEN;

  if (normalized.scope !== "public" || !token) {
    if (normalized.scope === "public" && !token) {
      try {
        const ipApiRes = await fetch(
          `http://ip-api.com/json/${encodeURIComponent(normalized.ip)}?fields=status,message,country,countryCode,region,regionName,city,timezone,isp,org,as,reverse,mobile,proxy,hosting,query`,
          { signal: AbortSignal.timeout(3000) }
        );
        if (ipApiRes.ok) {
          const d = (await ipApiRes.json()) as {
            status?: string;
            country?: string;
            countryCode?: string;
            regionName?: string;
            city?: string;
            timezone?: string;
            isp?: string;
            org?: string;
            as?: string;
            reverse?: string;
            mobile?: boolean;
            proxy?: boolean;
            hosting?: boolean;
          };
          if (d.status === "success") {
            const asnMatch = d.as?.match(/^(AS\d+)\s*(.*)$/);
            const asnNumber = asnMatch ? asnMatch[1] : d.as;
            const asnName = asnMatch && asnMatch[2] ? asnMatch[2] : d.org || d.isp;
            return {
              ...normalized,
              approximate: true,
              countryCode: d.countryCode,
              region: d.regionName,
              city: d.city,
              timezone: d.timezone,
              reverseDns: d.reverse || undefined,
              asn: asnNumber ? { number: asnNumber, name: asnName, type: d.hosting ? "hosting" : "isp" } : undefined,
              network: {
                type: d.hosting ? "hosting" : d.mobile ? "mobile" : "isp",
                anycast: unknown,
                mobile: typeof d.mobile === "boolean" ? (d.mobile ? "detected" : "not-detected") : unknown,
                hosting: typeof d.hosting === "boolean" ? (d.hosting ? "detected" : "not-detected") : unknown,
              },
              capabilities: {
                country: true,
                city: true,
                asn: true,
                networkType: true,
                privacy: typeof d.proxy === "boolean",
                residentialProxy: false,
              },
            };
          }
        }
      } catch {
        // fallback to basic
      }
    }
    return {
      ...normalized,
      approximate: true,
      capabilities: emptyCapabilities,
      network: { anycast: unknown, mobile: unknown, hosting: unknown },
    };
  }

  const data = await ipinfo(normalized.ip);
  const countryCode = data.geo?.country_code ?? data.country_code ?? data.country;
  const asnText = data.asn?.asn ?? data.org?.match(/AS\d+/i)?.[0];
  const capabilities: ProviderCapabilities = {
    country: Boolean(countryCode),
    city: Boolean(data.geo?.city ?? data.city),
    asn: Boolean(asnText),
    networkType: Boolean(data.asn?.type),
    privacy: Boolean(data.privacy || [data.is_vpn, data.is_proxy, data.is_tor, data.is_relay, data.is_hosting].some((value) => typeof value === "boolean")),
    residentialProxy: typeof data.is_residential_proxy === "boolean",
  };
  return {
    ...normalized,
    approximate: true,
    countryCode,
    region: data.geo?.region ?? data.region,
    city: data.geo?.city ?? data.city,
    timezone: data.geo?.timezone ?? data.timezone,
    reverseDns: data.hostname,
    asn: asnText ? { number: asnText, name: data.asn?.name ?? data.org?.replace(/^AS\d+\s*/, ""), domain: data.asn?.domain, type: data.asn?.type } : undefined,
    network: {
      type: data.asn?.type,
      anycast: state(data.is_anycast),
      mobile: state(data.is_mobile),
      hosting: state(data.privacy?.hosting ?? data.is_hosting),
    },
    capabilities,
  };
}

export async function checkIpPrivacy(ip: string): Promise<PrivacyAssessment> {
  const normalized = normalizeIp(ip);
  if (normalized.scope !== "public") throw new ApiError(400, "NON_PUBLIC_IP", "Privacy detection only applies to public IP addresses.");
  const token = process.env.IPINFO_TOKEN;

  if (!token) {
    try {
      const ipApiRes = await fetch(
        `http://ip-api.com/json/${encodeURIComponent(normalized.ip)}?fields=status,proxy,hosting,mobile`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (ipApiRes.ok) {
        const d = (await ipApiRes.json()) as { status?: string; proxy?: boolean; hosting?: boolean; mobile?: boolean };
        if (d.status === "success") {
          return {
            vpn: typeof d.proxy === "boolean" ? (d.proxy ? "detected" : "not-detected") : unknown,
            proxy: typeof d.proxy === "boolean" ? (d.proxy ? "detected" : "not-detected") : unknown,
            tor: unknown,
            relay: unknown,
            hosting: typeof d.hosting === "boolean" ? (d.hosting ? "detected" : "not-detected") : unknown,
            residentialProxy: unknown,
            mobile: typeof d.mobile === "boolean" ? (d.mobile ? "detected" : "not-detected") : unknown,
          };
        }
      }
    } catch {
      // fallback
    }
  }
  if (!token) throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "IP intelligence is not configured.");
  const data = await ipinfo(normalized.ip);
  const privacy = data.privacy;
  const hasCapability = Boolean(privacy || [data.is_vpn, data.is_proxy, data.is_tor, data.is_relay, data.is_hosting].some((value) => typeof value === "boolean"));
  if (!hasCapability) return { vpn: unknown, proxy: unknown, tor: unknown, relay: unknown, hosting: unknown, residentialProxy: unknown, mobile: unknown };
  return {
    vpn: state(privacy?.vpn ?? data.is_vpn),
    proxy: state(privacy?.proxy ?? data.is_proxy),
    tor: state(privacy?.tor ?? data.is_tor),
    relay: state(privacy?.relay ?? data.is_relay),
    hosting: state(privacy?.hosting ?? data.is_hosting),
    residentialProxy: state(data.is_residential_proxy),
    mobile: state(data.is_mobile),
    providerName: privacy?.service,
  };
}

const dohSchema = z.object({
  Status: z.number(),
  AD: z.boolean().optional(),
  Answer: z.array(z.object({ name: z.string(), type: z.number(), TTL: z.number(), data: z.string() })).optional(),
});
const recordNumber: Record<DnsRecordType, number> = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28, CAA: 257 };
const recordName = Object.fromEntries(Object.entries(recordNumber).map(([name, number]) => [number, name])) as Record<number, DnsRecordType>;

function normalizedDnsRecord(answer: { name: string; type: number; TTL: number; data: string }): DnsRecord | null {
  const type = recordName[answer.type];
  if (!type) return null;
  let value = answer.data;
  let priority: number | undefined;
  let flags: number | undefined;
  let tag: string | undefined;
  if (type === "MX") {
    const match = value.match(/^(\d+)\s+(.+)$/);
    if (match) {
      priority = Number(match[1]);
      value = match[2] ?? value;
    }
  }
  if (type === "CAA") {
    const match = value.match(/^(\d+)\s+(\S+)\s+"?(.+?)"?$/);
    if (match) {
      flags = Number(match[1]);
      tag = match[2];
      value = match[3] ?? value;
    }
  }
  if (type === "TXT") value = value.replace(/^"|"$/g, "").replace(/"\s+"/g, "");
  return { type, name: answer.name.replace(/\.$/, ""), ttl: Math.max(0, answer.TTL), value: value.replace(/\.$/, ""), priority, flags, tag };
}

export async function resolveDns(hostnameInput: string, types: DnsRecordType[]): Promise<DnsLookupResult> {
  const hostname = normalizeHostname(hostnameInput);
  const dohEndpoint = process.env.DNS_DOH_ENDPOINT ?? "https://cloudflare-dns.com/dns-query";
  const dohTimeout = Number(process.env.DNS_DOH_TIMEOUT_MS ?? "3000");

  const responses = await Promise.all(
    types.map(async (type) => {
      const url = new URL(dohEndpoint);
      url.searchParams.set("name", hostname);
      url.searchParams.set("type", type);
      url.searchParams.set("do", "true");
      const parsed = dohSchema.safeParse(await providerJson(url, dohTimeout, 262_144));
      if (!parsed.success) throw new ApiError(502, "DNS_LOOKUP_FAILED", "The DNS provider returned an invalid response.");
      return parsed.data;
    })
  );
  const nxdomain = responses.every((result) => result.Status === 3);
  const failed = responses.some((result) => result.Status !== 0 && result.Status !== 3);
  const records = responses.flatMap((result) => (result.Answer ?? []).map(normalizedDnsRecord).filter((record): record is DnsRecord => Boolean(record)));
  return {
    hostname,
    status: failed ? "ERROR" : nxdomain ? "NXDOMAIN" : "NOERROR",
    authenticatedData: responses.some((result) => result.AD === true),
    records,
  };
}

export type LeakSession = { sessionId: string; readToken: string; probeUrls: string[]; expiresAt: string };
export type LeakSessionResult = { status: "pending" | "complete" | "expired"; resolverIps: string[] };

async function probeRequest(path: string, init?: RequestInit) {
  const controlUrl = process.env.PROBE_CONTROL_URL;
  const controlToken = process.env.PROBE_CONTROL_TOKEN;
  if (!controlUrl || !controlToken) throw new ApiError(503, "PROBE_UNAVAILABLE", "The leak probe is not configured.");
  try {
    const response = await fetch(new URL(path, controlUrl), {
      ...init,
      headers: {
        ...init?.headers,
        authorization: `Bearer ${controlToken}`,
        "content-type": "application/json",
      },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error("probe");
    return (await response.json()) as unknown;
  } catch {
    throw new ApiError(503, "PROBE_UNAVAILABLE", "The leak probe is unavailable.");
  }
}

export async function createLeakSession(kind: "dns" | "combined") {
  return (await probeRequest("/internal/sessions", { method: "POST", body: JSON.stringify({ kind }) })) as LeakSession;
}
export async function getLeakSession(id: string, readToken: string) {
  return (await probeRequest(`/internal/sessions/${encodeURIComponent(id)}`, { headers: { "x-read-token": readToken } })) as LeakSessionResult;
}
export async function deleteLeakSession(id: string, readToken: string) {
  await probeRequest(`/internal/sessions/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "x-read-token": readToken } });
}
