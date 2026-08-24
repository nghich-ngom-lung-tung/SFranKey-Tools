import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("network API envelope", () => {
  it("uses one request ID in header and body", async () => {
    const response = await request(createApp()).get("/v1/network/capabilities").set("x-request-id", "test-request-123");
    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBe("test-request-123");
    expect(response.body).toMatchObject({ success: true, requestId: "test-request-123" });
  });
  it("returns a stable CORS failure envelope", async () => {
    const response = await request(createApp()).get("/v1/network/capabilities").set("origin", "https://evil.example").set("x-request-id", "cors-request-123");
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ success: false, error: { code: "CORS_ORIGIN_DENIED", requestId: "cors-request-123" } });
  });
  it("does not contact IP intelligence for a private lookup", async () => {
    const response = await request(createApp()).post("/v1/network/ip-lookup").send({ ip: "10.0.0.1", turnstileToken: "" });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ ip: "10.0.0.1", scope: "private", approximate: true });
  });
  it("ignores spoofed forwarding headers without a trusted proxy", async () => {
    const response = await request(createApp()).post("/v1/network/my-ip").set("x-forwarded-for", "1.1.1.1").send({ turnstileToken: "" });
    expect(response.status).toBe(200);
    expect(response.body.data.ip).not.toBe("1.1.1.1");
    expect(response.body.data.scope).not.toBe("public");
  });
});
