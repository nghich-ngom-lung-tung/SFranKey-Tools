import { Router } from "express";
export const timeRouter = Router();
timeRouter.get("/v1/time", (_req, res) => res.json({ unixMs: Date.now() }));
