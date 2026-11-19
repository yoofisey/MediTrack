"use client";

import { useState, useEffect } from "react";
import { WifiOff, X } from "lucide-react";
import { CSS } from "@/lib/constants";

// Non-blocking offline banner. navigator.onLine is unreliable (false negatives
// on cache hits), so previously this was a full-screen modal that hid an app
// that actually still works from the SW cache. Now it's a dismissible pill that
// lets the user keep using the app and queueing writes.
export default function OfflineScreen({ onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    function goOnline() {
      setVisible(false);
      setTimeout(() => onClose?.(), 350);
    }
    window.addEventListener("online", goOnline);
    return () => window.removeEventListener("online", goOnline);
  }, [onClose]);

  function dismiss() {
    setVisible(false);
    setTimeout(() => onClose?.(), 350);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 10px)",
        left: "max(12px, env(safe-area-inset-left, 0px))",
        right: "max(12px, env(safe-area-inset-right, 0px))",
        zIndex: 9998,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-12px)",
        transition: "opacity .3s ease, transform .3s ease",
      }}
    >
      <style>{CSS}</style>
      <div
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          maxWidth: 420,
          width: "100%",
          background: "var(--card)",
          borderRadius: 999,
          padding: "10px 12px 10px 14px",
          boxShadow: "var(--card-hover)",
          border: "0.5px solid var(--sep)",
        }}
      >
        <WifiOff size={18} color="var(--red)" strokeWidth={2.2} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--t2)", lineHeight: 1.35 }}>
          You&apos;re offline — changes will sync when you reconnect.
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={dismiss}
          style={{ width: "auto", padding: "6px 10px", fontSize: 12, flexShrink: 0 }}
          aria-label="Dismiss offline notice"
        >
          Dismiss
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss offline notice"
          style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: "var(--t3)", display: "grid", placeItems: "center", flexShrink: 0 }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
