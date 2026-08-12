import "dotenv/config";
import { z } from "zod";
const schema = z.object({ API_PORT: z.coerce.number().int().positive().default(4000), API_VERSION: z.string().default("0.1.0"), API_CORS_ORIGINS: z.string().default("http://localhost:3000"), TURNSTILE_SECRET_KEY: z.string().optional(), SMTP_HOST: z.string().optional(), SMTP_PORT: z.coerce.number().int().positive().default(587), SMTP_USER: z.string().optional(), SMTP_PASSWORD: z.string().optional(), FEEDBACK_TO_EMAIL: z.string().email().optional() });
export const env = schema.parse(process.env);
export const corsOrigins = env.API_CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
