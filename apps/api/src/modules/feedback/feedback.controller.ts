import type { RequestHandler } from "express";
import { feedbackSchema } from "./feedback.schema.js";
import { submitFeedback } from "./feedback.service.js";
export const postFeedback: RequestHandler = async (req, res, next) => { try { const parsed = feedbackSchema.parse(req.body); const requestId = String(res.locals.requestId); await submitFeedback(parsed, requestId, req.ip); res.status(202).json({ success: true, data: { accepted: true }, requestId }); } catch (error) { next(error); } };
