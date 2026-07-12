import { useState, useEffect } from "react";
import Moodboard from "./Moodboard";
import Auth from "./Auth";
import RoomManager from "./RoomManager";
import { getUser, onAuthChange, signOut, saveRoom, uploadBase64Image } from "./supabase";

const colors = {
  toolbar: "#3d2b1f", toolbarBorder: "#5c3d2e",
  accent: "#c47a45", accentDark: "#a05a2c",
  text: "#fdf6f0", textMuted: "#c9a98a", textDim: "#6b4a35",
};

const toolbarBtn = (variant = "ghost") => ({
  padding: "5px 12px", borderRadius: "8px", border: "none",
  cursor: "pointer", fontWeight: "600", fontSize: "12px",
  transition: "all 0.15s",
  ...(variant === "primary" && {
    background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
    color: "white", boxShadow: "0 2px 8px rgba(160,90,44,0.3)",
  }),
  ...(variant === "ghost" && {
    background: "transparent", color: colors.textMuted,
    border: "1px solid #5c3d2e",
  }),
  ...(variant === "muted" && {
    background: "rgba(255,255,255,0.06)", color: colors.textDim,
    border: "1px solid #4a3020",
  }),
});

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showRooms, setShowRooms] = useState(false);
  const [currentRoom, setCurrentRoom] = useState({ id: null, name: "Untitled Room" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [background, setBackground] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    getUser().then((u) => { setUser(u); setAuthLoading(false); });
    const { data: { subscription } } = onAuthChange((u) => setUser(u));
    return () => subscription.unsubscribe();
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaveMsg("");
    try {
      const uploadedItems = await Promise.all(
        items.map(async (item) => {
          if (item.src.startsWith("data:") || item.src.startsWith("blob:")) {
            try {
              const res = await fetch(item.src);
              const blob = await res.blob();
              const file = new File([blob], `item-${item.id}.png`, { type: blob.type });
              const url = await uploadBase64Image(file, "furniture");
              return { ...item, src: url };
            } catch { return item; }
          }
          return item;
        })
      );

      let bgUrl = background;
      if (background && (background.startsWith("data:") || background.startsWith("blob:"))) {
        try {
          const res = await fetch(background);
          const blob = await res.blob();
          const file = new File([blob], `bg-${Date.now()}.jpg`, { type: blob.type });
          bgUrl = await uploadBase64Image(file, "backgrounds");
        } catch { bgUrl = background; }
      }

      const saved = await saveRoom({ id: currentRoom.id, name: currentRoom.name, background: bgUrl, items: uploadedItems });
      setCurrentRoom((prev) => ({ ...prev, id: saved.id }));
      setSaveMsg("✓ Saved");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch {
      setSaveMsg("Save failed");
      setTimeout(() => setSaveMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadRoom = (room) => {
    setCurrentRoom({ id: room.id, name: room.name });
    setBackground(room.background || null);
    setItems(room.items || []);
    setShowRooms(false);
  };

  const handleNewRoom = () => {
    setCurrentRoom({ id: null, name: "Untitled Room" });
    setBackground(null);
    setItems([]);
    setShowRooms(false);
  };

  const handleRename = () => {
    const name = prompt("Room name:", currentRoom.name);
    if (name?.trim()) setCurrentRoom((prev) => ({ ...prev, name: name.trim() }));
  };

  if (authLoading) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fdf6f0 0%, #f5e6d8 50%, #ede0d4 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🛋️</div>
        <div style={{ color: "#a07850", fontSize: "14px" }}>Loading...</div>
      </div>
    </div>
  );

  if (!user) return <Auth onAuth={() => getUser().then(setUser)} />;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Top bar */}
      <div style={{
        background: colors.toolbar, padding: "9px 16px",
        display: "flex", alignItems: "center", gap: "10px",
        borderBottom: `1px solid ${colors.toolbarBorder}`,
        flexShrink: 0, flexWrap: "wrap",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginRight: "4px" }}>
          <span style={{ fontSize: "18px" }}>🛋️</span>
          <span style={{ color: colors.text, fontWeight: "700", fontSize: "14px", letterSpacing: "-0.2px" }}>Room Planner</span>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "18px", background: "#4a3020" }} />

        {/* Room name */}
        <button onClick={handleRename} style={{
          background: "rgba(255,255,255,0.07)", border: "1px solid #4a3020",
          color: colors.textMuted, padding: "4px 10px", borderRadius: "7px",
          cursor: "pointer", fontSize: "12px", fontWeight: "500",
          display: "flex", alignItems: "center", gap: "5px",
        }}>
          <span>✏️</span>
          <span>{currentRoom.name}</span>
        </button>

        {/* My Rooms */}
        <button onClick={() => setShowRooms(true)} style={toolbarBtn("ghost")}>
          📂 My Rooms
        </button>

        {/* Save */}
        <button onClick={handleSave} disabled={saving} style={{ ...toolbarBtn("primary"), opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "💾 Save"}
        </button>

        {/* Save message */}
        {saveMsg && (
          <span style={{
            fontSize: "12px", fontWeight: "600",
            color: saveMsg.startsWith("✓") ? "#7ecba0" : "#e87e6b",
          }}>{saveMsg}</span>
        )}

        {/* Right side */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: colors.textDim, fontSize: "11px" }}>{user.email}</span>
          <button onClick={signOut} style={toolbarBtn("muted")}>Sign out</button>
        </div>
      </div>

      {/* Canvas */}
      <Moodboard
        initialBackground={background}
        initialItems={items}
        onBackgroundChange={setBackground}
        onItemsChange={setItems}
      />

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
