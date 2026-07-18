import { useState } from "react";
import FurnitureItem from "./FurnitureItem";
import GridSlider from "../GridSlider/GridSlider";
import { snap } from "../../lib/snapGrid";
import "./Canvas.css";

export default function Canvas({ background, items, onItemsChange, onBackgroundChange, onAddToList }) {
  const [selectedId, setSelectedId] = useState(null);
  const [gridSize,   setGridSize]   = useState(0);

  const update = (fn) => onItemsChange(typeof fn === "function" ? fn(items) : fn);

  const handleDrag   = (id, pos)      => update((p) => p.map((i) => i.id === id ? { ...i, ...pos }      : i));
  const handleResize = (id, size)     => update((p) => p.map((i) => i.id === id ? { ...i, ...size }     : i));
  const handleRotate = (id, rotation) => update((p) => p.map((i) => i.id === id ? { ...i, rotation }    : i));
  const handleDelete = (id)           => { update((p) => p.filter((i) => i.id !== id)); setSelectedId(null); };

  // ── Z-order helpers ────────────────────────────────────────────────────────
  // Re-indexes a sorted array so zOrder is always 0, 1, 2 … (no gaps).
  const reindex = (arr) =>
    [...arr].sort((a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0))
            .map((item, i) => ({ ...item, zOrder: i }));

  const handleBringToFront = (id) =>
    update((prev) => {
      const arr = reindex(prev);
      const idx = arr.findIndex((i) => i.id === id);
      const [item] = arr.splice(idx, 1);
      arr.push(item);
      return arr.map((i, z) => ({ ...i, zOrder: z }));
    });

  const handleSendToBack = (id) =>
    update((prev) => {
      const arr = reindex(prev);
      const idx = arr.findIndex((i) => i.id === id);
      const [item] = arr.splice(idx, 1);
      arr.unshift(item);
      return arr.map((i, z) => ({ ...i, zOrder: z }));
    });

  const handleBringForward = (id) =>
    update((prev) => {
      const arr = reindex(prev);
      const idx = arr.findIndex((i) => i.id === id);
      if (idx >= arr.length - 1) return prev;
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr.map((i, z) => ({ ...i, zOrder: z }));
    });

  const handleSendBackward = (id) =>
    update((prev) => {
      const arr = reindex(prev);
      const idx = arr.findIndex((i) => i.id === id);
      if (idx <= 0) return prev;
      [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
      return arr.map((i, z) => ({ ...i, zOrder: z }));
    });

  // ── Layer button state ─────────────────────────────────────────────────────
  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) : null;
  const allZ  = items.map((i) => i.zOrder ?? 0);
  const atTop    = selectedItem && (selectedItem.zOrder ?? 0) >= Math.max(...allZ);
  const atBottom = selectedItem && (selectedItem.zOrder ?? 0) <= Math.min(...allZ);

  const showGrid = gridSize >= 4;
  const gridStyle = showGrid
    ? { backgroundImage: `radial-gradient(circle, #c1c1c4 1px, transparent 1px), linear-gradient(to right, rgba(232,130,60,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(232,130,60,0.10) 1px, transparent 1px)`, backgroundSize: `22px 22px, ${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px` }
    : {};

  return (
    <div className="canvas-wrap">
      {/* Mini bar */}
      <div className="canvas-minibar">
        <span className="canvas-minibar__count">{items.length} item{items.length !== 1 ? "s" : ""}</span>

        {selectedId && (
          <>
            {/* Layer controls */}
            <div className="canvas-minibar__layers">
              <button
                className="canvas-minibar__layer-btn"
                title="Send to back"
                disabled={atBottom}
                onClick={() => handleSendToBack(selectedId)}
              >⬇</button>
              <button
                className="canvas-minibar__layer-btn"
                title="Send backward"
                disabled={atBottom}
                onClick={() => handleSendBackward(selectedId)}
              >↓</button>
              <button
                className="canvas-minibar__layer-btn"
                title="Bring forward"
                disabled={atTop}
                onClick={() => handleBringForward(selectedId)}
              >↑</button>
              <button
                className="canvas-minibar__layer-btn"
                title="Bring to front"
                disabled={atTop}
                onClick={() => handleBringToFront(selectedId)}
              >⬆</button>
            </div>
            <span className="canvas-minibar__layer-label">
              Layer {(selectedItem?.zOrder ?? 0) + 1}/{items.length}
            </span>

            <button className="canvas-minibar__remove" onClick={() => handleDelete(selectedId)}>
              🗑 Remove
            </button>
          </>
        )}

        <div className="canvas-minibar__right">
          <GridSlider value={gridSize} onChange={setGridSize} />
        </div>
      </div>

      {/* Drop area */}
      <div
        className={`canvas-area${background ? " canvas-area--has-bg" : ""}`}
        style={gridStyle}
        onClick={() => setSelectedId(null)}
      >
        {background && (
          <img className="canvas-area__bg" src={background} alt="room background" draggable={false} />
        )}

        {items.map((item) => (
          <FurnitureItem
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            onSelect={setSelectedId}
            onDrag={handleDrag}
            onResize={handleResize}
            onRotate={handleRotate}
            onDelete={handleDelete}
            onAddToList={onAddToList}
            gridSize={gridSize}
          />
        ))}

        {items.length === 0 && (
          <div className="canvas-empty">
            <span className="canvas-empty__icon">🪴</span>
            <span className="canvas-empty__text">
              {background
                ? "Search for furniture in the sidebar to start decorating"
                : "Set a room background in the Room tab, then add furniture"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
