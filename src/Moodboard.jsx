import { useState, useRef } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_KEY;
const PIXABAY_BASE = "https://pixabay.com/api/";

// ─── Rate Limiter (max 80 requests per minute) ────────────────────────────────
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
      resolve({ width: Math.round(img.naturalWidth * scale), height: Math.round(img.naturalHeight * scale) });
    };
    img.onerror = () => resolve({ width: 220, height: 160 });
    img.src = src;
  });
}

// ─── Warm cozy design tokens ──────────────────────────────────────────────────
const colors = {
  bg: "#fdf6f0",
  bgSecondary: "#f5ede6",
  bgCard: "rgba(255,255,255,0.92)",
  border: "#e8d5c4",
  borderFocus: "#c47a45",
  text: "#3d2b1f",
  textMuted: "#a07850",
  textLight: "#c9a98a",
  accent: "#c47a45",
  accentDark: "#a05a2c",
  accentLight: "#f5e6d8",
  toolbar: "#3d2b1f",
  toolbarBorder: "#5c3d2e",
  danger: "#c0392b",
  dangerBg: "#fff5f5",
};

const btn = (variant = "primary", small = false) => ({
  padding: small ? "5px 12px" : "8px 16px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: small ? "12px" : "13px",
  transition: "all 0.15s",
  ...(variant === "primary" && {
    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`,
    color: "white",
    boxShadow: "0 2px 8px rgba(160,90,44,0.25)",
  }),
  ...(variant === "secondary" && {
    background: colors.bgSecondary,
    color: colors.text,
    border: `1px solid ${colors.border}`,
  }),
  ...(variant === "ghost" && {
    background: "transparent",
    color: colors.textMuted,
    border: `1px solid ${colors.toolbarBorder}`,
  }),
  ...(variant === "danger" && {
    background: colors.dangerBg,
    color: colors.danger,
    border: "1px solid #fac8c8",
  }),
});

const input = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "9px",
  border: `1.5px solid ${colors.border}`,
  fontSize: "13px",
  outline: "none",
  background: "#fdf8f5",
  color: colors.text,
  boxSizing: "border-box",
  fontFamily: "inherit",
};

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
    const onMove = (e) => onDrag(item.id, {
      x: snap(e.clientX - dragOffset.current.x, gridSize),
      y: snap(e.clientY - dragOffset.current.y, gridSize),
    });
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation(); e.preventDefault();
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, startW: item.width, startH: item.height, ratio: item.width / item.height };
    const onMove = (e) => {
      const dx = e.clientX - resizeStart.current.mouseX;
      const rawW = Math.max(60, resizeStart.current.startW + dx);
      const snappedW = snap(rawW, gridSize);
      onResize(item.id, { width: snappedW, height: Math.round(snappedW / resizeStart.current.ratio) });
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
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
        position: "absolute", left: item.x, top: item.y,
        width: item.width, height: item.height,
        cursor: "grab", userSelect: "none",
        outline: isSelected ? `2px solid ${colors.accent}` : isHovered ? `2px solid ${colors.textLight}` : "2px solid transparent",
        borderRadius: "8px",
        boxShadow: isSelected ? `0 4px 20px rgba(196,122,69,0.3)` : isHovered ? "0 4px 14px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.1)",
        transition: "outline 0.12s, box-shadow 0.12s",
        zIndex: isSelected ? 50 : isHovered ? 40 : 10,
      }}
    >
      <img src={item.src} alt={item.label || "furniture"} draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "8px", display: "block", pointerEvents: "none" }}
      />
      {item.label && showControls && (
        <div style={{
          position: "absolute", bottom: -22, left: 0, right: 0,
          textAlign: "center", fontSize: "11px", color: colors.text,
          background: "rgba(255,255,255,0.9)", borderRadius: "4px",
          padding: "1px 6px", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          border: `1px solid ${colors.border}`,
        }}>{item.label}</div>
      )}
      {showControls && (
        <div data-delete="true" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          style={{
            position: "absolute", top: -10, right: -10,
            width: 22, height: 22, background: colors.danger,
            color: "white", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: "700", cursor: "pointer", zIndex: 60,
            opacity: isSelected ? 1 : 0.8, boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >×</div>
      )}
      {showControls && (
        <div data-handle="true" onMouseDown={handleResizeMouseDown}
          style={{
            position: "absolute", bottom: -6, right: -6,
            width: 14, height: 14, background: "white",
            border: `2px solid ${isSelected ? colors.accent : colors.textLight}`,
            borderRadius: "4px", cursor: "nwse-resize", zIndex: 60,
            opacity: isSelected ? 1 : 0.8,
          }}
        />
      )}
    </div>
  );
}

// ─── Draggable Grid Control ───────────────────────────────────────────────────
function DraggableGridControl({ gridSize, onChange }) {
  const trackRef = useRef(null);
  const MAX = 80;

  const handleMouseDown = (e) => {
    e.preventDefault();
    updateFromMouse(e);
    const onMove = (e) => updateFromMouse(e);
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const updateFromMouse = (e) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const raw = Math.round(ratio * MAX);
    onChange(raw < 4 ? 0 : Math.round(raw / 4) * 4);
  };

  const pct = (gridSize / MAX) * 100;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ color: colors.textLight, fontSize: "12px", whiteSpace: "nowrap" }}>Grid</span>
      <div ref={trackRef} onMouseDown={handleMouseDown}
        style={{ position: "relative", width: "90px", height: "5px", background: "rgba(255,255,255,0.15)", borderRadius: "3px", cursor: "pointer" }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: pct + "%", height: "100%", background: gridSize > 0 ? colors.accent : "rgba(255,255,255,0.3)", borderRadius: "3px" }} />
        <div style={{
          position: "absolute", left: `calc(${pct}% - 7px)`, top: "50%", transform: "translateY(-50%)",
          width: "14px", height: "14px", background: "white",
          border: `2px solid ${gridSize > 0 ? colors.accent : "rgba(255,255,255,0.5)"}`,
          borderRadius: "50%", cursor: "grab", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }} />
      </div>
      <span style={{ color: colors.textLight, fontSize: "12px", minWidth: "32px" }}>
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
  const [hoveredId, setHoveredId] = useState(null);

  const search = async (q = query, p = 1) => {
    if (!q.trim()) return;
    if (!rateLimiter.canRequest()) { setError("Rate limit reached. Please wait a moment."); return; }
    setRemaining(rateLimiter.remaining());
    setLoading(true); setError(""); setResults([]);
    try {
      const url = `${PIXABAY_BASE}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=20&page=${p}&safesearch=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.hits || []);
      setTotalPages(Math.ceil((data.totalHits || 0) / 20));
      setPage(p);
    } catch {
      setError("Search failed. Check your API key or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input
          type="text" placeholder="Search sofa, chair, lamp..."
          value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          style={input}
          onFocus={(e) => e.target.style.border = `1.5px solid ${colors.borderFocus}`}
          onBlur={(e) => e.target.style.border = `1.5px solid ${colors.border}`}
        />
        <button onClick={() => search()} disabled={loading} style={{ ...btn("primary"), whiteSpace: "nowrap", opacity: loading ? 0.7 : 1 }}>
          {loading ? "..." : "Search"}
        </button>
      </div>

      <div style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "10px" }}>
        Requests remaining: <strong style={{ color: remaining < 20 ? "#e67e22" : colors.accent }}>{remaining}</strong> / 80
      </div>

      {error && <div style={{ color: colors.danger, fontSize: "12px", marginBottom: "8px", padding: "8px 10px", background: colors.dangerBg, borderRadius: "8px", border: "1px solid #fac8c8" }}>{error}</div>}

      <div style={{ minHeight: "260px" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "260px", color: colors.textMuted, fontSize: "13px", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "28px" }}>🔍</div>
            Searching Pixabay...
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", height: "240px", overflowY: "auto", marginBottom: "10px", paddingRight: "2px" }}>
              {results.map((img) => (
                <div
                  key={img.id}
                  onClick={() => onSelect(img.webformatURL, img.tags?.split(",")[0]?.trim() || "furniture")}
                  onMouseEnter={() => setHoveredId(img.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    cursor: "pointer", borderRadius: "8px", overflow: "hidden",
                    border: hoveredId === img.id ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`,
                    aspectRatio: "1", background: colors.bgSecondary,
                    transition: "border 0.12s, transform 0.12s",
                    transform: hoveredId === img.id ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <img src={img.previewURL} alt={img.tags} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={(e) => { e.target.src = "https://placehold.co/100x100/f5ede6/a07850?text=?"; }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "8px", alignItems: "center" }}>
              <button onClick={() => search(query, page - 1)} disabled={page <= 1 || loading} style={{ ...btn("secondary", true), opacity: page <= 1 ? 0.5 : 1 }}>← Prev</button>
              <span style={{ fontSize: "12px", color: colors.textMuted }}>Page {page} of {totalPages}</span>
              <button onClick={() => search(query, page + 1)} disabled={page >= totalPages || loading} style={{ ...btn("secondary", true), opacity: page >= totalPages ? 0.5 : 1 }}>Next →</button>
            </div>
          </>
        )}

        {!loading && results.length === 0 && !query && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "260px", gap: "10px", color: colors.textMuted }}>
            <div style={{ fontSize: "36px" }}>🔍</div>
            <div style={{ fontSize: "13px" }}>Search for furniture above</div>
            <div style={{ fontSize: "11px", color: colors.textLight }}>e.g. "sofa", "wooden chair", "lamp"</div>
          </div>
        )}

        {!loading && results.length === 0 && query && !error && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "260px", color: colors.textMuted, fontSize: "13px" }}>
            No results for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(61,43,31,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(3px)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: colors.bgCard, borderRadius: "20px",
        padding: "28px", width: wide ? "480px" : "380px",
        maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 16px 60px rgba(61,43,31,0.2), 0 4px 12px rgba(0,0,0,0.1)",
        border: `1px solid ${colors.border}`,
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <span style={{ fontWeight: "700", fontSize: "16px", color: colors.text }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: colors.textMuted, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", background: colors.bgSecondary, borderRadius: "10px", padding: "3px", gap: "3px", marginBottom: "18px" }}>
      {tabs.map(({ id, label }) => (
        <button key={id} onClick={() => onChange(id)} style={{
          flex: 1, padding: "7px 0", borderRadius: "8px", border: "none",
          cursor: "pointer", fontWeight: "600", fontSize: "12px",
          background: active === id ? "white" : "transparent",
          color: active === id ? colors.text : colors.textMuted,
          boxShadow: active === id ? "0 1px 5px rgba(139,90,60,0.12)" : "none",
          transition: "all 0.15s",
        }}>{label}</button>
      ))}
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

  return (
    <Modal title="🛋️ Add Furniture" onClose={onClose} wide>
      {removing && (
        <div style={{ background: colors.accentLight, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 14px", marginBottom: "14px", fontSize: "13px", color: colors.accentDark, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>✂️</span> Removing background — this may take a moment...
        </div>
      )}

      <TabBar
        tabs={[{ id: "search", label: "🔍 Search" }, { id: "upload", label: "📁 Upload" }, { id: "url", label: "🔗 URL" }]}
        active={tab} onChange={setTab}
      />

      {tab === "search" && <PixabaySearch onSelect={handleSelect} />}

      {tab === "upload" && (
        <div>
          <div onClick={() => fileInputRef.current.click()} style={{
            border: `2px dashed ${colors.border}`, borderRadius: "12px",
            padding: "40px 20px", textAlign: "center", cursor: "pointer",
            background: colors.accentLight, transition: "border 0.15s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.border = `2px dashed ${colors.accent}`}
            onMouseLeave={(e) => e.currentTarget.style.border = `2px dashed ${colors.border}`}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>🛋️</div>
            <div style={{ fontWeight: "600", color: colors.text, marginBottom: "4px" }}>Click to browse files</div>
            <div style={{ fontSize: "12px", color: colors.textMuted }}>PNG with transparency works best · Background removed automatically</div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: "none" }} />
        </div>
      )}

      {tab === "url" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: colors.textMuted, display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.3px" }}>Image URL</label>
            <input type="text" placeholder="https://example.com/sofa.png" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} style={input}
              onFocus={(e) => e.target.style.border = `1.5px solid ${colors.borderFocus}`}
              onBlur={(e) => e.target.style.border = `1.5px solid ${colors.border}`}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: colors.textMuted, display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.3px" }}>Label (optional)</label>
            <input type="text" placeholder="e.g. Sofa, Coffee Table" value={labelInput} onChange={(e) => setLabelInput(e.target.value)} style={input}
              onFocus={(e) => e.target.style.border = `1.5px solid ${colors.borderFocus}`}
              onBlur={(e) => e.target.style.border = `1.5px solid ${colors.border}`}
            />
          </div>
          <button onClick={() => urlInput.trim() && handleSelect(urlInput.trim(), labelInput.trim() || "Image")} style={{ ...btn("primary"), marginTop: "4px" }}>
            Add + Remove Background →
          </button>
        </div>
      )}
    </Modal>
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
    <Modal title="🏠 Set Room Background" onClose={onClose}>
      <TabBar tabs={[{ id: "upload", label: "📁 Upload" }, { id: "url", label: "🔗 URL" }]} active={tab} onChange={setTab} />

      {tab === "upload" && (
        <div>
          <div onClick={() => fileInputRef.current.click()} style={{
            border: `2px dashed ${colors.border}`, borderRadius: "12px",
            padding: "40px 20px", textAlign: "center", cursor: "pointer",
            background: colors.accentLight,
          }}
            onMouseEnter={(e) => e.currentTarget.style.border = `2px dashed ${colors.accent}`}
            onMouseLeave={(e) => e.currentTarget.style.border = `2px dashed ${colors.border}`}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>🏠</div>
            <div style={{ fontWeight: "600", color: colors.text, marginBottom: "4px" }}>Upload room photo</div>
            <div style={{ fontSize: "12px", color: colors.textMuted }}>JPG or PNG recommended</div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
        </div>
      )}

      {tab === "url" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input type="text" placeholder="https://example.com/living-room.jpg" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} style={input}
            onFocus={(e) => e.target.style.border = `1.5px solid ${colors.borderFocus}`}
            onBlur={(e) => e.target.style.border = `1.5px solid ${colors.border}`}
          />
          <button onClick={() => { if (urlInput.trim()) { onSet(urlInput.trim()); onClose(); } }} style={btn("primary")}>
            Set as Background →
          </button>
        </div>
      )}
    </Modal>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Moodboard({ initialBackground, initialItems, onBackgroundChange, onItemsChange }) {
  const [items, setItems] = useState(initialItems || []);
  const [selectedId, setSelectedId] = useState(null);
  const [gridSize, setGridSize] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const [background, setBackground] = useState(initialBackground || null);

  const updateItems = (fn) => {
    setItems((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      onItemsChange?.(next);
      return next;
    });
  };

  const updateBg = (val) => { setBackground(val); onBackgroundChange?.(val); };
  const handleDrag = (id, pos) => updateItems((prev) => prev.map((i) => i.id === id ? { ...i, ...pos } : i));
  const handleResize = (id, size) => updateItems((prev) => prev.map((i) => i.id === id ? { ...i, ...size } : i));
  const handleDelete = (id) => { updateItems((prev) => prev.filter((i) => i.id !== id)); setSelectedId(null); };

  const handleAddImage = (src, size, label) => {
    updateItems((prev) => [...prev, {
      id: nextId++, src, label,
      x: snap(60 + Math.random() * 160, gridSize || 1),
      y: snap(60 + Math.random() * 100, gridSize || 1),
      width: size.width, height: size.height,
    }]);
  };

  const showGrid = gridSize >= 4;
  const gridStyle = showGrid ? {
    backgroundImage: `linear-gradient(to right, rgba(196,122,69,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(196,122,69,0.1) 1px, transparent 1px)`,
    backgroundSize: `${gridSize}px ${gridSize}px`,
  } : {};

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Toolbar */}
      <div style={{
        padding: "10px 16px", background: colors.toolbar,
        display: "flex", alignItems: "center", gap: "10px",
        borderBottom: `1px solid ${colors.toolbarBorder}`,
        flexWrap: "wrap",
      }}>
        <button onClick={() => setShowBgModal(true)} style={btn("ghost", true)}>🏠 Set Room</button>
        <button onClick={() => setShowAddModal(true)} style={btn("primary", true)}>+ Add Furniture</button>
        {background && (
          <button onClick={() => updateBg(null)} style={{ ...btn("ghost", true), color: "#e8a87c", borderColor: "#5c3d2e" }}>✕ Clear Room</button>
        )}
        <div style={{ marginLeft: "auto" }}>
          <DraggableGridControl gridSize={gridSize} onChange={setGridSize} />
        </div>
        <span style={{ color: "#6b4a35", fontSize: "12px" }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Canvas */}
      <div
        style={{
          position: "relative", flex: 1, overflow: "hidden",
          background: background ? "transparent" : colors.bg,
          ...(!background ? {
            backgroundImage: "radial-gradient(circle, #d4b8a0 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          } : {}),
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
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "12px",
            pointerEvents: "none", zIndex: 5,
          }}>
            <div style={{ fontSize: "56px" }}>🛋️</div>
            <div style={{ fontSize: "15px", color: colors.textMuted, fontWeight: "500" }}>
              {background ? 'Click "+ Add Furniture" to start decorating' : "Start by setting a room background"}
            </div>
            <div style={{ fontSize: "12px", color: colors.textLight }}>
              Drag the grid slider to snap furniture into place
            </div>
          </div>
        )}
      </div>

      {showAddModal && <AddImageModal onClose={() => setShowAddModal(false)} onAdd={handleAddImage} />}
      {showBgModal && <SetBgModal onClose={() => setShowBgModal(false)} onSet={updateBg} />}
    </div>
  );
}
