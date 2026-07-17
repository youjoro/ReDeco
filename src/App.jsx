import { useState, useEffect, useRef, useCallback } from "react";
import Landing            from "./components/Landing/Landing";
import Auth               from "./components/Auth/Auth";
import Toolbar             from "./components/Toolbar/Toolbar";
import Sidebar             from "./components/Sidebar/Sidebar";
import Canvas               from "./components/Canvas/Canvas";
import RoomManager          from "./components/RoomManager/RoomManager";
import ShoppingListPanel    from "./components/ShoppingList/ShoppingListPanel";
import PaywallModal         from "./components/Paywall/PaywallModal";
import { ShoppingListProvider, useShoppingList } from "./context/ShoppingListContext";
import { getUser, onAuthChange, signOut, saveRoom, uploadBase64Image } from "./lib/supabase";
import { snap } from "./lib/snapGrid";
import { loadImageSize } from "./lib/imageUtils";
import "./App.css";

let nextId = 1;

// ── Auto logout config ────────────────────────────────────────────────────────
const INACTIVE_LIMIT_MS = 2 * 60 * 60 * 1000; // 2 hours
const WARN_BEFORE_MS    = 2 * 60 * 1000;       // warn 2 mins before logout
const ACTIVITY_EVENTS   = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

export default function App() {
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showRooms,   setShowRooms]   = useState(false);
  const [itemPaywall, setItemPaywall] = useState(false);
  const [currentRoom, setCurrentRoom] = useState({ id: null, name: "Untitled Room" });
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState("");
  const [background,  setBackground]  = useState(null);
  const [items,       setItems]       = useState([]);
  const [sessionWarn, setSessionWarn] = useState(false); // show warning banner
  const [view,        setView]        = useState("landing"); // "landing" | "auth"
  const [authTab,     setAuthTab]     = useState("login");   // which tab Auth opens on
  const [showShoppingList, setShowShoppingList] = useState(false);

  const logoutTimer = useRef(null);
  const warnTimer   = useRef(null);

  // ── Reset both timers on any user activity ────────────────────────────────
  const resetTimers = useCallback(() => {
    setSessionWarn(false);
    clearTimeout(logoutTimer.current);
    clearTimeout(warnTimer.current);

    // Show warning 2 mins before logout
    warnTimer.current = setTimeout(() => {
      setSessionWarn(true);
    }, INACTIVE_LIMIT_MS - WARN_BEFORE_MS);

    // Auto sign out after inactivity limit
    logoutTimer.current = setTimeout(async () => {
      setSessionWarn(false);
      await signOut();
      setUser(null);
    }, INACTIVE_LIMIT_MS);
  }, []);

  // ── Start/stop activity listeners when user logs in/out ───────────────────
  useEffect(() => {
    if (!user) {
      clearTimeout(logoutTimer.current);
      clearTimeout(warnTimer.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimers));
      return;
    }
    resetTimers();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetTimers, { passive: true }));
    return () => {
      clearTimeout(logoutTimer.current);
      clearTimeout(warnTimer.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, [user, resetTimers]);

  useEffect(() => {
    getUser()
      .then((u) => { setUser(u); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));

    const { data: { subscription } } = onAuthChange((u) => setUser(u));
    return () => subscription.unsubscribe();
  }, []);

  const FREE_ITEM_LIMIT = 50;

  // ── Add item from sidebar ──
  const handleAddItem = (src, size, label) => {
    if (items.length >= FREE_ITEM_LIMIT) {
      setItemPaywall(true);
      return;
    }
    setItems((prev) => [...prev, {
      id: nextId++, src, label,
      x: snap(80 + Math.random() * 200, 0),
      y: snap(60 + Math.random() * 120, 0),
      width: size.width, height: size.height,
    }]);
  };

  // ── Save to Supabase ──
  const handleSave = async () => {
    setSaving(true); setSaveMsg("");
    try {
      const uploadedItems = await Promise.all(items.map(async (item) => {
        if (item.src.startsWith("data:") || item.src.startsWith("blob:")) {
          try {
            const res  = await fetch(item.src);
            const blob = await res.blob();
            const url  = await uploadBase64Image(new File([blob], `item-${item.id}.png`, { type: blob.type }), "furniture");
            return { ...item, src: url };
          } catch { return item; }
        }
        return item;
      }));

      let bgUrl = background;
      if (background && (background.startsWith("data:") || background.startsWith("blob:"))) {
        try {
          const res  = await fetch(background);
          const blob = await res.blob();
          bgUrl = await uploadBase64Image(new File([blob], `bg.jpg`, { type: blob.type }), "backgrounds");
        } catch { bgUrl = background; }
      }

      const saved = await saveRoom({ id: currentRoom.id, name: currentRoom.name, background: bgUrl, items: uploadedItems });
      setCurrentRoom((p) => ({ ...p, id: saved.id }));
      setSaveMsg("✓ Saved");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch {
      setSaveMsg("Save failed");
      setTimeout(() => setSaveMsg(""), 3000);
    } finally { setSaving(false); }
  };

  const handleRename = () => {
    const name = prompt("Room name:", currentRoom.name);
    if (name?.trim()) setCurrentRoom((p) => ({ ...p, name: name.trim() }));
  };

  const handleLoadRoom = (room) => {
    setCurrentRoom({ id: room.id, name: room.name });
    setBackground(room.background || null);
    setItems(room.items || []);
    setShowRooms(false);
  };

  const handleNewRoom = () => {
    setCurrentRoom({ id: null, name: "Untitled Room" });
    setBackground(null); setItems([]);
    setShowRooms(false);
  };

  if (authLoading) return (
    <div className="app__loading">
      <div style={{ textAlign: "center" }}>
        <span className="app__loading-icon">🪴</span>
        <p className="app__loading-text">Loading…</p>
      </div>
    </div>
  );

  if (!user) {
    if (view === "landing") {
      return (
        <Landing
          onGetStarted={() => { setAuthTab("signup"); setView("auth"); }}
          onLogin={() => { setAuthTab("login"); setView("auth"); }}
        />
      );
    }
    return (
      <Auth
        initialTab={authTab}
        onAuth={() => getUser().then(setUser)}
        onBack={() => setView("landing")}
      />
    );
  }

  return (
    <ShoppingListProvider user={user}>
      <AuthenticatedApp
        user={user}
        currentRoom={currentRoom}
        saving={saving}
        saveMsg={saveMsg}
        background={background}
        items={items}
        sessionWarn={sessionWarn}
        resetTimers={resetTimers}
        showRooms={showRooms}
        showShoppingList={showShoppingList}
        setShowShoppingList={setShowShoppingList}
        setShowRooms={setShowRooms}
        setBackground={setBackground}
        setItems={setItems}
        onSave={handleSave}
        onRename={handleRename}
        onAddItem={handleAddItem}
        onLoadRoom={handleLoadRoom}
        onNewRoom={handleNewRoom}
        itemPaywall={itemPaywall}
        setItemPaywall={setItemPaywall}
      />
    </ShoppingListProvider>
  );
}

// ── Inner shell — rendered inside the ShoppingListProvider so it can read the
//    cart count/badge and pass a bound "add to list" handler down to Canvas ──
function AuthenticatedApp({
  user, currentRoom, saving, saveMsg, background, items, sessionWarn, resetTimers,
  showRooms, showShoppingList, setShowShoppingList, setShowRooms,
  setBackground, setItems, onSave, onRename, onAddItem, onLoadRoom, onNewRoom,
  itemPaywall, setItemPaywall,
}) {
  const { count, addToList } = useShoppingList();

  return (
    <div className="app">
      <Toolbar
        user={user}
        roomName={currentRoom.name}
        saving={saving}
        saveMsg={saveMsg}
        onSave={onSave}
        onRename={onRename}
        onOpenRooms={() => setShowRooms(true)}
        onOpenShoppingList={() => setShowShoppingList(true)}
        shoppingCount={count}
      />

      {sessionWarn && (
        <div className="app__session-warn">
          <span>⏳ You'll be logged out in 2 minutes due to inactivity.</span>
          <button onClick={resetTimers}>Stay logged in</button>
        </div>
      )}

      <div className="app__body">
        <Sidebar
          background={background}
          onAddItem={onAddItem}
          onSetBackground={setBackground}
          onClearBackground={() => setBackground(null)}
        />
        <Canvas
          background={background}
          items={items}
          onItemsChange={setItems}
          onBackgroundChange={setBackground}
          onAddToList={(canvasItem) => addToList(canvasItem, currentRoom.id)}
        />
      </div>

      {showRooms && (
        <RoomManager
          onClose={() => setShowRooms(false)}
          onLoad={onLoadRoom}
          onNew={onNewRoom}
        />
      )}

      {showShoppingList && (
        <ShoppingListPanel onClose={() => setShowShoppingList(false)} />
      )}

      {itemPaywall && (
        <PaywallModal
          type="items"
          count={items.length}
          onClose={() => setItemPaywall(false)}
        />
      )}
    </div>
  );
}
