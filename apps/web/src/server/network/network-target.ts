import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import tls from "node:tls";
import type { IncomingHttpHeaders } from "node:http";
import type { RedirectHop } from "@sfrankey/shared";
import { analyzeHeaders, normalizeHostname, normalizeHttpUrl, normalizeIp } from "@sfrankey/tool-core/network";
import { ApiError } from "./api-error";

export type PublicTarget = { hostname: string; address: string; family: 4 | 6 };
export type TargetResolver = (hostname: string) => Promise<Array<{ address: string; family: number }>>;
const defaultResolver: TargetResolver = async (hostname) => await lookup(hostname, { all: true, verbatim: true });
let activeProbes = 0;
const probeWaiters: Array<() => void> = [];

async function acquireProbeSlot() {
  if (activeProbes >= 20) await new Promise<void>((resolve) => probeWaiters.push(resolve));
  activeProbes += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeProbes -= 1;
    probeWaiters.shift()?.();
  };
}

export async function resolvePublicTarget(
  hostnameInput: string,
  resolver: TargetResolver = defaultResolver
): Promise<PublicTarget> {
  const hostname = normalizeHostname(hostnameInput);
  let resolved: Array<{ address: string; family: number }>;
  try {
    resolved = await resolver(hostname);
  } catch {
    throw new ApiError(400, "DNS_LOOKUP_FAILED", "The target hostname could not be resolved.");
  }
  if (!resolved.length) throw new ApiError(400, "DNS_LOOKUP_FAILED", "The target hostname has no public address.");
  const checked = resolved.map((item) => ({ ...normalizeIp(item.address), family: item.family }));
  if (checked.some((item) => item.scope !== "public")) {
    throw new ApiError(400, "UNSAFE_TARGET", "The target resolves to a non-public network address.");
  }
  const selected = checked[0]!;
  return { hostname, address: selected.ip, family: selected.version };
}

function stringHeaders(headers: IncomingHttpHeaders) {
  return Object.fromEntries(
    Object.entries(headers).flatMap(([name, value]) =>
      value === undefined ? [] : [[name.toLowerCase(), Array.isArray(value) ? value.join(", ") : value]]
    )
  );
}

export type HeaderProbeResult = {
  url: string;
  status: number;
  durationMs: number;
  headers: Record<string, string>;
  connectedIp: string;
};

export async function probeHeaders(
  urlInput: string | URL,
  timeoutMs = 5000,
  resolver?: TargetResolver
): Promise<HeaderProbeResult> {
  const url = typeof urlInput === "string" ? normalizeHttpUrl(urlInput) : normalizeHttpUrl(urlInput.toString());
  const target = await resolvePublicTarget(url.hostname, resolver);
  const started = performance.now();
  const release = await acquireProbeSlot();
  try {
    return await new Promise<HeaderProbeResult>((resolve, reject) => {
      const client = url.protocol === "https:" ? https : http;
      const request = client.request(
        {
          protocol: url.protocol,
          host: target.address,
          family: target.family,
          port: url.protocol === "https:" ? 443 : 80,
          method: "GET",
          path: `${url.pathname}${url.search}`,
          servername: url.hostname,
          rejectUnauthorized: true,
          agent: false,
          maxHeaderSize: 65_536,
          headers: {
            host: url.host,
            "user-agent": "SFranKey-Network-Checker/0.2 (+https://sfrankey.bond/security)",
            accept: "*/*",
            connection: "close",
          },
          signal: AbortSignal.timeout(timeoutMs),
        },
        (response) => {
          const result = {
            url: url.toString(),
            status: response.statusCode ?? 0,
            durationMs: Math.round(performance.now() - started),
            headers: stringHeaders(response.headers),
            connectedIp: target.address,
          };
          resolve(result);
          response.destroy();
          request.destroy();
        }
      );
      request.on("error", (error) =>
        reject(
          new ApiError(
            error.name === "AbortError" ? 504 : 502,
            error.name === "AbortError" ? "REQUEST_TIMEOUT" : "PROCESSING_FAILED",
            error.name === "AbortError" ? "The target request timed out." : "The target could not be reached."
          )
        )
      );
      request.end();
    });
  } finally {
    release();
  }
}

export type RedirectInspectionResult = {
  finalUrl: string;
  hops: RedirectHop[];
  finalProbe?: HeaderProbeResult;
};

