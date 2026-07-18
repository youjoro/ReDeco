---
name: Furniture catalog — local fixtures
description: The furniture catalog is a local JS array, not a Supabase table. ShoppingListContext imports it directly.
---

## Rule
The furniture catalog lives in `src/lib/furnitureFixtures.js` as a static JS array (`FURNITURE_FIXTURES`). `ShoppingListContext` imports it directly — there is no Supabase `furniture_items` table in use for the demo.

**Why:** Avoids needing a real Supabase catalog table for the demo. Items have all fields the shopping list panel needs: `id`, `name`, `tags`, `image_url`, `price`, `retailer_name`, `product_url`, `sponsored`.

**How to apply:** When adding catalog items, edit `furnitureFixtures.js`. If Supabase catalog integration is added later, `ShoppingListContext` should be updated to prefer DB rows and fall back to fixtures.
