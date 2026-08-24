import { describe, expect, it } from "vitest";
import { resolvePublicTarget } from "./network.target.js";

describe("outbound target guard", () => {
  it.each(["127.0.0.1", "10.0.0.1", "100.64.0.1", "169.254.169.254", "192.0.2.1", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1"])("blocks %s", async (address) => {
    await expect(resolvePublicTarget("example.com", async () => [{ address, family: address.includes(":") ? 6 : 4 }])).rejects.toMatchObject({ code: "UNSAFE_TARGET" });
  });
  it("blocks a mixed public/private DNS answer", async () => {
    await expect(resolvePublicTarget("example.com", async () => [{ address: "1.1.1.1", family: 4 }, { address: "10.0.0.1", family: 4 }])).rejects.toMatchObject({ code: "UNSAFE_TARGET" });
  });
  it("returns only a validated public address for pinning", async () => {
    await expect(resolvePublicTarget("example.com", async () => [{ address: "1.1.1.1", family: 4 }])).resolves.toEqual({ hostname: "example.com", address: "1.1.1.1", family: 4 });
  });
});