export async function inspectRedirects(
  input: string,
  options: { maxHops?: number; totalTimeoutMs?: number; resolver?: TargetResolver } = {}
): Promise<RedirectInspectionResult> {
  const maxHops = options.maxHops ?? 10;
  const deadline = Date.now() + (options.totalTimeoutMs ?? 15_000);
  let current = normalizeHttpUrl(input);
  const seen = new Set<string>();
  const hops: RedirectHop[] = [];
  for (let index = 0; index <= maxHops; index += 1) {
    const key = current.toString();
    if (seen.has(key)) throw new ApiError(400, "REDIRECT_LOOP", "The redirect chain contains a loop.");
    seen.add(key);
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new ApiError(504, "REQUEST_TIMEOUT", "The redirect check timed out.");
    const response = await probeHeaders(current, Math.min(5000, remaining), options.resolver);
    const location = response.headers.location;
    hops.push({
      index,
      url: response.url,
      status: response.status,
      location,
      durationMs: response.durationMs,
      protocol: current.protocol as "http:" | "https:",
    });
    if (![301, 302, 303, 307, 308].includes(response.status) || !location) {
      return { finalUrl: response.url, hops, finalProbe: response };
    }
    if (index === maxHops) throw new ApiError(400, "TOO_MANY_REDIRECTS", "The redirect chain is too long.");
    let next: URL;
    try {
      next = new URL(location, current);
    } catch {
      throw new ApiError(400, "INVALID_URL", "A redirect location is invalid.");
    }
    current = normalizeHttpUrl(next.toString());
  }
  throw new ApiError(400, "TOO_MANY_REDIRECTS", "The redirect chain is too long.");
}

export async function inspectHeaders(input: string, resolver?: TargetResolver) {
  const chain = await inspectRedirects(input, { maxHops: 5, resolver });
  const final = chain.finalProbe ?? (await probeHeaders(chain.finalUrl, 5000, resolver));
  const allow = [
    "content-type",
    "cache-control",
    "content-security-policy",
    "strict-transport-security",
    "referrer-policy",
    "x-content-type-options",
    "x-frame-options",
    "permissions-policy",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
    "access-control-allow-origin",
    "access-control-allow-credentials",
  ];
  const headers = Object.fromEntries(
    allow.flatMap((name) => (final.headers[name] === undefined ? [] : [[name, final.headers[name]]]))
  );
  return {
    finalUrl: final.url,
    status: final.status,
    connectedIp: final.connectedIp,
    redirects: chain.hops.slice(0, -1),
    assessments: analyzeHeaders(new URL(final.url).protocol as "http:" | "https:", headers),
  };
}

type CertificateSummary = {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  fingerprint256?: string;
};

function certificateName(value: Record<string, string | string[] | undefined> | undefined) {
  return value
    ? Object.entries(value)
        .flatMap(([key, item]) => (item === undefined ? [] : [`${key}=${Array.isArray(item) ? item.join("+") : item}`]))
        .join(", ")
    : "";
}

export async function inspectTls(hostnameInput: string, resolver?: TargetResolver) {
  const hostname = normalizeHostname(hostnameInput);
  const target = await resolvePublicTarget(hostname, resolver);
  const release = await acquireProbeSlot();
  try {
    return await new Promise((resolve, reject) => {
      const socket = tls.connect(
        { host: target.address, port: 443, servername: hostname, rejectUnauthorized: false, timeout: 5000 },
        () => {
          const certificate = socket.getPeerCertificate(true);
          if (!certificate || !certificate.raw) {
            socket.destroy();
            reject(new ApiError(502, "TLS_HANDSHAKE_FAILED", "The server did not provide a certificate."));
            return;
          }
          const identityError = tls.checkServerIdentity(hostname, certificate);
          const chain: CertificateSummary[] = [];
          const seen = new Set<string>();
          let current = certificate;
          while (current?.raw && chain.length < 10) {
            const fingerprint = current.fingerprint256 ?? current.fingerprint;
            if (fingerprint && seen.has(fingerprint)) break;
            if (fingerprint) seen.add(fingerprint);
            chain.push({
              subject: certificateName(current.subject),
              issuer: certificateName(current.issuer),
              validFrom: current.valid_from,
              validTo: current.valid_to,
              fingerprint256: current.fingerprint256,
            });
            if (!current.issuerCertificate || current.issuerCertificate === current) break;
            current = current.issuerCertificate;
          }
          const validToMs = Date.parse(certificate.valid_to);
          const validFromMs = Date.parse(certificate.valid_from);
          const result = {
            hostname,
            connectedIp: target.address,
            protocol: socket.getProtocol(),
            cipher: socket.getCipher().name,
            authorized: socket.authorized,
            authorizationError: socket.authorizationError ? String(socket.authorizationError) : undefined,
            hostnameMatches: !identityError,
            hostnameError: identityError?.message,
            subject: certificateName(certificate.subject),
            issuer: certificateName(certificate.issuer),
            subjectAltName: certificate.subjectaltname,
            validFrom: certificate.valid_from,
            validTo: certificate.valid_to,
            daysRemaining: Number.isFinite(validToMs) ? Math.floor((validToMs - Date.now()) / 86_400_000) : null,
            notYetValid: Number.isFinite(validFromMs) && validFromMs > Date.now(),
            expired: Number.isFinite(validToMs) && validToMs <= Date.now(),
            fingerprint256: certificate.fingerprint256,
            chain,
          };
          socket.end();
          resolve(result);
        }
      );
      socket.once("timeout", () => {
        socket.destroy();
        reject(new ApiError(504, "REQUEST_TIMEOUT", "The TLS handshake timed out."));
      });
      socket.once("error", () => reject(new ApiError(502, "TLS_HANDSHAKE_FAILED", "The TLS handshake failed.")));
    });
  } finally {
    release();
  }
}
