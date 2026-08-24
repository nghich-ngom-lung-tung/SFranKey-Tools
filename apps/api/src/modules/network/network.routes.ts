import { Router } from "express";
import { networkRateLimit } from "../../middlewares/network-rate-limit.js";
import { getCapabilities, postDnsLookup, postHeaderCheck, postIpLookup, postLeakSession, postMyIp, postPrivacyCheck, postRedirectCheck, postSslCheck, readLeakSession, removeLeakSession } from "./network.controller.js";

export const networkRouter = Router();
networkRouter.get("/v1/network/capabilities", networkRateLimit(900), getCapabilities);
networkRouter.post("/v1/network/my-ip", networkRateLimit(30), postMyIp);
networkRouter.post("/v1/network/ip-lookup", networkRateLimit(20), postIpLookup);
networkRouter.post("/v1/network/privacy-check", networkRateLimit(10), postPrivacyCheck);
networkRouter.post("/v1/network/dns-lookup", networkRateLimit(20), postDnsLookup);
networkRouter.post("/v1/network/ssl-check", networkRateLimit(10), postSslCheck);
networkRouter.post("/v1/network/redirect-check", networkRateLimit(10), postRedirectCheck);
networkRouter.post("/v1/network/header-check", networkRateLimit(10), postHeaderCheck);
networkRouter.post("/v1/network/leak-sessions", networkRateLimit(5), postLeakSession);
networkRouter.get("/v1/network/leak-sessions/:id", networkRateLimit(30), readLeakSession);
networkRouter.delete("/v1/network/leak-sessions/:id", networkRateLimit(10), removeLeakSession);
