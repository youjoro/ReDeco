import { useRef, useState } from "react";
import { validateImageFile } from "../../lib/security";
import "./RoomTab.css";

export default function RoomTab({ background, onSetBackground, onClearBackground }) {
  const fileRef = useRef(null);
  const [urlVal, setUrlVal] = useState("");
  const [fileError, setFileError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileError("");

    const check = await validateImageFile(file);
    if (!check.ok) {
      setFileError(check.reason);
      e.target.value = "";
      return;
    }

    const r = new FileReader();
    r.onload = (ev) => { onSetBackground(ev.target.result); };
    r.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUrl = () => {
    if (urlVal.trim()) { onSetBackground(urlVal.trim()); setUrlVal(""); }
  };

  return (
    <div className="room-tab">
      <p className="room-tab__label">Room Background</p>

      {background ? (
        <div className="room-tab__preview">
          <img src={background} alt="room" />
          <button className="room-tab__clear" onClick={onClearBackground}>✕ Clear</button>
        </div>
      ) : (
        <div className="room-tab__empty">
          <span className="room-tab__empty-icon">🏠</span>
          <span className="room-tab__empty-text">No room set</span>
        </div>
      )}

      <button className="room-tab__btn" onClick={() => { setFileError(""); fileRef.current.click(); }}>
        📁 Upload Room Photo
      </button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" onChange={handleFile} style={{ display: "none" }} />
      {fileError && <p className="room-tab__error">{fileError}</p>}

      <p className="room-tab__or">or paste a URL</p>

      <div className="room-tab__url">
        <input
          className="room-tab__url-input"
          type="text" placeholder="https://…"
          value={urlVal} onChange={(e) => setUrlVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUrl()}
        />
        <button className="room-tab__url-btn" onClick={handleUrl}>Set</button>
      </div>
    </div>
  );
}
