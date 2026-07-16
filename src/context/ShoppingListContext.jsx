import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getOrCreateShoppingList,
  loadFurnitureCatalog,
  loadShoppingListItems,
  addShoppingListItem,
  updateShoppingListItemQuantity,
  removeShoppingListItem,
} from "../lib/supabase";
import { matchFurnitureToCatalog } from "../lib/shoppingMatch";

// NOTE: the spec suggested Zustand or React Query for this. To keep the
// project dependency-free (nothing else in the app uses either), this is
// built with plain React Context + useState instead. It still does
// optimistic updates — UI changes are applied immediately and the backend
// call happens in the background; on failure the optimistic change is
// rolled back and an error is surfaced.

const ShoppingListContext = createContext(null);

export function ShoppingListProvider({ user, children }) {
  const [listId, setListId]   = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // ── Load catalog + list + items once the user is available ────────────────
  useEffect(() => {
    if (!user) { setItems([]); setCatalog([]); setListId(null); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [list, catalogRows] = await Promise.all([
          getOrCreateShoppingList(),
          loadFurnitureCatalog(),
        ]);
        if (cancelled) return;
        setListId(list.id);
        setCatalog(catalogRows);

        const listItems = await loadShoppingListItems(list.id);
        if (cancelled) return;
        setItems(listItems);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load shopping list.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // ── Add a canvas furniture item to the list ────────────────────────────────
  // canvasItem: { label, ... } from the moodboard canvas
  // roomId: currentRoom.id, so the item can be traced back to the moodboard it came from
  const addToList = useCallback(async (canvasItem, roomId = null) => {
    if (!listId) return;
    const catalogMatch = matchFurnitureToCatalog(canvasItem.label || "", catalog);
    if (!catalogMatch) return;

    // If this catalog item is already in the list, just bump quantity
    const existing = items.find((i) => i.furniture_item_id === catalogMatch.id);
    if (existing) {
      await updateQuantity(existing.id, existing.quantity + 1);
      return;
    }

    // Optimistic insert with a temporary id
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
      setItems((prev) => prev.filter((i) => i.id !== tempId)); // roll back
      setError("Couldn't add item — please try again.");
    }
  }, [listId, catalog, items]);

  // ── Update quantity (also used internally by addToList for "already in list") ─
  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (quantity <= 0) return removeItem(itemId);

    const prevItems = items;
    setItems((cur) => cur.map((i) => (i.id === itemId ? { ...i, quantity } : i)));

    try {
      await updateShoppingListItemQuantity(itemId, quantity);
    } catch {
      setItems(prevItems); // roll back
      setError("Couldn't update quantity — please try again.");
    }
  }, [items]);

  // ── Remove item ─────────────────────────────────────────────────────────────
  const removeItem = useCallback(async (itemId) => {
    const prevItems = items;
    setItems((cur) => cur.filter((i) => i.id !== itemId));

    try {
      await removeShoppingListItem(itemId);
    } catch {
      setItems(prevItems); // roll back
      setError("Couldn't remove item — please try again.");
    }
  }, [items]);

  const total = items.reduce((sum, i) => sum + (i.furniture_items?.price || 0) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <ShoppingListContext.Provider value={{ items, loading, error, total, count, addToList, updateQuantity, removeItem, clearError: () => setError("") }}>
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error("useShoppingList must be used inside ShoppingListProvider");
  return ctx;
}
