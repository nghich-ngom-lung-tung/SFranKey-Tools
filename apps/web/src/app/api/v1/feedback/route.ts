import { feedbackSchema } from "@sfrankey/shared";
import { handleApiError, handleApiSuccess } from "@/server/network/api-response";
import { extractClientIp, verifyAction } from "@/server/network/turnstile";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const json = (await req.json().catch(() => ({}))) as unknown;
    const input = feedbackSchema.parse(json);
    const clientIp = extractClientIp(req);
    if (input.turnstileToken) {
      await verifyAction(input.turnstileToken, clientIp);
    }
    // Log feedback cleanly (can optionally send email if SMTP env vars are present)
    console.info(
      JSON.stringify({
        level: "info",
        event: "feedback_received",
        kind: input.kind,
        subject: input.subject,
        locale: input.locale,
        email: input.email || "(none)",
      })
    );
    return handleApiSuccess({ received: true }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
