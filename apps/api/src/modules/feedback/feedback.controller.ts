import type { RequestHandler } from "express";
import { feedbackSchema } from "./feedback.schema.js";
import { submitFeedback } from "./feedback.service.js";
export const postFeedback: RequestHandler = async (req, res, next) => { try { const parsed = feedbackSchema.parse(req.body); const result = await submitFeedback(parsed, req.ip); res.status(202).json({ success: true, ...result }); } catch (error) { next(error); } };
