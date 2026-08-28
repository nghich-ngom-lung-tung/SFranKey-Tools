import { networkActionSchema } from "@sfrankey/shared";
import { handleApiError, handleApiSuccess } from "@/server/network/api-response";
import { lookupMyIp } from "@/server/network/network-provider";
import { extractClientIp, verifyAction } from "@/server/network/turnstile";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const json = (await req.json().catch(() => ({}))) as unknown;
    const input = networkActionSchema.parse(json);
    const clientIp = extractClientIp(req);
    await verifyAction(input.turnstileToken, clientIp);
    const result = await lookupMyIp(clientIp);
    return handleApiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
