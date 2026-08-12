export type TotpConfig = { secret: string; algorithm?: "SHA-1" | "SHA-256" | "SHA-512"; digits?: 6 | 8; period?: number; counter?: number };
export type OtpauthData = { type: "totp" | "hotp"; secret: string; issuer?: string; account?: string; algorithm?: "SHA-1" | "SHA-256" | "SHA-512"; digits?: 6 | 8; period?: number; counter?: number };

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
  const url = new URL(value.trim());
  if (url.protocol !== "otpauth:") throw new Error("Expected an otpauth:// URI");
  const type = url.hostname as "totp" | "hotp";
  if (type !== "totp" && type !== "hotp") throw new Error("Unsupported OTP type");
  const secret = url.searchParams.get("secret") ?? "";
  decodeBase32(secret);
  const label = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const [issuerFromLabel, account] = label.includes(":") ? label.split(/:(.*)/s, 2) : [undefined, label];
  const algorithm = (url.searchParams.get("algorithm") ?? "SHA1").replace("SHA1", "SHA-1").replace("SHA256", "SHA-256").replace("SHA512", "SHA-512") as NonNullable<OtpauthData["algorithm"]>;
  if (!["SHA-1", "SHA-256", "SHA-512"].includes(algorithm)) throw new Error("Unsupported OTP algorithm");
  const digits = Number(url.searchParams.get("digits") ?? "6") as 6 | 8;
  if (digits !== 6 && digits !== 8) throw new Error("OTP digits must be 6 or 8");
  const issuer = url.searchParams.get("issuer") ?? issuerFromLabel;
  const period = Number(url.searchParams.get("period") ?? "30");
  const counter = Number(url.searchParams.get("counter") ?? "0");
  return { type, secret, issuer, account, algorithm, digits, period, counter };
}

function algorithmName(algorithm: TotpConfig["algorithm"] = "SHA-1") { return algorithm; }

export async function generateOtp(config: TotpConfig, nowMs = Date.now()): Promise<string> {
  const secret = decodeBase32(config.secret);
  const period = config.period ?? 30;
  const counterValue = config.counter ?? Math.floor(nowMs / 1000 / period);
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
