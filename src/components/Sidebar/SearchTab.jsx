import { useState, useMemo } from "react";
import { FURNITURE_FIXTURES } from "../../lib/furnitureFixtures";
import { loadImageSize, removeImageBackground } from "../../lib/imageUtils";
import "./SearchTab.css";

// Touch-drag helper — attaches non-passive move/end listeners imperatively so
// we can call preventDefault() and suppress the following click on drags.
function startTouchDrag(e, item) {
  const t0 = e.touches[0];
  const startX = t0.clientX;
  const startY = t0.clientY;

  // Ghost image that follows the finger
  const ghost = document.createElement("div");
  ghost.style.cssText = [
    "position:fixed",
    `left:${startX}px`,
    `top:${startY}px`,
    "width:80px",
    "height:80px",
    "transform:translate(-50%,-50%)",
    "pointer-events:none",
    "z-index:9999",
    "border-radius:10px",
    "overflow:hidden",
    "box-shadow:0 8px 28px rgba(0,0,0,0.35)",
    "opacity:0.88",
    "transition:none",
  ].join(";");
  const img = document.createElement("img");
  img.src = item.image_url;
  img.style.cssText = "width:100%;height:100%;object-fit:contain;display:block;";
  ghost.appendChild(img);
  document.body.appendChild(ghost);

  let dragging = false;

  const onMove = (ev) => {
    const t = ev.touches[0];
    const dist = Math.hypot(t.clientX - startX, t.clientY - startY);
    if (dist > 6) {
      dragging = true;
      ev.preventDefault(); // stop the sidebar from scrolling
    }
    ghost.style.left = `${t.clientX}px`;
    ghost.style.top  = `${t.clientY}px`;
  };

  const cleanup = () => {
    document.removeEventListener("touchmove",   onMove,   { passive: false });
    document.removeEventListener("touchend",    onEnd);
    document.removeEventListener("touchcancel", onCancel);
    if (ghost.parentNode) document.body.removeChild(ghost);
  };

  const onEnd = (ev) => {
    cleanup();
    if (!dragging) return; // short tap → let onClick fire normally
    ev.preventDefault(); // suppress the click that would follow
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

export default function SearchTab({ onAddItem }) {
  const [query,   setQuery]   = useState("");
  const [adding,  setAdding]  = useState(null);
  const [error,   setError]   = useState("");

  // Filter the fixture catalogue by the current query.
  // Empty query → show everything.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FURNITURE_FIXTURES;
    return FURNITURE_FIXTURES.filter((item) => {
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.tags.some((t) => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [query]);

  const handleAdd = async (src, label) => {
    setAdding(src);
    setError("");
    try {
      const cleaned = await removeImageBackground(src);
      const size    = await loadImageSize(cleaned);
      onAddItem(cleaned, size, label);
    } catch {
      try {
        const size = await loadImageSize(src);
        onAddItem(src, size, label);
      } catch {
        setError("Couldn't load that image. Try a different one.");
      }
    } finally { setAdding(null); }
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

      {/* Status row */}
      <p className="search-tab__count">
        {query
          ? <><strong>{results.length}</strong> result{results.length !== 1 ? "s" : ""} for "<em>{query}</em>"</>
          : <><strong>{results.length}</strong> items — tap or drag to place</>
        }
      </p>

      {adding && (
        <div className="search-tab__notice search-tab__notice--removing">
          <span>✂️</span> Removing background…
        </div>
      )}
      {error && (
        <div className="search-tab__notice search-tab__notice--error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Scrollable catalogue grid */}
      <div className="search-tab__scroll">
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
                onTouchStart={(e) => !adding && startTouchDrag(e, item)}
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
