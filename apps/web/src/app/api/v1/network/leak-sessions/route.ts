import { leakSessionSchema } from "@sfrankey/shared";
import { handleApiError, handleApiSuccess } from "@/server/network/api-response";
import { createLeakSession, lookupIp } from "@/server/network/network-provider";
import { extractClientIp, verifyAction } from "@/server/network/turnstile";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const json = (await req.json().catch(() => ({}))) as unknown;
    const input = leakSessionSchema.parse(json);
    const clientIp = extractClientIp(req);
    await verifyAction(input.turnstileToken, clientIp);
    const session = await createLeakSession(input.kind);
    const ipProfile = input.kind === "combined" && clientIp ? await lookupIp(clientIp) : undefined;
    return handleApiSuccess({ ...session, ipProfile }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
