import { describe, expect, it, vi } from "vitest";
import { SessionStore } from "./session-store.js";
describe("probe session store", () => {
  it("records and deduplicates resolver observations", () => { const store = new SessionStore(60_000, 2, 2); const session = store.create(); expect(store.observe(session.labels[0]!, "1.1.1.1")).toBe(true); store.observe(session.labels[1]!, "1.1.1.1"); expect([...store.get(session.id, session.readToken)!.resolverIps]).toEqual(["1.1.1.1"]); expect(store.get(session.id, "wrong")).toBeUndefined(); });
  it("expires sessions", () => { vi.useFakeTimers(); const store = new SessionStore(1000, 2, 2); const session = store.create(); vi.advanceTimersByTime(1001); expect(store.get(session.id)).toBeUndefined(); vi.useRealTimers(); });
});
