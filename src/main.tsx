import { createRoot } from 'react-dom/client';
import App from './App'
import { StrictMode } from 'react'
import { useState, useRef, useCallback } from "react";

// ─── Config ──────────────────────────────────────────────────────────────────
const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_KEY; // Replace with your key
const PIXABAY_BASE = "https://pixabay.com/api/";

// ─── Rate Limiter (max 80 requests per minute) ───────────────────────────────
const rateLimiter = {
  requests: [],
  canRequest() {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < 60000);
    if (this.requests.length >= 80) return false;
    this.requests.push(now);
    return true;
  },
  remaining() {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < 60000);
    return 80 - this.requests.length;
  },
};

let nextId = 1;

function snap(val, grid) {
  if (!grid) return val;
  return Math.round(val / grid) * grid;
}

function loadImageSize(src, maxW = 220) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(1, maxW / img.naturalWidth);
      resolve({
        width: Math.round(img.naturalWidth * scale),
        height: Math.round(img.naturalHeight * scale),
      });
    };
    img.onerror = () => resolve({ width: 220, height: 160 });
    img.src = src;
  });
}

// ─── Furniture Item ───────────────────────────────────────────────────────────
function FurnitureItem({ item, onDrag, onResize, onDelete, isSelected, onSelect, gridSize }) {
  const dragOffset = useRef(null);
  const resizeStart = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleDragMouseDown = (e) => {
    if (e.target.dataset.handle || e.target.dataset.delete) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(item.id);
    dragOffset.current = { x: e.clientX - item.x, y: e.clientY - item.y };
    const onMove = (e) => {
      onDrag(item.id, {
        x: snap(e.clientX - dragOffset.current.x, gridSize),
        y: snap(e.clientY - dragOffset.current.y, gridSize),
      });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    resizeStart.current = {
      mouseX: e.clientX, mouseY: e.clientY,
      startW: item.width, startH: item.height,
      ratio: item.width / item.height,
    };
    const onMove = (e) => {
      const dx = e.clientX - resizeStart.current.mouseX;
      const rawW = Math.max(60, resizeStart.current.startW + dx);
      const snappedW = snap(rawW, gridSize);
      const snappedH = Math.round(snappedW / resizeStart.current.ratio);
      onResize(item.id, { width: snappedW, height: snappedH });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const showControls = isSelected || isHovered;

  return (
    <div
      onMouseDown={handleDragMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "absolute",
        left: item.x, top: item.y,
        width: item.width, height: item.height,
        cursor: "grab", userSelect: "none",
        outline: isSelected ? "2px solid #4f8ef7" : isHovered ? "2px solid rgba(79,142,247,0.4)" : "2px solid transparent",
        borderRadius: 4,
        boxShadow: isSelected ? "0 4px 16px rgba(79,142,247,0.3)" : isHovered ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.12)",
        transition: "outline 0.12s, box-shadow 0.12s",
        zIndex: isSelected ? 50 : isHovered ? 40 : 10,
      }}
    >
      <img
        src={item.src} alt={item.label || "furniture"} draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 4, display: "block", pointerEvents: "none" }}
      />
      {item.label && showControls && (
        <div style={{
          position: "absolute", bottom: -22, left: 0, right: 0,
          textAlign: "center", fontSize: 11, color: "#333",
          background: "rgba(255,255,255,0.85)", borderRadius: 3, padding: "1px 4px",
          pointerEvents: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{item.label}</div>
      )}
      {showControls && (
        <div
          data-delete="true"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          style={{
            position: "absolute", top: -10, right: -10,
            width: 20, height: 20, background: "#ff4d4d", color: "white",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, cursor: "pointer", zIndex: 60,
            opacity: isSelected ? 1 : 0.7, transition: "opacity 0.12s",
          }}
        >×</div>
      )}
      {showControls && (
        <div
          data-handle="true"
          onMouseDown={handleResizeMouseDown}
          style={{
            position: "absolute", bottom: -6, right: -6,
            width: 13, height: 13, background: "white",
            border: isSelected ? "2px solid #4f8ef7" : "2px solid rgba(79,142,247,0.5)",
            borderRadius: 3, cursor: "nwse-resize", zIndex: 60,
            opacity: isSelected ? 1 : 0.7, transition: "opacity 0.12s",
          }}
        />
      )}
    </div>
  );
}

// ─── Draggable Grid Control ───────────────────────────────────────────────────
function DraggableGridControl({ gridSize, onChange }) {
  const trackRef = useRef(null);
  const MIN = 0, MAX = 80;

  const handleMouseDown = (e) => {
    e.preventDefault();
    updateFromMouse(e);
    const onMove = (e) => updateFromMouse(e);
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const updateFromMouse = (e) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const raw = Math.round(ratio * MAX);
    const snapped = raw < 4 ? 0 : Math.round(raw / 4) * 4;
    onChange(snapped);
  };

  const pct = (gridSize / MAX) * 100;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: "#aaa", fontSize: 12, whiteSpace: "nowrap" }}>Grid</span>
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        style={{ position: "relative", width: 100, height: 6, background: "#0f3460", borderRadius: 3, cursor: "pointer" }}
      >
        <div style={{
          position: "absolute", left: 0, top: 0,
          width: pct + "%", height: "100%",
          background: gridSize > 0 ? "#4f8ef7" : "#555",
          borderRadius: 3, transition: "background 0.15s",
        }} />
        <div style={{
          position: "absolute", left: `calc(${pct}% - 7px)`, top: "50%",
          transform: "translateY(-50%)", width: 14, height: 14,
          background: "white", border: "2px solid #4f8ef7",
          borderRadius: "50%", cursor: "grab",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </div>
      <span style={{ color: "#ccc", fontSize: 12, minWidth: 36 }}>
        {gridSize === 0 ? "off" : `${gridSize}px`}
      </span>
    </div>
  );
}

