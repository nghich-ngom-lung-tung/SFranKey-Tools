# Phase 1 acceptance criteria

- 13 localized tool pages are available under `/vi` and `/en`.
- Local tools work without an account or database.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.
- No sensitive tool input is sent to the API, URL, analytics or local storage.
- Feedback is validated, rate-limited and delivered through the API without persisting a database record.
