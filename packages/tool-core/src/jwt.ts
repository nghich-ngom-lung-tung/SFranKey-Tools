export type JwtWarningCode =
  | "UNSECURED_ALGORITHM"
  | "EMPTY_SIGNATURE"
  | "INVALID_EXP_CLAIM"
  | "INVALID_NBF_CLAIM"
  | "INVALID_IAT_CLAIM"
  | "EXPIRED"
  | "NOT_ACTIVE";

export type JwtNumericDate = {
  raw: number;
  unixMs: number;
  iso: string;
};

export type DecodedJwtResult = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  algorithm?: string;
  tokenType?: string;
  expiresAt?: JwtNumericDate;
  notBefore?: JwtNumericDate;
  issuedAt?: JwtNumericDate;
  warnings: JwtWarningCode[];
};

export type JwtDecodeErrorCode =
  | "EMPTY_TOKEN"
  | "TOKEN_TOO_LARGE"
  | "INVALID_PART_COUNT"
  | "EMPTY_HEADER"
  | "EMPTY_PAYLOAD"
  | "INVALID_BASE64URL"
  | "INVALID_UTF8"
  | "INVALID_HEADER_JSON"
  | "INVALID_PAYLOAD_JSON"
  | "HEADER_NOT_OBJECT"
  | "PAYLOAD_NOT_OBJECT";

export class JwtDecodeError extends Error {
  readonly code: JwtDecodeErrorCode;

  constructor(code: JwtDecodeErrorCode) {
    super(code);
    this.name = "JwtDecodeError";
    this.code = code;
  }
}

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]*$/;
const DEFAULT_MAX_BYTES = 1024 * 1024;

function decodeBase64UrlSegment(segment: string): string {
  if (!segment || !BASE64URL_PATTERN.test(segment) || segment.length % 4 === 1) {
    throw new JwtDecodeError("INVALID_BASE64URL");
  }

  const standard = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard + "=".repeat((4 - (standard.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new JwtDecodeError("INVALID_BASE64URL");
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new JwtDecodeError("INVALID_UTF8");
  }
}

function decodeJsonPart(
  segment: string,
  code: "INVALID_HEADER_JSON" | "INVALID_PAYLOAD_JSON",
): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(decodeBase64UrlSegment(segment));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new JwtDecodeError(
        code === "INVALID_HEADER_JSON" ? "HEADER_NOT_OBJECT" : "PAYLOAD_NOT_OBJECT",
      );
    }
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof JwtDecodeError) throw error;
    throw new JwtDecodeError(code);
  }
}

function parseNumericDate(
  claims: Record<string, unknown>,
  claim: "exp" | "nbf" | "iat",
  warnings: JwtWarningCode[],
): JwtNumericDate | undefined {
  if (!(claim in claims)) return undefined;
  const value = claims[claim];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    warnings.push(
      claim === "exp"
        ? "INVALID_EXP_CLAIM"
        : claim === "nbf"
          ? "INVALID_NBF_CLAIM"
          : "INVALID_IAT_CLAIM",
    );
    return undefined;
  }

  const unixMs = Math.trunc(value * 1000);
  const date = new Date(unixMs);
  if (!Number.isFinite(unixMs) || Number.isNaN(date.getTime())) {
    warnings.push(
      claim === "exp"
        ? "INVALID_EXP_CLAIM"
        : claim === "nbf"
          ? "INVALID_NBF_CLAIM"
          : "INVALID_IAT_CLAIM",
    );
    return undefined;
  }
  return { raw: value, unixMs, iso: date.toISOString() };
}

export function decodeJwt(
  token: string,
  options: { nowMs?: number; maxBytes?: number } = {},
): DecodedJwtResult {
  const normalized = token.trim();
  if (!normalized) throw new JwtDecodeError("EMPTY_TOKEN");
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  if (new TextEncoder().encode(normalized).byteLength > maxBytes) {
    throw new JwtDecodeError("TOKEN_TOO_LARGE");
  }

  const parts = normalized.split(".");
  if (parts.length !== 3) throw new JwtDecodeError("INVALID_PART_COUNT");
  if (!parts[0]) throw new JwtDecodeError("EMPTY_HEADER");
  if (!parts[1]) throw new JwtDecodeError("EMPTY_PAYLOAD");
  if (!BASE64URL_PATTERN.test(parts[2]) || (parts[2].length > 0 && parts[2].length % 4 === 1)) {
    throw new JwtDecodeError("INVALID_BASE64URL");
  }

  const header = decodeJsonPart(parts[0], "INVALID_HEADER_JSON");
  const payload = decodeJsonPart(parts[1], "INVALID_PAYLOAD_JSON");
  const warnings: JwtWarningCode[] = [];
  const algorithm = typeof header.alg === "string" ? header.alg : undefined;
  const tokenType = typeof header.typ === "string" ? header.typ : undefined;
  if (algorithm?.toLowerCase() === "none") warnings.push("UNSECURED_ALGORITHM");
  if (!parts[2] && algorithm?.toLowerCase() !== "none") {
    warnings.push("EMPTY_SIGNATURE");
  }

  const nowMs = options.nowMs ?? Date.now();
  const expiresAt = parseNumericDate(payload, "exp", warnings);
  const notBefore = parseNumericDate(payload, "nbf", warnings);
  const issuedAt = parseNumericDate(payload, "iat", warnings);
  if (expiresAt && nowMs >= expiresAt.unixMs) warnings.push("EXPIRED");
  if (notBefore && nowMs < notBefore.unixMs) warnings.push("NOT_ACTIVE");

  return {
    header,
    payload,
    signature: parts[2],
    algorithm,
    tokenType,
    expiresAt,
    notBefore,
    issuedAt,
    warnings: [...new Set(warnings)],
  };
}
