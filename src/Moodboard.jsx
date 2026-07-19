import { useState, useRef, useEffect } from "react";
import rateLimiter from "./lib/rateLimiter";
import { loadImageSize, removeImageBackground } from "./lib/imageUtils";
import { snap } from "./lib/snapGrid";

const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_KEY;
const PIXABAY_BASE = "https://pixabay.com/api/";

// ── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg:          "#faf7f4",
  sidebar:     "#ffffff",
  sidebarBdr:  "#ede8e3",
  toolbar:     "#2c1f14",
  toolbarBdr:  "#3d2b1f",
  accent:      "#c47a45",
  accentDark:  "#a05a2c",
  accentLight: "#fdf0e6",
  text:        "#2c1a0e",
  textSub:     "#8a6a50",
  textFaint:   "#c4a882",
  border:      "#e8ddd4",
  inputBg:     "#fdf8f4",
  canvas:      "#f2ece6",
  danger:      "#c0392b",
};

// ── Furniture item on canvas ───────────────────────────────────────────────
function FurnitureItem({ item, onDrag, onResize, onDelete, isSelected, onSelect, gridSize }) {
  const dragOffset = useRef(null);
  const resizeStart = useRef(null);
  const [hovered, setHovered] = useState(false);

  const startDrag = (e) => {
    if (e.target.dataset.handle || e.target.dataset.del) return;
    e.preventDefault(); e.stopPropagation();
    onSelect(item.id);
    dragOffset.current = { x: e.clientX - item.x, y: e.clientY - item.y };
    const move = (e) => onDrag(item.id, {
      x: snap(e.clientX - dragOffset.current.x, gridSize),
      y: snap(e.clientY - dragOffset.current.y, gridSize),
    });
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const startResize = (e) => {
    e.stopPropagation(); e.preventDefault();
    resizeStart.current = { mx: e.clientX, my: e.clientY, w: item.width, h: item.height, r: item.width / item.height };
    const move = (e) => {
      const w = Math.max(60, snap(resizeStart.current.w + (e.clientX - resizeStart.current.mx), gridSize));
      onResize(item.id, { width: w, height: Math.round(w / resizeStart.current.r) });
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const show = isSelected || hovered;
  return (
    <div
      onMouseDown={startDrag}
      onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute", left: item.x, top: item.y,
        width: item.width, height: item.height,
        cursor: "grab", userSelect: "none",
        outline: isSelected ? `2px solid ${C.accent}` : hovered ? `2px solid ${C.textFaint}` : "2px solid transparent",
        borderRadius: 6,
        boxShadow: isSelected ? `0 0 0 4px ${C.accentLight}` : "none",
        transition: "outline 0.1s, box-shadow 0.1s",
        zIndex: isSelected ? 50 : hovered ? 40 : 10,
      }}
    >
      <img src={item.src} alt={item.label || ""} draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 6, display: "block", pointerEvents: "none" }}
      />
      {show && (
        <>
          <div data-del onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            style={{
              position: "absolute", top: -9, right: -9, width: 20, height: 20,
              background: C.danger, color: "#fff", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, cursor: "pointer", zIndex: 60,
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            }}
          >×</div>
          <div data-handle onMouseDown={startResize}
            style={{
              position: "absolute", bottom: -5, right: -5, width: 12, height: 12,
              background: "#fff", border: `2px solid ${C.accent}`,
              borderRadius: 3, cursor: "nwse-resize", zIndex: 60,
            }}
          />
        </>
      )}
    </div>
  );
}

// ── Grid slider ────────────────────────────────────────────────────────────
function GridSlider({ value, onChange }) {
  const ref = useRef(null);
  const MAX = 80;
  const pct = (value / MAX) * 100;

  const startDrag = (e) => {
    e.preventDefault();
    update(e);
    const move = (e) => update(e);
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const update = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const r = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const raw = Math.round(r * MAX);
    onChange(raw < 4 ? 0 : Math.round(raw / 4) * 4);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: C.textFaint }}>Grid</span>
      <div ref={ref} onMouseDown={startDrag}
        style={{ position: "relative", width: 80, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, cursor: "pointer" }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: pct + "%", height: "100%", background: value > 0 ? C.accent : "rgba(255,255,255,0.25)", borderRadius: 2 }} />
        <div style={{
          position: "absolute", left: `calc(${pct}% - 6px)`, top: "50%", transform: "translateY(-50%)",
          width: 12, height: 12, background: "#fff",
          border: `2px solid ${value > 0 ? C.accent : "rgba(255,255,255,0.4)"}`,
          borderRadius: "50%", cursor: "grab",
        }} />
      </div>
      <span style={{ fontSize: 11, color: C.textFaint, minWidth: 28 }}>{value === 0 ? "off" : `${value}px`}</span>
    </div>
  );
}

