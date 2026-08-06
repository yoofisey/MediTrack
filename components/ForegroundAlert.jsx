"use client";

import { useEffect, useState } from "react";
import { Bell, Flame, Timer, HeartPulse } from "lucide-react";

export default function ForegroundAlert({ alert, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!alert) return;
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 5000);
    return () => clearTimeout(t);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const { title, body, type } = alert;
  const isMilestone = type === "milestone";
  const isReminder = title?.toLowerCase().includes("reminder");
  const isMissed = title?.toLowerCase().includes("missed");
  const isVital = title?.toLowerCase().includes("check your");

  let icon = <Bell size={22} color="white" />;
  let bg = "linear-gradient(135deg, #2563eb, #5856d6)";
  if (isMilestone) { icon = <Flame size={22} color="white" />; bg = "linear-gradient(135deg, #f59e0b, #ef4444)"; }
  else if (isReminder) { icon = <Timer size={22} color="white" />; bg = "linear-gradient(135deg, #8b5cf6, #6366f1)"; }
  else if (isMissed) { icon = <Bell size={22} color="white" />; bg = "linear-gradient(135deg, #ef4444, #dc2626)"; }
  else if (isVital) { icon = <HeartPulse size={22} color="white" />; bg = "linear-gradient(135deg, #10b981, #059669)"; }

  return (
    <div style={{
      position: "fixed", top: 16, left: 16, right: 16, zIndex: 9998,
      background: bg, borderRadius: 16, padding: 16,
      boxShadow: "0 8px 32px rgba(0,0,0,.25)", color: "white",
      transform: visible ? "translateY(0)" : "translateY(-120%)",
      opacity: visible ? 1 : 0,
      transition: "transform .3s ease, opacity .3s ease",
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, lineHeight: 1.3 }}>{title}</div>
        {body && <div style={{ fontSize: 12, opacity: .9, lineHeight: 1.4, whiteSpace: "pre-line" }}>{body}</div>}
      </div>
      <button onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }} style={{ background: "rgba(255,255,255,.2)", border: "none", color: "white", width: 28, height: 28, borderRadius: 8, cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0 }}>×</button>
    </div>
  );
}