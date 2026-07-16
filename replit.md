# Room Planner

A React + Vite room design/moodboard app. Users can upload a photo of their room, place furniture items on a canvas, save rooms, and build a shopping list.

## Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Auth & Database:** Supabase (auth, `rooms`, `furniture_items`, `shopping_lists`, `shopping_list_items` tables, `room-images` storage bucket)
- **Background removal:** `@imgly/background-removal`
- **Charts:** Recharts

## Running

```bash
npm run dev
```

Runs on port 5000. The workflow "Start application" is configured to start this automatically.

## Environment Variables

| Key | Description |
|-----|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable anon key |

Both are set in Replit's shared environment.

## User preferences

- Keep the existing project structure; do not restructure or migrate the stack.