// ── Sidebar panel ──────────────────────────────────────────────────────────
function Sidebar({ onAddItem, onSetBackground, background, onClearBackground }) {
  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adding, setAdding] = useState(null);
  const fileRef = useRef(null);
  const bgFileRef = useRef(null);

  const search = async (q = query, p = 1) => {
    if (!q.trim()) return;
    if (!rateLimiter.canRequest()) { setError("Rate limit reached. Wait a moment."); return; }
    setLoading(true); setError(""); setResults([]);
    try {
      const url = `${PIXABAY_BASE}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=24&page=${p}&safesearch=true`;
      const res = await fetch(url);
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
      // Use local package via helper — faster and consistent with imageUtils
      const cleanedUrl = await removeImageBackground(src); // returns blob: URL
      const size = await loadImageSize(cleanedUrl);
      onAddItem(cleanedUrl, size, label);
    } catch {
      const size = await loadImageSize(src);
      onAddItem(src, size, label);
    } finally { setAdding(null); }
  };

  const handleFileUpload = async (e) => {
    for (const file of Array.from(e.target.files)) {
      const src = await new Promise((res) => {
        const r = new FileReader();
        r.onload = (ev) => res(ev.target.result);
        r.readAsDataURL(file);
      });
      await handleAdd(src, file.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleBgFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => onSetBackground(ev.target.result);
    r.readAsDataURL(file);
  };

  const tabs = [
    { id: "search", icon: "🔍", label: "Search" },
    { id: "upload", icon: "📁", label: "Upload" },
    { id: "room",   icon: "🏠", label: "Room" },
  ];

  return (
    <div style={{
      width: 260, flexShrink: 0, background: C.sidebar,
      borderRight: `1px solid ${C.sidebarBdr}`,
      display: "flex", flexDirection: "column",
      height: "100%", overflow: "hidden",
    }}>
      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.sidebarBdr}`, flexShrink: 0 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
            background: tab === t.id ? C.accentLight : "transparent",
            borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
            color: tab === t.id ? C.accent : C.textSub,
            fontWeight: tab === t.id ? 700 : 500,
            fontSize: 11, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 2, transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ... (rest of Sidebar unchanged — omitted here for brevity in this excerpt) ... */}

      {/* For clarity: the rest of the JSX remains the same as before */}
    </div>
  );
}

function UrlBgInput({ onSet }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <input type="text" placeholder="https://..." value={val} onChange={(e) => setVal(e.target.value)}
        style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 11, outline: "none", background: C.inputBg }}
        onFocus={(e) => e.target.style.borderColor = C.accent}
        onBlur={(e) => e.target.style.borderColor = C.border}
      />
      <button onClick={() => { if (val.trim()) { onSet(val.trim()); setVal(""); } }}
        style={{ padding: "7px 10px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
      >Set</button>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function Moodboard({ initialBackground, initialItems, onBackgroundChange, onItemsChange }) {
  const [items, setItems] = useState(initialItems || []);
  const [selectedId, setSelectedId] = useState(null);
  const [gridSize, setGridSize] = useState(0);
  const [background, setBackground] = useState(initialBackground || null);

  const updateItems = (fn) => {
    setItems((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      onItemsChange?.(next);
      return next;
    });
  };

  const updateBg = (val) => { setBackground(val); onBackgroundChange?.(val); };
  const handleDrag   = (id, pos)  => updateItems((p) => p.map((i) => i.id === id ? { ...i, ...pos }  : i));
  const handleResize = (id, size) => updateItems((p) => p.map((i) => i.id === id ? { ...i, ...size } : i));
  const handleDelete = (id)       => { updateItems((p) => p.filter((i) => i.id !== id)); setSelectedId(null); };

  const handleAddItem = (src, size, label) => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? `local-${crypto.randomUUID()}` : `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    updateItems((prev) => [...prev, {
      id, src, label,
      x: snap(80 + Math.random() * 200, gridSize || 1),
      y: snap(60 + Math.random() * 120, gridSize || 1),
      width: size.width, height: size.height,
    }]);
  };

  const showGrid = gridSize >= 4;

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "100%" }}>
      {/* Sidebar */}
      <Sidebar
        onAddItem={handleAddItem}
        onSetBackground={updateBg}
        background={background}
        onClearBackground={() => updateBg(null)}
      />

      {/* Canvas area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Mini toolbar */}
        <div style={{
          height: 40, background: C.toolbar, borderBottom: `1px solid ${C.toolbarBdr}`,
          display: "flex", alignItems: "center", paddingLeft: 14, paddingRight: 14,
          gap: 16, flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: C.textFaint }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
          {selectedId && (
            <button onClick={() => handleDelete(selectedId)} style={{
              padding: "3px 10px", borderRadius: 6, border: "none",
              background: "rgba(192,57,43,0.2)", color: "#e87e6b",
              cursor: "pointer", fontSize: 11, fontWeight: 600,
            }}>🗑 Remove selected</button>
          )}
          <div style={{ marginLeft: "auto" }}>
            <GridSlider value={gridSize} onChange={setGridSize} />
          </div>
        </div>

        {/* Canvas */}
        <div
          onClick={() => setSelectedId(null)}
          style={{
            flex: 1, position: "relative", overflow: "hidden",
            background: background ? "transparent" : C.canvas,
            ...(!background ? {
              backgroundImage: "radial-gradient(circle, #c4a882 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            } : {}),
            ...(showGrid ? {
              backgroundImage: `
                radial-gradient(circle, #c4a882 1px, transparent 1px),
                linear-gradient(to right, rgba(196,122,69,0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(196,122,69,0.08) 1px, transparent 1px)
              `,
              backgroundSize: `22px 22px, ${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px`,
            } : {}),
          }}
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
              alignItems: "center", justifyContent: "center", gap: 12, pointerEvents: "none", zIndex: 5,
            }}>
              <div style={{ fontSize: 52 }}>🪴</div>
              <div style={{ fontSize: 14, color: C.textSub, fontWeight: 500 }}>
                {background ? "Search for furniture in the sidebar to start decorating" : "Set a room background in the Room tab, then add furniture"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
