# ReDeco — Technical Documentation

> Audience: developers with React/TypeScript experience.  
> Last updated: July 2026 | Branch: `feature/carousel-and-shopping-fix`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Tech Stack & NPM Packages](#3-tech-stack--npm-packages)
4. [Environment Variables & Secrets](#4-environment-variables--secrets)
5. [Database — Schema & Decisions](#5-database--schema--decisions)
6. [Data Flow — How Data Is Sent & Fetched](#6-data-flow--how-data-is-sent--fetched)
7. [Styling System — Design Tokens & Where to Change Them](#7-styling-system--design-tokens--where-to-change-them)
8. [Component Reference](#8-component-reference)
9. [Custom Hooks & Utilities](#9-custom-hooks--utilities)
10. [State Management & Context](#10-state-management--context)
11. [Routing](#11-routing)
12. [Authentication Flow](#12-authentication-flow)
13. [User Behaviour Monitoring](#13-user-behaviour-monitoring)
14. [Deployment — Vercel](#14-deployment--vercel)
15. [Adding New Features](#15-adding-new-features)
16. [Swapping Out Packages](#16-swapping-out-packages)
17. [Known Limitations & UX Audit Items](#17-known-limitations--ux-audit-items)

---

## 1. Project Overview

ReDeco is a browser-based interior design moodboard. Users drag furniture images onto a virtual canvas, set a room background photo, rotate and resize items, and save their layouts. A shopping list collects items they like.

**Runtime**: React 19 + TypeScript + Vite. All persistence is via Supabase (Postgres + Storage + Auth). There is no custom Express/Node backend — Supabase acts as the entire BaaS layer.

---

## 2. Repository Structure

```
/
├── docs/                        ← Documentation (this file lives here)
├── src/
│   ├── main.tsx                 ← App entry point; Sentry init; React root
│   ├── App.jsx                  ← Root component; view routing; global state
│   ├── App.css                  ← Global layout, animations, modals
│   ├── index.css                ← CSS design tokens (variables), resets
│   │
│   ├── components/
│   │   ├── Auth/                ← Login + signup forms
│   │   ├── Canvas/              ← Main design workspace + draggable items
│   │   ├── ErrorFallback.tsx    ← Sentry error boundary UI
│   │   ├── Feedback/            ← Floating feedback button → Sentry
│   │   ├── GridSlider/          ← Snap-to-grid size slider
│   │   ├── Landing/             ← Marketing landing page
│   │   ├── Paywall/             ← Pro-feature gate UI (not yet wired to payments)
│   │   ├── RoomManager/         ← List, load, delete saved rooms
│   │   ├── ShoppingList/        ← Shopping list panel
│   │   ├── Sidebar/             ← Tabbed panel: Search | Upload | Room
│   │   └── Toolbar/             ← Top navigation bar
│   │
│   ├── context/
│   │   ├── ShoppingListContext.jsx   ← Shopping list global state + Supabase sync
│   │   └── ThemeContext.jsx          ← Light/dark theme toggle
│   │
│   ├── hooks/
│   │   └── useWindowDrag.js     ← Window-level mouse/touch drag abstraction
│   │
│   └── lib/
│       ├── supabase.js          ← Supabase client + all CRUD functions
│       ├── furnitureFixtures.js ← 80 local catalog items (fallback / demo)
│       ├── imageUtils.js        ← Background removal + image sizing
│       ├── rateLimiter.js       ← Per-action rate throttling
│       ├── roomPersistence.js   ← Local-storage draft saving
│       ├── security.js          ← URL/src sanitisation
│       ├── shoppingMatch.js     ← Regex match canvas labels → catalog UUIDs
│       └── snapGrid.js          ← Snap coordinate to nearest grid multiple
│
├── supabase-setup.sql           ← One-time DB setup script (run in Supabase dashboard)
├── vercel.json                  ← Vercel build + CSP headers config
├── vite.config.ts               ← Vite dev server config (port 5000)
├── tsconfig.json
└── package.json
```

---

## 3. Tech Stack & NPM Packages

### Production dependencies

| Package | Version | Purpose | How to swap |
|---|---|---|---|
| `react` / `react-dom` | 19 | UI framework | N/A — core |
| `@supabase/supabase-js` | 2.x | Auth, database, storage | Replace `src/lib/supabase.js` exports with another BaaS (Firebase, PocketBase). Each exported function is a clean boundary. |
| `@imgly/background-removal` | 1.7 | Client-side AI background removal (WebAssembly) | Replace `imageUtils.js → removeBackground()`. Any service returning a blob works. Alternative: Clipdrop or Remove.bg API calls server-side. |
| `@sentry/react` | 10 | Error tracking + user feedback capture | Replace `src/main.tsx` Sentry init and `FeedbackButton.jsx → Sentry.captureMessage`. Alternative: GlitchTip (open-source Sentry-compatible). |
| `nanoid` | 6 | Short unique ID generation for canvas items | Drop-in swap: `crypto.randomUUID()` (native, no package needed). |
| `recharts` | 3 | Data visualisation (imported but not yet used in the main canvas flow) | Remove if unused; or swap for `victory`, `nivo`, or `chart.js`. |

### Dev dependencies

| Package | Purpose |
|---|---|
| `vite` + `@vitejs/plugin-react` | Build tool + HMR. **Must stay on v5.x** on NixOS (v6+ crashes with Bus error). |
| `typescript` ~5.5 | Type checking |
| `vitest` | Unit test runner |
| `@testing-library/react` | Component tests |
| `jimp` / `pixelmatch` | Image comparison in tests |
| `eslint` + plugins | Linting |

---

## 4. Environment Variables & Secrets

All secrets are injected at **build time** via Vite's `import.meta.env`. They must be prefixed `VITE_` to be exposed to client code.

| Variable | Where it's read | What it does |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/lib/supabase.js` line 4 | Supabase project REST endpoint |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.js` line 5 | Supabase anon/public key (safe to expose — RLS enforces access) |
| `VITE_PIXABAY_KEY` | `src/components/Sidebar/SearchTab.jsx` | Pixabay image search API key |
| `VITE_SENTRY_DSN` | `src/main.tsx` | Sentry project DSN for error reporting |

### Where to store them

**Local development (Replit):**  
Add via Replit's Secrets panel (the padlock icon). They are injected as environment variables and Vite picks them up automatically.

**Production (Vercel):**  
`vercel.json` does NOT hold secrets. Go to **Vercel dashboard → Project → Settings → Environment Variables** and add each `VITE_` key there. Vercel injects them during `npm run build`.

**Never** commit values to `.env` files or hardcode them in source. The fallbacks in `supabase.js` (`"http://localhost"`, `"placeholder"`) are intentional no-ops for cold starts without env vars — they will not connect to any real Supabase project.

---

## 5. Database — Schema & Decisions

Run `supabase-setup.sql` once in the Supabase SQL editor to create all tables. The file is idempotent (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).

### Tables

#### `public.rooms`
```sql
id          uuid  PRIMARY KEY  DEFAULT gen_random_uuid()
user_id     uuid  FK → auth.users(id)  ON DELETE CASCADE
name        text  DEFAULT 'Untitled Room'
background  text  -- public HTTPS URL from Supabase Storage, or null
items       jsonb -- array of canvas item objects (see below)
updated_at  timestamptz
```
**Design decision:** `items` is stored as a JSONB array, not normalised rows. This was a deliberate v1 choice — canvas items are ephemeral layout state, not entities that need to be queried or joined. The whole array is replaced on each save (`UPDATE rooms SET items = $1`). If you later need per-item querying (e.g. analytics on which furniture is most placed), extract `items` into its own table.

**Canvas item shape (inside the JSONB array):**
```json
{
  "id":       "abc123",          // nanoid
  "src":      "https://...",     // image URL
  "label":    "Velvet Sofa",
  "x":        120,               // canvas-space pixels from left
  "y":        80,                // canvas-space pixels from top
  "width":    200,
  "height":   150,
  "rotation": 45,                // degrees
  "zOrder":   2,                 // stacking index
  "catalogId":"00000000-..."     // FK to furniture_items.id, or null for uploads
}
```

#### `public.furniture_items`
```sql
id            uuid PRIMARY KEY
name          text
tags          text[]
price         numeric(10,2)
image_url     text
retailer_name text
product_url   text
sponsored     boolean DEFAULT false
```
**Design decision:** No RLS on this table (public read). The catalog is read-only for all users, including unauthenticated ones. Seeded with 80 demo items (UUIDs `00000000-0000-0000-0000-000000001001` … `1080`). In production, replace demo data with real retailer SKUs and wire up `sponsored` for monetisation.

#### `public.shopping_lists`
```sql
id      uuid PRIMARY KEY
user_id uuid UNIQUE FK → auth.users(id)  ON DELETE CASCADE
name    text DEFAULT 'My Shopping List'
```
One list per user (enforced by `UNIQUE (user_id)`). Created lazily on first add via `getOrCreateShoppingList()`.

#### `public.shopping_list_items`
```sql
id                      uuid PRIMARY KEY
shopping_list_id        uuid FK → shopping_lists(id)    ON DELETE CASCADE
furniture_item_id       uuid FK → furniture_items(id)   ON DELETE CASCADE
quantity                integer CHECK (quantity >= 1)    DEFAULT 1
added_from_moodboard_id uuid FK → rooms(id)             ON DELETE SET NULL
created_at              timestamptz
```
**Critical FK constraint:** `furniture_item_id` must be a UUID that exists in `furniture_items`. The local fixture file (`furnitureFixtures.js`) uses matching UUIDs (`00000000-0000-0000-0000-000000001001` … `1080`) — if you change the seed data or add new items, keep the UUIDs in sync or inserts will fail with a FK violation.

### Row-Level Security (RLS)

| Table | Policy |
|---|---|
| `rooms` | Users can only SELECT/INSERT/UPDATE/DELETE their own rows (`auth.uid() = user_id`) |
| `shopping_lists` | Same — own rows only |
| `shopping_list_items` | Users can only access items inside their own shopping list (sub-select join) |
| `furniture_items` | Public read, no write from client |

### Storage

One bucket: `room-images` (must be set to **Public**).  
Path pattern: `{user_id}/{folder}/{timestamp}.{ext}` where `folder` is `"furniture"` or `"room"`.

---

## 6. Data Flow — How Data Is Sent & Fetched

All database calls go through `src/lib/supabase.js`. No component calls the Supabase client directly — they call the named exports from that file.

### Pattern

```
Component / Context
    ↓  calls named export
src/lib/supabase.js
    ↓  uses @supabase/supabase-js client
Supabase REST API (HTTPS)
    ↓
Postgres (in Supabase cloud)
```

### Key data flows

**Room save:**
```
App.jsx handleSave()
  → uploadBase64Image() for any blob: URLs (user uploads)
  → saveRoom({ id, name, background, items })
      → supabase.from("rooms").upsert(payload)
```
If `id` is set → UPDATE. If not → INSERT (new room). The returned row gives the new `id` which App.jsx stores in state so subsequent saves become UPDATEs.

**Room load:**
```
RoomManager opens
  → loadRooms() → SELECT * FROM rooms WHERE user_id = auth.uid() ORDER BY updated_at DESC
User clicks a room
  → App.jsx handleLoadRoom(room) → sets items, background, roomId, roomName from the room object
```

**Shopping list — add item:**
```
FurnitureItem 🛒 button → onAddToList(item)
  → Canvas.jsx passes up to App.jsx → ShoppingListContext addItem()
      → getOrCreateShoppingList() → finds or inserts shopping_lists row
      → shoppingMatch(item.label) → looks up furniture_items UUID by label
      → addShoppingListItem({ shoppingListId, furnitureItemId, quantity:1 })
          → INSERT INTO shopping_list_items (...)
```

**Furniture catalog:**
```
SearchTab mounts
  → tries loadFurnitureCatalog() (SELECT * FROM furniture_items)
  → falls back to FURNITURE_FIXTURES (local array) if Supabase unavailable
```

**Image upload (custom furniture):**
```
UploadTab file drop
  → imageUtils.removeBackground(file) → WebAssembly processing → blob URL
  → App.jsx handleAddItem() stores item with blob: URL in state
  → On save: uploadBase64Image(blob) → PUT to Supabase Storage → returns public URL
  → items array updated with permanent URL before saving to DB
```

---

## 7. Styling System — Design Tokens & Where to Change Them

ReDeco uses **plain CSS with CSS custom properties** (design tokens). No CSS-in-JS, no Tailwind, no SCSS.

### Token file: `src/index.css`

All colour, surface, and gradient tokens are defined here as CSS variables on `:root` (light theme) and `[data-theme="dark"]`.

```css
/* PRIMARY ACCENT — change these two lines to rebrand */
--accent:       #b85c38;   /* terracotta */
--accent-dark:  #9d4d2f;
```

| Token group | Variables | Used for |
|---|---|---|
| Surfaces | `--bg`, `--sidebar`, `--toolbar`, `--canvas`, `--card-bg` | Background colours |
| Text | `--text`, `--text-sub`, `--text-faint` | Typography hierarchy |
| Borders | `--border`, `--sidebar-bdr`, `--toolbar-bdr` | Lines and outlines |
| Primary accent | `--accent`, `--accent-dark`, `--accent-light`, `--accent-glow`, `--accent-shadow` | Buttons, links, highlights |
| Secondary accent | `--accent-2`, `--accent-2-light` | Success states, green tones |
| Status | `--danger`, `--danger-bg`, `--success` | Error/success messages |
| Gradients | `--gradient-accent`, `--gradient-dark`, `--gradient-surface`, `--gradient-page`, `--gradient-canvas-empty` | Hero sections, empty states |

### Typography

Set in `src/index.css` on `html, body`:
```css
font-family: 'Inter', 'Segoe UI', sans-serif;
```
Inter is loaded from the system stack — no Google Fonts import. To switch fonts, change this line and optionally add a `<link>` to `index.html`.

### Component-level CSS

Each component folder has its own `.css` file imported directly in the component. Styles are not scoped (no CSS Modules) — class names use BEM-like conventions (`canvas-minibar__zoom-btn`).

**To change global layout spacing or typography scale:** edit `src/index.css` and `src/App.css`.  
**To change a specific component:** edit its matching `.css` file in the same folder.  
**To rebrand colours:** change `--accent` and `--accent-dark` in `src/index.css`. Update both `:root` and `[data-theme="dark"]` blocks.

---

## 8. Component Reference

### `App.jsx`
Root component. Owns global state: `view` (landing/auth/canvas), `items[]`, `background`, `roomId`, `roomName`, `user`, `saving`.

| Function | Does |
|---|---|
| `navigateTo(view)` | Fades out with curtain overlay, waits 280ms, switches view |
| `resetTimers()` | Resets the 25-minute inactivity timer that auto-logs out users |
| `handleAddItem(item)` | Deduplicates by src, appends to canvas items |
| `handleSave()` | Converts blob: URLs → Supabase Storage URLs, then calls `saveRoom()` |
| `handleRename()` | Uses `window.prompt()` (known UX debt — see §17) |
| `handleLoadRoom(room)` | Hydrates canvas from a saved room object |
| `handleNewRoom()` | Resets all canvas state |
| `handleNeedAuth()` | Shows the "create an account" modal overlay |

---

### `Canvas.jsx`
Manages the drop surface and all item state. Renders `FurnitureItem` for each item.

| Function | Does |
|---|---|
| `update(id, patch)` | Immutably updates one item in the items array |
| `zoomIn/Out/Reset` | Steps zoom ±10%, clamped 25%–150% |
| `handleDrop(e)` | Reads dragged item data, places at drop coords divided by zoom |
| `handleDrag/Resize/Rotate` | Delegates to `update()` |
| `handleBringToFront/Back/Forward/Backward` | Reorders `zOrder` values |
| `handleDelete(id)` | Removes item; clears selection if it was selected |

**Zoom implementation:** A `canvas-scene` div inside `canvas-area` receives `transform: scale(zoom); transform-origin: top left`. Drop coordinates from `handleDrop` and drag/resize deltas in `FurnitureItem` are all divided by `zoom` to stay in canvas-space (unscaled pixel coordinates stored in DB).

---

### `FurnitureItem.jsx`
Draggable, resizable, rotatable image element.

| Prop | Type | Purpose |
|---|---|---|
| `item` | Object | `{id, src, x, y, width, height, rotation, zOrder}` |
| `zoom` | number | Current canvas zoom (default 1) — used to convert screen px → canvas px |
| `gridSize` | number | Snap grid size in canvas px |
| `onDrag/Resize/Rotate/Delete` | functions | Lift state to Canvas |
| `onAddToList` | function | Triggers shopping list add |
| `isSelected` / `onSelect` | bool / function | Selection state |

**Coordinate maths:** All `clientX/Y` values from mouse/touch events are divided by `zoom` before use. Rotation angle (`atan2`) is computed from `getBoundingClientRect()` which is already in screen-space, so no zoom correction is needed there.

---

### `Sidebar.jsx` → tabs

| Tab | File | What it does |
|---|---|---|
| Search | `SearchTab.jsx` | Searches furniture catalog (Supabase + local fixtures). Drag or tap items to canvas. Horizontal carousel on mobile (≤640px), 2-column grid on desktop. |
| Upload | `UploadTab.jsx` | File drop → background removal → canvas item |
| Room | `RoomTab.jsx` | Set room background via file upload or URL |

---

### `Toolbar.jsx`
Top bar with: brand logo, room name (rename button), save status, shopping list badge, theme toggle, room manager, sign in/out.

`guardedSave()` and `guardedRooms()` check `user` before acting and call `onNeedAuth()` for guests.

---

### `RoomManager.jsx`
Modal that fetches `loadRooms()` on open, lists rooms with thumbnail (background or placeholder), and exposes Load / Delete per room.

---

### `ShoppingListPanel.jsx`
Reads from `ShoppingListContext`. Shows item image, name, price, quantity stepper, remove button. Quantity changes call `updateQuantity()` which patches the DB row.

---

### `FeedbackButton.jsx`
Floating `💬 Feedback` button. On submit, calls `Sentry.captureMessage(text, { level: "info", extra: { email } })`. No separate DB table — feedback goes to the Sentry project.

---

### `Auth.jsx`
Controlled form. `submit()` calls `signIn()` or `signUp()` from `supabase.js`, then calls `onAuth(user)` to lift the user object to App.jsx.

---

### `GridSlider/`
Wraps an `<input type="range">` that controls the snap-to-grid size passed down to Canvas and FurnitureItem. Hidden on mobile via CSS.

---

### `Paywall/`
Static UI gate shown before Pro features. Not yet connected to a payment processor. Wire it up by checking a `is_pro` column on the user profile or a Stripe subscription status.

---

## 9. Custom Hooks & Utilities

### `useWindowDrag` (`src/hooks/useWindowDrag.js`)
Attaches `mousemove`/`mouseup` (or `touchmove`/`touchend`) listeners to `window` for the duration of a drag, then removes them. Eliminates repeated listener setup/teardown boilerplate across every draggable element.

```js
const { startMouse, startTouch } = useWindowDrag();

// in onMouseDown:
startMouse(
  (e) => onMove(e.clientX, e.clientY),  // move callback
  ()  => onDone(),                       // optional end callback
);
```

---

### `src/lib/supabase.js`
Single source of truth for all Supabase operations. Exports:

| Export | Type | Does |
|---|---|---|
| `supabase` | client | Raw Supabase client (use sparingly outside this file) |
| `signUp/signIn/signOut/getUser/onAuthChange` | auth | Standard auth operations |
| `saveRoom/loadRooms/loadRoom/deleteRoom` | rooms | Room CRUD |
| `loadFurnitureCatalog` | catalog | Fetch all furniture items |
| `getOrCreateShoppingList` | shopping | Idempotent list bootstrap |
| `loadShoppingListItems` | shopping | Fetch items with joined furniture data |
| `addShoppingListItem` | shopping | Insert with FK to furniture_items |
| `updateShoppingListItemQuantity` | shopping | PATCH quantity |
| `removeShoppingListItem` | shopping | DELETE by id |
| `uploadImage` | storage | Upload File object → public URL |
| `uploadBase64Image` | storage | Upload blob/data URL → public URL |

---

### `src/lib/imageUtils.js`
`removeBackground(file)` — calls `@imgly/background-removal` in a Web Worker. Returns a `Blob`. Falls back gracefully if the WASM fails.

`fitDimensions(naturalW, naturalH, maxW, maxH)` — returns `{width, height}` scaled to fit within a bounding box while preserving aspect ratio.

---

### `src/lib/snapGrid.js`
`snap(value, gridSize)` — rounds `value` to the nearest multiple of `gridSize`. If `gridSize <= 1`, returns `value` unchanged (grid disabled).

---

### `src/lib/shoppingMatch.js`
`shoppingMatch(label)` — fuzzy-matches a furniture label string against the local fixtures to find the correct catalog UUID for the FK insert. Normalises punctuation and uses partial string matching.

---

### `src/lib/rateLimiter.js`
`createRateLimiter(limit, windowMs)` — returns a function that returns `true` if the call is within the allowed rate. Used to throttle search API calls and upload attempts.

---

### `src/lib/security.js`
`sanitiseUrl(url)` — blocks `javascript:` and `data:` URIs. Returns `""` for unsafe inputs.  
Used before setting `img src` or `a href` from user-supplied input.

---

### `src/lib/roomPersistence.js`
Saves a draft of current canvas state to `localStorage` every few seconds so unsaved work survives a page refresh. Not a replacement for `saveRoom()` — just a safety net.

---

## 10. State Management & Context

ReDeco uses React's built-in state and two lightweight contexts. There is no Redux or Zustand.

### `ThemeContext` (`src/context/ThemeContext.jsx`)
Stores `theme` (`"light"` | `"dark"`). Persists to `localStorage`. Sets `data-theme` attribute on `<html>` which triggers the `[data-theme="dark"]` CSS block.

```js
const { theme, toggle } = useTheme();
```

### `ShoppingListContext` (`src/context/ShoppingListContext.jsx`)
Stores the shopping list items array in memory. On mount, fetches from Supabase (if user is logged in). Exposes:

| Value | Type | Purpose |
|---|---|---|
| `items` | array | Current shopping list items (with joined furniture data) |
| `addItem(canvasItem)` | function | Resolves catalog UUID → inserts DB row → updates local state |
| `removeItem(id)` | function | Deletes DB row → updates local state |
| `updateQuantity(id, qty)` | function | PATCHes DB row → updates local state |
| `total` | number | Summed price of all items |

### Global canvas state (App.jsx)
`items`, `background`, `roomId`, `roomName` live in `App.jsx` and are passed down as props. This was a deliberate v1 choice — the canvas state is simple enough that prop-drilling is clear. For more complex features, lift this into a `CanvasContext`.

---

## 11. Routing

There is **no React Router**. Navigation is a `view` state string in `App.jsx`:

```
"landing" → Landing.jsx
"auth"    → Auth.jsx
"canvas"  → Toolbar + Sidebar + Canvas
```

`navigateTo(view)` plays a fade-out curtain animation, then sets the new view. To add a new top-level page, add a string case to the view switch and render the new component.

---

## 12. Authentication Flow

1. `src/main.tsx` renders `<App>`.
2. `App.jsx` calls `onAuthChange(callback)` on mount — Supabase fires the callback immediately with the current session, then again on sign-in/out.
3. `user` state is set to `session.user` or `null`.
4. If `user` is null and the user tries a protected action (save, rooms, list), `handleNeedAuth()` shows the sign-up prompt modal.
5. Inactivity timeout (25 min) shows a warning banner, then calls `signOut()` after a further grace period.

All auth tokens are managed entirely by `@supabase/supabase-js` — it stores the JWT in `localStorage` and refreshes it automatically.

---

## 13. User Behaviour Monitoring

ReDeco uses **Sentry** (`@sentry/react`) for behaviour and error monitoring. Configuration is in `src/main.tsx`.

### What is currently tracked

| Signal | How | Where to find it |
|---|---|---|
| JavaScript errors | Automatic (Sentry ErrorBoundary) | Sentry dashboard → Issues |
| Page performance | `browserTracingIntegration()` at 20% sample rate | Sentry → Performance |
| User feedback text | `FeedbackButton.jsx → Sentry.captureMessage()` | Sentry → Issues (level: info) |

### Where to add more tracking

To track specific user actions (button clicks, feature usage, funnels):

```js
// In any component:
import * as Sentry from "@sentry/react";

// Record a custom event:
Sentry.addBreadcrumb({ category: "ui", message: "User clicked Save", level: "info" });

// Capture a named event with data:
Sentry.captureMessage("room_saved", { level: "info", extra: { itemCount: items.length } });
```

To add **product analytics** (e.g. which furniture items are most dragged, funnel drop-off rates), the cleanest integration point is `App.jsx → handleAddItem()` and `ShoppingListContext → addItem()`. These are the two actions with the highest product signal. Consider adding PostHog or Mixpanel there:

```js
// Example — posthog not currently installed:
posthog.capture("furniture_added", { label: item.label, catalogId: item.catalogId });
```

To track **which catalog items users click most**, instrument `SearchTab.jsx → handleAdd()`.

---

## 14. Deployment — Vercel

### `vercel.json` (at repo root)

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install --legacy-peer-deps",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

The `rewrites` rule is an SPA catch-all — all paths serve `index.html` so the view state in App.jsx handles routing.

`headers` in `vercel.json` sets a strict CSP, `X-Frame-Options: DENY`, HSTS, and Permissions-Policy. **If you add a new external domain** (a new image CDN, a new API), you must add it to the relevant CSP directive in `vercel.json` or browsers will block the request.

### Deploying

```bash
# First time:
vercel link          # connects repo to Vercel project
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_PIXABAY_KEY
vercel env add VITE_SENTRY_DSN

# Subsequent:
git push origin main    # Vercel auto-deploys on push to main
```

Production URL is managed by Vercel. Never construct it from env vars in code — fetch it from the Vercel dashboard.

---

## 15. Adding New Features

### New frontend component

1. Create `src/components/YourFeature/YourFeature.jsx` and `YourFeature.css`.
2. Export the component.
3. Import and render it where needed:
   - A new **toolbar button**: edit `Toolbar.jsx` and add a prop to App.jsx.
   - A new **sidebar tab**: add a tab entry in `Sidebar.jsx` and render a new tab panel.
   - A new **canvas control**: add a button to the minibar section in `Canvas.jsx`.
   - A new **full page view**: add a new `view` string case in `App.jsx`.

### New backend table

1. Write a `CREATE TABLE` statement following the patterns in `supabase-setup.sql`.
2. Add RLS policies.
3. Add the corresponding CRUD functions to `src/lib/supabase.js`.
4. Wire them up from a component or context.

### New API key / external service

1. Add the variable to Replit Secrets (dev) and Vercel Environment Variables (prod).
2. Reference it in code as `import.meta.env.VITE_YOUR_KEY`.
3. Add the service domain to the `connect-src` CSP directive in `vercel.json`.

---

## 16. Swapping Out Packages

### Replacing Supabase

Supabase is isolated entirely behind `src/lib/supabase.js`. To switch to Firebase:
1. Replace the Supabase client with Firebase SDK.
2. Rewrite each named export in `supabase.js` to use Firebase equivalents.
3. No component code changes needed.

### Replacing background removal

`@imgly/background-removal` is called only in `src/lib/imageUtils.js → removeBackground()`. Replace the body of that function with any service that returns a `Blob` (e.g. a server-side call to Remove.bg).

### Replacing Sentry

Sentry is called in two places: `src/main.tsx` (init + ErrorBoundary) and `src/components/Feedback/FeedbackButton.jsx` (captureMessage). Swap both to use GlitchTip, Datadog, or your own logging service.

### Replacing nanoid

`nanoid` is called in `App.jsx → handleAddItem()` to generate canvas item IDs. Replace with `crypto.randomUUID()` and remove the import — no other changes needed.

---

## 17. Known Limitations & UX Audit Items

These were noted during development and intentionally deferred:

| Issue | File | Notes |
|---|---|---|
| Room rename uses `window.prompt()` | `App.jsx → handleRename` | Bad on mobile, blocks the thread. Replace with an inline edit or modal input. |
| No loading skeleton for Search tab | `SearchTab.jsx` | Shows blank while catalog loads. Add a shimmer grid. |
| `saveRoom` error has no retry affordance | `App.jsx → handleSave` | Error is shown briefly in `saveMsg` then disappears. Add a persistent retry button. |
| Shopping list count badge overflows at ≥100 items | `Toolbar.jsx` | Badge clips at 2 digits. Cap display at `99+`. |
| Session-timeout warning has no `role="alert"` | `App.css / App.jsx` | Screen readers won't announce it. Add `role="alert"` to `.app__session-warn`. |
| Paywall not wired to payments | `Paywall/` | UI exists but `isPro` is hardcoded false. Needs Stripe or similar. |
| `recharts` imported but not used | `package.json` | Can be removed to reduce bundle size if analytics charts are not planned. |
