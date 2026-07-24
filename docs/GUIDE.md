# ReDeco — Plain English Guide

> Audience: non-technical stakeholders, designers, or new team members with no coding background.  
> Last updated: July 2026

---

## What Is ReDeco?

ReDeco is a website where people design the look of a room. They drag furniture pictures onto a virtual canvas, set a photo of their actual room as the background, move things around, and save the result. They can also keep a shopping list of items they like.

It runs entirely in a web browser — there is nothing to download or install.

---

## Table of Contents

1. [The Big Picture — How the Pieces Fit Together](#1-the-big-picture)
2. [The Screens and Buttons — What Everything Does](#2-the-screens-and-buttons)
3. [Where Everything Is Stored](#3-where-everything-is-stored)
4. [How the App Knows Who You Are](#4-how-the-app-knows-who-you-are)
5. [The Furniture Catalog — Where It Comes From](#5-the-furniture-catalog)
6. [Design Choices — Why It Looks the Way It Does](#6-design-choices)
7. [How to Change the Look Without Knowing Code](#7-how-to-change-the-look)
8. [Monitoring What Users Do](#8-monitoring-what-users-do)
9. [How the App Gets Published to the Internet](#9-how-the-app-gets-published)
10. [Secret Keys — What They Are and Where They Live](#10-secret-keys)
11. [What the Database Looks Like in Plain English](#11-what-the-database-looks-like)
12. [Adding New Things to the App — A Plain-English Map](#12-adding-new-things)
13. [The Tools the App Is Built With — and Why](#13-the-tools-the-app-is-built-with)
14. [Known Issues the Team Has Already Noted](#14-known-issues)

---

## 1. The Big Picture

Think of ReDeco as three layers working together:

```
┌─────────────────────────────────────────────────────┐
│  BROWSER  (what the user sees and clicks)           │
│  Built with React — a popular tool for building     │
│  interactive web pages                              │
└────────────────────────┬────────────────────────────┘
                         │  sends / receives data
┌────────────────────────▼────────────────────────────┐
│  SUPABASE  (the back-end service)                   │
│  Stores all user accounts, saved rooms, and the     │
│  furniture catalog in a cloud database.             │
│  Also stores uploaded photos.                       │
└────────────────────────┬────────────────────────────┘
                         │  deployed through
┌────────────────────────▼────────────────────────────┐
│  VERCEL  (the hosting service)                      │
│  Serves the website to anyone who visits the URL.   │
│  Handles HTTPS, speed, and security headers.        │
└─────────────────────────────────────────────────────┘
```

The developer writes all of the browser code. Supabase and Vercel are third-party cloud services — you pay for them separately and manage them through their own dashboards.

---

## 2. The Screens and Buttons

### Landing Page
The first screen visitors see. Has a single call-to-action: **"Get Started"**. Clicking it takes the user to the sign-up / log-in screen.

*File that controls it:* `src/components/Landing/`

---

### Sign Up / Log In Screen

| Element | What it does |
|---|---|
| **Log In tab** | Shows email + password fields for existing users |
| **Sign Up tab** | Shows email + password fields to create a new account |
| **Log In → / Create Account →** button | Submits the form and takes the user to the canvas |
| **Continue without an account →** | Lets users try the canvas as a guest (work cannot be saved) |
| **← Back to home** | Returns to the landing page |

*File that controls it:* `src/components/Auth/Auth.jsx`

---

### The Canvas (main design screen)

This is where all the design work happens. It has four zones:

#### Top bar (Toolbar)

| Element | What it does |
|---|---|
| **ReDeco logo** | Does nothing — just branding |
| **✏️ Room Name** (e.g. "Living Room") | Click it to rename the current design |
| **📂 Rooms** button | Opens the list of saved rooms |
| **🛒 List** button + number badge | Opens the shopping list. The number shows how many items are in the list |
| **💾 Save** button | Saves the current design to the user's account |
| **🌙 / ☀️** button | Switches between dark mode and light mode |
| **Sign in** | Takes guests to the sign-up screen |
| **Sign out** | Logs the current user out |

*File:* `src/components/Toolbar/Toolbar.jsx`

---

#### Left sidebar (the content panel)

Three tabs:

**Search tab**
- Type in the search box to filter furniture by keyword (e.g. "sofa", "rug").
- On desktop: items appear in a two-column grid.
- On mobile: items appear in a horizontal scrollable strip.
- **‹ / ›** arrows scroll the strip on mobile.
- **✕** in the search box clears the search and shows everything.
- **Show all** button resets the filter.
- Tap an item to add it to the canvas. On desktop you can also drag it straight onto the canvas.

**Upload tab**
- Drag an image file here, or click to pick one.
- The app automatically removes the background from the photo (the item appears cut out against the canvas).
- The cut-out item is then added to your canvas.

**Room tab**
- **📁 Upload Room Photo** — pick a photo of the room from your device; it becomes the canvas background.
- **URL field + Set** — paste a web link to a photo instead.
- **✕ Clear** — removes the background photo.

*Files:* `src/components/Sidebar/`

---

#### The canvas itself

The big area in the middle. Drag furniture items around here to arrange the room.

**When you click / tap a furniture item:**

| Control | What it does |
|---|---|
| Drag the item | Moves it around |
| **×** button (top-left of item) | Deletes the item from the canvas |
| **🛒** button (top-right of item) | Adds the item to your shopping list |
| **↻** handle (corner) | Drag to rotate the item |
| **resize handle** (bottom-right corner) | Drag to make the item bigger or smaller |

**Mini-bar (strip above the canvas):**

| Control | What it does |
|---|---|
| Item count label | Shows how many items are on the canvas and which one is selected |
| **🗑 Remove** button | Deletes the selected item |
| **⬇ ↓ ↑ ⬆** layer buttons | Move items in front of or behind each other |
| **Layer 1 / 2** label | Shows which layer the selected item is on |
| **− / % / +** zoom buttons | Zoom the canvas out or in. Click the percentage to reset to 100% |
| **Grid slider** (desktop only) | Controls the snap-to-grid size |

*Files:* `src/components/Canvas/Canvas.jsx` and `FurnitureItem.jsx`

---

#### Room Manager (opens as an overlay)

A panel that lists all saved rooms for the logged-in user.

| Control | What it does |
|---|---|
| Room thumbnail + name | Shows a preview |
| **Load** button | Replaces the current canvas with that saved room |
| **Delete** button | Permanently deletes the room from the database |

*File:* `src/components/RoomManager/`

---

#### Shopping List (opens as an overlay)

Shows all items the user has added with the 🛒 button.

| Control | What it does |
|---|---|
| Item row | Shows image, name, retailer, price |
| **− / +** buttons | Decrease or increase quantity |
| **✕** remove button | Removes the item from the list |
| **Total** | Running price total at the bottom |

*File:* `src/components/ShoppingList/`

---

#### Feedback button (floating, bottom-right)

| Control | What it does |
|---|---|
| **💬 Feedback** | Opens a small form |
| **Send feedback** | Submits the text to the development team via Sentry (the error-tracking service) |

*File:* `src/components/Feedback/FeedbackButton.jsx`

---

### Session warning banner
If a user is inactive for ~25 minutes, a banner appears at the top:

| Control | What it does |
|---|---|
| **Stay logged in** button | Resets the timer; the banner disappears |
| (no action) | After a short grace period the user is automatically signed out to protect their account |

---

## 3. Where Everything Is Stored

| What | Where | Who manages it |
|---|---|---|
| User accounts (email, password) | Supabase Auth | Supabase cloud service |
| Saved room designs | Supabase database (a table called `rooms`) | Supabase cloud service |
| Furniture catalog (80 items) | Supabase database (`furniture_items` table) + a backup copy in the code itself | Both |
| Shopping lists | Supabase database (`shopping_lists` + `shopping_list_items` tables) | Supabase cloud service |
| Uploaded photos (room backgrounds, custom furniture) | Supabase Storage (a cloud file bucket called `room-images`) | Supabase cloud service |
| Theme preference (dark/light) | User's browser (`localStorage`) — not the database | Browser |
| Unsaved canvas draft | User's browser (`localStorage`) — auto-saved every few seconds as a safety net | Browser |
| Error reports and user feedback | Sentry (a separate error-tracking service) | Sentry cloud service |

---

## 4. How the App Knows Who You Are

When you log in, Supabase gives your browser a security token (like a digital wristband). Your browser holds onto this automatically. Every time you load a saved room or add to your shopping list, the app sends this token along with the request. Supabase checks the token and only returns data that belongs to you.

If the token expires or you sign out, the token is removed and you are treated as a guest.

This means **users can never see each other's rooms or shopping lists** — Supabase enforces this at the database level (called "Row Level Security").

---

## 5. The Furniture Catalog

The catalog has **80 demo furniture items** with names, tags, images, prices, and links. These are seeded into the database using the `supabase-setup.sql` script the development team runs once.

There is also a backup copy of the same 80 items inside the app code (`src/lib/furnitureFixtures.js`). This backup is shown if the database is temporarily unreachable — users always see a catalog.

**To add real furniture products:** a developer would insert rows into the `furniture_items` database table with the real product name, price, image URL, and purchase link. No code changes are needed — the app reads from the table automatically.

The `sponsored` column (true/false) on each item is reserved for promoted listings. Currently all items have it set to false — this is where you would mark paid placements in the future.

---

## 6. Design Choices

### Colours

The app uses a warm **terracotta and forest green** palette. This was chosen to feel aspirational and interior-design-adjacent rather than generic tech-blue.

- **Primary colour (terracotta):** used for main buttons, active states, highlights.
- **Secondary colour (emerald green):** used for success messages and secondary actions.
- **Background surfaces:** warm off-whites and dark browns — not pure white or pure black.

Both a light theme and a dark theme are fully supported. The user can switch with the 🌙/☀️ button and the choice is remembered in their browser.

### Typography

The app uses **Inter** (a clean, modern sans-serif font) loaded from the device's system stack when available, so it loads instantly without a network request.

### Layout decisions

- The **sidebar is always visible on desktop** (fixed left panel).
- On **mobile**, the sidebar collapses into a slide-up panel to maximise canvas space.
- The **canvas fills the remaining screen** after the toolbar and sidebar take their space.
- The **dark toolbar at the top** (brown/charcoal) contrasts with the warmer canvas below — a deliberate hierarchy choice.

---

## 7. How to Change the Look

You do not need to understand code to know where look-and-feel changes happen. Pass these instructions to a developer:

| What to change | Where to tell the developer to look |
|---|---|
| **All colours** (rebrand) | `src/index.css` — the `:root { }` block has every colour token |
| **Dark mode colours** | `src/index.css` — the `[data-theme="dark"] { }` block |
| **Primary accent colour** | Change `--accent` and `--accent-dark` in `src/index.css` |
| **Font** | Change `font-family` in `src/index.css` on the `html, body` line |
| **Top toolbar appearance** | `src/components/Toolbar/Toolbar.css` |
| **Sidebar appearance** | `src/components/Sidebar/Sidebar.css` |
| **Canvas background colour** | `--canvas` token in `src/index.css` |
| **Landing page layout and copy** | `src/components/Landing/Landing.jsx` and `Landing.css` |
| **Login / sign-up form** | `src/components/Auth/Auth.jsx` and `Auth.css` |
| **How the page loads / transitions** | `src/App.css` — animation keyframes |

---

## 8. Monitoring What Users Do

### Errors
When something breaks for a user, a report is automatically sent to **Sentry** (a third-party error-tracking service). Developers can log in to the Sentry dashboard to see what went wrong and where.

### Performance
Sentry also measures how fast pages load for 20% of users (a random sample). This keeps reporting lightweight while still giving useful data.

### User feedback
When a user submits the feedback form (💬 button), the text goes directly to Sentry as a tagged message. There is no separate inbox — all feedback appears alongside error reports in the Sentry dashboard.

### Tracking user habits and decisions

Currently the app does **not** have product analytics (e.g. "which furniture items do people add most often?", "how many users reach the shopping list?"). If you want this, tell a developer to add a tool like **PostHog** or **Mixpanel**. The best places to hook in are:

| Moment to track | Where in the app it happens |
|---|---|
| User adds a furniture item to canvas | `App.jsx` — the `handleAddItem` function |
| User saves a room | `App.jsx` — the `handleSave` function |
| User adds item to shopping list | `ShoppingListContext.jsx` — the `addItem` function |
| User searches the catalog | `SearchTab.jsx` — the search input handler |
| User clicks a furniture item | `SearchTab.jsx` — the `handleAdd` function |

---

## 9. How the App Gets Published

**Vercel** is the service that takes the code and makes it available on the internet.

Every time the development team pushes code to the `main` branch on GitHub, Vercel automatically rebuilds and publishes the latest version within a couple of minutes. No manual steps are needed for routine updates.

The Vercel project is managed at [vercel.com](https://vercel.com) under the team's account. The production URL is shown in the Vercel dashboard.

**Security:** Vercel is configured (via `vercel.json`) to add security headers automatically — these protect users from common web attacks. If the team adds a new external service (a new image source, a new API), the development team needs to add that service's web address to the security config or browsers will block it.

---

## 10. Secret Keys

The app uses four "secret keys" — think of them as passwords that let the app talk to external services.

| Key name | What service it unlocks | Risk if leaked |
|---|---|---|
| `VITE_SUPABASE_URL` | The address of the Supabase project | Low (it's a URL, not a password) |
| `VITE_SUPABASE_ANON_KEY` | Read-only access to Supabase | Low (Supabase RLS prevents misuse) |
| `VITE_PIXABAY_KEY` | Pixabay image search (used in Search tab) | Medium (could rack up API usage) |
| `VITE_SENTRY_DSN` | Error reporting to Sentry | Low |

### Where they are kept

- **During development (on Replit):** stored in Replit's Secrets panel (the padlock icon in the sidebar). Never written into any file.
- **In production (on Vercel):** stored in Vercel's Environment Variables settings page. Never written into any file.
- **They are never in the code itself.** The code just says "go find the key named X" — the actual value is always in the secure vault.

---

## 11. What the Database Looks Like in Plain English

Supabase provides a traditional database (PostgreSQL). Think of it like a set of spreadsheets that are linked together.

### The "Rooms" spreadsheet
One row per saved design. Columns: unique ID, which user owns it, the room name, the background photo URL, and the entire list of furniture items on the canvas (stored as a blob of structured data). Updated every time the user saves.

### The "Furniture Items" spreadsheet
The product catalog. One row per item. Columns: unique ID, name, tags (e.g. `["sofa","velvet","modern"]`), price, image URL, retailer name, purchase link, and whether it is a sponsored listing. Readable by anyone, including non-logged-in visitors.

### The "Shopping Lists" spreadsheet
One row per user. Just an ID, the user's account ID, and a list name. Created automatically the first time a user adds something to their list.

### The "Shopping List Items" spreadsheet
One row per item in a shopping list. Links to both the Shopping Lists spreadsheet and the Furniture Items spreadsheet. Also records which room design the item was added from, and the quantity.

### How they connect
```
User account
  └── has one → Shopping List
                  └── has many → Shopping List Items
                                   └── each links to → Furniture Item

User account
  └── has many → Rooms
```

Every user can only see their own rooms and shopping list — the database enforces this automatically.

---

## 12. Adding New Things to the App — A Plain-English Map

Here is a plain-English guide for briefing a developer on where to add common new features:

| What you want to add | Where the developer works |
|---|---|
| A new button in the top bar | `src/components/Toolbar/Toolbar.jsx` |
| A new tab in the left sidebar | `src/components/Sidebar/Sidebar.jsx` + a new tab component in the same folder |
| A new panel that slides in (like the shopping list) | A new component in `src/components/`, triggered from `App.jsx` |
| A new furniture category in the catalog | Add rows to the `furniture_items` database table (no code change) |
| Real product links from a retailer | Update the `product_url` and `retailer_name` columns in `furniture_items` |
| Sponsored / promoted listings | Set `sponsored = true` on the relevant rows in `furniture_items`, then have a developer style them differently in `SearchTab.jsx` |
| A payment / subscription wall | Wire up the existing `Paywall` component (already built, just not connected) to a payment service like Stripe |
| User profiles (avatar, display name) | Add a `profiles` table in Supabase linked to `auth.users`, then add a profile settings screen |
| A new full page (e.g. an "About" page) | Add a new view string in `App.jsx` and a new component in `src/components/` |
| Saving items to multiple lists | Modify the `shopping_lists` table to allow more than one per user, and update `ShoppingListContext.jsx` |

---

## 13. The Tools the App Is Built With — and Why

| Tool | Plain-English description | Why it was chosen |
|---|---|---|
| **React** | The framework that builds the interactive web pages | Industry standard; huge community; fast |
| **Vite** | The build tool that compiles and serves the code | Extremely fast, modern replacement for older tools |
| **TypeScript** | A stricter version of JavaScript that catches mistakes early | Reduces bugs; better editor support |
| **Supabase** | A cloud database + file storage + login service | One service replaces a database server, an auth server, and a file server — much simpler than running each separately |
| **Vercel** | Hosting service that publishes the app | Free tier generous; deploys automatically from GitHub; very fast globally |
| **@imgly/background-removal** | AI tool that cuts out the background from photos — runs entirely in the browser | No server cost; works offline; privacy-friendly (images never leave the device) |
| **Sentry** | Error and performance monitoring | Standard in the industry; catches problems before users report them |
| **Recharts** | A library for drawing charts | Already included in case data-visualisation features are added (not currently used heavily) |
| **nanoid** | Generates short random IDs for canvas items | Tiny, fast, secure |

### What could be swapped out

These are the most likely candidates if business or technical needs change:

| Replace | With | Why you'd do it |
|---|---|---|
| Supabase | Firebase (Google) or PocketBase | Team preference, existing Google relationship, or self-hosting requirement |
| Vercel | Netlify, AWS, or Cloudflare Pages | Cost, geographic requirements, or existing cloud contracts |
| Background removal library | Remove.bg or Clipdrop API | If you want server-side processing or better quality |
| Sentry | GlitchTip (open-source) or Datadog | Cost or compliance with data residency rules |
| Pixabay image search | Unsplash API or a proprietary catalog | If you want curated, higher-quality stock photos |

---

## 14. Known Issues

The development team has already noted these issues. They are not bugs that break the app — they are polish items earmarked for a future sprint.

| Issue | Impact | Severity |
|---|---|---|
| Renaming a room uses a basic browser pop-up | Looks unprofessional on mobile, can be dismissed accidentally | Medium |
| No loading animation while the furniture catalog loads | Users see a blank panel briefly | Low |
| If saving a room fails, there is no "Try again" button | Users have to press Save again manually | Medium |
| The shopping list item count badge clips if there are 100+ items | Display shows "100" where it should show "99+" | Low |
| The session-expiry warning is not announced to screen readers | Accessibility gap for visually impaired users | Medium |
| The "Pro features" gate is not connected to payments | The Paywall screen exists but clicking it does nothing | High (when monetisation matters) |
