import { useState } from "react";
import FurnitureItem from "./FurnitureItem";
import GridSlider from "../GridSlider/GridSlider";
import { snap } from "../../lib/snapGrid";
import { loadImageSize, removeImageBackground } from "../../lib/imageUtils";
import "./Canvas.css";

let nextId = 1;

export default function Canvas({ background, items, onItemsChange, onBackgroundChange, onAddToList }) {
  const [selectedId, setSelectedId] = useState(null);
  const [gridSize,   setGridSize]   = useState(0);

  const update = (fn) => onItemsChange(typeof fn === "function" ? fn(items) : fn);

  const handleDrag   = (id, pos)  => update((p) => p.map((i) => i.id === id ? { ...i, ...pos }  : i));
  const handleResize = (id, size) => update((p) => p.map((i) => i.id === id ? { ...i, ...size } : i));
  const handleDelete = (id)       => { update((p) => p.filter((i) => i.id !== id)); setSelectedId(null); };

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
          <button className="canvas-minibar__remove" onClick={() => handleDelete(selectedId)}>
            🗑 Remove selected
          </button>
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
            onDelete={handleDelete}
            onAddToList={onAddToList}
            gridSize={gridSize}
          />
        ))}

        {items.length === 0 && (
          <div className="canvas-empty">
            <span className="canvas-empty__icon">🛋️</span>
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
