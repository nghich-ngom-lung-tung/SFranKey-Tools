import dgram from "node:dgram";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import net from "node:net";
import { timingSafeEqual } from "node:crypto";
import packet from "dns-packet";
import { z } from "zod";
import { SessionStore } from "./session-store.js";

const env = z.object({
  PROBE_ZONE: z.string().default("probe.localhost"), PROBE_PUBLIC_IPV4: z.string().default("127.0.0.1"), PROBE_PUBLIC_IPV6: z.string().default("::1"),
  PROBE_DNS_PORT: z.coerce.number().int().positive().default(5353), PROBE_PIXEL_PORT: z.coerce.number().int().positive().default(4060), PROBE_CONTROL_PORT: z.coerce.number().int().positive().default(4050),
  PROBE_CONTROL_TOKEN: z.string().min(16).default("local-probe-control-token"), PROBE_NS_HOSTNAME: z.string().default("ns1.sfrankey.com"), PROBE_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(120), PROBE_MAX_SESSIONS: z.coerce.number().int().positive().default(10_000), PROBE_MAX_RESOLVERS_PER_SESSION: z.coerce.number().int().positive().default(20)
}).parse(process.env);
const zone = env.PROBE_ZONE.toLowerCase().replace(/\.$/, "");
const store = new SessionStore(env.PROBE_SESSION_TTL_SECONDS * 1000, env.PROBE_MAX_SESSIONS, env.PROBE_MAX_RESOLVERS_PER_SESSION);
const pixel = Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", "base64");

function dnsResponse(input: Buffer, resolverIp: string) {
  let query: packet.Packet; try { query = packet.decode(input); } catch { return null; }
  const question = query.questions?.[0]; if (!question) return packet.encode({ type: "response", id: query.id, flags: packet.AUTHORITATIVE_ANSWER, questions: [], answers: [] });
  const name = question.name.toLowerCase().replace(/\.$/, ""); const suffix = `.${zone}`;
  if (name === zone && question.type === "NS") return packet.encode({ type: "response", id: query.id, flags: packet.AUTHORITATIVE_ANSWER, questions: query.questions, answers: [{ type: "NS", name: question.name, ttl: 60, data: env.PROBE_NS_HOSTNAME }] });
  if (name === zone && question.type === "SOA") return packet.encode({ type: "response", id: query.id, flags: packet.AUTHORITATIVE_ANSWER, questions: query.questions, answers: [{ type: "SOA", name: question.name, ttl: 60, data: { mname: env.PROBE_NS_HOSTNAME, rname: `hostmaster.${zone}`, serial: Math.floor(Date.now() / 86_400_000), refresh: 300, retry: 60, expire: 3600, minimum: 0 } }] });
  if (!name.endsWith(suffix)) return packet.encode({ type: "response", id: query.id, flags: packet.AUTHORITATIVE_ANSWER | 3, questions: query.questions, answers: [] });
  const label = name.slice(0, -suffix.length).split(".").at(-1) ?? ""; const valid = store.observe(label, resolverIp);
  if (!valid) return packet.encode({ type: "response", id: query.id, flags: packet.AUTHORITATIVE_ANSWER | 3, questions: query.questions, answers: [] });
  const answers: packet.Answer[] = [];
  if (question.type === "A" && env.PROBE_PUBLIC_IPV4) answers.push({ type: "A", name: question.name, ttl: 0, data: env.PROBE_PUBLIC_IPV4 });
  if (question.type === "AAAA" && env.PROBE_PUBLIC_IPV6) answers.push({ type: "AAAA", name: question.name, ttl: 0, data: env.PROBE_PUBLIC_IPV6 });
  return packet.encode({ type: "response", id: query.id, flags: packet.AUTHORITATIVE_ANSWER, questions: query.questions, answers });
}

