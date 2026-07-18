import { useRef, useState } from "react";
import { loadImageSize, removeImageBackground } from "../../lib/imageUtils";
import { validateImageFile } from "../../lib/security";
import "./UploadTab.css";

export default function UploadTab({ onAddItem }) {
  const fileRef = useRef(null);
  const [adding, setAdding] = useState(false);
  const [error,  setError]  = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (e) => {
    setError("");
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    if (!files.length) return;

    setAdding(true);
    for (const file of files) {
      // Validate type and size before processing
      const check = await validateImageFile(file);
      if (!check.ok) {
        setError(check.reason);
        continue;
      }

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
    setDragOver(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFiles(e);
  };

  return (
    <div className="upload-tab">
      <p className="upload-tab__label">Upload Furniture Image</p>

      <div
        className={`upload-tab__drop${dragOver ? " upload-tab__drop--over" : ""}`}
        onClick={() => fileRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-tab__drop-icon">🪴</div>
        <div className="upload-tab__drop-title">Click to browse files</div>
        <div className="upload-tab__drop-sub">Background removed automatically · PNG works best · Max 10 MB</div>
      </div>

      {/* accept is a UX hint only — real validation happens in handleFiles */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
        multiple
        onChange={handleFiles}
        style={{ display: "none" }}
      />

      {error && (
        <div className="upload-tab__notice upload-tab__notice--error">
          <span>⚠️</span> {error}
        </div>
      )}

      {adding && (
        <div className="upload-tab__notice">
          <span>✂️</span> Removing background…
        </div>
      )}
    </div>
  );
}
