import type { FeedbackRequest } from "@sfrankey/shared";
import { sendFeedbackEmail, verifyTurnstile } from "./feedback.provider.js";
import { ApiError } from "../../lib/api-error.js";
export async function submitFeedback(input: FeedbackRequest, requestId: string, remoteIp?: string) { if (input.website) return; if (!(await verifyTurnstile(input.turnstileToken, remoteIp))) throw new ApiError(400, "TURNSTILE_FAILED", "Verification failed."); await sendFeedbackEmail(input, requestId); }
