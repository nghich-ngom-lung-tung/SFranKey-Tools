import { describe, expect, it, vi } from "vitest";
import { decodeJwt, JwtDecodeError } from "./jwt";
import { JsonToolError, processJson } from "./json";
import { generateUuidBatch, generateUuidV4 } from "./uuid";
import { convertWallTime, formatTimestamp, parseTimestamp } from "./timestamp";

const encodePart = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

describe("JWT core", () => {
  it("decodes unicode claims and timing warnings without verifying", () => {
    const token = `${encodePart({ alg: "none", typ: "JWT" })}.${encodePart({ sub: "SFranKey", exp: 1, iat: 0 })}.`;
    const result = decodeJwt(token, { nowMs: 2_000 });
    expect(result.payload.sub).toBe("SFranKey");
    expect(result.warnings).toEqual(expect.arrayContaining(["UNSECURED_ALGORITHM", "EXPIRED"]));
  });

  it("rejects padding and non-object JSON", () => {
    expect(() => decodeJwt("e30=.e30=.sig")).toThrowError(JwtDecodeError);
    expect(() => decodeJwt(`${encodePart([])}.${encodePart({})}.sig`)).toThrowError("HEADER_NOT_OBJECT");
  });
});

describe("JSON core", () => {
  it("formats, minifies and sorts without rounding a large number", () => {
    const input = '{"b":1,"a":90071992547409931234567890}';
    const result = processJson(input, { operation: "format", indent: { kind: "spaces", size: 2 }, sortKeys: true });
    expect(result.output).toContain('"a": 90071992547409931234567890');
    expect(processJson(input, { operation: "minify", indent: { kind: "spaces", size: 2 }, sortKeys: false }).output).toBe(input);
  });

  it("reports duplicate keys and rejects comments", () => {
    expect(() => processJson('{"a":1,"a":2}', { operation: "validate", indent: { kind: "spaces", size: 2 }, sortKeys: false })).toThrowError(JsonToolError);
    try { processJson("{/* comment */\"a\":1}", { operation: "validate", indent: { kind: "spaces", size: 2 }, sortKeys: false }); } catch (error) { expect(error).toMatchObject({ code: "COMMENTS_NOT_ALLOWED" }); }
  });
});

describe("UUID core", () => {
  it("generates a v4 batch and rejects invalid count", () => {
    const batch = generateUuidBatch({ count: 3, casing: "uppercase", hyphens: false });
    expect(batch.values).toHaveLength(3);
    expect(batch.values.every((value) => /^[0-9A-F]{32}$/.test(value))).toBe(true);
    expect(() => generateUuidBatch({ count: 0, casing: "lowercase", hyphens: true })).toThrow("COUNT_OUT_OF_RANGE");
    expect(generateUuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("does not call Math.random", () => {
    const random = vi.spyOn(Math, "random");
    generateUuidV4();
    expect(random).not.toHaveBeenCalled();
    random.mockRestore();
  });
});

describe("Timestamp core", () => {
  it("parses seconds and milliseconds and formats an epoch", () => {
    expect(parseTimestamp("0", "auto")).toMatchObject({ unixMs: 0, detectedUnit: "seconds" });
    expect(parseTimestamp("1700000000000", "auto")).toMatchObject({ unixMs: 1_700_000_000_000, detectedUnit: "milliseconds" });
    expect(formatTimestamp(0, { locale: "en-US", timeZone: "UTC", nowMs: 0 }).isoUtc).toContain("1970-01-01");
  });

  it("makes New York DST transitions explicit", () => {
    const ambiguous = convertWallTime({ value: "2024-11-03T01:30", timeZone: "America/New_York", outputUnit: "seconds", disambiguation: "reject" });
    expect(ambiguous.status).toBe("ambiguous");
    if (ambiguous.status !== "success") expect(ambiguous.earlier.timestamp).not.toBe(ambiguous.later.timestamp);
    const nonexistent = convertWallTime({ value: "2024-03-10T02:30", timeZone: "America/New_York", outputUnit: "seconds", disambiguation: "reject" });
    expect(nonexistent.status).toBe("nonexistent");
  });
});
