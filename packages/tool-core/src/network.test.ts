import { describe, expect, it } from "vitest";
import { analyzeHeaders, maskIp, normalizeHostname, normalizeHttpUrl, normalizeIp, parseIceCandidate } from "./network";

describe("network core", () => {
  it.each([
    ["8.8.8.8", "public"], ["10.0.0.1", "private"], ["127.0.0.1", "loopback"],
    ["100.64.0.1", "carrier-grade-nat"], ["169.254.169.254", "link-local"], ["192.0.2.1", "documentation"],
    ["::1", "loopback"], ["fc00::1", "private"], ["fe80::1", "link-local"], ["2001:db8::1", "documentation"]
  ])("classifies %s", (value, scope) => expect(normalizeIp(value).scope).toBe(scope));

  it("normalizes mapped IPv4 and masks both families", () => {
    expect(normalizeIp("::ffff:8.8.8.8")).toEqual({ ip: "8.8.8.8", version: 4, scope: "public" });
    expect(maskIp("8.8.8.8")).toBe("8.8.8.xxx");
    expect(maskIp("2001:4860:4860::8888")).toContain("…");
  });

  it("normalizes public hostnames and guarded URLs", () => {
    expect(normalizeHostname("Example.COM.")).toBe("example.com");
    expect(normalizeHttpUrl("example.com/path#private").toString()).toBe("https://example.com/path");
    expect(() => normalizeHostname("localhost")).toThrowError("INVALID_HOSTNAME");
    expect(() => normalizeHttpUrl("file:///etc/passwd")).toThrowError("UNSUPPORTED_PROTOCOL");
    expect(() => normalizeHttpUrl("https://user:pass@example.com")).toThrowError("INVALID_URL");
    expect(() => normalizeHttpUrl("https://example.com:8443")).toThrowError("UNSUPPORTED_PORT");
  });

  it("parses ICE candidates without resolving mDNS", () => {
    expect(parseIceCandidate("candidate:1 1 udp 1 192.168.1.2 5000 typ host")?.scope).toBe("private");
    expect(parseIceCandidate("candidate:2 1 udp 1 device.local 5001 typ host")?.scope).toBe("mdns");
    expect(parseIceCandidate("candidate:3 1 udp 1 8.8.8.8 5002 typ srflx")?.type).toBe("srflx");
  });

  it("assesses selected headers without producing a score", () => {
    const result = analyzeHeaders("https:", { "content-type": "text/html", "content-security-policy": "default-src 'self'", "access-control-allow-origin": "*", "access-control-allow-credentials": "true" });
    expect(result.find((item) => item.name === "Content-Security-Policy")?.status).toBe("present");
    expect(result.find((item) => item.name === "Access-Control-Allow-Origin")?.status).toBe("warning");
  });
});
