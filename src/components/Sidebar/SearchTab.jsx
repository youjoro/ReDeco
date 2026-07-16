import { useState } from "react";
import rateLimiter from "../../lib/rateLimiter";
import { loadImageSize, removeImageBackground } from "../../lib/imageUtils";
import "./SearchTab.css";

const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_KEY;
const PIXABAY_BASE    = "https://pixabay.com/api/";

export default function SearchTab({ onAddItem }) {
  const [query,      setQuery]      = useState("");
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adding,     setAdding]     = useState(null);
  const [remaining,  setRemaining]  = useState(rateLimiter.remaining());

  const search = async (q = query, p = 1) => {
    if (!q.trim()) return;
    if (!rateLimiter.canRequest()) { setError("Rate limit reached. Wait a moment."); return; }
    setRemaining(rateLimiter.remaining());
    setLoading(true); setError(""); setResults([]);
    try {
      const url  = `${PIXABAY_BASE}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=24&page=${p}&safesearch=true`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.hits || []);
      setTotalPages(Math.ceil((data.totalHits || 0) / 24));
      setPage(p);
    } catch { setError("Search failed. Check your API key."); }
    finally { setLoading(false); }
  };

  const handleAdd = async (src, label) => {
    setAdding(src);
    try {
      const cleaned = await removeImageBackground(src);
      const size    = await loadImageSize(cleaned);
      onAddItem(cleaned, size, label);
    } catch {
      const size = await loadImageSize(src);
      onAddItem(src, size, label);
    } finally { setAdding(null); }
  };

  return (
    <div className="search-tab">
      {/* Search bar */}
      <div className="search-tab__bar">
        <input
          className="search-tab__input"
          type="text" placeholder="sofa, chair, lamp…"
          value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button className="search-tab__go" onClick={() => search()} disabled={loading}>
          {loading ? "…" : "↵"}
        </button>
      </div>

      <p className="search-tab__rate">
        Requests left: <strong className={remaining < 20 ? "warn" : ""}>{remaining}</strong> / 80
      </p>

      {adding && <div className="search-tab__notice search-tab__notice--removing"><span>✂️</span> Removing background…</div>}
      {error  && <div className="search-tab__notice search-tab__notice--error"   ><span>⚠️</span> {error}</div>}

      {/* Scrollable results */}
      <div className="search-tab__scroll">
        {loading && (
          <div className="search-tab__empty">
            <span className="search-tab__empty-icon">🔍</span>
            <span className="search-tab__empty-text">Searching Pixabay…</span>
          </div>
        )}

        {!loading && results.length === 0 && !query && (
          <div className="search-tab__empty">
            <span className="search-tab__empty-icon">🛋️</span>
            <span className="search-tab__empty-text">Search for furniture to add to your room</span>
          </div>
        )}

        {!loading && results.length === 0 && query && !error && (
          <div className="search-tab__empty">
            <span className="search-tab__empty-text">No results for "{query}"</span>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="search-tab__grid">
            {results.map((img) => (
              <div
                key={img.id}
                className={`search-tab__result${adding === img.webformatURL ? " search-tab__result--adding" : ""}`}
                onClick={() => !adding && handleAdd(img.webformatURL, img.tags?.split(",")[0]?.trim() || "furniture")}
              >
                <img
                  src={img.previewURL} alt={img.tags} loading="lazy"
                  onError={(e) => { e.target.src = "https://placehold.co/120x120/fdf0e6/c4a882?text=?"; }}
                />
                {adding === img.webformatURL && <div className="search-tab__result-overlay">✂️</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {results.length > 0 && (
        <div className="search-tab__pagination">
          <button className="search-tab__page-btn" onClick={() => search(query, page - 1)} disabled={page <= 1 || loading}>← Prev</button>
          <span className="search-tab__page-info">{page} / {totalPages}</span>
          <button className="search-tab__page-btn" onClick={() => search(query, page + 1)} disabled={page >= totalPages || loading}>Next →</button>
        </div>
      )}
    </div>
  );
}
