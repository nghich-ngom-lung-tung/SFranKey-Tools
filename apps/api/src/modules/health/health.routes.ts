import { Router } from "express";
import { env } from "../../config/env.js";
export const healthRouter = Router();
healthRouter.get("/health", (_req, res) => res.json({ status: "ok", version: env.API_VERSION, timestamp: new Date().toISOString() }));
