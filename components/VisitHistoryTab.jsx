"use client";

import { useState } from "react";
import { Stethoscope, BarChart3 } from "lucide-react";
import { CSS } from "@/lib/constants";
import { getVisits, getVisitTime } from "@/lib/data";
import { useSwipe } from "@/lib/useSwipe";
import { VisitRow, monthGroupLabel, monthGroupKey, visitReminderLabel } from "@/components/VisitHistoryList";

function Ico({ children, ...props }) {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }} {...props}>{children}</span>;
}

export default function VisitHistoryTab({ onBack }) {
  const [expandedVisit, setExpandedVisit] = useState(null);
  const backSwipe = useSwipe({ onSwipeRight: onBack });

  const allVisits = getVisits().slice().sort((a, b) => ((b.date || "") + (b.time || "")).localeCompare((a.date || "") + (a.time || "")));
  const now = new Date();
  const stats = {
    total: allVisits.length,
    upcoming: allVisits.filter(v => v.status !== "attended" && v.status !== "missed" && getVisitTime(v) >= now).length,
    attended: allVisits.filter(v => v.status === "attended").length,
    missed: allVisits.filter(v => v.status === "missed").length,
  };

  const groups = {};
  allVisits.forEach(v => {
    const key = monthGroupKey(v.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(v);
  });
  const orderedGroups = Object.keys(groups).sort().reverse();

  return (
    <div className="scroll" {...backSwipe}>
      <style>{CSS}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 8px 4px" }}>
        {onBack && <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--teal)", display: "flex", alignItems: "center" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>}
        <div className="nav-large" style={{ padding: 0 }}>Visit History</div>
      </div>

      {allVisits.length === 0 ? (
        <div className="empty-state" style={{ margin: "60px 24px 0" }}>
          <div className="empty-state-icon"><Ico><Stethoscope size={52} strokeWidth={1.5} color="var(--t2)"/></Ico></div>
          <div className="empty-state-title">No visits yet</div>
          <div className="empty-state-sub">Schedule a hospital visit and it will appear here</div>
        </div>
      ) : (
        <>
          <div style={{ margin: "14px 16px 4px", background: "var(--card)", borderRadius: 22, padding: "18px 20px", boxShadow: "var(--card-shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 13, background: "var(--ib5)", display: "grid", placeItems: "center" }}><Ico><BarChart3 size={19} strokeWidth={2.2} color="var(--t1)"/></Ico></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--t1)", letterSpacing: "-.5px", lineHeight: 1.1 }}>{stats.total}</div>
                <div style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500 }}>Total visits tracked</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "var(--bg)", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--teal)" }}>{stats.upcoming}</div>
                <div style={{ fontSize: 10, color: "var(--t3)", fontWeight: 600 }}>Upcoming</div>
              </div>
              <div style={{ flex: 1, background: "var(--bg)", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--teal2)" }}>{stats.attended}</div>
                <div style={{ fontSize: 10, color: "var(--t3)", fontWeight: 600 }}>Attended</div>
              </div>
              <div style={{ flex: 1, background: "var(--bg)", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--red)" }}>{stats.missed}</div>
                <div style={{ fontSize: 10, color: "var(--t3)", fontWeight: 600 }}>Missed</div>
              </div>
            </div>
          </div>

          {orderedGroups.map(group => (
            <div key={group} style={{ marginTop: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", color: "var(--t4)" }}>{monthGroupLabel(groups[group][0].date)}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)" }}>{groups[group].length} visit{groups[group].length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ margin: "0 16px", background: "var(--card)", borderRadius: "var(--rl)", boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
                {groups[group].map((v, i) => {
                  const id = v.id;
                  const expanded = expandedVisit === id;
                  return (
                    <div key={id}>
                      <VisitRow v={v} expanded={expanded} onClick={() => setExpandedVisit(expanded ? null : id)} style={{ borderTop: i > 0 ? "0.5px solid var(--sep)" : "none" }}/>
                      {expanded && (
                        <div style={{ borderTop: "0.5px solid var(--sep)", background: "var(--bg)", padding: "10px 12px 12px 52px" }}>
                          {v.doctor && <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 2 }}>Dr. {v.doctor}{v.facility ? ` · ${v.facility}` : ""}</div>}
                          {visitReminderLabel(v) && <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 2 }}>Reminder {visitReminderLabel(v)}</div>}
                          {v.notes ? <div style={{ fontSize: 12, color: "var(--t3)", lineHeight: 1.45 }}>{v.notes}</div> : <div style={{ fontSize: 12, color: "var(--t4)" }}>No additional notes</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ height: 24 }} />
        </>
      )}
    </div>
  );
}