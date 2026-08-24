import rateLimit from "express-rate-limit";
export function networkRateLimit(limit: number) {
  return rateLimit({ windowMs: 15 * 60 * 1000, limit, standardHeaders: "draft-8", legacyHeaders: false, validate: { xForwardedForHeader: false }, handler: (_req, res) => { const requestId = String(res.locals.requestId ?? "unknown"); res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many network checks. Try again later.", requestId } }); } });
}
