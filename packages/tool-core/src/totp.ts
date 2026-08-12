export type TotpAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";
export type TotpConfig = { secret: string; algorithm?: TotpAlgorithm; digits?: 6 | 8; period?: number; counter?: number };
export type ResolvedTotpConfig = { secret: string; issuer?: string; account?: string; algorithm: TotpAlgorithm; digits: 6 | 8; period: 30 | 60 };
export type OtpauthData = ResolvedTotpConfig & { type: "totp" | "hotp"; counter?: number };

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function normalizeBase32(value: string) {
  return value.toUpperCase().replace(/[\s=-]/g, "");
}

export function decodeBase32(value: string): Uint8Array {
  const normalized = normalizeBase32(value);
  if (!normalized || /[^A-Z2-7]/.test(normalized)) throw new Error("Invalid Base32 secret");
  let bits = 0;
  let buffer = 0;
  const output: number[] = [];
  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 255);
    }
  }
  return new Uint8Array(output);
}

export function parseOtpAuth(value: string): OtpauthData {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error("Invalid otpauth URI"); }
  if (url.protocol !== "otpauth:") throw new Error("Expected an otpauth:// URI");
  const type = url.hostname.toLowerCase() as "totp" | "hotp";
  if (type !== "totp" && type !== "hotp") throw new Error("Unsupported OTP type");
  const secret = url.searchParams.get("secret") ?? "";
  const normalizedSecret = normalizeBase32(secret);
  decodeBase32(normalizedSecret);
  let label: string;
  try { label = decodeURIComponent(url.pathname.replace(/^\//, "")); } catch { throw new Error("Invalid otpauth label"); }
  const [issuerFromLabel, account] = label.includes(":") ? label.split(/:(.*)/s, 2) : [undefined, label];
  const algorithmValue = (url.searchParams.get("algorithm") ?? "SHA1").toUpperCase().replaceAll("-", "");
  const algorithm = ({ SHA1: "SHA-1", SHA256: "SHA-256", SHA512: "SHA-512" } as const)[algorithmValue as "SHA1" | "SHA256" | "SHA512"];
  if (!algorithm) throw new Error("Unsupported OTP algorithm");
  const digitsValue = Number(url.searchParams.get("digits") ?? "6");
  const digits = digitsValue as 6 | 8;
  if (digits !== 6 && digits !== 8) throw new Error("OTP digits must be 6 or 8");
  const issuer = url.searchParams.get("issuer") ?? issuerFromLabel;
  const periodValue = Number(url.searchParams.get("period") ?? "30");
  const period = periodValue as 30 | 60;
  if (type === "totp" && period !== 30 && period !== 60) throw new Error("OTP period must be 30 or 60 seconds");
  const counterValue = Number(url.searchParams.get("counter") ?? "0");
  if (type === "hotp" && (!Number.isSafeInteger(counterValue) || counterValue < 0)) throw new Error("HOTP counter must be a non-negative integer");
  return { type, secret: normalizedSecret, issuer: issuer || undefined, account: account || undefined, algorithm, digits, period: period === 60 ? 60 : 30, counter: counterValue };
}

export function resolveTotpConfig(value: string): ResolvedTotpConfig {
  const parsed = parseOtpAuth(value);
  if (parsed.type !== "totp") throw new Error("HOTP is not supported; use a TOTP URI");
  return { secret: parsed.secret, issuer: parsed.issuer, account: parsed.account, algorithm: parsed.algorithm, digits: parsed.digits, period: parsed.period };
}

function algorithmName(algorithm: TotpConfig["algorithm"] = "SHA-1") { return algorithm; }

export async function generateOtp(config: TotpConfig, nowMs = Date.now()): Promise<string> {
  const secret = decodeBase32(config.secret);
  const period = config.period ?? 30;
  if (!Number.isInteger(period) || period <= 0) throw new Error("OTP period must be a positive integer");
  const counterValue = config.counter ?? Math.floor(nowMs / 1000 / period);
  if (!Number.isSafeInteger(counterValue) || counterValue < 0) throw new Error("OTP counter must be a non-negative integer");
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, Math.floor(counterValue / 2 ** 32));
  view.setUint32(4, counterValue >>> 0);
  const key = await crypto.subtle.importKey("raw", secret as Uint8Array<ArrayBuffer>, { name: "HMAC", hash: algorithmName(config.algorithm) }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, buffer));
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  const digits = config.digits ?? 6;
  return String(binary % 10 ** digits).padStart(digits, "0");
}

export function otpRemainingSeconds(nowMs = Date.now(), period = 30) {
  const seconds = Math.floor(nowMs / 1000);
  return period - (seconds % period);
}
