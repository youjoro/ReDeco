import { useRef } from "react";
import { useWindowDrag } from "../../hooks/useWindowDrag";
import "./GridSlider.css";

const MAX = 80;

export default function GridSlider({ value, onChange }) {
  const trackRef = useRef(null);
  const pct = (value / MAX) * 100;
  const { startMouse } = useWindowDrag();

  const startDrag = (e) => {
    e.preventDefault();
    update(e);
    startMouse((e) => update(e));
  };

  const update = (e) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const raw   = Math.round(ratio * MAX);
    onChange(raw < 4 ? 0 : Math.round(raw / 4) * 4);
  };

  return (
    <div className="grid-slider">
      <span className="grid-slider__label">Grid</span>
      <div className="grid-slider__track" ref={trackRef} onMouseDown={startDrag}>
        <div className={`grid-slider__fill${value > 0 ? " grid-slider__fill--active" : ""}`} style={{ width: pct + "%" }} />
        <div className={`grid-slider__thumb${value > 0 ? " grid-slider__thumb--active" : ""}`} style={{ left: pct + "%" }} />
      </div>
      <span className="grid-slider__value">{value === 0 ? "off" : `${value}px`}</span>
    </div>
  );
}
