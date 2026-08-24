import { decodeBase64Bytes, encodeBase64Bytes, Base64Error } from "./encoding";

export type HashAlgorithm = "SHA-256" | "SHA-384" | "SHA-512";
export type DigestFormat = "hex" | "base64";
export type HashComparisonErrorCode =
  "INVALID_HEX" | "INVALID_BASE64" | "INVALID_LENGTH";

export type HashComparison = {
  valid: boolean;
  matches: boolean;
  normalizedExpected?: string;
  errorCode?: HashComparisonErrorCode;
};

const DIGEST_BYTES: Record<HashAlgorithm, number> = {
  "SHA-256": 32,
  "SHA-384": 48,
  "SHA-512": 64,
};

function asBytes(data: ArrayBuffer | ArrayBufferView) {
  return data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(
        data.buffer.slice(
          data.byteOffset,
          data.byteOffset + data.byteLength,
        ) as ArrayBuffer,
      );
}

export function formatDigest(bytes: Uint8Array, format: DigestFormat): string {
  if (format === "base64") return encodeBase64Bytes(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export async function digestBytes(
  data: ArrayBuffer | ArrayBufferView,
  algorithm: HashAlgorithm = "SHA-256",
) {
  return new Uint8Array(
    await crypto.subtle.digest(
      algorithm,
      asBytes(data) as Uint8Array<ArrayBuffer>,
    ),
  );
}

export async function hashText(
  value: string,
  algorithm: HashAlgorithm = "SHA-256",
  format: DigestFormat = "hex",
) {
  return formatDigest(
    await digestBytes(new TextEncoder().encode(value), algorithm),
    format,
  );
}

export async function hashArrayBuffer(
  buffer: ArrayBuffer,
  algorithm: HashAlgorithm = "SHA-256",
  format: DigestFormat = "hex",
) {
  return formatDigest(await digestBytes(buffer, algorithm), format);
}

function normalizeHex(value: string) {
  return value
    .trim()
    .replace(/^0x/i, "")
    .replace(/[\t\n\f\r ]/g, "")
    .toLowerCase();
}

function normalizeBase64(value: string) {
  const compact = value.replace(/[\t\n\f\r ]/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact))
    throw new Error("INVALID_BASE64");
  const content = compact.replace(/=+$/, "");
  const explicitPadding = compact.length - content.length;
  if (content.length % 4 === 1) throw new Error("INVALID_BASE64");
  if (explicitPadding > 2 || (explicitPadding && compact.length % 4 !== 0))
    throw new Error("INVALID_BASE64");
  if (explicitPadding === 1 && content.length % 4 !== 3)
    throw new Error("INVALID_BASE64");
  if (explicitPadding === 2 && content.length % 4 !== 2)
    throw new Error("INVALID_BASE64");
  const padded = content.padEnd(Math.ceil(content.length / 4) * 4, "=");
  const bytes = decodeBase64Bytes(padded, false);
  return encodeBase64Bytes(bytes);
}

export function normalizeExpectedDigest(
  value: string,
  algorithm: HashAlgorithm,
  format: DigestFormat,
): string {
  const expectedBytes = DIGEST_BYTES[algorithm];
  if (format === "hex") {
    const normalized = normalizeHex(value);
    if (!/^[0-9a-f]*$/.test(normalized)) throw new Error("INVALID_HEX");
    if (normalized.length !== expectedBytes * 2)
      throw new Error("INVALID_LENGTH");
    return normalized;
  }

  try {
    const normalized = normalizeBase64(value);
    if (decodeBase64Bytes(normalized).byteLength !== expectedBytes)
      throw new Error("INVALID_LENGTH");
    return normalized;
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_LENGTH")
      throw error;
    if (error instanceof Base64Error) throw new Error("INVALID_BASE64");
    throw new Error("INVALID_BASE64");
  }
}

export function compareDigest(
  actual: string,
  expected: string,
  algorithm: HashAlgorithm,
  format: DigestFormat,
): HashComparison {
  try {
    const normalizedExpected = normalizeExpectedDigest(
      expected,
      algorithm,
      format,
    );
    const normalizedActual = normalizeExpectedDigest(actual, algorithm, format);
    return {
      valid: true,
      matches: normalizedActual === normalizedExpected,
      normalizedExpected,
    };
  } catch (error) {
    const errorCode =
      error instanceof Error &&
      ["INVALID_HEX", "INVALID_BASE64", "INVALID_LENGTH"].includes(
        error.message,
      )
        ? (error.message as HashComparisonErrorCode)
        : format === "hex"
          ? "INVALID_HEX"
          : "INVALID_BASE64";
    return { valid: false, matches: false, errorCode };
  }
}

/** Legacy comparison helper retained for existing callers. */
export function normalizeHash(value: string) {
  return value.trim().toLowerCase().replace(/\s/g, "");
}
export function compareHashes(a: string, b: string) {
  return normalizeHash(a) === normalizeHash(b);
}
