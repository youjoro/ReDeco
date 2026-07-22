import { useState, useMemo } from "react";
import { FURNITURE_FIXTURES } from "../../lib/furnitureFixtures";
import { loadImageSize, removeImageBackground } from "../../lib/imageUtils";
import "./SearchTab.css";

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
