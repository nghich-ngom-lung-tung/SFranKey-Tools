# Security baseline

- Secrets, passwords, JWTs and file contents never enter URLs, analytics, logs or local storage.
- Browser tools do not call the API with user input.
- TOTP clock synchronization requests contain no secret or OTP configuration; if the endpoint fails, the browser clock remains the fallback.
- CSPRNG comes from Web Crypto; `Math.random()` is not used for security values.
- The API validates JSON with Zod, applies CORS, security headers, request IDs and feedback rate limits.
- Feedback request bodies are never logged. SMTP and Turnstile secrets are server-only.
- Camera permission is requested only from an explicit QR scanner action and is released on unmount.
- TOTP secrets, setup URIs and QR frames are held in component memory only and are cleared by Reset or when the page is left.