const udp4 = dgram.createSocket("udp4"); udp4.on("message", (message, remote) => { const response = dnsResponse(message, remote.address); if (response) udp4.send(response, remote.port, remote.address); }); udp4.bind(env.PROBE_DNS_PORT, "0.0.0.0");
const udp6 = dgram.createSocket("udp6"); udp6.on("message", (message, remote) => { const response = dnsResponse(message, remote.address); if (response) udp6.send(response, remote.port, remote.address); }); udp6.on("error", () => undefined); udp6.bind(env.PROBE_DNS_PORT, "::");
const tcp = net.createServer((socket) => { let buffer = Buffer.alloc(0); socket.on("data", (chunk) => { buffer = Buffer.concat([buffer, chunk]); while (buffer.length >= 2) { const length = buffer.readUInt16BE(0); if (buffer.length < length + 2) break; const request = buffer.subarray(2, length + 2); buffer = buffer.subarray(length + 2); const response = dnsResponse(request, socket.remoteAddress ?? "unknown"); if (response) { const framed = Buffer.alloc(response.length + 2); framed.writeUInt16BE(response.length); response.copy(framed, 2); socket.write(framed); } } }); }); tcp.listen(env.PROBE_DNS_PORT, "0.0.0.0");

function sendJson(res: ServerResponse, status: number, value: unknown) { const body = JSON.stringify(value); res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(body), "cache-control": "no-store" }); res.end(body); }
async function body(req: IncomingMessage) { const chunks: Buffer[] = []; let size = 0; for await (const chunk of req) { const value = Buffer.from(chunk); size += value.length; if (size > 8192) throw new Error("LARGE"); chunks.push(value); } return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); }
function authorized(req: IncomingMessage) { const provided = Buffer.from(req.headers.authorization ?? ""); const expected = Buffer.from(`Bearer ${env.PROBE_CONTROL_TOKEN}`); return provided.length === expected.length && timingSafeEqual(provided, expected); }

const control = http.createServer(async (req, res) => {
  if (!authorized(req)) { sendJson(res, 401, { error: "UNAUTHORIZED" }); return; }
  const url = new URL(req.url ?? "/", "http://probe.internal");
  if (req.method === "GET" && url.pathname === "/health") { sendJson(res, 200, { status: "ok", sessions: store.size }); return; }
  if (req.method === "POST" && url.pathname === "/internal/sessions") { try { await body(req); const session = store.create(); sendJson(res, 201, { sessionId: session.id, readToken: session.readToken, probeUrls: session.labels.map((label) => `https://${label}.${zone}/pixel.gif`), expiresAt: new Date(session.expiresAt).toISOString() }); } catch (error) { sendJson(res, error instanceof Error && error.message === "CAPACITY" ? 503 : 400, { error: "SESSION_FAILED" }); } return; }
  const match = url.pathname.match(/^\/internal\/sessions\/([a-zA-Z0-9_-]+)$/); if (match) { const id = match[1]!; const session = store.get(id, String(req.headers["x-read-token"] ?? "")); if (!session) { sendJson(res, 404, { status: "expired", resolverIps: [] }); return; } if (req.method === "DELETE") { store.delete(id); sendJson(res, 200, { deleted: true }); return; } if (req.method === "GET") { sendJson(res, 200, { status: session.resolverIps.size ? "complete" : "pending", resolverIps: [...session.resolverIps] }); return; } }
  sendJson(res, 404, { error: "NOT_FOUND" });
}); control.listen(env.PROBE_CONTROL_PORT, "0.0.0.0");

const pixelServer = http.createServer((req, res) => { if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405).end(); return; } res.writeHead(200, { "content-type": "image/gif", "content-length": pixel.length, "cache-control": "no-store, max-age=0", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff" }); res.end(req.method === "HEAD" ? undefined : pixel); }); pixelServer.listen(env.PROBE_PIXEL_PORT, "0.0.0.0");
const cleanup = setInterval(() => store.cleanup(), 30_000); cleanup.unref();
function shutdown() { clearInterval(cleanup); udp4.close(); udp6.close(); tcp.close(); control.close(); pixelServer.close(); }
process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown);
