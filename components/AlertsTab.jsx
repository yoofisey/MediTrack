"use client";

import { CSS } from "@/lib/constants";
import { buildAlerts, callHref } from "@/lib/household";
import { CheckCircle2, Phone, Package, AlertTriangle, ChevronRight } from "lucide-react";

export default function AlertsTab({ household, onOpenMember }) {
  const { today, week } = buildAlerts(household);

  function minsLabel(mins) {
    if (mins < 60) return `${mins}m ago`;
    const h = Math.floor(mins / 60);
    return h === 1 ? "1h ago" : `${h}h ago`;
  }

  return (
    <div className="scroll">
      <style>{CSS}</style>

      <div className="nav-large" style={{ padding: "10px 16px 0" }}>Alerts</div>

      {today.length === 0 && week.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 70 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#E8F7EC", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
            <CheckCircle2 size={34} color="#1F8A3D" strokeWidth={1.8} />
          </div>
          <div className="empty-state-title">Nothing needs you today</div>
          <div className="empty-state-sub" style={{ marginBottom: 0 }}>All doses are on track. When something needs attention, it shows up here.</div>
        </div>
      ) : (
        <>
          {today.length > 0 && (
            <>
              <div className="section-header" style={{ padding: "18px 20px 8px" }}>Today</div>
              {today.map((a, i) => {
                const href = callHref(a.member);
                return (
                  <div key={i} style={{ margin: "0 20px 12px", borderRadius: 24, overflow: "hidden", background: "linear-gradient(135deg,#FF3B30,#FF6B3A)", color: "white", boxShadow: "0 10px 28px rgba(255,59,48,.28)" }}>
                    <div style={{ padding: "16px 18px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}>
                        <AlertTriangle size={15} strokeWidth={2.4} /> MISSED DOSE
                      </div>
                      <div style={{ fontSize: 19, fontWeight: 800, marginTop: 6, letterSpacing: -.3 }}>{a.med.name}</div>
                      <div style={{ fontSize: 13, opacity: .9, marginTop: 3 }}>
                        {a.member.kind === "self" ? "You" : a.member.name} missed the {a.time} dose · {minsLabel(a.overdueMins)}
                      </div>
                    </div>
                    <div style={{ display: "flex" }}>
                      {href ? (
                        <a href={href} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "13px 0", background: "white", color: "#FF3B30", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                          <Phone size={17} strokeWidth={2.4} /> Call {a.member.kind === "self" ? "now" : a.member.name.split(" ")[0]}
                        </a>
                      ) : (
                        <div onClick={() => onOpenMember(a.member)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "13px 0", background: "white", color: "#FF3B30", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                          Remind {a.member.kind === "self" ? "me" : "them"} <ChevronRight size={16} />
                        </div>
                      )}
                      <button onClick={() => onOpenMember(a.member)} style={{ flex: 1, background: "rgba(0,0,0,.18)", border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                        Open member
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {week.length > 0 && (
            <>
              <div className="section-header" style={{ padding: "18px 20px 8px" }}>This week</div>
              <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {week.map((a, i) => (
                  <div key={i} onClick={() => onOpenMember(a.member)} style={{ background: "#FFF8E7", border: "1px solid #F0DFB8", borderRadius: 20, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F5E6C4", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Package size={18} color="#8A6D2F" strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#6B5426" }}>Refill {a.med.name}</div>
                      <div style={{ fontSize: 12, color: "#9A8450", marginTop: 2 }}>
                        {a.med.pills_per_package ? `${a.remaining} of ${a.total} left · ` : ""}{a.member.kind === "self" ? "you" : a.member.name}
                      </div>
                    </div>
                    <ChevronRight size={18} color="#9A8450" />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
