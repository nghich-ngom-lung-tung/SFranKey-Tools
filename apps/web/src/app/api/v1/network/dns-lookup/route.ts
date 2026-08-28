import { dnsLookupSchema } from "@sfrankey/shared";
import { handleApiError, handleApiSuccess } from "@/server/network/api-response";
import { resolveDns } from "@/server/network/network-provider";
import { extractClientIp, verifyAction } from "@/server/network/turnstile";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const json = (await req.json().catch(() => ({}))) as unknown;
    const input = dnsLookupSchema.parse(json);
    const clientIp = extractClientIp(req);
    await verifyAction(input.turnstileToken, clientIp);
    const result = await resolveDns(input.hostname, input.types);
    return handleApiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
