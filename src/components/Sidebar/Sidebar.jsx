import { useState } from "react";
import SearchTab from "./SearchTab";
import UploadTab from "./UploadTab";
import RoomTab   from "./RoomTab";
import "./Sidebar.css";

const TABS = [
  { id: "search", icon: "🔍", label: "Search" },
  { id: "upload", icon: "📁", label: "Upload" },
  { id: "room",   icon: "🏠", label: "Room"   },
];

export default function Sidebar({ background, onAddItem, onSetBackground, onClearBackground }) {
  const [tab,    setTab]    = useState("search");
  const [panelOpen, setPanelOpen] = useState(false);

  const handleTabClick = (id) => {
    if (tab === id) {
      // tapping same tab toggles panel on mobile
      setPanelOpen((prev) => !prev);
    } else {
      setTab(id);
      setPanelOpen(true);
    }
  };

  return (
    <div className="sidebar">
      {/* Tab bar */}
      <div className="sidebar__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`sidebar__tab${tab === t.id ? " active" : ""}`}
            onClick={() => handleTabClick(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel — "open" class controls mobile slide-up */}
      <div className={`sidebar__panel${panelOpen ? " open" : ""}`}>
        {tab === "search" && <SearchTab onAddItem={(src, size, label) => { onAddItem(src, size, label); setPanelOpen(false); }} onDragStart={() => setPanelOpen(false)} />}
        {tab === "upload" && <UploadTab onAddItem={(src, size, label) => { onAddItem(src, size, label); setPanelOpen(false); }} />}
        {tab === "room"   && <RoomTab   background={background} onSetBackground={onSetBackground} onClearBackground={onClearBackground} />}
      </div>
    </div>
  );
}
