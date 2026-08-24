import { createServer } from "node:http";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
const server = createServer(createApp());
server.listen(env.API_PORT, () => console.log(`SFranKey API listening on :${env.API_PORT}`));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
