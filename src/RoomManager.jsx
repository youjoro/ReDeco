import { useState, useEffect } from "react";
import { loadRooms, deleteRoom } from "./supabase";

const colors = {
  bg: "#fdf6f0", bgSecondary: "#f5ede6",
  bgCard: "rgba(255,255,255,0.95)",
  border: "#e8d5c4", text: "#3d2b1f",
  textMuted: "#a07850", textLight: "#c9a98a",
  accent: "#c47a45", accentDark: "#a05a2c",
  accentLight: "#f5e6d8", danger: "#c0392b",
  dangerBg: "#fff5f5", overlay: "rgba(61,43,31,0.45)",
};

export default function RoomManager({ onLoad, onNew, onClose }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try { setRooms((await loadRooms()) || []); }
    catch { setError("Failed to load rooms."); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try { await deleteRoom(id); setRooms((prev) => prev.filter((r) => r.id !== id)); }
    catch { setError("Failed to delete."); }
    finally { setDeleting(null); }
  };

  const formatDate = (str) => new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: colors.overlay,
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(3px)",
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: colors.bgCard, borderRadius: "20px", padding: "28px",
        width: "480px", maxHeight: "80vh", display: "flex", flexDirection: "column",
        boxShadow: "0 16px 60px rgba(61,43,31,0.2)", border: `1px solid ${colors.border}`,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <div style={{ fontWeight: "700", fontSize: "17px", color: colors.text }}>My Rooms</div>
            <div style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>{rooms.length} saved room{rooms.length !== 1 ? "s" : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: colors.textMuted }}>×</button>
        </div>

        {/* New Room */}
        <button onClick={onNew} style={{
          width: "100%", padding: "11px 0", marginBottom: "16px",
          background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`,
          color: "white", border: "none", borderRadius: "12px",
          cursor: "pointer", fontWeight: "700", fontSize: "14px",
          boxShadow: "0 3px 10px rgba(160,90,44,0.3)",
        }}>+ New Room</button>

        {error && <div style={{ color: colors.danger, fontSize: "13px", marginBottom: "10px", padding: "8px 12px", background: colors.dangerBg, borderRadius: "8px" }}>{error}</div>}

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: colors.textMuted, padding: "40px 0", fontSize: "14px" }}>Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🏠</div>
              <div style={{ fontSize: "14px", color: colors.textMuted, fontWeight: "500" }}>No saved rooms yet</div>
              <div style={{ fontSize: "12px", color: colors.textLight, marginTop: "4px" }}>Click "New Room" to get started</div>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 14px", borderRadius: "12px",
                background: colors.bgSecondary, border: `1.5px solid ${colors.border}`,
                transition: "border 0.12s, box-shadow 0.12s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.border = `1.5px solid ${colors.accent}`; e.currentTarget.style.boxShadow = "0 2px 8px rgba(196,122,69,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.border = `1.5px solid ${colors.border}`; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Thumbnail */}
                <div style={{ width: "54px", height: "42px", borderRadius: "8px", overflow: "hidden", background: colors.accentLight, flexShrink: 0, border: `1px solid ${colors.border}` }}>
                  {room.background
                    ? <img src={room.background} alt="room" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🏠</div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "600", fontSize: "14px", color: colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.name}</div>
                  <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>
                    {room.items?.length || 0} items · {formatDate(room.updated_at)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button onClick={() => onLoad(room)} style={{
                    padding: "5px 14px", borderRadius: "8px",
                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                    color: "white", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600",
                  }}>Open</button>
                  <button onClick={() => handleDelete(room.id)} disabled={deleting === room.id} style={{
                    padding: "5px 10px", borderRadius: "8px",
                    background: colors.dangerBg, color: colors.danger,
                    border: "1px solid #fac8c8", cursor: "pointer", fontSize: "12px",
                    opacity: deleting === room.id ? 0.5 : 1,
                  }}>{deleting === room.id ? "..." : "🗑"}</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
