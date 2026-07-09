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

// ─── Image Storage ────────────────────────────────────────────────────────────

export async function uploadImage(file, folder = "furniture") {
  const user = await getUser();
  if (!user) throw new Error("Not logged in");

  const ext = file.name?.split(".").pop() || "png";
  const path = `${user.id}/${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("room-images")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from("room-images")
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function uploadBase64Image(base64, folder = "furniture") {
  const user = await getUser();
  if (!user) throw new Error("Not logged in");

  // Convert base64 to blob
  const res = await fetch(base64);
  const blob = await res.blob();
  const ext = blob.type.split("/")[1] || "png";
  const path = `${user.id}/${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("room-images")
    .upload(path, blob, { upsert: true, contentType: blob.type });

  if (error) throw error;

  const { data } = supabase.storage
    .from("room-images")
    .getPublicUrl(path);

  return data.publicUrl;
}
