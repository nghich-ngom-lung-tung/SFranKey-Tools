import rateLimit from "express-rate-limit";
export const feedbackRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, error: { code: "RATE_LIMITED", message: "Too many feedback requests. Try again later." } } });
