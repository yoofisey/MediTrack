"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { getVisitTime } from "@/lib/data";
import { fmtDateLong } from "@/lib/constants";

function Ico({ children, ...props }) {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }} {...props}>{children}</span>;
}

export function visitStatusOf(v) {
  if (v.status === "attended") return "attended";
  if (v.status === "missed") return "missed";
  return getVisitTime(v) < new Date() ? "scheduled" : "upcoming";
}

export function visitStatusLabel(v) {
  return ({ attended: "Attended", missed: "Missed", scheduled: "Scheduled", upcoming: "Upcoming" })[visitStatusOf(v)];
}

export function visitStatusBadge(v) {
  const colors = {
    attended: { bg: "var(--ib5)", fg: "var(--teal2)" },
    missed: { bg: "var(--ib6)", fg: "var(--red)" },
    scheduled: { bg: "var(--bg)", fg: "var(--t3)" },
    upcoming: { bg: "var(--ib1)", fg: "var(--teal)" },
  }[visitStatusOf(v)];
  return <span style={{ fontSize: 11, fontWeight: 700, background: colors.bg, color: colors.fg, padding: "3px 10px", borderRadius: 99, flexShrink: 0, whiteSpace: "nowrap" }}>{visitStatusLabel(v)}</span>;
}

export function visitReminderLabel(v) {
  const m = parseInt(v.reminder_minutes);
  if (!m || m <= 0) return "";
  if (m >= 1440) return `${Math.round(m / 1440)} day${Math.round(m / 1440) > 1 ? "s" : ""} before`;
  if (m >= 60) return `${Math.round(m / 60)} hr${Math.round(m / 60) > 1 ? "s" : ""} before`;
  return `${m} min before`;
}

export function visitTimeLabel(v) {
  const t = getVisitTime(v);
  return t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function visitDateLabel(v) {
  return fmtDateLong(v.date + "T12:00:00");
}

export function visitSubline(v) {
  const t = getVisitTime(v);
  return t.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " · " + visitTimeLabel(v) + (v.facility ? ` · ${v.facility}` : "");
}

export function monthGroupLabel(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d)) return "Other";
  return d.toLocaleDateString([], { month: "long", year: "numeric" });
}

export function monthGroupKey(dateStr) {
  return (dateStr || "").slice(0, 7) || "other";
}

const statusIconBg = v => visitStatusOf(v) === "attended" ? "var(--ib5)" : visitStatusOf(v) === "missed" ? "var(--ib6)" : "var(--ib1)";
const statusIconColor = v => visitStatusOf(v) === "attended" ? "var(--teal2)" : visitStatusOf(v) === "missed" ? "var(--red)" : "var(--teal)";

export function VisitRow({ v, expanded, onClick, style }) {
  return (
    <div className="row" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default", alignItems: "center", ...(style || {}) }}>
      <div style={{ width: 28, height: 28, borderRadius: 9, background: statusIconBg(v), display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Ico><CalendarDays size={14} strokeWidth={2.2} color={statusIconColor(v)}/></Ico>
      </div>
      <div className="row-body" style={{ minWidth: 0 }}>
        <div className="row-title" style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.reason || "Hospital visit"}</span>
          {visitStatusBadge(v)}
        </div>
        <div className="row-sub" style={{ fontSize: 11, color: "var(--t3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{visitSubline(v)}</div>
      </div>
      <span style={{ fontSize: 10, color: "var(--t4)", transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>▼</span>
    </div>
  );
}

export function VisitDetailCard({ v }) {
  return (
    <div style={{ marginTop: 14, background: "var(--card)", borderRadius: "var(--rl)", boxShadow: "var(--card-shadow)", padding: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: statusIconBg(v), display: "grid", placeItems: "center", flexShrink: 0 }}><Ico><MapPin size={15} strokeWidth={2.2} color={statusIconColor(v)}/></Ico></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>{v.reason || "Hospital visit"}</div>
          <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{visitDateLabel(v)} · {visitTimeLabel(v)}</div>
          {v.doctor && <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 6 }}>Dr. {v.doctor}{v.facility ? ` · ${v.facility}` : ""}</div>}
          {visitReminderLabel(v) ? <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>Reminder {visitReminderLabel(v)}</div> : null}
          {v.notes ? <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 8, background: "var(--bg)", borderRadius: 10, padding: "8px 10px" }}>{v.notes}</div> : null}
        </div>
      </div>
    </div>
  );
}