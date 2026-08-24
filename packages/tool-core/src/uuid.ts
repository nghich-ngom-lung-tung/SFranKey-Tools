export type UuidCase = "lowercase" | "uppercase";

export type UuidV4Options = {
  count: number;
  casing: UuidCase;
  hyphens: boolean;
};

export type GeneratedUuidBatch = {
  values: string[];
  count: number;
  generatedAt: number;
};

export type UuidErrorCode =
  | "COUNT_NOT_INTEGER"
  | "COUNT_OUT_OF_RANGE"
  | "CRYPTO_UNAVAILABLE";

export class UuidError extends Error {
  readonly code: UuidErrorCode;

  constructor(code: UuidErrorCode) {
    super(code);
    this.name = "UuidError";
    this.code = code;
  }
}

function cryptoSource(): Crypto {
  if (typeof globalThis.crypto === "undefined") throw new UuidError("CRYPTO_UNAVAILABLE");
  if (typeof globalThis.crypto.randomUUID === "function" || typeof globalThis.crypto.getRandomValues === "function") {
    return globalThis.crypto;
  }
  throw new UuidError("CRYPTO_UNAVAILABLE");
}

export function generateUuidV4(): string {
  const source = cryptoSource();
  if (typeof source.randomUUID === "function") return source.randomUUID();
  if (typeof source.getRandomValues !== "function") throw new UuidError("CRYPTO_UNAVAILABLE");
  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function formatUuid(value: string, options: Pick<UuidV4Options, "casing" | "hyphens">): string {
  const formatted = options.hyphens ? value : value.replaceAll("-", "");
  return options.casing === "uppercase" ? formatted.toUpperCase() : formatted.toLowerCase();
}

export function validateUuidOptions(options: UuidV4Options): void {
  if (!Number.isInteger(options.count)) throw new UuidError("COUNT_NOT_INTEGER");
  if (options.count < 1 || options.count > 1_000) throw new UuidError("COUNT_OUT_OF_RANGE");
}

export function generateUuidBatch(options: UuidV4Options): GeneratedUuidBatch {
  validateUuidOptions(options);
  const values = Array.from({ length: options.count }, () =>
    formatUuid(generateUuidV4(), options),
  );
  return { values, count: values.length, generatedAt: Date.now() };
}

export function generateUuid() {
  return generateUuidV4();
}

export function generateUuids(count: number) {
  return generateUuidBatch({ count, casing: "lowercase", hyphens: true }).values;
}
