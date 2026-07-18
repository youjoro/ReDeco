import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getOrCreateShoppingList,
  loadShoppingListItems,
  addShoppingListItem,
  updateShoppingListItemQuantity,
  removeShoppingListItem,
} from "../lib/supabase";
import { matchFurnitureToCatalog } from "../lib/shoppingMatch";
import { FURNITURE_FIXTURES } from "../lib/furnitureFixtures";

// Catalog is always the local fixtures — no Supabase call needed.
// Shopping list rows are stored in Supabase when the user is logged in,
// and in local state only when browsing as a guest.

const ShoppingListContext = createContext(null);

export function ShoppingListProvider({ user, children }) {
  const [listId, setListId] = useState(null);
  const [items,  setItems]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Catalog is always the local fixture data — fast, no network needed.
  const catalog = FURNITURE_FIXTURES;

  // ── Load persisted list when user logs in; clear DB state when they log out ─
  useEffect(() => {
    if (!user) {
      // Guest mode: keep any locally-built list, just disconnect from DB.
      setListId(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const list = await getOrCreateShoppingList();
        if (cancelled) return;
        setListId(list.id);

        const dbItems = await loadShoppingListItems(list.id);
        if (cancelled) return;
        // Merge: keep any guest items that aren't already in the DB list,
        // then append the DB rows (DB wins for duplicates).
        setItems((prev) => {
          const dbIds = new Set(dbItems.map((i) => i.furniture_item_id));
          const guestOnly = prev.filter(
            (i) => i.id?.startsWith("local-") && !dbIds.has(i.furniture_item_id)
          );
          return [...guestOnly, ...dbItems];
        });
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load shopping list.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // ── Add a canvas furniture item to the list ────────────────────────────────
  const addToList = useCallback(async (canvasItem, roomId = null) => {
    const catalogMatch = matchFurnitureToCatalog(canvasItem.label || "", catalog);
    if (!catalogMatch) return;

    // Bump quantity if already present.
    const existing = items.find((i) => i.furniture_item_id === catalogMatch.id);
    if (existing) {
      await updateQuantity(existing.id, existing.quantity + 1);
      return;
    }

    if (!listId) {
      // Guest mode: add to local state only.
      const localRow = {
        id: `local-${Date.now()}`,
        shopping_list_id: null,
        furniture_item_id: catalogMatch.id,
        quantity: 1,
        added_from_moodboard_id: roomId,
        furniture_items: catalogMatch,
      };
      setItems((prev) => [...prev, localRow]);
      return;
    }

    // Logged-in: optimistic insert.
    const tempId = `temp-${Date.now()}`;
    const optimisticRow = {
      id: tempId,
      shopping_list_id: listId,
      furniture_item_id: catalogMatch.id,
      quantity: 1,
      added_from_moodboard_id: roomId,
      furniture_items: catalogMatch,
    };
    setItems((prev) => [...prev, optimisticRow]);

    try {
      const saved = await addShoppingListItem({
        shoppingListId: listId,
        furnitureItemId: catalogMatch.id,
        quantity: 1,
        addedFromMoodboardId: roomId,
      });
      setItems((prev) => prev.map((i) => (i.id === tempId ? saved : i)));
    } catch (err) {
      setItems((prev) => prev.filter((i) => i.id !== tempId));
      setError("Couldn't add item — please try again.");
    }
  }, [listId, catalog, items]);

  // ── Update quantity ────────────────────────────────────────────────────────
  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (quantity <= 0) { removeItem(itemId); return; }

    const prevItems = items;
    setItems((cur) => cur.map((i) => (i.id === itemId ? { ...i, quantity } : i)));

    // Guest rows (local- prefix) or temp rows: no DB call.
    if (typeof itemId === "string" && (itemId.startsWith("local-") || itemId.startsWith("temp-"))) return;
    if (!listId) return;

    try {
      await updateShoppingListItemQuantity(itemId, quantity);
    } catch {
      setItems(prevItems);
      setError("Couldn't update quantity — please try again.");
    }
  }, [items, listId]);

  // ── Remove item ────────────────────────────────────────────────────────────
  const removeItem = useCallback(async (itemId) => {
    const prevItems = items;
    setItems((cur) => cur.filter((i) => i.id !== itemId));

    if (typeof itemId === "string" && (itemId.startsWith("local-") || itemId.startsWith("temp-"))) return;
    if (!listId) return;

    try {
      await removeShoppingListItem(itemId);
    } catch {
      setItems(prevItems);
      setError("Couldn't remove item — please try again.");
    }
  }, [items, listId]);

  const total = items.reduce((sum, i) => sum + (i.furniture_items?.price || 0) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <ShoppingListContext.Provider
      value={{ items, loading, error, total, count, addToList, updateQuantity, removeItem, clearError: () => setError("") }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error("useShoppingList must be used inside ShoppingListProvider");
  return ctx;
}
