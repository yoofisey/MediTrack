"use client";

import { Bell, Flame, Timer, HeartPulse } from "lucide-react";

export default function ForegroundAlert({ alert, onDismiss }) {
  if (!alert) return null;

  const { title, body, type } = alert;
  const alertKey = `${type}-${title}`;
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
    <div key={alertKey} onAnimationEnd={(e) => { if (e.animationName === "fgAlertOut") onDismiss(); }}
      style={{
      position: "fixed", top: 16, left: 16, right: 16, zIndex: 9998,
      background: bg, borderRadius: 16, padding: 16,
      boxShadow: "0 8px 32px rgba(0,0,0,.25)", color: "white",
      animation: "fgAlertIn .3s ease, fgAlertOut .35s ease 5s forwards",
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <style>{`
        @keyframes fgAlertIn{from{transform:translateY(-120%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fgAlertOut{from{transform:translateY(0);opacity:1}to{transform:translateY(-120%);opacity:0}}
      `}</style>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, lineHeight: 1.3 }}>{title}</div>
        {body && <div style={{ fontSize: 12, opacity: .9, lineHeight: 1.4, whiteSpace: "pre-line" }}>{body}</div>}
      </div>
      <button onClick={onDismiss} style={{ background: "rgba(255,255,255,.2)", border: "none", color: "white", width: 28, height: 28, borderRadius: 8, cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0 }}>×</button>
    </div>
  );
}