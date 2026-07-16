import { useRef, useState } from "react";
import { loadImageSize, removeImageBackground } from "../../lib/imageUtils";
import "./UploadTab.css";

export default function UploadTab({ onAddItem }) {
  const fileRef = useRef(null);
  const [adding, setAdding] = useState(false);

  const handleFiles = async (e) => {
    setAdding(true);
    for (const file of Array.from(e.target.files)) {
      const src = await new Promise((res) => {
        const r = new FileReader();
        r.onload = (ev) => res(ev.target.result);
        r.readAsDataURL(file);
      });
      try {
        const cleaned = await removeImageBackground(src);
        const size    = await loadImageSize(cleaned);
        onAddItem(cleaned, size, file.name.replace(/\.[^.]+$/, ""));
      } catch {
        const size = await loadImageSize(src);
        onAddItem(src, size, file.name.replace(/\.[^.]+$/, ""));
      }
    }
    setAdding(false);
    e.target.value = "";
  };

  return (
    <div className="upload-tab">
      <p className="upload-tab__label">Upload Furniture Image</p>

      <div className="upload-tab__drop" onClick={() => fileRef.current.click()}>
        <div className="upload-tab__drop-icon">🛋️</div>
        <div className="upload-tab__drop-title">Click to browse files</div>
        <div className="upload-tab__drop-sub">Background removed automatically · PNG works best</div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />

      {adding && (
        <div className="upload-tab__notice">
          <span>✂️</span> Removing background…
        </div>
      )}
    </div>
  );
}
