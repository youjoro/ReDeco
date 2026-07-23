import { useState, useEffect, useRef } from "react";
import FurnitureItem from "./FurnitureItem";
import GridSlider from "../GridSlider/GridSlider";
import { snap } from "../../lib/snapGrid";
import "./Canvas.css";

const ZOOM_STEP = 0.1;
const ZOOM_MIN  = 0.25;
const ZOOM_MAX  = 1.5;

export default function Canvas({ background, items, onItemsChange, onAddItem, onBackgroundChange, onAddToList }) {
  const [selectedId, setSelectedId] = useState(null);
  const [gridSize,   setGridSize]   = useState(0);
  const [zoom,       setZoom]       = useState(1.0);
  const canvasAreaRef = useRef(null);

  const update = (fn) => onItemsChange(typeof fn === "function" ? fn(items) : fn);

  const zoomOut   = () => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100));
  const zoomIn    = () => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100));
  const zoomReset = () => setZoom(1.0);

  // ── Touch-drag drop from sidebar ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const { src, label, clientX, clientY } = e.detail;
      const canvasEl = canvasAreaRef.current;
      if (!canvasEl) return;

      const rect   = canvasEl.getBoundingClientRect();
      const MARGIN = 60;
      if (clientX < rect.left - MARGIN || clientX > rect.right  + MARGIN ||
          clientY < rect.top  - MARGIN || clientY > rect.bottom + MARGIN) return;

      const clampedX = Math.max(rect.left, Math.min(clientX, rect.right));
      const clampedY = Math.max(rect.top,  Math.min(clientY, rect.bottom));

      // Divide by zoom to convert screen-space coords to canvas-space coords.
      const x = snap((clampedX - rect.left) / zoom, gridSize);
      const y = snap((clampedY - rect.top)  / zoom, gridSize);

      onAddItem(src, { width: 150, height: 150 }, label || "item", { x, y });
    };

    document.addEventListener("canvasTouchDrop", handler);
    return () => document.removeEventListener("canvasTouchDrop", handler);
  }, [gridSize, zoom, onAddItem]);

  const handleDrag   = (id, pos)      => update((p) => p.map((i) => i.id === id ? { ...i, ...pos }   : i));
  const handleResize = (id, size)     => update((p) => p.map((i) => i.id === id ? { ...i, ...size }   : i));
  const handleRotate = (id, rotation) => update((p) => p.map((i) => i.id === id ? { ...i, rotation }  : i));
  const handleDelete = (id)           => { update((p) => p.filter((i) => i.id !== id)); setSelectedId(null); };

  // ── Z-order helpers ────────────────────────────────────────────────────────
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
  const allZ     = items.map((i) => i.zOrder ?? 0);
  const atTop    = selectedItem && (selectedItem.zOrder ?? 0) >= Math.max(...allZ);
  const atBottom = selectedItem && (selectedItem.zOrder ?? 0) <= Math.min(...allZ);

  const showGrid = gridSize >= 4;
  const gridStyle = showGrid
    ? { backgroundImage: `radial-gradient(circle, #c1c1c4 1px, transparent 1px), linear-gradient(to right, rgba(232,130,60,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(232,130,60,0.10) 1px, transparent 1px)`, backgroundSize: `22px 22px, ${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px` }
    : {};

  // ── Drag-and-drop from sidebar (mouse/keyboard) ────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const canvasRect = e.currentTarget.getBoundingClientRect();
    // Convert screen coords to canvas-space by dividing by zoom.
    const x = snap((e.clientX - canvasRect.left) / zoom, gridSize);
    const y = snap((e.clientY - canvasRect.top)  / zoom, gridSize);

    const data = e.dataTransfer.getData("application/json");
    if (data) {
      try {
        const itemData = JSON.parse(data);
        onAddItem(
          itemData.src,
          { width: itemData.width || 150, height: itemData.height || 150 },
          itemData.label || "item",
          { x, y }
        );
      } catch (err) {
        console.error("Failed to parse dropped data:", err);
      }
    }
  };

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

        {/* Right controls */}
        <div className="canvas-minibar__right">
          {/* Zoom — always visible, works on both desktop and mobile */}
          <div className="canvas-minibar__zoom">
            <button
              className="canvas-minibar__zoom-btn"
              onClick={zoomOut}
              disabled={zoom <= ZOOM_MIN}
              title="Zoom out"
            >−</button>
            <button
              className="canvas-minibar__zoom-val"
              onClick={zoomReset}
              title="Reset zoom to 100%"
            >{Math.round(zoom * 100)}%</button>
            <button
              className="canvas-minibar__zoom-btn"
              onClick={zoomIn}
              disabled={zoom >= ZOOM_MAX}
              title="Zoom in"
            >+</button>
          </div>

          {/* Grid slider — desktop only (hidden on mobile to prevent overflow) */}
          <div className="canvas-minibar__grid">
            <GridSlider value={gridSize} onChange={setGridSize} />
          </div>
        </div>
      </div>

      {/* Drop area — outer div is the clip boundary; inner canvas-scene is what zooms */}
      <div
        ref={canvasAreaRef}
        className={`canvas-area${background ? " canvas-area--has-bg" : ""}`}
        style={gridStyle}
        onClick={() => setSelectedId(null)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* canvas-scene scales with zoom; transform-origin top left so content
            grows/shrinks from the top-left corner of the canvas. */}
        <div
          className="canvas-scene"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
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
              zoom={zoom}
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
    </div>
  );
}
