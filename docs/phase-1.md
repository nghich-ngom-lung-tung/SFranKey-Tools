# Phase 1 acceptance criteria

- 13 localized tool pages are available under `/vi` and `/en`.
- Local tools work without an account or database.
- `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.
- No sensitive tool input is sent to the API, URL, analytics or local storage.
- Feedback is validated, rate-limited and delivered through the API without persisting a database record.
- QR Generator supports text, URL, email, phone, SMS, Wi-Fi and vCard payloads with local PNG/SVG export.
- QR Reader and the 2FA scanner share image validation, camera cleanup and safe-link confirmation behavior.
- Base64 handles bounded Unicode text and binary files in both directions; File Checksum streams up to 200 MiB through a cancellable worker.
- Hash comparisons validate algorithm-specific length and keep Base64 case-sensitive.
