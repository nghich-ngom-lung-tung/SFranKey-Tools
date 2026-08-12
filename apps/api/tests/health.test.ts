import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
describe("health", () => { it("returns a health payload", async () => { const response = await request(createApp()).get("/health"); expect(response.status).toBe(200); expect(response.body.status).toBe("ok"); expect(response.headers["x-request-id"]).toBeTruthy(); }); });
describe("feedback", () => { it("rejects malformed requests with a safe error envelope", async () => { const response = await request(createApp()).post("/v1/feedback").send({ kind: "bug_report" }); expect(response.status).toBe(400); expect(response.body.success).toBe(false); expect(response.body.error.code).toBe("VALIDATION_ERROR"); expect(response.body.error.requestId).toBeTruthy(); }); });
