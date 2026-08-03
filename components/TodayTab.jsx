"use client";

import { useState } from "react";
import { CSS } from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { expectedDosesToday, focusMember, ringPct, missedDoses, remainingDoses, totalExpectedToday, callHref, initials } from "@/lib/household";
import { Bell, Check, ChevronDown, Phone, Plus, User } from "lucide-react";

function CareRing({ member, size = 58, stroke = 4, active }) {
  const pct = member.pending ? 0 : ringPct(member);
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const color = member.pending ? "var(--t4)" : pct >= 1 ? "#34C759" : pct > 0 ? "var(--teal)" : "#FF3B30";
  return (
    <div style={{ width: size + 10, height: size + 10, borderRadius: "50%", background: active ? "var(--sel)" : "transparent", display: "grid", placeItems: "center", transition: "background .2s" }}>
      <div style={{ width: size, height: size, position: "relative" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sep)" strokeWidth={stroke} />
          {!member.pending && (
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
              strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round" />
          )}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: size - stroke * 3, height: size - stroke * 3, borderRadius: "50%", overflow: "hidden", background: "var(--ib1)", display: "grid", placeItems: "center", fontSize: size * 0.34, fontWeight: 800, color: "var(--t1)" }}>
            {member.avatarUrl ? <img src={member.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(member)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TodayTab({ household, user, profile, onGoMe, onGoFamily, notifPerm, onEnableNotif, onMarkDose }) {
  const { t } = useLang();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "";
  const people = household.filter(m => !m.pending && (m.meds?.length || m.kind === "self" && m.meds?.length));
  const summaryPeople = household.filter(m => !m.pending && m.meds?.length).length;
  const summaryDoses = totalExpectedToday(household, now);

  const [focusKey, setFocusKey] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  function toggleGroup(key) { setCollapsed(c => ({ ...c, [key]: !c[key] })); }
  const focus = focusMember(household, now);
  const selected = household.find(m => m.key === focusKey) || focus?.member || household[0];
  const selMissed = selected ? missedDoses(selected, now) : [];
  const selRemaining = selected ? remainingDoses(selected, now) : [];
  const mostUrgent = selMissed[0] || selRemaining[0];
  const selPhone = selected ? callHref(selected) : null;

  const groups = [];
  household.filter(m => !m.pending).forEach(m => {
    const memberSlots = expectedDosesToday(m, now).map(s => ({
      member: m, med: s.med, time: s.time, dueMs: s.dueMs, logged: s.logged,
      overdue: !s.logged && now.getTime() - s.dueMs > 20 * 60000,
    })).sort((a, b) => a.dueMs - b.dueMs);
    if (memberSlots.length) groups.push({ member: m, slots: memberSlots });
  });
  groups.sort((a, b) => {
    const aMissed = a.slots.filter(s => s.overdue).length;
    const bMissed = b.slots.filter(s => s.overdue).length;
    if (aMissed !== bMissed) return bMissed - aMissed;
    const aFirst = a.slots.find(s => !s.logged)?.dueMs ?? Infinity;
    const bFirst = b.slots.find(s => !s.logged)?.dueMs ?? Infinity;
    return aFirst - bFirst;
  });
  const slots = groups.flatMap(g => g.slots);

  const overdueTotal = household.reduce((s, m) => s + missedDoses(m, now).length, 0);

  return (
    <div className="scroll" style={{ paddingTop: 0 }}>
      <style>{CSS}</style>

      <div style={{ padding: "20px 20px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="hero-label" style={{ marginBottom: 2 }}>{greeting}{firstName ? `, ${firstName}` : ""}</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.4, color: "var(--t1)" }}>
              {summaryPeople > 1 ? `${summaryPeople} people` : summaryPeople === 1 ? "1 person" : "No one yet"}, {summaryDoses} {summaryDoses === 1 ? "dose" : "doses"} today
            </div>
          </div>
          <div onClick={onGoMe} style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "var(--ib1)", display: "grid", placeItems: "center", cursor: "pointer", fontSize: 17, fontWeight: 800, color: "var(--t1)", border: "2.5px solid var(--card)", boxShadow: "0 4px 12px rgba(0,0,0,.12)" }}>
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={22} />}
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 14px 4px" }}>
        <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
          {household.map(m => (
            <div key={m.key} onClick={() => setFocusKey(m.key === selected?.key ? null : m.key)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 78, cursor: "pointer", userSelect: "none" }}>
              <CareRing member={m} active={m.key === selected?.key} />
              <span style={{ fontSize: 12, fontWeight: m.key === selected?.key ? 700 : 500, color: "var(--t1)", maxWidth: 76, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name.split(" ")[0]}</span>
            </div>
          ))}
          {household.length === 1 && (
            <div onClick={onGoFamily} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 78, cursor: "pointer" }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", border: "2px dashed var(--t4)", display: "grid", placeItems: "center", color: "var(--t3)" }}><Plus size={22} /></div>
              <span style={{ fontSize: 12, color: "var(--t3)" }}>Add people</span>
            </div>
          )}
        </div>
      </div>

      {selected ? (
        <div style={{ margin: "10px 20px 14px", borderRadius: 26, overflow: "hidden", background: "var(--card)", boxShadow: "var(--card-shadow)", border: "var(--card-border)" }}>
          <div style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", background: "var(--ib1)", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 800, color: "var(--t1)", flexShrink: 0 }}>
              {selected.avatarUrl ? <img src={selected.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(selected)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--t1)", letterSpacing: -.3 }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: selMissed.length ? "var(--red)" : "var(--t3)", marginTop: 2 }}>
                {selected.pending ? "Invite accepted once they sign in" : selMissed.length ? `${selMissed.length} missed dose${selMissed.length > 1 ? "s" : ""} — needs attention` : selRemaining.length ? `On track · ${selRemaining.length} dose${selRemaining.length > 1 ? "s" : ""} left today` : "All doses done for today"}
              </div>
            </div>
          </div>
          {mostUrgent && (
            <div style={{ margin: "0 16px 16px", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, background: selMissed.length ? "linear-gradient(135deg,#FF3B30,#FF6B3A)" : "var(--ib1)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: .4, opacity: .8 }}>{selMissed.length ? "MISSED DOSE" : "UP NEXT"}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {mostUrgent.time} · {mostUrgent.med.name} {mostUrgent.med.dosage_amount}{mostUrgent.med.dosage_unit}
                </div>
              </div>
              {selMissed.length > 0 && (
                <a href={selPhone || undefined} onClick={(e) => { if (!selPhone) { e.preventDefault(); alert(`No phone number on file for ${selected.name}.`); } }}
                  style={{ width: 48, height: 48, borderRadius: "50%", background: "white", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,.2)" }}>
                  <Phone size={22} color="#FF3B30" />
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state" style={{ paddingTop: 60 }}>
          <div className="empty-state-icon" style={{ fontSize: 44 }}>👋</div>
          <div className="empty-state-title">Nothing to track yet</div>
          <div className="empty-state-sub">Add a medication or invite a family member to get started.</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="btn btn-primary" style={{ width: "auto", padding: "12px 22px" }} onClick={onGoMe}>Go to Me</button>
          </div>
        </div>
      )}

      {overdueTotal > 0 && (
        <div style={{ margin: "0 20px 14px", background: "linear-gradient(135deg,#FF3B30,#FF6B3A)", borderRadius: 20, padding: "16px 18px", color: "white", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 24px rgba(255,59,48,.25)" }}>
          <Bell size={20} strokeWidth={2.2} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{overdueTotal} dose{overdueTotal > 1 ? "s" : ""} missed today</div>
            <div style={{ fontSize: 12, opacity: .85 }}>Check on them — a call beats a notification</div>
          </div>
        </div>
      )}

      {notifPerm === "default" && (
        <div className="notif-banner" onClick={onEnableNotif}>
          <div className="notif-banner-text" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Bell size={16} color="white" strokeWidth={2.2} />
            {t("today.enableReminders")}
          </div>
          <button className="notif-banner-btn">{t("today.enable")}</button>
        </div>
      )}

      <div className="section" style={{ paddingTop: 4 }}>
        <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Up next</span>
          {slots.length > 0 && <span style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500 }}>{slots.filter(s => s.logged).length}/{slots.length} done</span>}
        </div>
        {slots.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 24, paddingBottom: 24 }}>
            <div className="empty-state-title" style={{ fontSize: 15 }}>All caught up</div>
            <div className="empty-state-sub" style={{ marginBottom: 0 }}>No doses scheduled for today.</div>
          </div>
        ) : (
          <div className="list">
            {groups.map(g => {
              const isCollapsed = !!collapsed[g.member.key];
              return (
                <div key={g.member.key} style={{ marginBottom: 4 }}>
                  <div onClick={() => toggleGroup(g.member.key)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 2px", cursor: "pointer", userSelect: "none" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", background: "var(--ib1)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, color: "var(--t1)", flexShrink: 0 }}>
                      {g.member.avatarUrl ? <img src={g.member.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(g.member)}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.member.name}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: g.slots.some(s => s.overdue) ? "#FF3B30" : "var(--t3)" }}>
                      {g.slots.filter(s => s.logged).length}/{g.slots.length}
                    </span>
                    <ChevronDown size={16} style={{ color: "var(--t4)", flexShrink: 0, transition: "transform .2s", transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </div>
                  {!isCollapsed && g.slots.map((s, i) => (
                    <div key={i} className="row" style={{ cursor: "default" }}>
                      <div onClick={() => !s.logged && onMarkDose(s.member, s)}
                        style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, border: s.logged ? "none" : `2px solid ${s.overdue ? "#FF3B30" : "var(--sep)"}`, background: s.logged ? "var(--ib2)" : "transparent", cursor: s.logged ? "default" : "pointer" }}>
                        {s.logged ? <Check size={18} strokeWidth={3} color="#34C759" /> : <span style={{ fontSize: 11, fontWeight: 700, color: s.overdue ? "#FF3B30" : "var(--t3)" }}>{s.time}</span>}
                      </div>
                      <div className="row-body">
                        <div className="row-title" style={{ fontWeight: 500 }}>{s.med.name} {s.med.dosage_amount}{s.med.dosage_unit}</div>
                        <div className="row-sub">{s.time}{s.overdue ? " · overdue" : ""}</div>
                      </div>
                      {s.overdue && <span style={{ fontSize: 11, fontWeight: 700, color: "#FF3B30", background: "var(--ib6)", padding: "3px 8px", borderRadius: 99 }}>{Math.max(0, Math.round((now.getTime() - s.dueMs) / 60000))}m</span>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
