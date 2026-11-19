"use client";

import { useState, useEffect } from "react";
import { Check, Lock, Timer } from "lucide-react";
import { medLogState } from "@/lib/household";

export default function MedLogButton({ member, med, now = new Date(), onMarkDose }) {
  const st = medLogState(member, med, now);
  const [, setTick] = useState(0);
  useEffect(() => { if (!st.locked) return; const id = setInterval(() => setTick(n => n + 1), 30000); return () => clearInterval(id); }, [st.locked]);

  if (st.locked) {
    const waitMs = st.waitMs || 0;
    const waitM = Math.max(1, Math.ceil(waitMs / 60000));
    const waitH = Math.floor(waitM / 60);
    const remM = waitM % 60;
    const label = waitH > 0 ? `${waitH}h ${remM}m` : `${waitM}m`;
    return (
      <span className="btn btn-sm" style={{ background: "var(--hover)", color: "var(--t4)", border: "none", display: "flex", alignItems: "center", gap: 4, cursor: "not-allowed", pointerEvents: "none", flexShrink: 0 }}>
        <Timer size={12} /> {label}
      </span>
    );
  }
  if (st.allLogged) {
    return (
      <span className="btn btn-sm" style={{ background: "var(--ib2)", color: "var(--green)", border: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, pointerEvents: "none", flexShrink: 0 }}>
        <Check size={13} strokeWidth={3} /> Taken
      </span>
    );
  }
  return (
    <button className="btn btn-sm" onClick={() => onMarkDose(member, st.next)}
      style={{ background: st.overdue ? "var(--red)" : "var(--teal)", color: "#fff", border: "none", fontWeight: 700, padding: "8px 14px", flexShrink: 0 }}>
      Log
    </button>
  );
}
