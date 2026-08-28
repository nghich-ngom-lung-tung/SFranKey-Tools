import { urlCheckSchema } from "@sfrankey/shared";
import { handleApiError, handleApiSuccess } from "@/server/network/api-response";
import { inspectRedirects } from "@/server/network/network-target";
import { extractClientIp, verifyAction } from "@/server/network/turnstile";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const json = (await req.json().catch(() => ({}))) as unknown;
    const input = urlCheckSchema.parse(json);
    const clientIp = extractClientIp(req);
    await verifyAction(input.turnstileToken, clientIp);
    const result = await inspectRedirects(input.url);
    return handleApiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
