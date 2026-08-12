import { decodeBase64 } from "./encoding";

function decodePart(part: string): unknown {
  const json = decodeBase64(part.replace(/-/g, "+").replace(/_/g, "/"), true);
  return JSON.parse(json);
}
export type DecodedJwt = { header: Record<string, unknown>; payload: Record<string, unknown>; signature: string; expiresAt?: Date; notBefore?: Date; issuedAt?: Date; expired?: boolean; notActive?: boolean };
export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split(".");
  if (parts.length !== 3) throw new Error("A JWT must contain three parts");
  const header = decodePart(parts[0]);
  const payload = decodePart(parts[1]);
  if (!header || typeof header !== "object" || !payload || typeof payload !== "object") throw new Error("JWT header and payload must be JSON objects");
  const claims = payload as Record<string, unknown>;
  const result: DecodedJwt = { header: header as Record<string, unknown>, payload: claims, signature: parts[2] };
  if (typeof claims.exp === "number") { result.expiresAt = new Date(claims.exp * 1000); result.expired = Date.now() >= claims.exp * 1000; }
  if (typeof claims.nbf === "number") { result.notBefore = new Date(claims.nbf * 1000); result.notActive = Date.now() < claims.nbf * 1000; }
  if (typeof claims.iat === "number") result.issuedAt = new Date(claims.iat * 1000);
  return result;
}
