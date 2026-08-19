import { useRef, useCallback } from "react";

const THRESHOLD = 50;
const MAX_OFF_AXIS = 80;

export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeDown, onSwipeUp }) {
  const ref = useRef({ sx: 0, sy: 0, tracking: false });

  const onStart = useCallback((e) => {
    const t = e.touches ? e.touches[0] : e;
    ref.current = { sx: t.clientX, sy: t.clientY, tracking: true };
  }, []);

  const onEnd = useCallback((e) => {
    const r = ref.current;
    if (!r.tracking) return;
    r.tracking = false;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    const dx = t.clientX - r.sx;
    const dy = t.clientY - r.sy;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    if (adx > ady && adx > THRESHOLD && ady < MAX_OFF_AXIS) {
      if (dx < 0 && onSwipeLeft) onSwipeLeft();
      else if (dx > 0 && onSwipeRight) onSwipeRight();
    } else if (ady > adx && ady > THRESHOLD && adx < MAX_OFF_AXIS) {
      if (dy > 0 && onSwipeDown) onSwipeDown();
      else if (dy < 0 && onSwipeUp) onSwipeUp();
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeDown, onSwipeUp]);

  return {
    onTouchStart: onStart,
    onTouchEnd: onEnd,
    onMouseDown: onStart,
    onMouseUp: onEnd,
  };
}

export function useSwipeBack(onBack) {
  return useSwipe({ onSwipeRight: onBack });
}

export function SwipeDismiss({ onDismiss, children, ...props }) {
  const swipe = useSwipe({ onSwipeDown: onDismiss });
  return <div {...swipe} {...props}>{children}</div>;
}
