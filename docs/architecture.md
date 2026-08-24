# SFranKey Phase 1 architecture

The repository is an npm Workspaces/Turborepo monorepo with an independently deployable Next.js web app and Express API. Browser-safe tool algorithms live in `packages/tool-core`; shared contracts and the tool registry live in `packages/shared`.

The web app owns SEO pages and all local-first tool interactions. The API only exposes `/health`, `/v1/time` and `/v1/feedback` in Phase 1.

QR payload validation, QR rendering and QR scanning are exposed through separate `tool-core` entry points so generator routes do not load `jsqr` and reader routes do not load `qrcode`. QR Reader and the 2FA scanner share the browser-only scanner surface. Base64 file operations run in a cancellable worker, while File Checksum uses a separate `hash-wasm` worker that reads 4 MiB slices and never buffers the complete file.

Developer tools use dedicated `@sfrankey/tool-core/jwt`, `/json`, `/uuid` and `/timestamp` entry points. JWT, UUID and timestamp work stays in the route component; JSON validation and transformation run in a cancellable job-scoped Web Worker. The dispatcher only selects a workspace and records the existing anonymous tool-used event.
