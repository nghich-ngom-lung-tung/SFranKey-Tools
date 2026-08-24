const encoder = new TextEncoder();

export type Base64Alphabet = "standard" | "url-safe";
export type Base64FileEncoding = "raw" | "data-url";

export type ParsedBase64File = {
  bytes: Uint8Array;
  mimeType: string;
  source: Base64FileEncoding;
};

export type Base64DataUrlParts = {
  mimeType: string;
  payload: string;
};

export type Base64ErrorCode =
  | "INVALID_ALPHABET"
  | "INVALID_PADDING"
  | "INVALID_LENGTH"
  | "INVALID_UTF8"
  | "INVALID_DATA_URL"
  | "INVALID_MIME"
  | "DECODED_SIZE_LIMIT";

export class Base64Error extends Error {
  readonly code: Base64ErrorCode;

  constructor(code: Base64ErrorCode, message = code) {
    super(message);
    this.name = "Base64Error";
    this.code = code;
  }
}

const ASCII_WHITESPACE = /[\t\n\f\r ]/g;
const MIME_PATTERN =
  /^[a-zA-Z][a-zA-Z0-9!#$&^_.+-]{0,126}\/[a-zA-Z0-9!#$&^_.+-]{1,127}$/;

function stripAsciiWhitespace(value: string) {
  return value.replace(ASCII_WHITESPACE, "");
}

function toStandardAlphabet(value: string, alphabet: Base64Alphabet) {
  return alphabet === "url-safe"
    ? value.replace(/-/g, "+").replace(/_/g, "/")
    : value;
}

function validateNormalized(value: string, alphabet: Base64Alphabet) {
  const normalized = stripAsciiWhitespace(value);
  const alphabetPattern =
    alphabet === "url-safe"
      ? /^[A-Za-z0-9_-]*={0,2}$/
      : /^[A-Za-z0-9+/]*={0,2}$/;
  if (!alphabetPattern.test(normalized)) {
    throw new Base64Error("INVALID_ALPHABET");
  }

  const firstPadding = normalized.indexOf("=");
  const content =
    firstPadding >= 0 ? normalized.slice(0, firstPadding) : normalized;
  const padding = firstPadding >= 0 ? normalized.slice(firstPadding) : "";
  if (padding && padding.length > 2) {
    throw new Base64Error("INVALID_PADDING");
  }
  if (content.length % 4 === 1) {
    throw new Base64Error("INVALID_LENGTH");
  }
  if (alphabet === "standard" && normalized.length % 4 !== 0) {
    throw new Base64Error("INVALID_LENGTH");
  }
  if (padding && normalized.length % 4 !== 0) {
    throw new Base64Error("INVALID_PADDING");
  }
  if (padding.length === 1 && content.length % 4 !== 3) {
    throw new Base64Error("INVALID_PADDING");
  }
  if (padding.length === 2 && content.length % 4 !== 2) {
    throw new Base64Error("INVALID_PADDING");
  }

  return normalized;
}

function toPaddedStandard(value: string, alphabet: Base64Alphabet) {
  const normalized = validateNormalized(value, alphabet);
  const standard = toStandardAlphabet(normalized, alphabet);
  return standard.padEnd(Math.ceil(standard.length / 4) * 4, "=");
}

function binaryToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(
      offset,
      Math.min(offset + chunkSize, bytes.length),
    );
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/** Validate a Base64 string and return its whitespace-free representation. */
export function validateBase64(
  value: string,
  alphabet: Base64Alphabet = "standard",
) {
  return validateNormalized(value, alphabet);
}

/** Encode UTF-8 text using RFC 4648 Base64. */
export function encodeBase64(value: string, urlSafe = false) {
  return encodeBase64Bytes(encoder.encode(value), urlSafe);
}

/** Decode UTF-8 text and reject malformed Base64 or malformed UTF-8. */
export function decodeBase64(value: string, urlSafe = false) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      decodeBase64Bytes(value, urlSafe),
    );
  } catch (error) {
    if (error instanceof Base64Error) throw error;
    throw new Base64Error("INVALID_UTF8");
  }
}

/** Encode raw bytes. The legacy boolean argument remains supported. */
export function encodeBase64Bytes(bytes: Uint8Array, urlSafe = false) {
  const result = binaryToBase64(bytes);
  return urlSafe
    ? result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
    : result;
}

/** Decode raw bytes with strict alphabet, padding and case handling. */
export function decodeBase64Bytes(value: string, urlSafe = false) {
  const alphabet: Base64Alphabet = urlSafe ? "url-safe" : "standard";
  const normalized = toPaddedStandard(value, alphabet);
  try {
    const binary = atob(normalized);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    throw new Base64Error("INVALID_PADDING");
  }
}

export function encodeBase64Alphabet(
  bytes: Uint8Array,
  alphabet: Base64Alphabet,
) {
  return encodeBase64Bytes(bytes, alphabet === "url-safe");
}

export function decodeBase64Alphabet(value: string, alphabet: Base64Alphabet) {
  return decodeBase64Bytes(value, alphabet === "url-safe");
}

export function parseBase64DataUrlParts(value: string): Base64DataUrlParts {
  const match = /^data:([^;,\s]+);base64,(.*)$/is.exec(value);
  if (!match || !MIME_PATTERN.test(match[1])) {
    throw new Base64Error("INVALID_DATA_URL");
  }
  return { mimeType: match[1].toLowerCase(), payload: match[2] };
}

export function parseBase64DataUrl(
  value: string,
  alphabet: Base64Alphabet = "standard",
): ParsedBase64File {
  const { mimeType, payload } = parseBase64DataUrlParts(value);
  return {
    bytes: decodeBase64Alphabet(payload, alphabet),
    mimeType,
    source: "data-url",
  };
}

export function parseBase64File(
  value: string,
  alphabet: Base64Alphabet = "standard",
  mimeType = "application/octet-stream",
): ParsedBase64File {
  if (!MIME_PATTERN.test(mimeType)) throw new Base64Error("INVALID_MIME");
  if (/^data:/i.test(value)) return parseBase64DataUrl(value, alphabet);
  return {
    bytes: decodeBase64Alphabet(value, alphabet),
    mimeType: mimeType.toLowerCase(),
    source: "raw",
  };
}

/** Estimate decoded bytes before allocating the output buffer. */
export function estimateBase64DecodedSize(
  value: string,
  alphabet: Base64Alphabet = "standard",
) {
  const normalized = validateNormalized(value, alphabet);
  const contentLength = normalized.replace(/=+$/, "").length;
  const explicitPadding = normalized.length - contentLength;
  const padding = explicitPadding || (4 - (contentLength % 4)) % 4;
  const paddedLength = Math.ceil(contentLength / 4) * 4;
  return Math.floor((paddedLength / 4) * 3) - padding;
}
