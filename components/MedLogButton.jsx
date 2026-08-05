"use client";

import { Check, Lock } from "lucide-react";
import { medLogState } from "@/lib/household";

export default function MedLogButton({ member, med, now = new Date(), onMarkDose }) {
  const st = medLogState(member, med, now);
  if (st.allLogged) {
    return (
      <span className="btn btn-sm" style={{ background: "var(--ib2)", color: "var(--green)", border: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, pointerEvents: "none", flexShrink: 0 }}>
        <Check size={13} strokeWidth={3} /> Taken
      </span>
    );
  }
  if (st.locked) {
    return (
      <span className="btn btn-sm" style={{ background: "var(--hover)", color: "var(--t4)", border: "none", display: "flex", alignItems: "center", gap: 4, cursor: "not-allowed", pointerEvents: "none", flexShrink: 0 }}>
        <Lock size={12} /> Locked
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
