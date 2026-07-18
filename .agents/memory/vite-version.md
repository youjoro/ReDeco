---
name: Vite version constraint
description: Vite 6+ uses a Rust-based Rolldown binary that crashes on this NixOS environment — must stay on v5.x.
---

## Rule
Keep Vite pinned to `^5.x` in package.json. Do not upgrade to Vite 6, 7, or 8.

**Why:** Vite 6+ bundles a native Rolldown binary (Rust). On this Replit NixOS environment (stable-25_05, nodejs-20), that binary throws a `Bus error` immediately on startup. Vite 5 uses pure JS Rollup and works fine.

**How to apply:** If a package or task requests a Vite upgrade, decline or pin back to 5.x. Also update `vite.config.ts` — use `rollupOptions` not `rolldownOptions` (the v6+ key).

Paired packages to also keep on v5-compatible ranges: `@vitejs/plugin-react ^4.x`, `typescript ~5.5.x`.
