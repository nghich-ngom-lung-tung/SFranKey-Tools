import type { ErrorRequestHandler } from "express";
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = String(res.locals.requestId ?? "unknown");
  const isValidation = Boolean(error && typeof error === "object" && "name" in error && error.name === "ZodError");
  const status = isValidation ? 400 : Number(error?.statusCode ?? error?.status ?? 500);
  const code = isValidation ? "VALIDATION_ERROR" : typeof error?.code === "string" ? error.code : status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR";
  const safeMessage = isValidation ? "Invalid request." : status >= 500 ? "Something went wrong." : error instanceof Error ? error.message : "Request failed";
  if (status >= 500) console.error(JSON.stringify({ level: "error", event: "request_failed", requestId, path: req.path, code }));
  res.status(status).json({ success: false, error: { code, message: safeMessage, requestId } });
};
