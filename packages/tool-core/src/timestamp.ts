import { Temporal } from "temporal-polyfill";

export type TimestampUnit = "auto" | "seconds" | "milliseconds";
export type TimeZoneMode =
  | { kind: "utc" }
  | { kind: "local"; id: string }
  | { kind: "iana"; id: string };
export type DstDisambiguation = "reject" | "earlier" | "later";

export type TimestampInputResult = {
  detectedUnit: "seconds" | "milliseconds";
  unixSeconds: string;
  unixMilliseconds: string;
  isoUtc: string;
  localText: string;
  selectedZoneText: string;
  selectedZoneId: string;
  offset: string;
  relativeText: string;
};

export type WallTimeConversionRequest = {
  value: string;
  timeZone: string;
  outputUnit: "seconds" | "milliseconds";
  disambiguation: DstDisambiguation;
};

export type WallTimeConversionResult =
  | {
      status: "success";
      timestamp: string;
      instantIso: string;
      zonedDateTime: string;
      offset: string;
    }
  | {
      status: "ambiguous" | "nonexistent";
      earlier: { timestamp: string; zonedDateTime: string; offset: string };
      later: { timestamp: string; zonedDateTime: string; offset: string };
    };

export type TimestampErrorCode =
  | "EMPTY_TIMESTAMP"
  | "INVALID_TIMESTAMP"
  | "OUT_OF_RANGE"
  | "INVALID_DATE_TIME"
  | "INVALID_TIME_ZONE"
  | "DST_DISAMBIGUATION_REQUIRED";

export class TimestampError extends Error {
  readonly code: TimestampErrorCode;

  constructor(code: TimestampErrorCode) {
    super(code);
    this.name = "TimestampError";
    this.code = code;
  }
}

const MAX_DATE_MS = 8.64e15;
const SECONDS_PATTERN = /^[+-]?\d+(?:\.\d{1,3})?$/;
const MILLISECONDS_PATTERN = /^[+-]?\d+$/;

function assertTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
  } catch {
    throw new TimestampError("INVALID_TIME_ZONE");
  }
}

function assertRange(unixMs: number) {
  if (!Number.isFinite(unixMs) || Math.abs(unixMs) > MAX_DATE_MS) {
    throw new TimestampError("OUT_OF_RANGE");
  }
}

export function detectTimestampUnit(value: string): "seconds" | "milliseconds" {
  const trimmed = value.trim();
  if (trimmed.includes(".")) return "seconds";
  const absoluteDigits = trimmed.replace(/^[+-]/, "").replace(/^0+/, "");
  return absoluteDigits.length <= 11 ? "seconds" : "milliseconds";
}

export function parseTimestamp(
  value: string,
  unit: TimestampUnit,
): { unixMs: number; detectedUnit: "seconds" | "milliseconds" } {
  const trimmed = value.trim();
  if (!trimmed) throw new TimestampError("EMPTY_TIMESTAMP");
  const detectedUnit = unit === "auto" ? detectTimestampUnit(trimmed) : unit;
  const pattern = detectedUnit === "seconds" ? SECONDS_PATTERN : MILLISECONDS_PATTERN;
  if (!pattern.test(trimmed)) throw new TimestampError("INVALID_TIMESTAMP");
  const numeric = Number(trimmed);
  const unixMs = detectedUnit === "seconds" ? Math.trunc(numeric * 1000) : numeric;
  if (!Number.isFinite(numeric) || !Number.isSafeInteger(unixMs)) {
    throw new TimestampError("INVALID_TIMESTAMP");
  }
  assertRange(unixMs);
  return { unixMs, detectedUnit };
}

function decimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function relativeText(unixMs: number, locale: "vi-VN" | "en-US", nowMs: number) {
  const seconds = (unixMs - nowMs) / 1000;
  const absolute = Math.abs(seconds);
  const [divisor, unit] = absolute < 60
    ? [1, "second"]
    : absolute < 3600
      ? [60, "minute"]
      : absolute < 86400
        ? [3600, "hour"]
        : absolute < 2592000
          ? [86400, "day"]
          : absolute < 31536000
            ? [2592000, "month"]
            : [31536000, "year"];
  const value = Math.round(seconds / divisor);
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    value,
    unit as Intl.RelativeTimeFormatUnit,
  );
}

