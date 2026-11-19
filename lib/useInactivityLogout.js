"use client";
import { useEffect, useRef } from "react";

const TIMEOUT_MS = 15 * 60 * 1000;

export function useInactivityLogout(signOut) {
  const timerRef = useRef(null);

  useEffect(() => {
    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        signOut();
      }, TIMEOUT_MS);
    }

    const events = ["mousedown", "touchstart", "keydown", "scroll", "visibilitychange"];
    events.forEach(e => document.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => document.removeEventListener(e, reset));
    };
  }, [signOut]);
}
