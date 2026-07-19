import { useRef, useEffect } from 'react';

/**
 * useWindowDrag
 *
 * Manages window-level mouse and touch drag listeners with automatic unmount
 * cleanup. Eliminates the repeated track/untrack/useEffect boilerplate across
 * every drag, resize, and rotate handler in the app.
 *
 * Usage:
 *   const { startMouse, startTouch } = useWindowDrag();
 *
 *   // in an onMouseDown handler:
 *   startMouse(
 *     (e) => onMove(e.clientX, e.clientY),  // called on every mousemove
 *     ()  => onDone(),                        // optional — called on mouseup
 *   );
 *
 *   // in an onTouchStart handler:
 *   startTouch(
 *     (e) => onMove(e.touches[0].clientX, e.touches[0].clientY),
 *     ()  => onDone(),   // optional
 *     true,              // passive (default false)
 *   );
 *
 * Cleanup happens on mouseup/touchend *and* if the component unmounts while
 * a pointer is still down — no dangling listeners or setState-on-unmount.
 */
export function useWindowDrag() {
  const active = useRef([]); // [[eventName, handler], ...]

  // Remove all tracked listeners when the component unmounts
  useEffect(() => () => {
    active.current.forEach(([ev, fn]) => window.removeEventListener(ev, fn));
    active.current = [];
  }, []);

  /** Start a mouse drag. onMove receives the raw MouseEvent. */
  function startMouse(onMove, onEnd) {
    const move = (e) => onMove(e);
    const up   = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup',   up);
      active.current = active.current.filter(([, fn]) => fn !== move && fn !== up);
      onEnd?.();
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup',   up);
    active.current.push(['mousemove', move], ['mouseup', up]);
  }

  /** Start a touch drag. onMove receives the raw TouchEvent. */
  function startTouch(onMove, onEnd, passive = false) {
    const move = (e) => onMove(e);
    const end  = () => {
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend',  end);
      active.current = active.current.filter(([, fn]) => fn !== move && fn !== end);
      onEnd?.();
    };
    window.addEventListener('touchmove', move, { passive });
    window.addEventListener('touchend',  end);
    active.current.push(['touchmove', move], ['touchend', end]);
  }

  return { startMouse, startTouch };
}
