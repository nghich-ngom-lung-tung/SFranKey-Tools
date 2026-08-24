import { describe, expect, it, vi } from "vitest";
import {
  assessPassword,
  buildQrPayload,
  classifyQrValue,
  compareDigest,
  decodeBase64,
  decodeBase64Bytes,
  encodeBase64,
  encodeBase64Bytes,
  estimateClockOffset,
  estimateBase64DecodedSize,
  estimatePassphraseEntropy,
  generateOtp,
  generatePassword,
  generatePasswordBatch,
  hashText,
  loadEffWordlist,
  parseBase64DataUrlParts,
  parseOtpAuth,
  resolveTotpConfig,
  validateQrColors,
} from "./index";
import { formatJson } from "./json";
import { generateUuid } from "./uuid";

describe("tool core", () => {
  it("round trips unicode Base64", () => {
    const value = "SFranKey — riêng tư";
    expect(decodeBase64(encodeBase64(value))).toBe(value);
  });

  it("formats JSON", () => {
    expect(formatJson('{"b":1,"a":2}')).toContain("\n");
  });

  it("generates a UUID v4", () => {
    expect(generateUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("generates a password from selected groups", () => {
    const value = generatePassword({
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      excludeAmbiguous: false,
      noRepeat: false,
    });
    expect(value).toHaveLength(20);
    expect(value).toMatch(/[A-Z]/);
    expect(value).toMatch(/[a-z]/);
    expect(value).toMatch(/\d/);
  });

  it("defaults to excluding ambiguous characters", () => {
    const value = generatePassword({
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: true,
      noRepeat: false,
    });
    expect(value).not.toMatch(/[O0Il1]/);
  });

  it("uses the Web Crypto path instead of Math.random", () => {
    const random = vi.spyOn(Math, "random");
    generatePassword({
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: true,
      noRepeat: false,
    });
    expect(random).not.toHaveBeenCalled();
    random.mockRestore();
  });

  it("rejects impossible no-repeat settings and invalid batches", async () => {
    expect(() =>
      generatePassword({
        length: 100,
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: false,
        excludeAmbiguous: false,
        noRepeat: true,
      }),
    ).toThrow();
    await expect(
      generatePasswordBatch({
        mode: "characters",
        count: 51,
        options: {
          length: 20,
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: true,
          excludeAmbiguous: false,
          noRepeat: false,
        },
      }),
    ).rejects.toThrow();
  });

  it("generates EFF passphrases from the complete wordlist", async () => {
    const wordlist = await loadEffWordlist();
    expect(wordlist).toHaveLength(7_776);
    const results = await generatePasswordBatch({
      mode: "passphrase",
      count: 3,
      options: { wordCount: 6, separator: " ", capitalizeWords: false },
    });
    for (const result of results) {
      expect(result.value.split(" ")).toHaveLength(6);
      expect(
        result.value.split(" ").every((word) => wordlist.includes(word)),
      ).toBe(true);
      expect(result.estimatedEntropyBits).toBeCloseTo(6 * Math.log2(7_776), 10);
    }
    expect(
      estimatePassphraseEntropy({
        wordCount: 6,
        separator: " ",
        capitalizeWords: false,
      }),
    ).toBeCloseTo(6 * Math.log2(7_776), 10);
  });

  it("assesses weak and strong passwords locally with zxcvbn-ts", async () => {
    await expect(assessPassword("password", "en")).resolves.toMatchObject({
      score: 0,
    });
    await expect(
      assessPassword("correct-horse-battery-staple-71", "vi"),
    ).resolves.toMatchObject({ score: 4 });
    await expect(assessPassword("a".repeat(513), "en")).rejects.toThrow(
      "PASSWORD_TOO_LONG",
    );
  });

  it("matches the RFC TOTP SHA-1 vector", async () => {
    await expect(
      generateOtp(
        {
          secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
          algorithm: "SHA-1",
          digits: 8,
          period: 30,
        },
        59_000,
      ),
    ).resolves.toBe("94287082");
  });

  it("matches RFC 6238 SHA-256 and SHA-512 vectors", async () => {
    const sha256Secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZA";
    const sha512Secret =
      "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQGEZDGNA";
    await expect(
      generateOtp(
        { secret: sha256Secret, algorithm: "SHA-256", digits: 8, period: 30 },
        59_000,
      ),
    ).resolves.toBe("46119246");
    await expect(
      generateOtp(
        { secret: sha512Secret, algorithm: "SHA-512", digits: 8, period: 30 },
        59_000,
      ),
    ).resolves.toBe("90693936");
  });

  it("parses otpauth metadata", () => {
    const parsed = parseOtpAuth(
      "otpauth://totp/SFranKey:alice?secret=JBSWY3DPEHPK3PXP&issuer=SFranKey&digits=8&period=60",
    );
    expect(parsed.account).toBe("alice");
    expect(parsed.digits).toBe(8);
    expect(parsed.period).toBe(60);
  });

  it("normalizes and resolves a TOTP URI without retaining its raw formatting", () => {
    const parsed = resolveTotpConfig(
      "otpauth://totp/SFranKey:alice?secret=jbsw y3dp-ehpk3pxp&algorithm=SHA256",
    );
    expect(parsed.secret).toBe("JBSWY3DPEHPK3PXP");
    expect(parsed.algorithm).toBe("SHA-256");
  });

  it("rejects HOTP for the TOTP workspace", () => {
    expect(() =>
      resolveTotpConfig(
        "otpauth://hotp/SFranKey:alice?secret=JBSWY3DPEHPK3PXP&counter=1",
      ),
    ).toThrow(/HOTP/);
  });

  it("estimates clock offset at the request midpoint", () => {
    expect(estimateClockOffset(1_000, 1_200, 1_250)).toEqual({
      offsetMs: 150,
      roundTripMs: 200,
    });
  });

  it("matches a SHA-256 known vector", async () => {
    await expect(hashText("abc", "SHA-256")).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("round trips standard and URL-safe Base64 bytes without losing case", () => {
    const bytes = Uint8Array.from([0, 0xff, 0x41, 0x7a]);
    const standard = encodeBase64Bytes(bytes);
    const urlSafe = encodeBase64Bytes(bytes, true);
    expect(decodeBase64Bytes(standard)).toEqual(bytes);
    expect(decodeBase64Bytes(urlSafe, true)).toEqual(bytes);
    expect(estimateBase64DecodedSize("TQ", "url-safe")).toBe(1);
    expect(estimateBase64DecodedSize("TQ==")).toBe(1);
    expect(() => decodeBase64("!!!!")).toThrow();
    expect(() => decodeBase64Bytes("a", true)).toThrow();
    expect(() => decodeBase64Bytes("TQ=")).toThrow();
    expect(() => decodeBase64Bytes("TQ===")).toThrow();
    expect(decodeBase64Bytes("TQ", true)).toEqual(Uint8Array.of(77));
    expect(parseBase64DataUrlParts("data:text/plain;base64,%%%%")).toEqual({
      mimeType: "text/plain",
      payload: "%%%%",
    });
  });

  it("builds and classifies QR payloads", () => {
    expect(buildQrPayload({ kind: "url", url: "example.com/path?a=1" })).toBe(
      "https://example.com/path?a=1",
    );
    expect(() =>
      buildQrPayload({ kind: "url", url: "ftp://example.com" }),
    ).toThrow();
    expect(() =>
      buildQrPayload({ kind: "url", url: "file:///private.txt" }),
    ).toThrow();
    expect(
      buildQrPayload({
        kind: "wifi",
        ssid: "office;wifi",
        security: "WPA",
        password: "p\\;ass",
        hidden: false,
      }),
    ).toContain("S:office\\;wifi");
    expect(
      buildQrPayload({
        kind: "vcard",
        fullName: "Nguyễn, An",
        phone: "+84 123 456",
      }),
    ).toContain("FN:Nguyễn\\, An\r\n");
    expect(classifyQrValue("https://sfrankey.com").kind).toBe("url");
    expect(classifyQrValue("otpauth://totp/SFranKey:a?secret=ABC").kind).toBe(
      "otpauth",
    );
    expect(classifyQrValue("hello").kind).toBe("text");
    expect(
      buildQrPayload({
        kind: "wifi",
        ssid: 'a\\;,:"',
        security: "nopass",
        password: "ignored",
        hidden: true,
      }),
    ).toBe('WIFI:T:nopass;S:a\\\\\\;\\,\\:\\";P:;H:true;;');
    expect(buildQrPayload({ kind: "vcard", fullName: "An\nNguyen" })).toContain(
      "FN:An\\nNguyen\r\nEND:VCARD",
    );
    expect(validateQrColors("#ffffff", "#ffffff")).toMatchObject({
      usable: false,
      warning: false,
    });
    expect(validateQrColors("#000000", "#ffffff")).toMatchObject({
      usable: true,
      warning: false,
    });
  });

  it("hashes empty UTF-8 input without special-casing it", async () => {
    await expect(hashText("", "SHA-256", "hex")).resolves.toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("compares hex case-insensitively but Base64 case-sensitively", async () => {
    const digest = await hashText("abc", "SHA-256", "base64");
    expect(
      compareDigest(digest, ` ${digest} `, "SHA-256", "base64"),
    ).toMatchObject({ valid: true, matches: true });
    expect(
      compareDigest(digest, digest.replace(/=+$/, ""), "SHA-256", "base64"),
    ).toMatchObject({ valid: true, matches: true });
    expect(
      compareDigest(
        digest,
        (digest[0] === "A" ? "B" : "A") + digest.slice(1),
        "SHA-256",
        "base64",
      ),
    ).toMatchObject({ valid: true, matches: false });
    expect(
      compareDigest(
        "0xBA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD",
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
        "SHA-256",
        "hex",
      ),
    ).toMatchObject({ valid: true, matches: true });
    expect(compareDigest("aa", "bb", "SHA-256", "hex").errorCode).toBe(
      "INVALID_LENGTH",
    );
  });
});
