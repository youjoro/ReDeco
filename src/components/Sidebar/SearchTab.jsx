import { useState, useMemo, useRef, useCallback } from "react";
import { FURNITURE_FIXTURES } from "../../lib/furnitureFixtures";
import { loadImageSize } from "../../lib/imageUtils";
import "./SearchTab.css";

// Touch-drag helper — direction-aware so horizontal swipes scroll the carousel
// instead of accidentally triggering a canvas-drag.
//
// Decision logic: wait until movement exceeds DECIDE_PX, then check axis.
// • abs(dx) > abs(dy) → horizontal swipe → let native scroll happen (no preventDefault)
// • abs(dy) >= abs(dx) → vertical/diagonal → commit to canvas drag
const DECIDE_PX = 6;

function startTouchDrag(e, item, onDragStart) {
  const t0 = e.touches[0];
  const startX = t0.clientX;
  const startY = t0.clientY;

  let ghost = null;
  let dragging = false;   // committed to canvas drag
  let decided = false;    // direction has been locked in
  let sidebarClosed = false;

  // Ghost is created lazily — only after we confirm it's a canvas drag.
  const makeGhost = (x, y) => {
    const g = document.createElement("div");
    g.style.cssText = [
      "position:fixed",
      `left:${x}px`,
      `top:${y}px`,
      "width:80px",
      "height:80px",
      "transform:translate(-50%,-50%)",
      "pointer-events:none",
      "z-index:9999",
      "border-radius:10px",
      "overflow:hidden",
      "box-shadow:0 8px 28px rgba(0,0,0,0.35)",
      "opacity:0.88",
    ].join(";");
    const img = document.createElement("img");
    img.src = item.image_url;
    img.style.cssText = "width:100%;height:100%;object-fit:contain;display:block;";
    g.appendChild(img);
    document.body.appendChild(g);
    return g;
  };

  const cleanup = () => {
    document.removeEventListener("touchmove",   onMove,   { passive: false });
    document.removeEventListener("touchend",    onEnd);
    document.removeEventListener("touchcancel", onCancel);
    if (ghost?.parentNode) document.body.removeChild(ghost);
    ghost = null;
  };

  const onMove = (ev) => {
    const t = ev.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const dist = Math.hypot(dx, dy);

    // Lock in direction once we've moved far enough.
    if (!decided && dist > DECIDE_PX) {
      decided = true;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe → scroll the carousel; bail out entirely.
        cleanup();
        return;
      }

      // Vertical/diagonal → canvas drag. Create ghost and optionally collapse sidebar.
      dragging = true;
      ghost = makeGhost(startX, startY);

      if (!sidebarClosed && onDragStart) {
        onDragStart();
        sidebarClosed = true;
      }
    }

    // If we haven't committed to a drag yet, don't block anything.
    if (!dragging) return;

    // We are dragging — prevent default to stop iOS from claiming the gesture.
    ev.preventDefault();
    if (ghost) {
      ghost.style.left = `${t.clientX}px`;
      ghost.style.top  = `${t.clientY}px`;
    }
  };

  const onEnd = (ev) => {
    cleanup();
    if (!dragging) return; // tap or horizontal swipe — let click/scroll fire normally
    ev.preventDefault();  // suppress the synthesised click
    const t = ev.changedTouches[0];
    document.dispatchEvent(new CustomEvent("canvasTouchDrop", {
      detail: {
        src:     item.image_url,
        label:   item.name,
        clientX: t.clientX,
        clientY: t.clientY,
      },
    }));
  };

  const onCancel = () => cleanup();

  document.addEventListener("touchmove",   onMove,   { passive: false });
  document.addEventListener("touchend",    onEnd);
  document.addEventListener("touchcancel", onCancel);
}

// How far each arrow click scrolls (px).
const ARROW_SCROLL = 232;

