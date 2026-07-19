import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export async function saveRoom({ id, name, background, items }) {
  const user = await getUser();
  if (!user) throw new Error("Not logged in");

  const payload = {
    user_id: user.id,
    name: name || "Untitled Room",
    background: background || null,
    items: items || [],
    updated_at: new Date().toISOString(),
  };

  // If id exists → update, otherwise insert
  if (id) {
    const { data, error } = await supabase
      .from("rooms")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id) // safety check
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("rooms")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function loadRooms() {
  const user = await getUser();
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function loadRoom(id) {
  const user = await getUser();
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoom(id) {
  const user = await getUser();
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase
    .from("rooms")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}

// ─── Furniture Catalog (mock data, v1) ────────────────────────────────────────

export async function loadFurnitureCatalog() {
  const { data, error } = await supabase
    .from("furniture_items")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

// ─── Shopping List ───────────────────────────────────────────────────────────

// One list per user for v1 — creates it on first use, otherwise returns the existing one
export async function getOrCreateShoppingList() {
  const user = await getUser();
  if (!user) throw new Error("Not logged in");

  const { data: existing, error: findErr } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (findErr) throw findErr;
  if (existing) return existing;

  const { data: created, error: createErr } = await supabase
    .from("shopping_lists")
    .insert({ user_id: user.id, name: "My Shopping List" })
    .select()
    .single();

  if (createErr) throw createErr;
  return created;
}

// ─── (file truncated in this push)