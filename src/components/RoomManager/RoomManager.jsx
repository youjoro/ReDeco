import { useState, useEffect } from "react";
import { loadRooms, deleteRoom } from "../../lib/supabase";
import PaywallModal from "../Paywall/PaywallModal";
import "./RoomManager.css";

const FREE_ROOM_LIMIT = 3;

const fmt = (str) => new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function RoomManager({ onLoad, onNew, onClose }) {
  const [rooms,       setRooms]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [deleting,    setDeleting]    = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try { setRooms((await loadRooms()) || []); }
    catch { setError("Failed to load rooms."); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try { await deleteRoom(id); setRooms((p) => p.filter((r) => r.id !== id)); }
    catch { setError("Failed to delete."); }
    finally { setDeleting(null); }
  };

  const handleNew = () => {
    if (rooms.length >= FREE_ROOM_LIMIT) {
      setShowPaywall(true);
    } else {
      onNew();
    }
  };

  return (
    <>
      <div className="room-manager__overlay" onClick={onClose}>
        <div className="room-manager__modal" onClick={(e) => e.stopPropagation()}>

          <div className="room-manager__header">
            <div>
              <div className="room-manager__title">My Rooms</div>
              <div className="room-manager__subtitle">
                {rooms.length} / {FREE_ROOM_LIMIT} rooms used
              </div>
            </div>
            <button className="room-manager__close" onClick={onClose}>×</button>
          </div>

          <button className="room-manager__new" onClick={handleNew}>+ New Room</button>

          {error && <div className="room-manager__error">{error}</div>}

          <div className="room-manager__list">
            {loading ? (
              <div className="room-manager__loading">Loading rooms…</div>
            ) : rooms.length === 0 ? (
              <div className="room-manager__empty">
                <div className="room-manager__empty-icon">🏠</div>
                <div className="room-manager__empty-text">No saved rooms yet</div>
                <div className="room-manager__empty-sub">Click "New Room" to get started</div>
              </div>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="room-card">
                  <div className="room-card__thumb">
                    {room.background ? <img src={room.background} alt="room" /> : "🏠"}
                  </div>
                  <div className="room-card__info">
                    <div className="room-card__name">{room.name}</div>
                    <div className="room-card__meta">{room.items?.length || 0} items · {fmt(room.updated_at)}</div>
                  </div>
                  <div className="room-card__actions">
                    <button className="room-card__open"   onClick={() => onLoad(room)}>Open</button>
                    <button className="room-card__delete" onClick={() => handleDelete(room.id)} disabled={deleting === room.id}>
                      {deleting === room.id ? "…" : "🗑"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showPaywall && (
        <PaywallModal
          type="rooms"
          count={rooms.length}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </>
  );
}
