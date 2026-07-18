import { useRef, useState } from "react";
import { snap } from "../../lib/snapGrid";
import "./FurnitureItem.css";

export default function FurnitureItem({ item, onDrag, onResize, onRotate, onDelete, onAddToList, isSelected, onSelect, gridSize }) {
  const dragOffset  = useRef(null);
  const resizeStart = useRef(null);
  const elRef       = useRef(null);
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

  const getRotationAngle = (clientX, clientY) => {
    const rect = elRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const deg = Math.round(Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI) + 90;
    return ((deg % 360) + 360) % 360; // normalise to 0-359
  };

  // ── Mouse drag ─────────────────────────────────────────────────────────────
  const startMouseDrag = (e) => {
    if (e.target.dataset.handle || e.target.dataset.del || e.target.dataset.cart || e.target.dataset.rotate) return;
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
    if (e.target.dataset.handle || e.target.dataset.del || e.target.dataset.cart || e.target.dataset.rotate) return;
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

  // ── Rotate helpers ─────────────────────────────────────────────────────────
  // Normalise an angle delta to [-180, 180] so crossing 0°/360° never jumps.
  const normDelta = (d) => { while (d > 180) d -= 360; while (d < -180) d += 360; return d; };

  // ── Mouse rotate ───────────────────────────────────────────────────────────
  const startMouseRotate = (e) => {
    e.stopPropagation(); e.preventDefault();
    let prev = getRotationAngle(e.clientX, e.clientY);
    let rot  = item.rotation || 0;
    const move = (e) => {
      const cur = getRotationAngle(e.clientX, e.clientY);
      rot = ((rot + normDelta(cur - prev)) % 360 + 360) % 360;
      prev = cur;
      onRotate(item.id, rot);
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // ── Touch rotate ───────────────────────────────────────────────────────────
  const startTouchRotate = (e) => {
    e.stopPropagation();
    const t0 = e.touches[0];
    let prev = getRotationAngle(t0.clientX, t0.clientY);
    let rot  = item.rotation || 0;
    const move = (e) => {
      const t   = e.touches[0];
      const cur = getRotationAngle(t.clientX, t.clientY);
      rot = ((rot + normDelta(cur - prev)) % 360 + 360) % 360;
      prev = cur;
      onRotate(item.id, rot);
    };
    const end = () => { window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); };
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end);
  };

  const showControls = isSelected || hovered;
  const rotation = item.rotation || 0;

  const classList = [
    "furniture",
    isSelected ? "furniture--selected" : "",
    hovered    ? "furniture--hovered"  : "",
  ].join(" ").trim();

  return (
    <div
      ref={elRef}
      className={classList}
      style={{
        left: item.x, top: item.y,
        width: item.width, height: item.height,
        transform: `rotate(${rotation}deg)`,
        zIndex: isSelected ? 50 : hovered ? 40 : 10,
      }}
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
            title="Remove"
          >×</button>

          {onAddToList && (
            <button
              className="furniture__cart"
              data-cart
              onClick={(e) => { e.stopPropagation(); onAddToList(item); }}
              title="Add to shopping list"
            >🛒</button>
          )}

          {/* Resize handle — bottom-right */}
          <div
            className="furniture__resize"
            data-handle
            onMouseDown={startMouseResize}
            onTouchStart={startTouchResize}
            title="Resize"
          />

          {/* Rotate handle — bottom-left */}
          <div
            className="furniture__rotate"
            data-rotate
            onMouseDown={startMouseRotate}
            onTouchStart={startTouchRotate}
            title={`Rotate (${Math.round(rotation)}°)`}
          >↻</div>
        </>
      )}
    </div>
  );
}
