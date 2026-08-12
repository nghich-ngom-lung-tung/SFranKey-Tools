# SFranKey

SFranKey is a privacy-first security and developer tools hub. Phase 1 is a local-first public MVP: sensitive values stay in the browser and the API is reserved for health, time synchronization and feedback.

## Development

```bash
pnpm install
pnpm dev
```

The web app runs on `http://localhost:3000`; the API runs on `http://localhost:4000`.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

See `docs/architecture.md`, `docs/security.md` and `docs/phase-1.md` for the implementation constraints.
