import ipaddr from "ipaddr.js";
import type { HeaderAssessment, IpScope, IpVersion } from "@sfrankey/shared";

export class NetworkInputError extends Error {
  constructor(public readonly code: string) { super(code); this.name = "NetworkInputError"; }
}

const ipv4Ranges: Array<[string, number, IpScope]> = [
  ["0.0.0.0", 8, "unspecified"], ["10.0.0.0", 8, "private"], ["100.64.0.0", 10, "carrier-grade-nat"],
  ["127.0.0.0", 8, "loopback"], ["169.254.0.0", 16, "link-local"], ["172.16.0.0", 12, "private"],
  ["192.0.0.0", 24, "reserved"], ["192.0.2.0", 24, "documentation"], ["192.168.0.0", 16, "private"],
  ["198.18.0.0", 15, "reserved"], ["198.51.100.0", 24, "documentation"], ["203.0.113.0", 24, "documentation"],
  ["224.0.0.0", 4, "multicast"], ["240.0.0.0", 4, "reserved"]
];
const ipv6Ranges: Array<[string, number, IpScope]> = [
  ["::", 128, "unspecified"], ["::1", 128, "loopback"], ["100::", 64, "reserved"], ["2001:db8::", 32, "documentation"],
  ["fc00::", 7, "private"], ["fe80::", 10, "link-local"], ["ff00::", 8, "multicast"]
];

function parsedIp(value: string): ipaddr.IPv4 | ipaddr.IPv6 {
  const trimmed = value.trim();
  if (!ipaddr.isValid(trimmed)) throw new NetworkInputError("INVALID_IP");
  const parsed = ipaddr.parse(trimmed);
  if (parsed.kind() === "ipv6" && (parsed as ipaddr.IPv6).isIPv4MappedAddress()) return (parsed as ipaddr.IPv6).toIPv4Address();
  return parsed;
}

export function normalizeIp(value: string): { ip: string; version: IpVersion; scope: IpScope } {
  const parsed = parsedIp(value);
  const version: IpVersion = parsed.kind() === "ipv4" ? 4 : 6;
  const ranges = version === 4 ? ipv4Ranges : ipv6Ranges;
  const scope = ranges.find(([network, prefix]) => parsed.match(ipaddr.parse(network), prefix))?.[2] ?? "public";
  return { ip: parsed.toNormalizedString(), version, scope };
}

export function maskIp(value: string): string {
  const parsed = parsedIp(value);
  if (parsed.kind() === "ipv4") return `${(parsed as ipaddr.IPv4).octets.slice(0, 3).join(".")}.xxx`;
  return `${parsed.toNormalizedString().split(":").slice(0, 3).join(":")}:…`;
}