// ─── Pixabay Search ───────────────────────────────────────────────────────────
function PixabaySearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [remaining, setRemaining] = useState(rateLimiter.remaining());

  const search = async (q = query, p = 1) => {
    if (!q.trim()) return;
    if (!rateLimiter.canRequest()) {
      setError("Rate limit reached (80/min). Please wait a moment.");
      return;
    }
    setRemaining(rateLimiter.remaining());
    setLoading(true);
    setError("");
    try {
      const url = `${PIXABAY_BASE}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=20&page=${p}&safesearch=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.hits || []);
      setTotalPages(Math.ceil((data.totalHits || 0) / 20));
      setPage(p);
    } catch (err) {
      setError("Search failed. Check your API key or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Search bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search furniture, sofa, chair..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 6,
            border: "1.5px solid #ddd", fontSize: 13, outline: "none",
          }}
        />
        <button
          onClick={() => search()}
          disabled={loading}
          style={{
            padding: "8px 14px", background: "#4f8ef7", color: "white",
            border: "none", borderRadius: 6, cursor: "pointer",
            fontSize: 13, fontWeight: 500, opacity: loading ? 0.6 : 1,
          }}
        >{loading ? "..." : "Search"}</button>
      </div>

      {/* Rate limit indicator */}
      <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>
        Requests remaining this minute: <strong style={{ color: remaining < 20 ? "#ff9900" : "#4f8ef7" }}>{remaining}</strong> / 80
      </div>

      {error && <div style={{ color: "#ff4d4d", fontSize: 12, marginBottom: 8 }}>{error}</div>}

      {/* Results grid */}
      {results.length > 0 && (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6, maxHeight: 280, overflowY: "auto",
            marginBottom: 10,
          }}>
            {results.map((img) => (
              <div
                key={img.id}
                onClick={() => onSelect(img.webformatURL, img.tags?.split(",")[0] || "furniture")}
                style={{
                  cursor: "pointer", borderRadius: 6, overflow: "hidden",
                  border: "2px solid transparent", transition: "border 0.12s",
                  aspectRatio: "1",
                }}
                onMouseEnter={(e) => e.currentTarget.style.border = "2px solid #4f8ef7"}
                onMouseLeave={(e) => e.currentTarget.style.border = "2px solid transparent"}
              >
                <img
                  src={img.previewURL} alt={img.tags}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => search(query, page - 1)}
              disabled={page <= 1 || loading}
              style={{
                padding: "5px 12px", borderRadius: 5, border: "none",
                background: page <= 1 ? "#eee" : "#4f8ef7", color: page <= 1 ? "#aaa" : "white",
                cursor: page <= 1 ? "default" : "pointer", fontSize: 12,
              }}
            >← Prev</button>
            <span style={{ fontSize: 12, color: "#888" }}>Page {page} of {totalPages}</span>
            <button
              onClick={() => search(query, page + 1)}
              disabled={page >= totalPages || loading}
              style={{
                padding: "5px 12px", borderRadius: 5, border: "none",
                background: page >= totalPages ? "#eee" : "#4f8ef7",
                color: page >= totalPages ? "#aaa" : "white",
                cursor: page >= totalPages ? "default" : "pointer", fontSize: 12,
              }}
            >Next →</button>
          </div>
        </>
      )}

      {results.length === 0 && !loading && query && !error && (
        <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: "20px 0" }}>
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}

// ─── Add Image Modal ──────────────────────────────────────────────────────────
function AddImageModal({ onClose, onAdd }) {
  const [tab, setTab] = useState("search");
  const [urlInput, setUrlInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef(null);

  const handleSelect = async (src, label = "furniture") => {
    setRemoving(true);
    try {
      const { removeBackground } = await import("https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/+esm");
      const blob = await removeBackground(src);
      const url = URL.createObjectURL(blob);
      const size = await loadImageSize(url);
      onAdd(url, size, label);
    } catch {
      // fallback — use original image if bg removal fails
      const size = await loadImageSize(src);
      onAdd(src, size, label);
    } finally {
      setRemoving(false);
      onClose();
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const src = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (ev) => res(ev.target.result);
        reader.readAsDataURL(file);
      });
      await handleSelect(src, file.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleUrlAdd = async () => {
    if (!urlInput.trim()) return;
    await handleSelect(urlInput.trim(), labelInput.trim() || "Image");
  };

  const tabs = ["search", "upload", "url"];
  const tabLabels = { search: "🔍 Search", upload: "📁 Upload", url: "🔗 URL" };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 12, padding: 24,
          width: 440, maxHeight: "85vh", overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Add Furniture</span>
          <span onClick={onClose} style={{ cursor: "pointer", fontSize: 20, color: "#aaa" }}>×</span>
        </div>

        {removing && (
          <div style={{
            background: "#f0f7ff", border: "1px solid #c0d8ff",
            borderRadius: 8, padding: "10px 14px", marginBottom: 14,
            fontSize: 13, color: "#4f8ef7", display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>✂️</span> Removing background... this may take a moment.
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "7px 0", borderRadius: 6, border: "none",
              cursor: "pointer", fontWeight: 500, fontSize: 12,
              background: tab === t ? "#4f8ef7" : "#f0f0f0",
              color: tab === t ? "white" : "#555",
            }}>{tabLabels[t]}</button>
          ))}
        </div>

        {tab === "search" && (
          <PixabaySearch onSelect={handleSelect} />
        )}

        {tab === "upload" && (
          <div>
            <div
              onClick={() => fileInputRef.current.click()}
              style={{
                border: "2px dashed #c0d0f0", borderRadius: 8,
                padding: "32px 16px", textAlign: "center",
                cursor: "pointer", background: "#f8faff",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>🛋️</div>
              <div style={{ fontWeight: 500, color: "#555", marginBottom: 4 }}>Click to browse files</div>
              <div style={{ fontSize: 12, color: "#aaa" }}>Background will be removed automatically</div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: "none" }} />
          </div>
        )}

        {tab === "url" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              type="text" placeholder="https://example.com/sofa.png"
              value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 6, border: "1.5px solid #ddd", fontSize: 13, outline: "none" }}
            />
            <input
              type="text" placeholder="Label (e.g. Sofa)"
              value={labelInput} onChange={(e) => setLabelInput(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 6, border: "1.5px solid #ddd", fontSize: 13, outline: "none" }}
            />
            <button onClick={handleUrlAdd} style={{
              padding: "9px 0", background: "#4f8ef7", color: "white",
              border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500, fontSize: 13,
            }}>Add + Remove Background</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Set Background Modal ─────────────────────────────────────────────────────
function SetBgModal({ onClose, onSet }) {
  const [tab, setTab] = useState("upload");
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { onSet(ev.target.result); onClose(); };
    reader.readAsDataURL(file);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 12, padding: 24, width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Set Room Background</span>
          <span onClick={onClose} style={{ cursor: "pointer", fontSize: 20, color: "#aaa" }}>×</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["upload", "url"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "7px 0", borderRadius: 6, border: "none",
              cursor: "pointer", fontWeight: 500, fontSize: 13,
              background: tab === t ? "#4f8ef7" : "#f0f0f0",
              color: tab === t ? "white" : "#555",
            }}>{t === "upload" ? "📁 Upload" : "🔗 URL"}</button>
          ))}
        </div>
        {tab === "upload" && (
          <div>
            <div onClick={() => fileInputRef.current.click()} style={{ border: "2px dashed #c0d0f0", borderRadius: 8, padding: "32px 16px", textAlign: "center", cursor: "pointer", background: "#f8faff" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏠</div>
              <div style={{ fontWeight: 500, color: "#555", marginBottom: 4 }}>Upload room photo</div>
              <div style={{ fontSize: 12, color: "#aaa" }}>JPG or PNG recommended</div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </div>
        )}
        {tab === "url" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input type="text" placeholder="https://example.com/living-room.jpg" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 6, border: "1.5px solid #ddd", fontSize: 13, outline: "none" }} />
            <button onClick={() => { if (urlInput.trim()) { onSet(urlInput.trim()); onClose(); } }}
              style={{ padding: "9px 0", background: "#4f8ef7", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500, fontSize: 13 }}>
              Set as Background
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Moodboard() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [gridSize, setGridSize] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const [background, setBackground] = useState(null);

  const handleDrag = (id, pos) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...pos } : i));
  const handleResize = (id, size) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...size } : i));
  const handleDelete = (id) => { setItems((prev) => prev.filter((i) => i.id !== id)); setSelectedId(null); };

  const handleAddImage = (src, size, label) => {
    setItems((prev) => [...prev, {
      id: nextId++, src, label,
      x: snap(60 + Math.random() * 160, gridSize || 1),
      y: snap(60 + Math.random() * 100, gridSize || 1),
      width: size.width, height: size.height,
    }]);
  };

  const showGrid = gridSize >= 4;
  const gridStyle = showGrid ? {
    backgroundImage: `linear-gradient(to right, rgba(79,142,247,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(79,142,247,0.15) 1px, transparent 1px)`,
    backgroundSize: `${gridSize}px ${gridSize}px`,
  } : {};

  return (
    <div style={{ fontFamily: "sans-serif", height: "100vh", display: "flex", flexDirection: "column", background: "#1a1a2e" }}>
      {/* Toolbar */}
      <div style={{ padding: "10px 16px", background: "#16213e", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #0f3460", flexWrap: "wrap" }}>
        <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>🛋️ Room Planner</span>
        <button onClick={() => setShowBgModal(true)} style={{ background: "#0f3460", color: "#ccc", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>🏠 Set Room</button>
        <button onClick={() => setShowAddModal(true)} style={{ background: "#4f8ef7", color: "white", border: "none", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>+ Add Furniture</button>
        {background && (
          <button onClick={() => setBackground(null)} style={{ background: "transparent", color: "#888", border: "1px solid #333", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>✕ Clear Room</button>
        )}
        <div style={{ marginLeft: "auto" }}>
          <DraggableGridControl gridSize={gridSize} onChange={setGridSize} />
        </div>
        <span style={{ color: "#555", fontSize: 12 }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Canvas */}
      <div
        style={{
          position: "relative", flex: 1, overflow: "hidden",
          background: background ? "transparent" : "#f7f7f5",
          ...(!background ? { backgroundImage: "radial-gradient(circle, #ccc 1px, transparent 1px)", backgroundSize: "24px 24px" } : {}),
          ...gridStyle,
        }}
        onClick={() => setSelectedId(null)}
      >
        {background && (
          <img src={background} alt="room" draggable={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", zIndex: 0 }}
          />
        )}
        {items.map((item) => (
          <FurnitureItem
            key={item.id} item={item}
            onDrag={handleDrag} onResize={handleResize} onDelete={handleDelete}
            isSelected={selectedId === item.id} onSelect={setSelectedId} gridSize={gridSize}
          />
        ))}
        {items.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#aaa", fontSize: 14, pointerEvents: "none", zIndex: 5 }}>
            <div style={{ fontSize: 48 }}>🛋️</div>
            <div>{background ? 'Click "+ Add Furniture" to place items' : "Set a room background, then add furniture"}</div>
            <div style={{ fontSize: 12, color: "#888" }}>Drag the grid slider to snap furniture to a grid</div>
          </div>
        )}
      </div>

      {showAddModal && <AddImageModal onClose={() => setShowAddModal(false)} onAdd={handleAddImage} />}
      {showBgModal && <SetBgModal onClose={() => setShowBgModal(false)} onSet={setBackground} />}
    </div>
  );
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
