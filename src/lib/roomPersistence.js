// src/lib/roomPersistence.js
import { uploadBase64Image, saveRoom as supabaseSaveRoom } from "./supabase";

/**
 * Save a room and upload any data/blob image sources first.
 * - currentRoom: { id, name }
 * - items: array of canvas items with .src
 * - background: background URL or data/blob
 *
 * Returns the saved room object from Supabase.
 */
export async function saveRoomWithUploads({ currentRoom, items = [], background = null }) {
  // Upload items that are data:/blob: URLs
  const uploadedItems = [];
  for (const item of items) {
    if (typeof item.src === "string" && (item.src.startsWith("data:") || item.src.startsWith("blob:"))) {
      try {
        const res = await fetch(item.src);
        const blob = await res.blob();
        // make a File to preserve type/extension
        const file = new File([blob], `item-${item.id || Date.now()}.png`, { type: blob.type });
        const url = await uploadBase64Image(file, "furniture");
        uploadedItems.push({ ...item, src: url });
      } catch {
        // fallback: keep original src if upload fails
        uploadedItems.push(item);
      }
    } else {
      uploadedItems.push(item);
    }
  }

  // Upload background if needed
  let bgUrl = background;
  if (bgUrl && (bgUrl.startsWith("data:") || bgUrl.startsWith("blob:"))) {
    try {
      const res = await fetch(bgUrl);
      const blob = await res.blob();
      const file = new File([blob], `bg-${Date.now()}.jpg`, { type: blob.type });
      bgUrl = await uploadBase64Image(file, "backgrounds");
    } catch {
      // keep original background if upload fails
      bgUrl = background;
    }
  }

  // Call supabase saveRoom (reuses existing supabase logic)
  const saved = await supabaseSaveRoom({
    id: currentRoom?.id ?? null,
    name: currentRoom?.name ?? "Untitled Room",
    background: bgUrl,
    items: uploadedItems,
  });

  return saved;
}
