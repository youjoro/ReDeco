import { signOut } from "../../lib/supabase";
import "./Toolbar.css";

export default function Toolbar({ user, roomName, saving, saveMsg, onSave, onRename, onOpenRooms, onOpenShoppingList, shoppingCount = 0 }) {
  return (
    <div className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__brand-icon">🛋️</span>
        <span className="toolbar__brand-name">Room Planner</span>
      </div>

      <div className="toolbar__divider" />

      <button className="toolbar__room-name" onClick={onRename}>
        ✏️ {roomName}
      </button>

      <button className="toolbar__btn toolbar__btn--ghost" onClick={onOpenRooms}>
        📂 Rooms
      </button>

      <button className="toolbar__btn toolbar__btn--ghost toolbar__btn--cart" onClick={onOpenShoppingList}>
        🛒 List
        {shoppingCount > 0 && <span className="toolbar__cart-badge">{shoppingCount}</span>}
      </button>

      <button className="toolbar__btn toolbar__btn--primary" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "💾 Save"}
      </button>

      {saveMsg && (
        <span className={`toolbar__save-msg ${saveMsg.startsWith("✓") ? "toolbar__save-msg--ok" : "toolbar__save-msg--err"}`}>
          {saveMsg}
        </span>
      )}

      <div className="toolbar__right">
        <span className="toolbar__email">{user?.email}</span>
        <button className="toolbar__btn toolbar__btn--ghost" onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
