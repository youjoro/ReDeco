import { useState, useEffect, useRef } from "react";
import { signOut } from "../../lib/supabase";
import FeedbackButton from "../Feedback/FeedbackButton";
import { useTheme } from "../../context/ThemeContext";
import "./Toolbar.css";

export default function Toolbar({
  user, isPro,
  roomName, saving, saveMsg,
  onSave, onRename, onOpenRooms, onOpenShoppingList,
  shoppingCount = 0,
  onSignIn,
}) {
  const { theme, toggle } = useTheme();
  const isGuest  = !user;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking/touching outside.
  // Uses "pointerdown" (one event per interaction) instead of the
  // mousedown + touchstart pair — on iOS Safari the synthetic mousedown
  // can fire with document.body as target rather than the actual element,
  // making the handler incorrectly close the menu when tapping a menu item.
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

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
      {/* ── Brand (always visible) ── */}
      <div className="toolbar__brand">
        <img src="/logo.png" alt="ReDeco" className="toolbar__brand-logo" />
        <span className="toolbar__brand-name">ReDeco</span>
      </div>

      {/* ── Desktop action strip (hidden on mobile) ── */}
      <div className="toolbar__desktop">
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
      </div>

      {/* ── Desktop right section ── */}
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

      {/* ── Mobile hamburger (hidden on desktop) ── */}
      <div className="toolbar__mobile" ref={menuRef}>
        <button
          className={`toolbar__burger${menuOpen ? " toolbar__burger--open" : ""}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>

        {menuOpen && (
          <div className="toolbar__dropdown" role="menu">
            {/* Room rename */}
            <button
              className="toolbar__menu-item toolbar__menu-item--room"
              onClick={() => { isGuest ? guardedSave() : onRename(); closeMenu(); }}
              role="menuitem"
            >
              ✏️ <span className="toolbar__menu-room-name">{roomName}</span>
            </button>

            <div className="toolbar__menu-divider" />

            <button
              className="toolbar__menu-item"
              onClick={() => { guardedRooms(); closeMenu(); }}
              role="menuitem"
            >
              📂 Rooms
            </button>

            <button
              className="toolbar__menu-item"
              onClick={() => { onOpenShoppingList(); closeMenu(); }}
              role="menuitem"
            >
              🛒 List
              {shoppingCount > 0 && (
                <span className="toolbar__menu-badge">{shoppingCount}</span>
              )}
            </button>

            <button
              className="toolbar__menu-item toolbar__menu-item--save"
              onClick={() => { guardedSave(); closeMenu(); }}
              disabled={saving}
              role="menuitem"
            >
              💾 {saving ? "Saving…" : "Save"}
            </button>

            {saveMsg && (
              <span className={`toolbar__menu-save-msg ${saveMsg.startsWith("✓") ? "ok" : "err"}`}>
                {saveMsg}
              </span>
            )}

            <div className="toolbar__menu-divider" />

            <button
              className="toolbar__menu-item"
              onClick={() => { toggle(); }}
              role="menuitem"
            >
              {theme === "light" ? "🌙 Dark mode" : "☀️ Light mode"}
            </button>

            <div className="toolbar__menu-divider" />

            {isGuest ? (
              <>
                <span className="toolbar__menu-label">Browsing as guest</span>
                <button
                  className="toolbar__menu-item toolbar__menu-item--primary"
                  onClick={() => { onSignIn?.(); closeMenu(); }}
                  role="menuitem"
                >
                  Sign in to save rooms
                </button>
              </>
            ) : (
              <>
                <span className="toolbar__menu-label">{user?.email}</span>
                <span className={`toolbar__menu-badge-plan ${isPro ? "pro" : "free"}`}>
                  {isPro ? "✦ Pro" : "Free plan"}
                </span>
                <button
                  className="toolbar__menu-item toolbar__menu-item--ghost"
                  onClick={() => { signOut(); closeMenu(); }}
                  role="menuitem"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
