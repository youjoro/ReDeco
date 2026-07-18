import { signOut } from "../../lib/supabase";
import FeedbackButton from "../Feedback/FeedbackButton";
import { useTheme } from "../../context/ThemeContext";
import "./Toolbar.css";

export default function Toolbar({
  user, isPro,
  roomName, saving, saveMsg,
  onSave, onRename, onOpenRooms, onOpenShoppingList,
  shoppingCount = 0,
  onSignIn,          // called when a guest taps a protected action
}) {
  const { theme, toggle } = useTheme();
  const isGuest = !user;

  const guardedSave = () => {
    if (isGuest) { onSignIn?.(); return; }
    onSave();
  };

  const guardedRooms = () => {
    if (isGuest) { onSignIn?.(); return; }
    onOpenRooms();
  };

  return (
    <div className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__brand-icon">🪴</span>
        <span className="toolbar__brand-name">ReDeco</span>
      </div>

      <div className="toolbar__divider" />

      <button className="toolbar__room-name" onClick={isGuest ? guardedSave : onRename}>
        ✏️ {roomName}
      </button>

      <button className="toolbar__btn toolbar__btn--ghost" onClick={guardedRooms}>
        📂 Rooms
      </button>

      <button className="toolbar__btn toolbar__btn--ghost toolbar__btn--cart" onClick={onOpenShoppingList}>
        🛒 List
        {shoppingCount > 0 && <span className="toolbar__cart-badge">{shoppingCount}</span>}
      </button>

      <button className="toolbar__btn toolbar__btn--primary" onClick={guardedSave} disabled={saving}>
        {saving ? "Saving…" : "💾 Save"}
      </button>

      {saveMsg && (
        <span className={`toolbar__save-msg ${saveMsg.startsWith("✓") ? "toolbar__save-msg--ok" : "toolbar__save-msg--err"}`}>
          {saveMsg}
        </span>
      )}

      <div className="toolbar__right">
        {isGuest ? (
          <>
            <span className="toolbar__plan-badge toolbar__plan-badge--guest">Guest</span>
            <button
              className="toolbar__theme-toggle"
              onClick={toggle}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <button className="toolbar__btn toolbar__btn--primary toolbar__btn--signin" onClick={onSignIn}>
              Sign in
            </button>
          </>
        ) : (
          <>
            <span className={`toolbar__plan-badge ${isPro ? "toolbar__plan-badge--pro" : "toolbar__plan-badge--free"}`}>
              {isPro ? "✦ Pro" : "Free"}
            </span>
            <button
              className="toolbar__theme-toggle"
              onClick={toggle}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <FeedbackButton user={user} />
            <span className="toolbar__email">{user?.email}</span>
            <button className="toolbar__btn toolbar__btn--ghost" onClick={signOut}>
              Sign out
            </button>
          </>
        )}
      </div>
    </div>
  );
}
