import { describe, expect, it } from "vitest";
import { assessPassword, decodeBase64, encodeBase64, estimateClockOffset, formatJson, generatePassword, generateUuid, generateOtp, hashText, parseOtpAuth, resolveTotpConfig } from "./index";
describe("tool core", () => {
  it("round trips unicode Base64", () => { const value = "SFranKey — riêng tư"; expect(decodeBase64(encodeBase64(value))).toBe(value); });
  it("formats JSON", () => { expect(formatJson('{"b":1,"a":2}')).toContain("\n"); });
  it("generates a UUID v4", () => { expect(generateUuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/); });
  it("generates a password from selected groups", () => { const value = generatePassword({ length: 20, uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: false, noRepeat: false }); expect(value).toHaveLength(20); expect(value).toMatch(/[A-Z]/); expect(value).toMatch(/[a-z]/); expect(value).toMatch(/\d/); });
  it("detects a weak common password", () => { expect(assessPassword("password").score).toBe(0); });
  it("rejects impossible no-repeat settings", () => { expect(() => generatePassword({ length: 100, uppercase: false, lowercase: false, numbers: true, symbols: false, excludeAmbiguous: false, noRepeat: true })).toThrow(); });
  it("matches the RFC TOTP SHA-1 vector", async () => { await expect(generateOtp({ secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", algorithm: "SHA-1", digits: 8, period: 30 }, 59_000)).resolves.toBe("94287082"); });
  it("matches RFC 6238 SHA-256 and SHA-512 vectors", async () => { const sha256Secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZA"; const sha512Secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNA"; await expect(generateOtp({ secret: sha256Secret, algorithm: "SHA-256", digits: 8, period: 30 }, 59_000)).resolves.toBe("46119246"); await expect(generateOtp({ secret: sha512Secret, algorithm: "SHA-512", digits: 8, period: 30 }, 59_000)).resolves.toBe("90693936"); });
  it("parses otpauth metadata", () => { const parsed = parseOtpAuth("otpauth://totp/SFranKey:alice?secret=JBSWY3DPEHPK3PXP&issuer=SFranKey&digits=8&period=60"); expect(parsed.account).toBe("alice"); expect(parsed.digits).toBe(8); expect(parsed.period).toBe(60); });
  it("normalizes and resolves a TOTP URI without retaining its raw formatting", () => { const parsed = resolveTotpConfig("otpauth://totp/SFranKey:alice?secret=jbsw y3dp-ehpk3pxp&algorithm=SHA256"); expect(parsed.secret).toBe("JBSWY3DPEHPK3PXP"); expect(parsed.algorithm).toBe("SHA-256"); });
  it("rejects HOTP for the TOTP workspace", () => { expect(() => resolveTotpConfig("otpauth://hotp/SFranKey:alice?secret=JBSWY3DPEHPK3PXP&counter=1")).toThrow(/HOTP/); });
  it("estimates clock offset at the request midpoint", () => { expect(estimateClockOffset(1_000, 1_200, 1_250)).toEqual({ offsetMs: 150, roundTripMs: 200 }); });
  it("matches a SHA-256 known vector", async () => { await expect(hashText("abc", "SHA-256")).resolves.toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"); });
});
