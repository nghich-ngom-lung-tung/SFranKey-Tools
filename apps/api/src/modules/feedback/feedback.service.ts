import { randomUUID } from "node:crypto";
import type { FeedbackRequest } from "@sfrankey/shared";
import { sendFeedbackEmail, verifyTurnstile } from "./feedback.provider.js";
export async function submitFeedback(input: FeedbackRequest, remoteIp?: string) { const requestId = randomUUID(); if (input.website) return { requestId }; if (!(await verifyTurnstile(input.turnstileToken, remoteIp))) { const error = new Error("Turnstile verification failed"); Object.assign(error, { status: 400 }); throw error; } await sendFeedbackEmail(input, requestId); return { requestId }; }
