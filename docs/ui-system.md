# SFranKey UI system

The web shell uses a mint-first, local-first visual language for the security workspace. The source of truth for reusable primitives is `packages/ui`; application pages compose those primitives without duplicating the brand palette or icon mapping.

## Brand and tokens

- `BrandMark` is a code-native SVG monogram combining the S/F strokes with a keyhole inside a shield.
- `BrandLogo` is used in the header, splash, footer and favicon foundation.
- Mint shades, semantic surfaces, radii, shadows and motion durations are CSS variables in `apps/web/src/app/globals.css`, with Tailwind aliases in `apps/web/tailwind.config.ts`.
- Category accents are mapped in `packages/ui`: teal for 2FA, emerald for passwords, cyan for QR, lime for encoding and violet for developer tools.
- Signal Console V2 uses Deep Forest for the fixed header/footer, privacy band and result surfaces; Mint Signal is reserved for CTAs, active states, focus and local-processing status; Ivory Workspace keeps forms and catalog cards readable.
- Surface tokens include header/control, soft/strong sections, card/tinted/hover, workspace/result/footer, border tiers and shared soft/card/raised/featured shadows.
- Geist Sans and Geist Mono are bundled locally through `geist`; no font is loaded from a CDN.

## Motion and splash

`MotionProvider` mounts one `LazyMotion` provider at the application shell. Motion is reserved for the splash, drawer, dialogs and section-level entrance; controls and progress use CSS transitions. The splash marker is `sfrankey-ui-splash-v1` in `sessionStorage`, so it runs once per tab and is never part of `LocalPreferences`. Escape, Skip, reduced-motion and storage failures all close it safely.

## Tool surfaces

`ToolCard` consumes the shared tool registry and renders `showcase`, `standard`, `compact` and `related` variants for homepage, catalog, category, search and related-tool contexts. Showcase cards contain static, aria-hidden previews for featured tools; they never receive user input. Favorite actions are siblings of the primary link, preventing nested interactive elements. `ToolCatalog` keeps search text in React memory and persists only favorite/recent tool IDs through the existing versioned preferences.

`ToolPageFrame` provides the breadcrumb, localized identity, privacy status, workspace slot, instructions, privacy explanation, FAQ and related tools. `WorkspaceShell` adds the shared toolbar and local-processing status around every tool without changing tool state or validation. Sensitive values remain inside the tool workspace and are not copied into motion state, URLs, analytics or local preferences.

## Accessibility and reduced motion

All primary actions use at least 44px touch targets, visible focus rings and Radix primitives for dialog/drawer/focus management. The `prefers-reduced-motion` media query removes transforms, masks, parallax and artificial splash delay while leaving content immediately available.