export default function SearchTab({ onAddItem, onDragStart }) {
  const [query,  setQuery]  = useState("");
  const [adding, setAdding] = useState(null);
  const scrollRef = useRef(null);

  // Filter the fixture catalogue by the current query.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FURNITURE_FIXTURES;
    return FURNITURE_FIXTURES.filter((item) => {
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.tags.some((t) => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [query]);

  const handleAdd = (src, label) => {
    if (adding) return;
    setAdding(src);
    loadImageSize(src).then((size) => {
      onAddItem(src, size, label);
      setAdding(null);
    });
  };

  const handleDragStart = (e, src, label) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/json", JSON.stringify({
      src,
      label: label || "furniture",
      width: 150,
      height: 150,
    }));
  };

  const handleClear = () => setQuery("");

  // Redirect vertical wheel → horizontal scroll so the scroll wheel works on desktop.
  const handleWheel = useCallback((e) => {
    const el = scrollRef.current;
    if (!el) return;
    // Only intercept when scroll content is actually wider than the container.
    if (el.scrollWidth <= el.clientWidth) return;
    e.preventDefault();
    el.scrollBy({ left: e.deltaY !== 0 ? e.deltaY : e.deltaX, behavior: "auto" });
  }, []);

  const scrollBy = (delta) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="search-tab">
      {/* Search bar */}
      <div className="search-tab__bar">
        <input
          className="search-tab__input"
          type="text"
          placeholder="sofa, chair, lamp, rug…"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, 80))}
          maxLength={80}
          autoComplete="off"
          spellCheck={false}
          aria-label="Filter furniture"
        />
        {query ? (
          <button className="search-tab__clear" onClick={handleClear} aria-label="Clear filter">✕</button>
        ) : (
          <span className="search-tab__search-icon">🔍</span>
        )}
      </div>

      {/* Status + arrow controls */}
      <div className="search-tab__meta">
        <p className="search-tab__count">
          {query
            ? <><strong>{results.length}</strong> result{results.length !== 1 ? "s" : ""} for "<em>{query}</em>"</>
            : <><strong>{results.length}</strong> items — tap or drag to place</>
          }
        </p>
        {results.length > 0 && (
          <div className="search-tab__arrows" aria-label="Scroll catalogue">
            <button
              className="search-tab__arrow"
              onClick={() => scrollBy(-ARROW_SCROLL)}
              aria-label="Scroll left"
            >‹</button>
            <button
              className="search-tab__arrow"
              onClick={() => scrollBy(ARROW_SCROLL)}
              aria-label="Scroll right"
            >›</button>
          </div>
        )}
      </div>

      {/* Horizontal carousel */}
      <div
        className="search-tab__scroll"
        ref={scrollRef}
        onWheel={handleWheel}
      >
        {results.length === 0 && (
          <div className="search-tab__empty">
            <span className="search-tab__empty-icon">🛋️</span>
            <span className="search-tab__empty-text">No items match "{query}"</span>
            <button className="search-tab__reset" onClick={handleClear}>Show all</button>
          </div>
        )}

        {results.length > 0 && (
          <div className="search-tab__grid">
            {results.map((item) => (
              <div
                key={item.id}
                className={`search-tab__result${adding === item.image_url ? " search-tab__result--adding" : ""}`}
                onClick={() => !adding && handleAdd(item.image_url, item.name)}
                draggable
                onDragStart={(e) => handleDragStart(e, item.image_url, item.name)}
                onTouchStart={(e) => !adding && startTouchDrag(e, item, onDragStart)}
                title={`${item.name} — $${item.price}`}
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  loading="lazy"
                  onError={(e) => {
                    if (!e.target.dataset.errored) {
                      e.target.dataset.errored = "1";
                      e.target.src = "https://placehold.co/200x200/f5f0ea/c4a882?text=?";
                    }
                  }}
                />
                {adding === item.image_url && (
                  <div className="search-tab__result-overlay">✂️</div>
                )}
                <span className="search-tab__result-label">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
