# SFranKey Phase 1 architecture

The repository is an npm Workspaces/Turborepo monorepo with an independently deployable Next.js web app and Express API. Browser-safe tool algorithms live in `packages/tool-core`; shared contracts and the tool registry live in `packages/shared`.

The web app owns SEO pages and all local-first tool interactions. The API only exposes `/health`, `/v1/time` and `/v1/feedback` in Phase 1.
