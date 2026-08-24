import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
export const requestId: RequestHandler = (req, res, next) => {
  const candidate = req.header("x-request-id")?.trim();
  const id = candidate && /^[a-zA-Z0-9_-]{8,128}$/.test(candidate) ? candidate : randomUUID();
  res.locals.requestId = id;
  res.setHeader("x-request-id", id);
  next();
};
