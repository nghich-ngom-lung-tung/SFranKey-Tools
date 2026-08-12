export type ClockSyncState =
  | { status: "idle" | "syncing" }
  | { status: "synced"; offsetMs: number; roundTripMs: number }
  | { status: "fallback"; reason: string };

export function estimateClockOffset(clientStartedAtMs: number, clientFinishedAtMs: number, serverUnixMs: number) {
  if (![clientStartedAtMs, clientFinishedAtMs, serverUnixMs].every(Number.isFinite) || clientFinishedAtMs < clientStartedAtMs) throw new Error("Invalid clock sample");
  const roundTripMs = clientFinishedAtMs - clientStartedAtMs;
  const midpointMs = clientStartedAtMs + roundTripMs / 2;
  return { offsetMs: serverUnixMs - midpointMs, roundTripMs };
}

export function adjustedNow(clock: ClockSyncState, nowMs = Date.now()) {
  return clock.status === "synced" ? nowMs + clock.offsetMs : nowMs;
}
