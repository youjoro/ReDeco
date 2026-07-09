import { useState, useEffect } from "react";
import Moodboard from "./Moodboard";
import Auth from "./Auth";
import RoomManager from "./RoomManager";
import { getUser, onAuthChange, signOut, saveRoom, uploadBase64Image } from "./supabase";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showRooms, setShowRooms] = useState(false);
  const [currentRoom, setCurrentRoom] = useState({ id: null, name: "Untitled Room" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Listen for auth state changes
  useEffect(() => {
    getUser().then((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    const { data: { subscription } } = onAuthChange((u) => setUser(u));
    return () => subscription.unsubscribe();
  }, []);

  // Save current room to Supabase
  const handleSave = async (background, items) => {
    setSaving(true);
    setSaveMsg("");
    try {
      // Upload base64 images to Supabase Storage so they persist
      const uploadedItems = await Promise.all(
        items.map(async (item) => {
          if (item.src.startsWith("data:") || item.src.startsWith("blob:")) {
            try {
              const res = await fetch(item.src);
              const blob = await res.blob();
              const file = new File([blob], `item-${item.id}.png`, { type: blob.type });
              const url = await uploadBase64Image(file, "furniture");
              return { ...item, src: url };
            } catch {
              return item; // fallback to original if upload fails
            }
          }
          return item;
        })
      );

      // Upload background if it's a local blob/base64
      let bgUrl = background;
      if (background && (background.startsWith("data:") || background.startsWith("blob:"))) {
        try {
          const res = await fetch(background);
          const blob = await res.blob();
          const file = new File([blob], `bg-${Date.now()}.jpg`, { type: blob.type });
          bgUrl = await uploadBase64Image(file, "backgrounds");
        } catch {
          bgUrl = background;
        }
      }

      const saved = await saveRoom({
        id: currentRoom.id,
        name: currentRoom.name,
        background: bgUrl,
        items: uploadedItems,
      });

      setCurrentRoom((prev) => ({ ...prev, id: saved.id }));
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (err) {
      setSaveMsg("Save failed.");
      setTimeout(() => setSaveMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadRoom = (room) => {
    setCurrentRoom({ id: room.id, name: room.name });
    setShowRooms(false);
    // Pass room data to Moodboard via key to force remount with new data
    window.__loadRoom = room;
  };

  const handleNewRoom = () => {
    setCurrentRoom({ id: null, name: "Untitled Room" });
    window.__loadRoom = null;
    setShowRooms(false);
  };

  const handleRename = () => {
    const name = prompt("Room name:", currentRoom.name);
    if (name?.trim()) setCurrentRoom((prev) => ({ ...prev, name: name.trim() }));
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#1a1a2e",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontFamily: "sans-serif", fontSize: 16,
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Auth onAuth={() => getUser().then(setUser)} />;
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{
        background: "#16213e", padding: "8px 16px",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid #0f3460", fontFamily: "sans-serif",
        zIndex: 100, flexShrink: 0,
      }}>
        <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>🛋️ Room Planner</span>

        {/* Room name */}
        <button onClick={handleRename} style={{
          background: "transparent", border: "1px solid #2a3a5e",
          color: "#ccc", padding: "4px 10px", borderRadius: 6,
          cursor: "pointer", fontSize: 13,
        }}>
          ✏️ {currentRoom.name}
        </button>

        {/* Rooms list */}
        <button onClick={() => setShowRooms(true)} style={{
          background: "#0f3460", color: "#ccc", border: "none",
          padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12,
        }}>📂 My Rooms</button>

        {/* Save button */}
        <button
          onClick={() => {
            // Trigger save from Moodboard via global callback
            if (window.__triggerSave) window.__triggerSave();
          }}
          disabled={saving}
          style={{
            background: saving ? "#3a6abf" : "#4f8ef7", color: "white",
            border: "none", padding: "5px 14px", borderRadius: 6,
            cursor: saving ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 500,
          }}
        >{saving ? "Saving..." : "💾 Save"}</button>

        {saveMsg && (
          <span style={{
            fontSize: 12, color: saveMsg === "Saved!" ? "#4caf50" : "#ff6b6b",
            fontWeight: 500,
          }}>{saveMsg}</span>
        )}

        {/* User info + sign out */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#888", fontSize: 12 }}>{user.email}</span>
          <button onClick={signOut} style={{
            background: "transparent", color: "#888",
            border: "1px solid #333", padding: "4px 10px",
            borderRadius: 6, cursor: "pointer", fontSize: 12,
          }}>Sign out</button>
        </div>
      </div>

      {/* Moodboard canvas */}
      <MoodboardWithSave onSave={handleSave} />

      {/* Rooms modal */}
      {showRooms && (
        <RoomManager
          onClose={() => setShowRooms(false)}
          onLoad={handleLoadRoom}
          onNew={handleNewRoom}
        />
      )}
    </div>
  );
}

// Wrapper that exposes save trigger and initial load to App
function MoodboardWithSave({ onSave }) {
  const [background, setBackground] = useState(
    window.__loadRoom?.background || null
  );
  const [items, setItems] = useState(
    window.__loadRoom?.items || []
  );

  // Expose save trigger globally so App toolbar can call it
  useEffect(() => {
    window.__triggerSave = () => onSave(background, items);
    return () => { window.__triggerSave = null; };
  }, [background, items, onSave]);

  // When a room is loaded, sync state
  useEffect(() => {
    if (window.__loadRoom) {
      setBackground(window.__loadRoom.background || null);
      setItems(window.__loadRoom.items || []);
    }
  }, []);

  return (
    <Moodboard
      initialBackground={background}
      initialItems={items}
      onBackgroundChange={setBackground}
      onItemsChange={setItems}
    />
  );
}
