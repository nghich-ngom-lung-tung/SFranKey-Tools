import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOrigins, trustProxyCidrs } from "./config/env.js";
import { ApiError } from "./lib/api-error.js";
import { requestId } from "./middlewares/request-id.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { timeRouter } from "./modules/time/time.routes.js";
import { feedbackRouter } from "./modules/feedback/feedback.routes.js";
import { networkRouter } from "./modules/network/network.routes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (trustProxyCidrs.length) app.set("trust proxy", trustProxyCidrs);
  app.use(requestId);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: (origin, callback) => { if (!origin || corsOrigins.includes(origin)) callback(null, true); else callback(new ApiError(403, "CORS_ORIGIN_DENIED", "Origin not allowed.")); } }));
  app.use(express.json({ limit: "64kb", strict: true }));
  app.use(healthRouter);
  app.use(timeRouter);
  app.use(feedbackRouter);
  app.use(networkRouter);
  app.use((_req, res) => res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Not found", requestId: res.locals.requestId } }));
  app.use(errorHandler);
  return app;
}
