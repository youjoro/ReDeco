import { useState, useEffect } from "react";
import { loadRooms, deleteRoom } from "./supabase";

export default function RoomManager({ onLoad, onNew, onClose }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await loadRooms();
      setRooms(data || []);
    } catch (err) {
      setError("Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteRoom(id);
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to delete room.");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (str) => {
    return new Date(str).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, fontFamily: "sans-serif",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "white", borderRadius: 14, padding: 24,
        width: 460, maxHeight: "80vh", display: "flex",
        flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>My Rooms</span>
          <span onClick={onClose} style={{ cursor: "pointer", fontSize: 20, color: "#aaa" }}>×</span>
        </div>

        {/* New Room button */}
        <button onClick={onNew} style={{
          width: "100%", padding: "10px 0", marginBottom: 16,
          background: "#4f8ef7", color: "white", border: "none",
          borderRadius: 8, cursor: "pointer", fontWeight: 600,
          fontSize: 14, display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6,
        }}>
          + New Room
        </button>

        {error && (
          <div style={{ color: "#cc3333", fontSize: 13, marginBottom: 10 }}>{error}</div>
        )}

        {/* Room list */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0", fontSize: 14 }}>
              Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏠</div>
              <div style={{ fontSize: 14 }}>No saved rooms yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Click "New Room" to get started</div>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 10px", borderRadius: 8, marginBottom: 6,
                background: "#f8f8f8", border: "1.5px solid #eee",
                transition: "border 0.12s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.border = "1.5px solid #4f8ef7"}
                onMouseLeave={(e) => e.currentTarget.style.border = "1.5px solid #eee"}
              >
                {/* Room thumbnail */}
                <div style={{
                  width: 52, height: 40, borderRadius: 6, overflow: "hidden",
                  background: "#e0e0e0", flexShrink: 0,
                }}>
                  {room.background ? (
                    <img src={room.background} alt="room"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏠</div>
                  )}
                </div>

                {/* Room info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {room.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                    {room.items?.length || 0} items · Updated {formatDate(room.updated_at)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onLoad(room)} style={{
                    padding: "5px 12px", borderRadius: 6,
                    background: "#4f8ef7", color: "white",
                    border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500,
                  }}>Open</button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    disabled={deleting === room.id}
                    style={{
                      padding: "5px 10px", borderRadius: 6,
                      background: deleting === room.id ? "#eee" : "#fff0f0",
                      color: "#cc3333", border: "1px solid #ffc0c0",
                      cursor: "pointer", fontSize: 12,
                    }}
                  >{deleting === room.id ? "..." : "🗑"}</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
