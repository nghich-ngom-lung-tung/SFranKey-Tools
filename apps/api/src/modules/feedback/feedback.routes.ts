import { Router } from "express";
import { feedbackRateLimit } from "../../middlewares/feedback-rate-limit.js";
import { postFeedback } from "./feedback.controller.js";
export const feedbackRouter = Router();
feedbackRouter.post("/v1/feedback", feedbackRateLimit, postFeedback);
