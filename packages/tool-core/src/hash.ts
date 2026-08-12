import { encodeBase64Bytes } from "./encoding";

export type HashAlgorithm = "SHA-256" | "SHA-384" | "SHA-512";
export async function digestBytes(data: ArrayBuffer | ArrayBufferView, algorithm: HashAlgorithm = "SHA-256") {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
  return new Uint8Array(await crypto.subtle.digest(algorithm, bytes as Uint8Array<ArrayBuffer>));
}
export async function hashText(value: string, algorithm: HashAlgorithm = "SHA-256", format: "hex" | "base64" = "hex") {
  const digest = await digestBytes(new TextEncoder().encode(value), algorithm);
  return format === "base64" ? encodeBase64Bytes(digest) : Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
export async function hashFile(file: File, algorithm: HashAlgorithm = "SHA-256", format: "hex" | "base64" = "hex") {
  return hashArrayBuffer(await file.arrayBuffer(), algorithm, format);
}
export async function hashArrayBuffer(buffer: ArrayBuffer, algorithm: HashAlgorithm = "SHA-256", format: "hex" | "base64" = "hex") {
  const digest = await digestBytes(buffer, algorithm);
  return format === "base64" ? encodeBase64Bytes(digest) : Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
export function normalizeHash(value: string) { return value.trim().toLowerCase().replace(/\s/g, ""); }
export function compareHashes(a: string, b: string) { return normalizeHash(a) === normalizeHash(b); }
