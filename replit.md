# ReDeco — Room Planner

A React + Vite room design/moodboard app. Users can upload a photo of their room, place and arrange furniture on a canvas, save rooms, and build a shopping list.

## Stack

- **Frontend:** React 19 + Vite 5 (downgraded from v8 for NixOS binary compatibility)
- **Auth & Database:** Supabase (auth, `rooms`, `shopping_lists`, `shopping_list_items` tables, `room-images` storage bucket)
- **Catalog:** Local fixture file (`src/lib/furnitureFixtures.js`) — 80 mock items, no Supabase table needed
- **Background removal:** `@imgly/background-removal`
- **Image search:** Pixabay API (`VITE_PIXABAY_KEY`)

## Running

```bash
npm install
npm run dev
```

Runs on port 5000. The workflow "Start application" starts this automatically.

## Environment Variables

| Key | Description |
|-----|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (set in Replit shared env) |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable anon key (set in Replit shared env) |
| `VITE_PIXABAY_KEY` | Pixabay API key — optional, needed for image search tab |

## Features

- **Guest access** — moodboard is fully usable without signing in; shopping list is local-only for guests and merges on sign-in
- **Furniture catalog** — 80 mock items in `src/lib/furnitureFixtures.js`; no `furniture_items` table required for the demo
- **Canvas controls** — drag, resize (bottom-right handle), and rotate (bottom-left ↻ handle) each placed item; all values persist with room saves
- **Shopping list** — add canvas items to list, adjust quantity, remove, see running total; works for guests (local) and logged-in users (Supabase)
- **Saving** — requires sign-in; guests see an inline auth prompt

## User preferences

- Keep the existing project structure; do not restructure or migrate the stack.
- Vite must stay at v5.x — Vite 6+ uses a Rust-based Rolldown binary that crashes on this NixOS environment (stable-25_05).
