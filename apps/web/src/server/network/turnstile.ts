import { ApiError } from "./api-error";

export async function verifyTurnstile(token: string, remoteIp?: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret: secretKey, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

export async function verifyAction(token: string, remoteIp?: string) {
  const enabled = process.env.NETWORK_TOOLS_ENABLED !== "false";
  if (!enabled) throw new ApiError(503, "NETWORK_TOOLS_DISABLED", "Network tools are disabled.");
  const requireTurnstile = process.env.NETWORK_REQUIRE_TURNSTILE === "true";
  if (!requireTurnstile) return;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey || !token) throw new ApiError(400, "TURNSTILE_REQUIRED", "Verification is required.");
  if (!(await verifyTurnstile(token, remoteIp))) throw new ApiError(400, "TURNSTILE_FAILED", "Verification failed.");
}

export function extractClientIp(req: Request): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return undefined;
}
