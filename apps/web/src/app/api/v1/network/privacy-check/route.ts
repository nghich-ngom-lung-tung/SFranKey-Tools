import { privacyCheckSchema } from "@sfrankey/shared";
import { normalizeIp } from "@sfrankey/tool-core/network";
import { handleApiError, handleApiSuccess } from "@/server/network/api-response";
import { checkIpPrivacy } from "@/server/network/network-provider";
import { extractClientIp, verifyAction } from "@/server/network/turnstile";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const json = (await req.json().catch(() => ({}))) as unknown;
    const input = privacyCheckSchema.parse(json);
    const clientIp = extractClientIp(req);
    await verifyAction(input.turnstileToken, clientIp);
    const target = input.ip ? normalizeIp(input.ip).ip : clientIp ?? "127.0.0.1";
    const result = await checkIpPrivacy(target);
    return handleApiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
