import { useState, useEffect, useRef, useCallback } from "react";
import Landing            from "./components/Landing/Landing";
import Auth               from "./components/Auth/Auth";
import Toolbar            from "./components/Toolbar/Toolbar";
import Sidebar            from "./components/Sidebar/Sidebar";
import Canvas             from "./components/Canvas/Canvas";
import RoomManager        from "./components/RoomManager/RoomManager";
import ShoppingListPanel  from "./components/ShoppingList/ShoppingListPanel";
import PaywallModal       from "./components/Paywall/PaywallModal";
import { ShoppingListProvider, useShoppingList } from "./context/ShoppingListContext";
import { getUser, onAuthChange, signOut, saveRoom, uploadBase64Image } from "./lib/supabase";
import { snap } from "./lib/snapGrid";
import "./App.css";
import { nanoid } from 'nanoid';


// ── Auto logout config ────────────────────────────────────────────────────────
const INACTIVE_LIMIT_MS = 2 * 60 * 60 * 1000; // 2 hours
const WARN_BEFORE_MS    = 2 * 60 * 1000;       // warn 2 mins before logout
const ACTIVITY_EVENTS   = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

export default function App() {
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // "landing" | "auth" | "canvas"
  const [view,        setView]        = useState("landing");
  const [authTab,     setAuthTab]     = useState("login");

  // Canvas state — shared between guest and authenticated sessions
  const [showRooms,        setShowRooms]        = useState(false);
  const [itemPaywall,      setItemPaywall]      = useState(false);
  const [currentRoom,      setCurrentRoom]      = useState({ id: null, name: "Untitled Room" });
  const [saving,           setSaving]           = useState(false);
  const [saveMsg,          setSaveMsg]          = useState("");
  const [background,       setBackground]       = useState(null);
  const [items,            setItems]            = useState([]);
  const [sessionWarn,      setSessionWarn]      = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  // Guest trying a protected action → show inline auth prompt
  const [showAuthPrompt,   setShowAuthPrompt]   = useState(false);

  const logoutTimer  = useRef(null);
  const warnTimer    = useRef(null);
  const curtainTimer = useRef(null);
  const [curtain, setCurtain] = useState(false);

  // ── Animated page navigation ──────────────────────────────────────────────
  // Fades the curtain overlay in, swaps the view, then fades it back out.
  const navigateTo = useCallback((newView, tab) => {
    if (tab) setAuthTab(tab);
    setCurtain(true);
    clearTimeout(curtainTimer.current);
    curtainTimer.current = setTimeout(() => {
      setView(newView);
      // Two rAF passes ensure the new view has rendered before we fade out.
      requestAnimationFrame(() => requestAnimationFrame(() => setCurtain(false)));
    }, 300); // matches curtain-in transition duration
  }, []);

  // ── Reset both timers on any user activity ────────────────────────────────
  const resetTimers = useCallback(() => {
    setSessionWarn(false);
    clearTimeout(logoutTimer.current);
    clearTimeout(warnTimer.current);

    warnTimer.current = setTimeout(() => {
      setSessionWarn(true);
    }, INACTIVE_LIMIT_MS - WARN_BEFORE_MS);

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
      .then((u) => {
        setUser(u);
        // If already logged in on mount, go straight to canvas.
        if (u) setView("canvas");
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));

    const { data: { subscription } } = onAuthChange((u) => {
      setUser(u);
      if (u) navigateTo("canvas");
    });
    return () => subscription.unsubscribe();
  }, []);

  const FREE_ITEM_LIMIT = 50;
  const isPro = !!user?.app_metadata?.is_pro;

  // ── Add item from sidebar ──
  const handleAddItem = (src, size, label) => {
    if (!isPro && items.length >= FREE_ITEM_LIMIT) {
      setItemPaywall(true);
      return;
    }
    setItems((prev) => {
      const maxZ = prev.length > 0 ? Math.max(...prev.map((i) => i.zOrder ?? 0)) : -1;
      return [...prev, {
        id: `local-${nanoid()}`, src, label,
        x: snap(80 + Math.random() * 200, 0),
        y: snap(60 + Math.random() * 120, 0),
        width: size.width, height: size.height,
        rotation: 0,
        zOrder: maxZ + 1,
      }];
    });
  };

  // ── Save to Supabase (requires auth) ──
  const handleSave = async () => {
    if (!user) { setShowAuthPrompt(true); return; }
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

  // ── Guest triggers a protected action ────────────────────────────────────
  const handleNeedAuth = () => {
    setShowAuthPrompt(true);
  };

  const goToAuth = (tab = "login") => {
    setShowAuthPrompt(false);
    navigateTo("auth", tab);
  };

  // ── Single render tree (curtain lives here across all views) ────────────
  return (
    <>
      {/* Transition curtain — always in the DOM, fades in/out on nav */}
      <div className={`app__curtain${curtain ? " app__curtain--visible" : ""}`} />

      {authLoading ? (
        // ── Loading spinner ──
        <div className="app__loading">
          <div style={{ textAlign: "center" }}>
            <span className="app__loading-icon">🪴</span>
            <p className="app__loading-text">Loading…</p>
          </div>
        </div>

      ) : view === "landing" ? (
        // ── Landing page ──
        <Landing
          onGetStarted={() => navigateTo("canvas")}
          onLogin={() => navigateTo("auth", "login")}
        />

      ) : view === "auth" && !user ? (
        // ── Auth page ──
        <Auth
          initialTab={authTab}
          onAuth={() => getUser().then(setUser)}
          onBack={() => navigateTo("landing")}
          onTryGuest={() => navigateTo("canvas")}
        />

      ) : (
        // ── Canvas (guest or authenticated) ──
        <ShoppingListProvider user={user}>
          <CanvasApp
            user={user}
            isPro={isPro}
            currentRoom={currentRoom}
            saving={saving}
            saveMsg={saveMsg}
            background={background}
            items={items}
            sessionWarn={sessionWarn}
            resetTimers={resetTimers}
            showRooms={showRooms}
            showShoppingList={showShoppingList}
            showAuthPrompt={showAuthPrompt}
            setShowShoppingList={setShowShoppingList}
            setShowRooms={setShowRooms}
            setBackground={setBackground}
            setItems={setItems}
            onSave={handleSave}
            onRename={handleRename}
            onAddItem={handleAddItem}
            onLoadRoom={handleLoadRoom}
            onNewRoom={handleNewRoom}
            onNeedAuth={handleNeedAuth}
            onCloseAuthPrompt={() => setShowAuthPrompt(false)}
            onGoToAuth={goToAuth}
            itemPaywall={itemPaywall}
            setItemPaywall={setItemPaywall}
          />
        </ShoppingListProvider>
      )}
    </>
  );
}

// ── Inner shell — rendered inside ShoppingListProvider ───────────────────────
function CanvasApp({
  user, isPro, currentRoom, saving, saveMsg, background, items, sessionWarn, resetTimers,
  showRooms, showShoppingList, showAuthPrompt,
  setShowShoppingList, setShowRooms,
  setBackground, setItems,
  onSave, onRename, onAddItem, onLoadRoom, onNewRoom,
  onNeedAuth, onCloseAuthPrompt, onGoToAuth,
  itemPaywall, setItemPaywall,
}) {
  const { count, addToList } = useShoppingList();

  return (
    <div className="app">
      <div className="canvas-enter-toolbar">
        <Toolbar
          user={user}
          isPro={isPro}
          roomName={currentRoom.name}
          saving={saving}
          saveMsg={saveMsg}
          onSave={onSave}
          onRename={onRename}
          onOpenRooms={() => user ? setShowRooms(true) : onNeedAuth()}
          onOpenShoppingList={() => setShowShoppingList(true)}
          shoppingCount={count}
          onSignIn={onNeedAuth}
        />
      </div>

      {sessionWarn && (
        <div className="app__session-warn">
          <span>⏳ You'll be logged out in 2 minutes due to inactivity.</span>
          <button onClick={resetTimers}>Stay logged in</button>
        </div>
      )}

      <div className="app__body canvas-enter-body">
        <div className="canvas-enter-sidebar">
          <Sidebar
            background={background}
            onAddItem={onAddItem}
            onSetBackground={setBackground}
            onClearBackground={() => setBackground(null)}
          />
        </div>
        <Canvas
          background={background}
          items={items}
          onItemsChange={setItems}
          onBackgroundChange={setBackground}
          onAddToList={(canvasItem) => addToList(canvasItem, currentRoom.id)}
        />
      </div>

      {showRooms && user && (
        <RoomManager
          isPro={isPro}
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

      {/* Auth prompt for guests trying protected actions */}
      {showAuthPrompt && (
        <div className="app__auth-prompt-overlay" onClick={onCloseAuthPrompt}>
          <div className="app__auth-prompt" onClick={(e) => e.stopPropagation()}>
            <button className="app__auth-prompt-close" onClick={onCloseAuthPrompt}>×</button>
            <span className="app__auth-prompt-icon">🔐</span>
            <h3 className="app__auth-prompt-title">Sign in to save your work</h3>
            <p className="app__auth-prompt-sub">
              Your moodboard is safe while you browse. Create a free account to save rooms and access them anywhere.
            </p>
            <div className="app__auth-prompt-actions">
              <button className="app__auth-prompt-primary" onClick={() => onGoToAuth("signup")}>
                Create free account
              </button>
              <button className="app__auth-prompt-ghost" onClick={() => onGoToAuth("login")}>
                I have an account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
