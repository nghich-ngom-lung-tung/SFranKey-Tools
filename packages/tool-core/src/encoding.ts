const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeBase64(value: string, urlSafe = false) {
  const bytes = encoder.encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  const result = btoa(binary);
  return urlSafe ? result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "") : result;
}

export function decodeBase64(value: string, urlSafe = false) {
  const normalized = urlSafe ? value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=") : value;
  const binary = atob(normalized);
  return decoder.decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

export function encodeBase64Bytes(bytes: Uint8Array, urlSafe = false) {
  let binary = ""; bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  const result = btoa(binary);
  return urlSafe ? result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "") : result;
}

export function decodeBase64Bytes(value: string, urlSafe = false) {
  const normalized = urlSafe ? value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=") : value;
  const binary = atob(normalized);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
