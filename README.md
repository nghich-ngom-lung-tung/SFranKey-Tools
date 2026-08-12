# SFranKey

SFranKey is a privacy-first security and developer tools hub. Phase 1 is a local-first public MVP: sensitive values stay in the browser and the API is reserved for health, time synchronization and feedback.

## Development

```bash
npm install
npm run dev
```

The web app runs on `http://localhost:3000`; the API runs on `http://localhost:4000`.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

See `docs/architecture.md`, `docs/security.md` and `docs/phase-1.md` for the implementation constraints.
