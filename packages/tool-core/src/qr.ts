export type QrPayload =
  | { kind: "text"; text: string }
  | { kind: "url"; url: string }
  | { kind: "email"; email: string; subject?: string; body?: string }
  | { kind: "phone"; phone: string }
  | { kind: "sms"; phone: string; message?: string }
  | {
      kind: "wifi";
      ssid: string;
      security: "WPA" | "WEP" | "nopass";
      password?: string;
      hidden: boolean;
    }
  | {
      kind: "vcard";
      fullName: string;
      organization?: string;
      title?: string;
      phone?: string;
      email?: string;
      url?: string;
    };

export type QrRenderOptions = {
  size: 256 | 512 | 1024;
  errorCorrection: "L" | "M" | "Q" | "H";
  foreground: `#${string}`;
  background: `#${string}`;
  margin: 2;
};

export type QrScanKind =
  "url" | "email" | "phone" | "sms" | "wifi" | "vcard" | "otpauth" | "text";
export type QrScanResult = {
  value: string;
  kind: QrScanKind;
  safeHttpUrl?: string;
};
export type QrErrorCode =
  | "EMPTY_FIELD"
  | "INVALID_URL"
  | "INVALID_EMAIL"
  | "INVALID_PHONE"
  | "MISSING_PASSWORD"
  | "PAYLOAD_TOO_LARGE"
  | "INVALID_COLOR"
  | "LOW_CONTRAST";

export class QrValidationError extends Error {
  readonly code: QrErrorCode;

  constructor(code: QrErrorCode, message = code) {
    super(message);
    this.name = "QrValidationError";
    this.code = code;
  }
}

const MAX_QR_BYTES = 2_953;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][+\d\s().-]*$/;

function escapeWifi(value: string) {
  return value.replace(/[\\;,:\"]/g, (character) => `\\${character}`);
}

function escapeVCard(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/[\\,;\n\r]/g, (character) => {
    if (character === "\n" || character === "\r") return "\\n";
    return `\\${character}`;
  });
}

function normalizedUrl(value: string) {
  const trimmed = value.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) {
    throw new QrValidationError("INVALID_URL");
  }
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      throw new Error();
    if (!parsed.hostname) throw new Error();
    return parsed.toString();
  } catch {
    throw new QrValidationError("INVALID_URL");
  }
}

function normalizedPhone(value: string) {
  if (!PHONE_PATTERN.test(value)) throw new QrValidationError("INVALID_PHONE");
  const digits = value.replace(/[\s().-]/g, "");
  if (!/^\+?\d{3,20}$/.test(digits))
    throw new QrValidationError("INVALID_PHONE");
  return digits;
}

export function validateQrPayload(payload: QrPayload): void {
  switch (payload.kind) {
    case "text":
      if (!payload.text) throw new QrValidationError("EMPTY_FIELD");
      break;
    case "url":
      normalizedUrl(payload.url);
      break;
    case "email":
      if (!EMAIL_PATTERN.test(payload.email))
        throw new QrValidationError("INVALID_EMAIL");
      break;
    case "phone":
      normalizedPhone(payload.phone);
      break;
    case "sms":
      normalizedPhone(payload.phone);
      break;
    case "wifi":
      if (!payload.ssid) throw new QrValidationError("EMPTY_FIELD");
      if (payload.security !== "nopass" && !payload.password)
        throw new QrValidationError("MISSING_PASSWORD");
      break;
    case "vcard":
      if (!payload.fullName) throw new QrValidationError("EMPTY_FIELD");
      if (payload.email && !EMAIL_PATTERN.test(payload.email))
        throw new QrValidationError("INVALID_EMAIL");
      if (payload.phone) normalizedPhone(payload.phone);
      if (payload.url) normalizedUrl(payload.url);
      break;
  }
}

export function buildQrPayload(payload: QrPayload): string {
  validateQrPayload(payload);
  let result: string;
  switch (payload.kind) {
    case "text":
      result = payload.text;
      break;
    case "url":
      result = normalizedUrl(payload.url);
      break;
    case "email": {
      const query = new URLSearchParams();
      if (payload.subject) query.set("subject", payload.subject);
      if (payload.body) query.set("body", payload.body);
      result = `mailto:${payload.email}${query.toString() ? `?${query.toString()}` : ""}`;
      break;
    }
    case "phone":
      result = `tel:${normalizedPhone(payload.phone)}`;
      break;
    case "sms":
      result = `SMSTO:${normalizedPhone(payload.phone)}:${payload.message ?? ""}`;
      break;
    case "wifi": {
      const password =
        payload.security === "nopass" ? "" : escapeWifi(payload.password ?? "");
      result = `WIFI:T:${payload.security};S:${escapeWifi(payload.ssid)};P:${password};H:${payload.hidden ? "true" : "false"};;`;
      break;
    }
    case "vcard": {
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${escapeVCard(payload.fullName)}`,
      ];
      if (payload.organization)
        lines.push(`ORG:${escapeVCard(payload.organization)}`);
      if (payload.title) lines.push(`TITLE:${escapeVCard(payload.title)}`);
      if (payload.phone) lines.push(`TEL:${normalizedPhone(payload.phone)}`);
      if (payload.email) lines.push(`EMAIL:${escapeVCard(payload.email)}`);
      if (payload.url) lines.push(`URL:${normalizedUrl(payload.url)}`);
      lines.push("END:VCARD");
      result = lines.join("\r\n");
      break;
    }
  }
  if (new TextEncoder().encode(result).byteLength > MAX_QR_BYTES)
    throw new QrValidationError("PAYLOAD_TOO_LARGE");
  return result;
}

function colorToRgb(value: string) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (!match) throw new QrValidationError("INVALID_COLOR");
  const hex =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((char) => char + char)
          .join("")
      : match[1];
  return [0, 2, 4].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
}

function luminance(value: string) {
  const channels = colorToRgb(value);
  const weights = [0.2126, 0.7152, 0.0722];
  return channels.reduce(
    (total, channel, index) =>
      total +
      (channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4) *
        weights[index],
    0,
  );
}

export function validateQrColors(foreground: string, background: string) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const contrastRatio =
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  return {
    contrastRatio,
    usable: contrastRatio >= 3,
    warning: contrastRatio >= 3 && contrastRatio < 4.5,
  };
}

export function classifyQrValue(value: string): QrScanResult {
  const trimmed = value.trim();
  if (/^otpauth:\/\//i.test(trimmed)) return { value, kind: "otpauth" };
  if (/^WIFI:/i.test(trimmed)) return { value, kind: "wifi" };
  if (/^BEGIN:VCARD/i.test(trimmed)) return { value, kind: "vcard" };
  if (/^(SMSTO:|sms:)/i.test(trimmed)) return { value, kind: "sms" };
  if (/^mailto:/i.test(trimmed)) return { value, kind: "email" };
  if (/^tel:/i.test(trimmed)) return { value, kind: "phone" };
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:")
      return { value, kind: "url", safeHttpUrl: parsed.toString() };
  } catch {
    // Plain text is the expected fallback for QR values that are not URLs.
  }
  return { value, kind: "text" };
}
