import { useRef, useState } from "react";
import { snap } from "../../lib/snapGrid";
import "./FurnitureItem.css";

export default function FurnitureItem({ item, onDrag, onResize, onDelete, onAddToList, isSelected, onSelect, gridSize }) {
  const dragOffset  = useRef(null);
  const resizeStart = useRef(null);
  const [hovered, setHovered] = useState(false);

  // ── Shared move/end logic ──────────────────────────────────────────────────
  const applyDrag = (clientX, clientY) => {
    onDrag(item.id, {
      x: snap(clientX - dragOffset.current.x, gridSize),
      y: snap(clientY - dragOffset.current.y, gridSize),
    });
  };

  const applyResize = (clientX) => {
    const w = Math.max(60, snap(resizeStart.current.w + (clientX - resizeStart.current.mx), gridSize));
    onResize(item.id, { width: w, height: Math.round(w / resizeStart.current.r) });
  };

  // ── Mouse drag ─────────────────────────────────────────────────────────────
  const startMouseDrag = (e) => {
    if (e.target.dataset.handle || e.target.dataset.del || e.target.dataset.cart) return;
    e.preventDefault(); e.stopPropagation();
    onSelect(item.id);
    dragOffset.current = { x: e.clientX - item.x, y: e.clientY - item.y };
    const move = (e) => applyDrag(e.clientX, e.clientY);
    const up   = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // ── Touch drag ─────────────────────────────────────────────────────────────
  const startTouchDrag = (e) => {
    if (e.target.dataset.handle || e.target.dataset.del || e.target.dataset.cart) return;
    e.stopPropagation();
    onSelect(item.id);
    const t = e.touches[0];
    dragOffset.current = { x: t.clientX - item.x, y: t.clientY - item.y };
    const move = (e) => { const t = e.touches[0]; applyDrag(t.clientX, t.clientY); };
    const end  = () => { window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); };
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end);
  };

  // ── Mouse resize ───────────────────────────────────────────────────────────
  const startMouseResize = (e) => {
    e.stopPropagation(); e.preventDefault();
    resizeStart.current = { mx: e.clientX, w: item.width, r: item.width / item.height };
    const move = (e) => applyResize(e.clientX);
    const up   = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // ── Touch resize ───────────────────────────────────────────────────────────
  const startTouchResize = (e) => {
    e.stopPropagation();
    const t = e.touches[0];
    resizeStart.current = { mx: t.clientX, w: item.width, r: item.width / item.height };
    const move = (e) => applyResize(e.touches[0].clientX);
    const end  = () => { window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); };
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end);
  };

  const showControls = isSelected || hovered;
  const classList = [
    "furniture",
    isSelected ? "furniture--selected" : "",
    hovered    ? "furniture--hovered"  : "",
  ].join(" ").trim();

  return (
    <div
      className={classList}
      style={{ left: item.x, top: item.y, width: item.width, height: item.height, zIndex: isSelected ? 50 : hovered ? 40 : 10 }}
      onMouseDown={startMouseDrag}
      onTouchStart={startTouchDrag}
      onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img className="furniture__img" src={item.src} alt={item.label || ""} draggable={false} />

      {showControls && (
        <>
          <button
            className="furniture__delete"
            data-del
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          >×</button>

          {onAddToList && (
            <button
              className="furniture__cart"
              data-cart
              onClick={(e) => { e.stopPropagation(); onAddToList(item); }}
              title="Add to shopping list"
            >🛒</button>
          )}

          <div
            className="furniture__resize"
            data-handle
            onMouseDown={startMouseResize}
            onTouchStart={startTouchResize}
          />
        </>
      )}
    </div>
  );
}
