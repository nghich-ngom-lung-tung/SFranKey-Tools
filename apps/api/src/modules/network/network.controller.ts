import type { RequestHandler } from "express";
import { dnsLookupSchema, hostnameCheckSchema, ipLookupSchema, leakSessionSchema, networkActionSchema, privacyCheckSchema, urlCheckSchema, type NetworkCapabilities } from "@sfrankey/shared";
import { normalizeIp } from "@sfrankey/tool-core/network";
import { env } from "../../config/env.js";
import { ApiError } from "../../lib/api-error.js";
import { verifyTurnstile } from "../feedback/feedback.provider.js";
import { checkIpPrivacy, createLeakSession, deleteLeakSession, getLeakSession, lookupIp, resolveDns } from "./network.provider.js";
import { inspectHeaders, inspectRedirects, inspectTls } from "./network.target.js";

function success(res: Parameters<RequestHandler>[1], data: unknown, status = 200) { const requestId = String(res.locals.requestId); res.status(status).json({ success: true, data, requestId }); }
async function verifyAction(token: string, remoteIp?: string) {
  if (!env.NETWORK_TOOLS_ENABLED) throw new ApiError(503, "NETWORK_TOOLS_DISABLED", "Network tools are disabled.");
  if (!env.NETWORK_REQUIRE_TURNSTILE) return;
  if (!env.TURNSTILE_SECRET_KEY || !token) throw new ApiError(400, "TURNSTILE_REQUIRED", "Verification is required.");
  if (!(await verifyTurnstile(token, remoteIp))) throw new ApiError(400, "TURNSTILE_FAILED", "Verification failed.");
}
function sourceIp(value: string | undefined) { if (!value) throw new ApiError(400, "INVALID_IP", "The source IP is unavailable."); return normalizeIp(value).ip; }
const handler = (fn: RequestHandler): RequestHandler => async (req, res, next) => { try { await fn(req, res, next); } catch (error) { next(error); } };

export const getCapabilities: RequestHandler = (_req, res) => {
  const data: NetworkCapabilities = { ipInfoBasic: env.NETWORK_TOOLS_ENABLED && Boolean(env.IPINFO_TOKEN), privacyDetection: env.NETWORK_TOOLS_ENABLED && Boolean(env.IPINFO_TOKEN), ipv4Endpoint: Boolean(env.NETWORK_IPV4_ENDPOINT), ipv6Endpoint: Boolean(env.NETWORK_IPV6_ENDPOINT), dnsLookup: env.NETWORK_TOOLS_ENABLED && Boolean(env.DNS_DOH_ENDPOINT), dnsLeakProbe: env.NETWORK_TOOLS_ENABLED && Boolean(env.PROBE_CONTROL_URL && env.PROBE_CONTROL_TOKEN), webRtcStun: Boolean(env.NETWORK_STUN_URL), tlsProbe: env.NETWORK_TOOLS_ENABLED, httpProbe: env.NETWORK_TOOLS_ENABLED };
  success(res, data);
};
export const postMyIp = handler(async (req, res) => { const input = networkActionSchema.parse(req.body ?? {}); await verifyAction(input.turnstileToken, req.ip); success(res, await lookupIp(sourceIp(req.ip))); });
export const postIpLookup = handler(async (req, res) => { const input = ipLookupSchema.parse(req.body); await verifyAction(input.turnstileToken, req.ip); success(res, await lookupIp(input.ip)); });
export const postPrivacyCheck = handler(async (req, res) => { const input = privacyCheckSchema.parse(req.body ?? {}); await verifyAction(input.turnstileToken, req.ip); success(res, await checkIpPrivacy(input.ip ? normalizeIp(input.ip).ip : sourceIp(req.ip))); });
export const postDnsLookup = handler(async (req, res) => { const input = dnsLookupSchema.parse(req.body); await verifyAction(input.turnstileToken, req.ip); success(res, await resolveDns(input.hostname, input.types)); });
export const postSslCheck = handler(async (req, res) => { const input = hostnameCheckSchema.parse(req.body); await verifyAction(input.turnstileToken, req.ip); success(res, await inspectTls(input.hostname)); });
export const postRedirectCheck = handler(async (req, res) => { const input = urlCheckSchema.parse(req.body); await verifyAction(input.turnstileToken, req.ip); success(res, await inspectRedirects(input.url)); });
export const postHeaderCheck = handler(async (req, res) => { const input = urlCheckSchema.parse(req.body); await verifyAction(input.turnstileToken, req.ip); success(res, await inspectHeaders(input.url)); });
export const postLeakSession = handler(async (req, res) => { const input = leakSessionSchema.parse(req.body); await verifyAction(input.turnstileToken, req.ip); const session = await createLeakSession(input.kind); const ipProfile = input.kind === "combined" ? await lookupIp(sourceIp(req.ip)) : undefined; success(res, { ...session, ipProfile }, 201); });
function readToken(req: Parameters<RequestHandler>[0]) { const token = req.header("authorization")?.replace(/^Bearer\s+/i, ""); if (!token || token.length > 256) throw new ApiError(401, "SESSION_EXPIRED", "The leak session is unavailable."); return token; }
function sessionId(req: Parameters<RequestHandler>[0]) { const raw = req.params.id; const id = Array.isArray(raw) ? raw[0] : raw; if (!id || !/^[a-zA-Z0-9_-]{16,128}$/.test(id)) throw new ApiError(400, "SESSION_EXPIRED", "The leak session is unavailable."); return id; }
export const readLeakSession = handler(async (req, res) => success(res, await getLeakSession(sessionId(req), readToken(req))));
export const removeLeakSession = handler(async (req, res) => { await deleteLeakSession(sessionId(req), readToken(req)); success(res, { deleted: true }); });
