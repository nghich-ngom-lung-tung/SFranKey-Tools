import { randomBytes, timingSafeEqual } from "node:crypto";

export type ProbeSession = { id: string; readToken: string; labels: string[]; resolverIps: Set<string>; expiresAt: number };
const token = () => randomBytes(24).toString("base64url");

export class SessionStore {
  private sessions = new Map<string, ProbeSession>();
  private labels = new Map<string, string>();
  constructor(private readonly ttlMs: number, private readonly maxSessions: number, private readonly maxResolvers: number) {}
  create() {
    this.cleanup(); if (this.sessions.size >= this.maxSessions) throw new Error("CAPACITY");
    const session: ProbeSession = { id: token(), readToken: token(), labels: [token(), token(), token()], resolverIps: new Set(), expiresAt: Date.now() + this.ttlMs };
    this.sessions.set(session.id, session); for (const label of session.labels) this.labels.set(label, session.id); return session;
  }
  get(id: string, readToken?: string) {
    const session = this.sessions.get(id); if (!session || session.expiresAt <= Date.now()) { if (session) this.delete(id); return undefined; }
    if (readToken && !safeEqual(session.readToken, readToken)) return undefined; return session;
  }
  observe(label: string, resolverIp: string) { const id = this.labels.get(label); if (!id) return false; const session = this.get(id); if (!session) return false; if (session.resolverIps.size < this.maxResolvers) session.resolverIps.add(resolverIp); return true; }
  delete(id: string) { const session = this.sessions.get(id); if (!session) return false; for (const label of session.labels) this.labels.delete(label); this.sessions.delete(id); return true; }
  cleanup() { for (const [id, session] of this.sessions) if (session.expiresAt <= Date.now()) this.delete(id); }
  get size() { return this.sessions.size; }
}

function safeEqual(left: string, right: string) { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }
