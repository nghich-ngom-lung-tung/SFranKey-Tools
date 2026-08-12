import { estimateClockOffset, type ClockSyncState } from "@sfrankey/tool-core";

type TimeResponse = { unixMs?: unknown };

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function syncClock(signal?: AbortSignal): Promise<ClockSyncState> {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${apiBaseUrl}/v1/time`, { method: "GET", cache: "no-store", signal });
    if (!response.ok) throw new Error(`Time endpoint returned ${response.status}`);
    const payload = (await response.json()) as TimeResponse;
    const finishedAt = Date.now();
    if (typeof payload.unixMs !== "number" || !Number.isFinite(payload.unixMs)) throw new Error("Time endpoint returned an invalid timestamp");
    const { offsetMs, roundTripMs } = estimateClockOffset(startedAt, finishedAt, payload.unixMs);
    return { status: "synced", offsetMs, roundTripMs };
  } catch (error) {
    return { status: "fallback", reason: error instanceof Error ? error.message : "Time synchronization failed" };
  }
}

export function clockSkewWarningMs() {
  const configured = Number(process.env.NEXT_PUBLIC_CLOCK_SKEW_WARNING_MS ?? "30000");
  return Number.isFinite(configured) && configured >= 0 ? configured : 30_000;
}

export function hasClockSkewWarning(state: ClockSyncState) {
  return state.status === "synced" && Math.abs(state.offsetMs) > clockSkewWarningMs();
}
