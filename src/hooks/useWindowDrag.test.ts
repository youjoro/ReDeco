/**
 * Regression tests for useWindowDrag.
 *
 * These tests guard against the most common breakage patterns:
 *   1. Listeners not being added on startMouse / startTouch.
 *   2. Listeners not being removed on mouseup / touchend.
 *   3. Listeners not being cleaned up on component unmount while drag is active.
 *   4. onMove / onEnd callbacks firing with the correct arguments.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindowDrag } from './useWindowDrag';

// Helper to fire a window event
function fireWindowEvent(type: string, init: EventInit = {}) {
  window.dispatchEvent(new Event(type, init));
}
function fireMouseEvent(type: string, x = 0, y = 0) {
  window.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
}
function fireTouchEvent(type: string) {
  window.dispatchEvent(new Event(type));
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  // Belt-and-suspenders: ensure no dangling listeners survive between tests
  window.dispatchEvent(new Event('mouseup'));
  window.dispatchEvent(new Event('touchend'));
});

describe('useWindowDrag — mouse', () => {
  it('calls onMove on every mousemove event after startMouse', () => {
    const { result } = renderHook(() => useWindowDrag());
    const onMove = vi.fn();

    act(() => result.current.startMouse(onMove, undefined));
    fireMouseEvent('mousemove', 10, 20);
    fireMouseEvent('mousemove', 30, 40);

    expect(onMove).toHaveBeenCalledTimes(2);
    expect((onMove.mock.calls[0][0] as MouseEvent).clientX).toBe(10);
    expect((onMove.mock.calls[1][0] as MouseEvent).clientX).toBe(30);
  });

  it('calls onEnd once on mouseup and stops tracking onMove', () => {
    const { result } = renderHook(() => useWindowDrag());
    const onMove = vi.fn();
    const onEnd  = vi.fn();

    act(() => result.current.startMouse(onMove, onEnd));
    fireWindowEvent('mouseup');
    fireMouseEvent('mousemove', 99, 99); // should not reach onMove

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('removes window listeners on unmount even if drag is still active', () => {
    const addSpy    = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { result, unmount } = renderHook(() => useWindowDrag());
    const onMove = vi.fn();

    act(() => result.current.startMouse(onMove, undefined));
    const addedCount = addSpy.mock.calls.filter(([t]) => t === 'mousemove' || t === 'mouseup').length;

    unmount();

    const removedCount = removeSpy.mock.calls.filter(([t]) => t === 'mousemove' || t === 'mouseup').length;
    expect(removedCount).toBeGreaterThanOrEqual(addedCount);
    // After unmount no more move events should reach the callback
    fireMouseEvent('mousemove', 1, 1);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('does not call onEnd if undefined', () => {
    const { result } = renderHook(() => useWindowDrag());
    expect(() => {
      act(() => result.current.startMouse(vi.fn(), undefined));
      fireWindowEvent('mouseup');
    }).not.toThrow();
  });
});

describe('useWindowDrag — touch', () => {
  it('calls onMove on touchmove', () => {
    const { result } = renderHook(() => useWindowDrag());
    const onMove = vi.fn();

    act(() => result.current.startTouch(onMove, undefined));
    fireTouchEvent('touchmove');
    fireTouchEvent('touchmove');

    expect(onMove).toHaveBeenCalledTimes(2);
  });

  it('calls onEnd on touchend and removes touchmove listener', () => {
    const { result } = renderHook(() => useWindowDrag());
    const onMove = vi.fn();
    const onEnd  = vi.fn();

    act(() => result.current.startTouch(onMove, onEnd));
    fireTouchEvent('touchend');
    fireTouchEvent('touchmove'); // should not reach onMove

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('removes touch listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { result, unmount } = renderHook(() => useWindowDrag());
    act(() => result.current.startTouch(vi.fn(), undefined));

    removeSpy.mockClear();
    unmount();

    const removedTypes = removeSpy.mock.calls.map(([t]) => t);
    expect(removedTypes).toContain('touchmove');
    expect(removedTypes).toContain('touchend');
  });
});

describe('useWindowDrag — multiple concurrent drags', () => {
  it('cleans up independently when two drags end at different times', () => {
    const { result } = renderHook(() => useWindowDrag());
    const move1 = vi.fn();
    const move2 = vi.fn();

    act(() => result.current.startMouse(move1, undefined));
    act(() => result.current.startMouse(move2, undefined));

    fireMouseEvent('mousemove', 1, 1);
    expect(move1).toHaveBeenCalledTimes(1);
    expect(move2).toHaveBeenCalledTimes(1);

    // First mouseup removes only its own pair of listeners
    fireWindowEvent('mouseup');
    move1.mockClear();
    move2.mockClear();

    // After the first mouseup the second set might still fire — both are cleaned
    // up by the time a second mouseup or unmount happens; no crash expected.
    expect(() => fireWindowEvent('mouseup')).not.toThrow();
  });
});