export function normalizeHostname(value: string): string {
  const raw = value.trim().replace(/\.$/, "");
  if (!raw || raw.length > 253 || /[\u0000-\u0020/*]/.test(raw)) throw new NetworkInputError("INVALID_HOSTNAME");
  let ascii = "";
  try { ascii = new URL(`https://${raw}`).hostname.toLowerCase(); } catch { throw new NetworkInputError("INVALID_HOSTNAME"); }
  if (!ascii || ascii.length > 253 || ascii === "localhost" || ascii.endsWith(".local") || !ascii.includes(".")) throw new NetworkInputError("INVALID_HOSTNAME");
  if (ascii.split(".").some((label) => !label || label.length > 63 || label.startsWith("-") || label.endsWith("-"))) throw new NetworkInputError("INVALID_HOSTNAME");
  return ascii;
}

export function normalizeHttpUrl(value: string): URL {
  const raw = value.trim();
  if (!raw || raw.length > 2048 || /[\u0000-\u001f\u007f]/.test(raw)) throw new NetworkInputError("INVALID_URL");
  let url: URL;
  try { url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`); } catch { throw new NetworkInputError("INVALID_URL"); }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new NetworkInputError("UNSUPPORTED_PROTOCOL");
  if (url.username || url.password) throw new NetworkInputError("INVALID_URL");
  const expectedPort = url.protocol === "https:" ? "443" : "80";
  if (url.port && url.port !== expectedPort) throw new NetworkInputError("UNSUPPORTED_PORT");
  url.hostname = normalizeHostname(url.hostname);
  url.hash = "";
  return url;
}

export type IceCandidateObservation = { address: string; type: "host" | "srflx" | "relay" | "unknown"; protocol: "udp" | "tcp" | "unknown"; scope: IpScope | "mdns" | "unknown"; port?: number };

export function parseIceCandidate(candidate: string): IceCandidateObservation | null {
  const parts = candidate.trim().split(/\s+/);
  if (parts.length < 8 || !parts[0]?.startsWith("candidate:")) return null;
  const address = parts[4] ?? "";
  const port = Number(parts[5]);
  const typeIndex = parts.indexOf("typ");
  const rawType = typeIndex >= 0 ? parts[typeIndex + 1] : "unknown";
  const type = rawType === "host" || rawType === "srflx" || rawType === "relay" ? rawType : "unknown";
  const protocol = parts[2]?.toLowerCase() === "udp" ? "udp" : parts[2]?.toLowerCase() === "tcp" ? "tcp" : "unknown";
  if (address.endsWith(".local")) return { address, type, protocol, scope: "mdns", port: Number.isInteger(port) ? port : undefined };
  try { const normalized = normalizeIp(address); return { address: normalized.ip, type, protocol, scope: normalized.scope, port: Number.isInteger(port) ? port : undefined }; }
  catch { return { address, type, protocol, scope: "unknown", port: Number.isInteger(port) ? port : undefined }; }
}

export function analyzeHeaders(protocol: "http:" | "https:", headers: Record<string, string | undefined>): HeaderAssessment[] {
  const value = (name: string) => headers[name.toLowerCase()];
  const result: HeaderAssessment[] = [];
  const add = (name: string, status: HeaderAssessment["status"], explanation: string) => result.push({ name, value: value(name), status, explanation });
  add("Content-Type", value("content-type") ? "present" : "missing", value("content-type") ? "The response declares a content type." : "No Content-Type header was observed.");
  add("Cache-Control", value("cache-control") ? "informational" : "missing", value("cache-control") ? "Caching behavior is declared; suitability depends on the content." : "No explicit caching policy was observed.");
  add("Content-Security-Policy", value("content-security-policy") ? "present" : "missing", value("content-security-policy") ? "A CSP is present, but its directives still require review." : "No Content-Security-Policy header was observed.");
  add("Strict-Transport-Security", protocol === "https:" ? value("strict-transport-security") ? "present" : "missing" : "informational", protocol === "https:" ? value("strict-transport-security") ? "HSTS is present." : "HTTPS response does not declare HSTS." : "HSTS only applies to HTTPS responses.");
  add("Referrer-Policy", value("referrer-policy") ? "present" : "missing", value("referrer-policy") ? "A referrer policy is declared." : "No Referrer-Policy header was observed.");
  add("X-Content-Type-Options", value("x-content-type-options")?.toLowerCase() === "nosniff" ? "present" : "warning", value("x-content-type-options") ? "Review the value; nosniff is expected." : "The nosniff directive is missing.");
  add("X-Frame-Options", value("x-frame-options") ? "present" : value("content-security-policy")?.includes("frame-ancestors") ? "informational" : "missing", value("x-frame-options") ? "A legacy frame restriction is present." : "Use CSP frame-ancestors for modern framing control.");
  add("Permissions-Policy", value("permissions-policy") ? "present" : "missing", value("permissions-policy") ? "A permissions policy is declared." : "No Permissions-Policy header was observed.");
  add("Cross-Origin-Opener-Policy", value("cross-origin-opener-policy") ? "present" : "informational", value("cross-origin-opener-policy") ? "A cross-origin opener policy is declared." : "No COOP header was observed; not every site requires one.");
  add("Cross-Origin-Resource-Policy", value("cross-origin-resource-policy") ? "present" : "informational", value("cross-origin-resource-policy") ? "A cross-origin resource policy is declared." : "No CORP header was observed; requirements depend on the resource.");
  const acao = value("access-control-allow-origin");
  const credentials = value("access-control-allow-credentials")?.toLowerCase() === "true";
  add("Access-Control-Allow-Origin", acao === "*" && credentials ? "warning" : "informational", acao === "*" && credentials ? "Wildcard origin with credentials requires careful review." : acao ? "CORS is declared; correctness depends on the application." : "No CORS header was observed on this response.");
  return result;
}