export function formatTimestamp(
  unixMs: number,
  options: {
    locale: "vi-VN" | "en-US";
    timeZone: string;
    nowMs?: number;
  },
): TimestampInputResult {
  assertRange(unixMs);
  assertTimeZone(options.timeZone);
  const instant = Temporal.Instant.fromEpochMilliseconds(unixMs);
  const selected = instant.toZonedDateTimeISO(options.timeZone);
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const local = instant.toZonedDateTimeISO(localZone);
  const nowMs = options.nowMs ?? Date.now();
  return {
    detectedUnit: "milliseconds",
    unixSeconds: decimal(unixMs / 1000),
    unixMilliseconds: String(unixMs),
    isoUtc: instant.toString(),
    localText: new Intl.DateTimeFormat(options.locale, {
      dateStyle: "medium",
      timeStyle: "long",
      timeZone: localZone,
    }).format(new Date(unixMs)),
    selectedZoneText: new Intl.DateTimeFormat(options.locale, {
      dateStyle: "medium",
      timeStyle: "long",
      timeZone: options.timeZone,
    }).format(new Date(unixMs)),
    selectedZoneId: options.timeZone,
    offset: selected.offset,
    relativeText: relativeText(unixMs, options.locale, nowMs),
  };
}

function wallTimeResult(
  zdt: Temporal.ZonedDateTime,
  outputUnit: "seconds" | "milliseconds",
): Exclude<WallTimeConversionResult, { status: "ambiguous" | "nonexistent" }> {
  const epochMs = Number(zdt.epochMilliseconds);
  assertRange(epochMs);
  return {
    status: "success",
    timestamp: outputUnit === "seconds" ? decimal(epochMs / 1000) : String(epochMs),
    instantIso: Temporal.Instant.fromEpochMilliseconds(epochMs).toString(),
    zonedDateTime: zdt.toString(),
    offset: zdt.offset,
  };
}

export function convertWallTime(
  request: WallTimeConversionRequest,
): WallTimeConversionResult {
  assertTimeZone(request.timeZone);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(request.value)) {
    throw new TimestampError("INVALID_DATE_TIME");
  }
  let plain: Temporal.PlainDateTime;
  try {
    plain = Temporal.PlainDateTime.from(request.value);
  } catch {
    throw new TimestampError("INVALID_DATE_TIME");
  }

  try {
    return wallTimeResult(
      plain.toZonedDateTime(request.timeZone, {
        disambiguation: request.disambiguation,
      }),
      request.outputUnit,
    );
  } catch (error) {
    if (request.disambiguation !== "reject") throw error;
    let earlier: Temporal.ZonedDateTime;
    let later: Temporal.ZonedDateTime;
    try {
      earlier = plain.toZonedDateTime(request.timeZone, { disambiguation: "earlier" });
      later = plain.toZonedDateTime(request.timeZone, { disambiguation: "later" });
    } catch {
      throw new TimestampError("DST_DISAMBIGUATION_REQUIRED");
    }
    const sameWallTime = earlier.toPlainDateTime().equals(later.toPlainDateTime());
    return {
      status: sameWallTime ? "ambiguous" : "nonexistent",
      earlier: wallTimeResult(earlier, request.outputUnit),
      later: wallTimeResult(later, request.outputUnit),
    };
  }
}

export function getSupportedTimeZones() {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const supported = typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : [];
  return [...new Set(["UTC", localZone, ...supported])].sort();
}

// Compatibility helpers retained for existing callers until the workspace migration completes.
export function timestampToDate(value: number, unit: "seconds" | "milliseconds" = "seconds") {
  const date = new Date(unit === "seconds" ? value * 1000 : value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid timestamp");
  return date;
}

export function dateToTimestamp(date: Date, unit: "seconds" | "milliseconds" = "seconds") {
  return unit === "seconds" ? Math.floor(date.getTime() / 1000) : date.getTime();
}

export function relativeTime(date: Date, now = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const absolute = Math.abs(seconds);
  if (absolute < 60) return `${seconds}s`;
  if (absolute < 3600) return `${Math.round(seconds / 60)}m`;
  if (absolute < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}
