# ReDeco — Room Planner

A browser-based interior design moodboard. Authenticated users can upload a room photo as a canvas background, search Pixabay or upload their own furniture images (with automatic background removal), drag/resize/snap furniture pieces, save multiple named rooms, and manage a shopping list.

## Stack

- **React 19** + TypeScript + Vite 5
- **Supabase** — auth, database (rooms, shopping lists), and image storage
- **@imgly/background-removal** — client-side AI background removal
- **Recharts** — analytics/charts
- **Sentry** — error tracking (optional)

## Running on Replit

```
npm run dev
```

Starts the Vite dev server on port 5000. The `Start application` workflow runs this automatically.

## Environment Variables

Set in Replit Secrets / env vars (all required unless noted):

| Key | Purpose |
|-----|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_PIXABAY_KEY` | Pixabay API key (furniture image search) |
| `VITE_SENTRY_DSN` | Sentry DSN (optional — error tracking) |

## Notes

- `onnxruntime-web` is excluded from both the Vite dev optimizer and Rollup build — it is loaded dynamically by `@imgly/background-removal` at runtime in the browser.
- `.npmrc` sets `legacy-peer-deps=true` to resolve an ESLint peer dependency conflict. This is also picked up by Vercel on deployment.
- Supabase schema is documented in `DOCUMENTATION.md` § 8.

## User Preferences

_None recorded yet._
