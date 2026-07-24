import { useRef, useState } from "react";
import { snap } from "../../lib/snapGrid";
import { useWindowDrag } from "../../hooks/useWindowDrag";
import "./FurnitureItem.css";

export default function FurnitureItem({ item, onDrag, onResize, onRotate, onDelete, onAddToList, isSelected, onSelect, gridSize, zoom = 1 }) {
  const dragOffset  = useRef(null);
  const resizeStart = useRef(null);
  const elRef       = useRef(null);
  const [hovered, setHovered] = useState(false);
  const { startMouse, startTouch } = useWindowDrag();

  // ── Shared move/end logic ──────────────────────────────────────────────────
  // clientX/Y values coming in are in screen pixels. Dividing by zoom converts
  // them into canvas-space pixels (the coordinate system items are stored in).
  const applyDrag = (clientX, clientY) => {
    onDrag(item.id, {
      x: snap(clientX / zoom - dragOffset.current.x, gridSize),
      y: snap(clientY / zoom - dragOffset.current.y, gridSize),
    });
  };

  const applyResize = (canvasX) => {
    const w = Math.max(60, snap(resizeStart.current.w + (canvasX - resizeStart.current.mx), gridSize));
    onResize(item.id, { width: w, height: Math.round(w / resizeStart.current.r) });
  };

  // Rotation uses getBoundingClientRect on the element itself (which returns the
  // visual/screen rect including the zoom transform), so both the centre point and
  // clientX/Y are in the same screen-space — no zoom correction needed here.
  const getRotationAngle = (clientX, clientY) => {
    const rect = elRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const deg = Math.round(Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI) + 90;
    return ((deg % 360) + 360) % 360;
  };

  const normDelta = (d) => { while (d > 180) d -= 360; while (d < -180) d += 360; return d; };

  // ── Mouse drag ─────────────────────────────────────────────────────────────
  const startMouseDrag = (e) => {
    if (e.target.dataset.handle || e.target.dataset.del || e.target.dataset.cart || e.target.dataset.rotate) return;
    e.preventDefault(); e.stopPropagation();
    onSelect(item.id);
    // Store offset in canvas-space (divide screen coords by zoom).
    dragOffset.current = { x: e.clientX / zoom - item.x, y: e.clientY / zoom - item.y };
    startMouse((e) => applyDrag(e.clientX, e.clientY));
  };

  // ── Touch drag ─────────────────────────────────────────────────────────────
  const startTouchDrag = (e) => {
    if (e.target.dataset.handle || e.target.dataset.del || e.target.dataset.cart || e.target.dataset.rotate) return;
    e.stopPropagation();
    onSelect(item.id);
    const t = e.touches[0];
    dragOffset.current = { x: t.clientX / zoom - item.x, y: t.clientY / zoom - item.y };
    startTouch((e) => { const t = e.touches[0]; applyDrag(t.clientX, t.clientY); }, undefined, true);
  };

  // ── Mouse resize ───────────────────────────────────────────────────────────
  const startMouseResize = (e) => {
    e.stopPropagation(); e.preventDefault();
    resizeStart.current = { mx: e.clientX / zoom, w: item.width, r: item.width / item.height };
    startMouse((e) => applyResize(e.clientX / zoom));
  };

  // ── Touch resize ───────────────────────────────────────────────────────────
  const startTouchResize = (e) => {
    e.stopPropagation();
    const t = e.touches[0];
    resizeStart.current = { mx: t.clientX / zoom, w: item.width, r: item.width / item.height };
    startTouch((e) => applyResize(e.touches[0].clientX / zoom), undefined, true);
  };

  // ── Mouse rotate ───────────────────────────────────────────────────────────
  const startMouseRotate = (e) => {
    e.stopPropagation(); e.preventDefault();
    let prev = getRotationAngle(e.clientX, e.clientY);
    let rot  = item.rotation || 0;
    startMouse((e) => {
      const cur = getRotationAngle(e.clientX, e.clientY);
      rot = ((rot + normDelta(cur - prev)) % 360 + 360) % 360;
      prev = cur;
      onRotate(item.id, rot);
    });
  };

  // ── Touch rotate ───────────────────────────────────────────────────────────
  const startTouchRotate = (e) => {
    e.stopPropagation();
    const t0 = e.touches[0];
    let prev = getRotationAngle(t0.clientX, t0.clientY);
    let rot  = item.rotation || 0;
    startTouch((e) => {
      const t   = e.touches[0];
      const cur = getRotationAngle(t.clientX, t.clientY);
      rot = ((rot + normDelta(cur - prev)) % 360 + 360) % 360;
      prev = cur;
      onRotate(item.id, rot);
    }, undefined, true);
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
        zIndex: isSelected ? 1000 : (item.zOrder ?? 0) + 1,
      }}
      onMouseDown={startMouseDrag}
      onTouchStart={startTouchDrag}
      onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img className="furniture__img" src={item.src} alt={item.label || ""} draggable={false} />
      {item.bgRemoving && (
        <div className="furniture__bg-removing" title="Removing background…">✂️</div>
      )}

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

          <div
            className="furniture__resize"
            data-handle
            onMouseDown={startMouseResize}
            onTouchStart={startTouchResize}
            title="Resize"
          />

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
