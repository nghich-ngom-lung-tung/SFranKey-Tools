import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import type { FeedbackRequest } from "@sfrankey/shared";

export async function sendFeedbackEmail(input: FeedbackRequest, requestId: string) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.FEEDBACK_TO_EMAIL) {
    console.info(JSON.stringify({ level: "info", event: "feedback_received", requestId, kind: input.kind }));
    return;
  }
  const transporter = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465, auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } });
  await transporter.sendMail({ from: env.SMTP_USER, to: env.FEEDBACK_TO_EMAIL, replyTo: input.email || undefined, subject: `[SFranKey] ${input.kind}: ${input.subject}`, text: `Kind: ${input.kind}\nSubject: ${input.subject}\nEmail: ${input.email || "(none)"}\nPage: ${input.pageUrl || "(none)"}\n\n${input.message}` });
}

export async function verifyTurnstile(token: string, remoteIp?: string) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout(5000) });
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
