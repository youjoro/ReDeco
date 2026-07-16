# Room Planner — Technical Documentation

**Version:** 0.0.0  
**Stack:** React 19 · TypeScript · Vite 8 · Supabase  
**Last updated:** July 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Project Structure](#2-project-structure)
3. [Architecture](#3-architecture)
4. [User Flows](#4-user-flows)
5. [Component Reference](#5-component-reference)
6. [Library Reference](#6-library-reference)
7. [Context Reference](#7-context-reference)
8. [Supabase Schema](#8-supabase-schema)
9. [Environment Variables](#9-environment-variables)
10. [Running Locally](#10-running-locally)
11. [Building for Production](#11-building-for-production)
12. [Deploying to Vercel](#12-deploying-to-vercel)
13. [Security](#13-security)

---

## 1. Overview

Room Planner is a browser-based interior design moodboard. Authenticated users can:

- Upload or photograph a room as a background canvas
- Search Pixabay or upload their own furniture images (with automatic background removal)
- Drag, resize, and snap furniture pieces onto the canvas
- Save and reload multiple named rooms
- Add canvas items to a persistent shopping list with quantity tracking

All data is stored in Supabase (auth, rooms, shopping lists) and Supabase Storage (uploaded images).

---

## 2. Project Structure

```
/
├── index.html                  # App shell + Content Security Policy
├── vercel.json                 # Vercel build config + production security headers
├── vite.config.ts              # Vite dev server config (port 5000, security headers)
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.tsx                # React root (StrictMode)
    ├── App.jsx                 # Root component — auth, state, layout
    ├── App.css
    ├── index.css               # Global reset + CSS tokens
    ├── Moodboard.jsx           # Standalone moodboard variant (legacy)
    ├── RoomManager.jsx         # Room list/load modal (legacy inline version)
    ├── components/
    │   ├── Auth/               # Login + signup forms
    │   ├── Canvas/             # Drop area + draggable furniture items
    │   ├── GridSlider/         # Snap-grid size control
    │   ├── Landing/            # Marketing landing page
    │   ├── RoomManagerShoppingList/  # (unused slot)
    │   ├── Sidebar/            # Tabbed panel: Room · Search · Upload
    │   ├── ShoppingList/       # Slide-in shopping list panel
    │   └── Toolbar/            # Top navigation bar
    ├── context/
    │   └── ShoppingListContext.jsx
    └── lib/
        ├── supabase.js         # Supabase client + all DB/storage helpers
        ├── security.js         # URL sanitizers + file validation
        ├── imageUtils.js       # Image sizing + background removal
        ├── rateLimiter.js      # In-memory request throttle
        ├── shoppingMatch.js    # Fuzzy label → catalog matcher
        └── snapGrid.js         # Grid-snap rounding
```

---

## 3. Architecture

```
Browser
  │
  ├── Landing / Auth (pre-login views)
  │
  └── App (authenticated shell)
        ├── Toolbar          — save, rename, open rooms, open shopping list
        ├── Sidebar          — furniture source (search / upload / room photo)
        ├── Canvas           — moodboard workspace
        │     └── FurnitureItem × N   — draggable, resizable
        ├── RoomManager      — modal: list / load / delete rooms
        └── ShoppingListPanel — slide-in panel
              └── ShoppingListContext  — Supabase-backed cart state

Data layer (Supabase)
  ├── Auth          — email/password, session via JWT in localStorage
  ├── rooms         — JSONB canvas snapshots per user
  ├── furniture_items — product catalog
  ├── shopping_lists  — one list per user
  ├── shopping_list_items — line items with quantity
  └── room-images (Storage bucket) — uploaded room/furniture images
```

**State management:** plain React `useState` + `useContext`. No external state library.  
**Optimistic UI:** Shopping list mutations update local state immediately and roll back on error.  
**Auto-logout:** 2-hour inactivity timer; warning banner shown 2 minutes before sign-out.

---

## 4. User Flows

### 4.1 Authentication

```
Landing page
  ├── "Get Started" → Auth (signup tab)
  └── "Log In"      → Auth (login tab)

Auth component
  ├── Sign up  → Supabase creates user → onAuthChange fires → App loads canvas
  ├── Log in   → Supabase session → onAuthChange fires → App loads canvas
  └── "Back"   → returns to Landing
```

### 4.2 Canvas Session

```
App (authenticated)
  │
  ├── Sidebar → Room tab
  │     ├── Upload photo (FileReader → data URL → background state)
  │     └── Paste URL → background state
  │
  ├── Sidebar → Search tab
  │     ├── User types query (max 100 chars) → Pixabay API (rate-limited: 80 req/min)
  │     └── Click result → removeImageBackground() → inject into canvas items[]
  │
  ├── Sidebar → Upload tab
  │     ├── File picker (JPEG/PNG/GIF/WebP/AVIF, max 10 MB, magic-byte verified)
  │     └── removeImageBackground() → inject into canvas items[]
  │
  ├── Canvas
  │     ├── Drag item    → mousemove / touchmove → snap(x, gridSize)
  │     ├── Resize item  → drag handle → maintain aspect ratio + snap
  │     ├── Delete item  → removes from items[]
  │     └── 🛒 button   → addToList(item, roomId) via ShoppingListContext
  │
  └── Toolbar
        ├── Save → uploadBase64Image() for blob: srcs → saveRoom() → upsert rooms table
        ├── Rename → prompt → update currentRoom.name
        └── Rooms → RoomManager modal
```

### 4.3 Room Management

```
RoomManager modal
  ├── Load room → loadRoom(id) → restore background + items[] to canvas
  ├── New room  → clear canvas + reset currentRoom
  └── Delete    → deleteRoom(id) → remove from list
```

### 4.4 Shopping List

```
FurnitureItem "🛒" button
  → matchFurnitureToCatalog(item.label, catalog)
      ├── Word-overlap scoring against furniture_items.name + tags
      └── Deterministic hash fallback if no match
  → If already in list: increment quantity (optimistic)
  → Else: insert shopping_list_items row (optimistic, rollback on error)

ShoppingListPanel
  ├── Shows joined furniture_items data (name, price, image, retailer)
  ├── Quantity ±1 buttons
  ├── Remove button
  └── Running total (sum of price × quantity)
```

---

## 5. Component Reference

### `<Landing>`

Marketing entry page with hero, feature grid, and FAQ.

| Prop | Type | Description |
|---|---|---|
| `onGetStarted` | `() => void` | Navigates to Auth with signup tab active |
| `onLogin` | `() => void` | Navigates to Auth with login tab active |

---

### `<Auth>`

Email/password login and signup form with tab switching.

| Prop | Type | Description |
|---|---|---|
| `onAuth` | `(user) => void` | Called after successful sign-in or sign-up |
| `initialTab` | `"login" \| "signup"` | Which tab to open on mount |
| `onBack` | `() => void` | Returns to Landing page |

---

### `<Toolbar>`

Top navigation bar. Displays room name, save state, and action buttons.

| Prop | Type | Description |
|---|---|---|
| `user` | `object` | Supabase user object |
| `roomName` | `string` | Current room name (editable inline) |
| `saving` | `boolean` | Shows saving spinner when true |
| `saveMsg` | `string` | Short status message shown after save |
| `onSave` | `() => void` | Triggers room save |
| `onRename` | `(name: string) => void` | Called when user confirms a new name |
| `onOpenRooms` | `() => void` | Opens RoomManager modal |
| `onOpenShoppingList` | `() => void` | Opens ShoppingListPanel |
| `shoppingCount` | `number` | Item count shown on the 🛒 badge |

---

### `<Sidebar>`

Three-tab panel on the left: **Room**, **Search**, **Upload**.

| Prop | Type | Description |
|---|---|---|
| `background` | `string \| null` | Current room background (data URL or https URL) |
| `onAddItem` | `(src, size, label) => void` | Adds a furniture item to the canvas |
| `onSetBackground` | `(src: string) => void` | Sets the canvas background |
| `onClearBackground` | `() => void` | Removes the canvas background |

#### `<RoomTab>` (inside Sidebar)

Sets the room background via file upload or URL paste.

| Prop | Type | Description |
|---|---|---|
| `background` | `string \| null` | Current background for preview |
| `onSetBackground` | `(src: string) => void` | — |
| `onClearBackground` | `() => void` | — |

#### `<SearchTab>` (inside Sidebar)

Searches Pixabay and adds results to the canvas with background removal.

- Query capped at **100 characters**
- Rate-limited to **80 requests/minute** via `rateLimiter`
- Paginated (24 results/page)
- Requires `VITE_PIXABAY_KEY` env var

#### `<UploadTab>` (inside Sidebar)

Uploads local image files to the canvas.

- Accepts: JPEG, PNG, GIF, WebP, AVIF
- Max size: **10 MB**
- Validated by declared MIME type **and** magic bytes before processing
- Background removal applied automatically; falls back to original on failure

---

### `<Canvas>`

The main moodboard drop area. Renders the room background and all placed items.

| Prop | Type | Description |
|---|---|---|
| `background` | `string \| null` | Room background image src |
| `items` | `Item[]` | Array of furniture items currently on canvas |
| `onItemsChange` | `(items: Item[]) => void` | Full items array replacement |
| `onBackgroundChange` | `(src: string) => void` | Background drag-drop replacement |
| `onAddToList` | `(item: Item) => void` | Triggered by 🛒 button on each item |

**Item shape:**
```ts
{
  id: number,        // auto-increment, local only
  src: string,       // blob:, data:, or https: URL
  label: string,     // display name / search tag
  x: number,         // left offset (px)
  y: number,         // top offset (px)
  width: number,     // px
  height: number,    // px
}
```

**Grid snap:** controlled by `<GridSlider>` (0 = off, 4–80 px steps of 4).

---

### `<FurnitureItem>`

Individual draggable, resizable furniture piece on the canvas.

| Prop | Type | Description |
|---|---|---|
| `item` | `Item` | See Item shape above |
| `isSelected` | `boolean` | Shows controls (delete, cart, resize handle) |
| `onSelect` | `(id) => void` | |
| `onDrag` | `(id, {x, y}) => void` | |
| `onResize` | `(id, {width, height}) => void` | Maintains aspect ratio |
| `onDelete` | `(id) => void` | |
| `onAddToList` | `(item) => void \| null` | Pass `null` to hide 🛒 button |
| `gridSize` | `number` | Snap increment in px (0 = no snap) |

Supports both **mouse** and **touch** events for drag and resize.

---

### `<GridSlider>`

Horizontal drag slider that controls the canvas snap grid.

| Prop | Type | Description |
|---|---|---|
| `value` | `number` | Current grid size (0 = off, otherwise 4–80 px) |
| `onChange` | `(value: number) => void` | |

Values snap to multiples of 4. Values below 4 are floored to 0 (off).

---

### `<RoomManager>`

Full-screen modal listing the user's saved rooms.

| Prop | Type | Description |
|---|---|---|
| `onLoad` | `(room) => void` | Called with full room row from DB |
| `onNew` | `() => void` | Clears canvas and starts a fresh room |
| `onClose` | `() => void` | Dismisses the modal |

---

### `<ShoppingListPanel>`

Slide-in panel showing the current user's shopping list. Reads all state from `ShoppingListContext` — no props required except:

| Prop | Type | Description |
|---|---|---|
| `onClose` | `() => void` | Dismisses the panel |

---

## 6. Library Reference

### `src/lib/supabase.js`

Exports the configured Supabase client and all data-access helpers.

#### Auth helpers

```js
signUp(email, password)   → Promise<data>
signIn(email, password)   → Promise<data>
signOut()                 → Promise<void>
getUser()                 → Promise<User | null>
onAuthChange(callback)    → Subscription   // callback(user | null)
```

#### Rooms

```js
saveRoom({ id, name, background, items })
  // id present → UPDATE, absent → INSERT
  → Promise<room>

loadRooms()       → Promise<room[]>   // ordered by updated_at DESC
loadRoom(id)      → Promise<room>
deleteRoom(id)    → Promise<void>
```

#### Furniture catalog

```js
loadFurnitureCatalog()    → Promise<furniture_item[]>   // ordered by name
```

#### Shopping list

```js
getOrCreateShoppingList()               → Promise<shopping_list>
loadShoppingListItems(shoppingListId)   → Promise<shopping_list_item[]>
  // joined with furniture_items (name, price, image_url, retailer, etc.)

addShoppingListItem({ shoppingListId, furnitureItemId, quantity, addedFromMoodboardId })
  → Promise<shopping_list_item>

updateShoppingListItemQuantity(itemId, quantity)
  → Promise<shopping_list_item>

removeShoppingListItem(itemId)   → Promise<void>
```

#### Storage

```js
uploadImage(file, folder = "furniture")
  → Promise<publicUrl: string>

uploadBase64Image(base64DataUrl, folder = "furniture")
  → Promise<publicUrl: string>
  // Converts data URL → Blob, then uploads to room-images bucket
```

---

### `src/lib/security.js`

Security utilities used throughout the app. **Import from here for any URL or file handling.**

```js
sanitizeHref(url: string): string
  // Allows only http: and https: protocols.
  // Returns "#" for javascript:, data:, vbscript:, or malformed URLs.

sanitizeImageSrc(url: string): string
  // Allows blob:, verified data:image/* base64, and https: URLs.
  // Returns "" for anything disallowed.

validateImageFile(file: File): Promise<{ ok: boolean, reason?: string }>
  // Checks:
  //   1. file.size <= 10 MB
  //   2. file.type in { jpeg, png, gif, webp, avif }
  //   3. First 12 bytes match known image magic bytes
```

---

### `src/lib/imageUtils.js`

```js
loadImageSize(src: string, maxW = 200): Promise<{ width: number, height: number }>
  // Loads image, scales to maxW maintaining aspect ratio.
  // Falls back to { width: 200, height: 150 } on error.

removeImageBackground(src: string): Promise<blobUrl: string>
  // Uses @imgly/background-removal (local npm package).
  // Returns a blob: URL pointing to the transparent PNG.
  // Throws on failure — callers should fall back to the original src.
```

---

### `src/lib/shoppingMatch.js`

```js
matchFurnitureToCatalog(label: string, catalog: furniture_item[]): furniture_item | null
  // Scores each catalog item by word overlap between label and item.name/tags.
  // Returns best-scoring item if any overlap exists.
  // Falls back to a deterministic item (hash of label % catalog length)
  // so the same label always maps to the same product.
  // Returns null only if catalog is empty.
```

---

### `src/lib/rateLimiter.js`

Simple in-memory sliding-window rate limiter. Used in `SearchTab` before each Pixabay API call.

```js
rateLimiter.canRequest(): boolean
  // Returns false (and does NOT record the request) if >= 80 requests
  // were made in the last 60 seconds.

rateLimiter.remaining(): number
  // How many more requests are available in the current window.
```

> **Note:** This is client-side only and resets on page reload. It guards UX/API quota, not security.

---

### `src/lib/snapGrid.js`

```js
snap(value: number, grid: number): number
  // Rounds value to the nearest multiple of grid.
  // If grid <= 0, returns value unchanged.
```

---

## 7. Context Reference

### `ShoppingListContext`

Provided by `<ShoppingListProvider user={user}>`. Must wrap any component that calls `useShoppingList()`.

#### Provider props

| Prop | Type | Description |
|---|---|---|
| `user` | `object \| null` | Supabase user. Triggers data load when set, clears state when null. |

#### Context value

```ts
{
  items:    shopping_list_item[],   // joined with furniture_items
  loading:  boolean,
  error:    string,                 // last error message, "" if none
  total:    number,                 // sum of price × quantity
  count:    number,                 // sum of all quantities

  addToList(canvasItem, roomId?): Promise<void>
    // Matches canvasItem.label → catalog, then inserts or bumps quantity.
    // Optimistic: UI updates immediately, rolls back on DB error.

  updateQuantity(itemId, quantity): Promise<void>
    // quantity <= 0 delegates to removeItem. Optimistic with rollback.

  removeItem(itemId): Promise<void>
    // Optimistic delete with rollback.

  clearError(): void
    // Resets error to "".
}
```

---

## 8. Supabase Schema

The frontend implies this schema. RLS (Row Level Security) policies must be configured in the Supabase dashboard so users can only access their own data.

### `rooms`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | References `auth.users.id` |
| `name` | `text` | Room display name |
| `background` | `text` | HTTPS URL or `null` |
| `items` | `jsonb` | Array of Item objects (see Canvas section) |
| `updated_at` | `timestamptz` | Set on every save |

### `furniture_items`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Display name |
| `tags` | `text[]` | Used by `matchFurnitureToCatalog` |
| `price` | `numeric` | Used for shopping list total |
| `image_url` | `text` | Product image |
| `retailer_name` | `text` | Shown in ShoppingListPanel |
| `product_url` | `text` | "View →" link (sanitized via `sanitizeHref`) |
| `sponsored` | `boolean` | Shows "Sponsored" badge |

### `shopping_lists`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | One list per user |
| `name` | `text` | Default: `"My Shopping List"` |

### `shopping_list_items`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `shopping_list_id` | `uuid` | FK → `shopping_lists.id` |
| `furniture_item_id` | `uuid` | FK → `furniture_items.id` |
| `quantity` | `integer` | Default 1 |
| `added_from_moodboard_id` | `uuid` | FK → `rooms.id`, nullable |
| `created_at` | `timestamptz` | |

### Storage bucket: `room-images`

All uploaded images are stored here under `{user_id}/{folder}/{timestamp}.{ext}`.  
The bucket must be **public** for images to load in the canvas. Subfolders used:

| Folder | Used by |
|---|---|
| `furniture` | `uploadImage()`, `uploadBase64Image()` |

---

## 9. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase publishable anon key |
| `VITE_PIXABAY_KEY` | Optional | Pixabay API key. Without it, the Search tab returns errors. |

All `VITE_` variables are bundled into the client at build time and are visible in the browser. Do not use them for secrets.

---

## 10. Running Locally

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5000)
npm run dev
```

The workflow **"Start application"** in Replit runs `npm run dev` automatically.

### Lint

```bash
npm run lint
```

---

## 11. Building for Production

```bash
npm run build   # TypeScript check + Vite bundle → dist/
```

Output goes to `dist/`. The SPA must be served with a catch-all rewrite (`/* → /index.html`) so client-side routing works on refresh — `vercel.json` handles this automatically.

---

## 12. Deploying to Vercel

`vercel.json` at the repo root configures everything automatically:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Routing:** all paths rewrite to `index.html`
- **Headers:** all 8 security headers applied to every response (see §13)

### Steps

1. Push code to GitHub
2. Import the repo at [vercel.com](https://vercel.com) → **Add New → Project**
3. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optionally `VITE_PIXABAY_KEY`) under **Environment Variables → All Environments**
4. Click **Deploy**
5. After deployment, add your Vercel URL to **Supabase → Authentication → URL Configuration → Site URL + Redirect URLs** — auth redirects will fail without this

Future deploys happen automatically on every push to `main`.

---

## 13. Security

### OWASP ZAP Full Scan Results

Scan run against the live dev server using `zap-full-scan.py` (passive + active scanning).

| Result | Count |
|---|---|
| ✅ PASS | **140** |
| ⚠️ WARN | **1** *(see below)* |
| ❌ FAIL | **0** |

**Checks that explicitly passed (selected highlights):**

| Check | ID |
|---|---|
| SQL Injection | 40018–40022, 40027 |
| XSS — Reflected | 40012 |
| XSS — Persistent | 40014–40017 |
| XSS — DOM Based | 40026 |
| NoSQL Injection (MongoDB) | 40033 |
| Server Side Request Forgery | 40046 |
| Log4Shell | 40043 |
| Remote Code Execution | 40048 |
| Path Traversal | 6 |
| CORS Header | 40040 |
| CSP Header Not Set | 10038 |
| Vulnerable JS Library | 10003 |
| Dependency Audit | 0 critical / 0 high |

**Remaining warning — `CSP: style-src unsafe-inline` [10055]**

This is architecturally unavoidable. The canvas applies pixel positions (`left`, `top`, `width`, `height`, `z-index`) and dynamic percentage values as inline `style=""` attributes at runtime. CSS class names cannot represent arbitrary runtime pixel values; nonces do not apply to `style=""` attributes (only to `<style>` blocks); and `unsafe-hashes` only covers static values. This is a documented limitation of React SPAs with drag-and-drop canvas layouts.

Practical risk: **zero** — all XSS attack checks passed, and the inline styles are written by controlled React state, not user-injected content.

---

### Security Measures Implemented

#### HTTP Security Headers

Set in both `vite.config.ts` (dev) and `vercel.json` (production):

| Header | Value | Protects against |
|---|---|---|
| `Content-Security-Policy` | (see below) | XSS, data injection |
| `X-Content-Type-Options` | `nosniff` | MIME-type confusion |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Ambient sensor abuse |
| `Cross-Origin-Resource-Policy` | `same-origin` | Cross-origin resource theft |
| `Cross-Origin-Opener-Policy` | `same-origin` | Cross-origin window access |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Spectre/side-channel isolation |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS downgrade (prod only) |

#### Content Security Policy

```
default-src 'self';
script-src 'self' blob:;
style-src 'self' 'unsafe-inline';
img-src 'self' blob: data: https://*.pixabay.com https://pixabay.com
        https://*.supabase.co https://placehold.co;
connect-src 'self' https://*.supabase.co wss://*.supabase.co
            https://pixabay.com https://cdn.jsdelivr.net;
worker-src blob: 'self';
child-src blob: 'self';
font-src 'self' data:;
object-src 'none';
base-uri 'self';
form-action 'self';
```

#### URL Sanitization (`src/lib/security.js`)

- **`sanitizeHref`** — all `<a href>` values from the database are sanitized to only allow `http:` and `https:` protocols before rendering. `javascript:`, `data:`, `vbscript:`, and malformed URLs return `"#"`.
- **`sanitizeImageSrc`** — all external image URLs are validated before use. Only `blob:` (own code), verified `data:image/*` base64, and `https:` pass.

#### File Upload Validation (`src/lib/security.js`)

`validateImageFile()` performs three checks in order:

1. **Size:** rejects files over 10 MB
2. **Declared MIME type:** must be one of `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/avif`
3. **Magic bytes:** reads the first 12 bytes of the file and matches against known image signatures (JPEG `FF D8 FF`, PNG `89 50 4E 47`, GIF `47 49 46 38`, WebP `52 49 46 46 … 57 45 42 50`)

The `accept` attribute on file inputs is an additional UX hint only.

#### Supply Chain

The `@imgly/background-removal` library is loaded from the local `node_modules` package (not a CDN dynamic import), removing the runtime supply-chain dependency on `cdn.jsdelivr.net` for the script itself. Model weight files are still fetched from `cdn.jsdelivr.net` at runtime (required for ML inference).

#### Input Limits

- Pixabay search input: capped at **100 characters** (`maxLength` attribute + enforced in `onChange`)
- CORS: disabled on the Vite dev server (`cors: false`) — the app is not a CORS endpoint

#### Authentication

- Supabase handles all auth (email/password). JWTs are stored in `localStorage` by the Supabase client.
- **Auto-logout:** users are signed out after **2 hours of inactivity**. Activity is tracked via `mousemove`, `mousedown`, `keydown`, `touchstart`, and `scroll` events. A warning banner appears **2 minutes before** automatic sign-out.
- All database operations are scoped to the authenticated user (`user_id` filter + RLS policies in Supabase).
