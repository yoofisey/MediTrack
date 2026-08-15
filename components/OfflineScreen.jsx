"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { CSS } from "@/lib/constants";

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
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      background: "rgba(0,0,0,.35)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none",
      transition: "opacity .35s ease",
    }}>
      <style>{CSS}</style>
      <div style={{
        background: "var(--card)", borderRadius: "var(--rxl)",
        padding: "32px 28px 28px", width: "90%", maxWidth: 340,
        textAlign: "center", boxShadow: "var(--card-hover)",
        transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(.96)",
        transition: "transform .4s cubic-bezier(.22,1,.36,1), opacity .35s ease",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "var(--hover)", display: "grid", placeItems: "center",
          margin: "0 auto 18px", position: "relative",
        }}>
          <div style={{
            position: "absolute", inset: -10, borderRadius: "50%",
            background: "rgba(255,59,48,.08)", animation: "bgPulse 2s ease-in-out infinite",
          }} />
          <WifiOff size={32} color="var(--red)" strokeWidth={1.8} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", marginBottom: 6, letterSpacing: "-.3px" }}>
          You&apos;re offline
        </div>
        <div style={{ fontSize: 14, color: "var(--t3)", lineHeight: 1.5, marginBottom: 24 }}>
          Some features may be limited. Your changes will sync automatically when you reconnect.
        </div>
        <button className="btn btn-primary" onClick={dismiss}>
          <RefreshCw size={16} /> Continue offline
        </button>
      </div>
    </div>
  );
}
