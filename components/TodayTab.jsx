"use client";

import { useState } from "react";
import { CSS } from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { expectedDosesToday, focusMember, missedDoses, remainingDoses, totalExpectedToday, callHref, initials, weekAdherence, streak } from "@/lib/household";
import { getUpcomingVisits } from "@/lib/data";
import { Bell, Building2, CalendarDays, Check, ChevronDown, ChevronRight, HeartPulse, Lock, Phone, Pill, Plus, User } from "lucide-react";

const VITAL_LABELS = {
  blood_pressure: "BP", weight: "Weight", glucose: "Glucose", heart_rate: "Heart rate",
  temperature: "Temp", spo2: "SpO2", cholesterol: "Chol", bmi: "BMI", hba1c: "HbA1c",
  water_intake: "Water", peak_flow: "Peak flow",
};
const VITAL_UNITS = {
  blood_pressure: "mmHg", weight: "kg", glucose: "mg/dL", heart_rate: "bpm",
  temperature: "°F", spo2: "%", cholesterol: "mg/dL", bmi: "kg/m²", hba1c: "%",
  water_intake: "L", peak_flow: "L/min",
};
function latestVitals(member, limit = 3) {
  const latest = {};
  (member.vitals || []).forEach(v => {
    if (!latest[v.type] || new Date(v.created_at) > new Date(latest[v.type].created_at)) latest[v.type] = v;
  });
  return Object.values(latest).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
}
function vitalsLine(vitals) {
  return vitals.map(v => {
    const label = VITAL_LABELS[v.type] || v.type;
    const unit = VITAL_UNITS[v.type] || v.unit || "";
    const val = v.type === "blood_pressure" && v.value_secondary != null ? `${v.value}/${v.value_secondary}` : `${v.value}`;
    return `${label} ${val}${unit ? " " + unit : ""}`;
  }).join(" · ");
}

function fmtVisitDate(v) {
  const d = new Date(v.date + "T" + (v.time || "09:00"));
  return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} · ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function LogButton({ slot, now, onMarkDose }) {
  const overdue = !slot.logged && now.getTime() - slot.dueMs > 20 * 60000;
  const locked = !slot.logged && now.getTime() < slot.dueMs;
  if (slot.logged) {
    return (
      <span className="btn btn-sm" style={{ background: "var(--ib2)", color: "var(--green)", border: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, pointerEvents: "none" }}>
        <Check size={13} strokeWidth={3} /> Taken
      </span>
    );
  }
  if (locked) {
    return (
      <span className="btn btn-sm" style={{ background: "var(--hover)", color: "var(--t4)", border: "none", display: "flex", alignItems: "center", gap: 4, cursor: "not-allowed", pointerEvents: "none" }}>
        <Lock size={12} /> {slot.time}
      </span>
    );
  }
  return (
    <button className="btn btn-sm" onClick={() => onMarkDose(slot.member, slot)}
      style={{ background: overdue ? "var(--red)" : "var(--teal)", color: "#fff", border: "none", fontWeight: 700, padding: "8px 14px" }}>
      Log
    </button>
  );
}

export default function TodayTab({ household, user, profile, plan, onGoMe, onGoMeds, onGoVitals, onGoReports, onUpgrade, notifPerm, onEnableNotif, onMarkDose, onScheduleVisit, onEditVisit, onOpenVisits, onOpenAlerts, alertCount }) {
  const { t } = useLang();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "";
  const people = household.filter(m => !m.pending && (m.meds?.length || m.kind === "self" && m.meds?.length));
  const summaryPeople = household.filter(m => !m.pending && m.meds?.length).length;
  const summaryDoses = totalExpectedToday(household, now);

  const [collapsed, setCollapsed] = useState({});
  function toggleGroup(key) { setCollapsed(c => ({ ...c, [key]: !c[key] })); }
  const focus = focusMember(household, now);
  const selected = household.find(m => m.kind === "self") || focus?.member || household[0];
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

  const isPro = ["pro", "family", "enterprise"].includes(plan);
  const adh = selected ? weekAdherence(selected) : null;
  const stk = selected ? streak(selected) : 0;
  const upcomingVisits = getUpcomingVisits(60);
  const hasAnyMeds = household.some(m => !m.pending && (m.meds || []).length);

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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onOpenAlerts} aria-label="Alerts"
              style={{ position: "relative", width: 42, height: 42, borderRadius: "50%", background: "var(--card)", border: "2.5px solid var(--card)", boxShadow: "0 4px 12px rgba(0,0,0,.12)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
              <Bell size={19} color="var(--t1)" strokeWidth={2} />
              {alertCount > 0 && (
                <span style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, background: "var(--red)", color: "#fff", fontSize: 11, fontWeight: 800, lineHeight: 1, display: "grid", placeItems: "center", padding: "0 5px", boxShadow: "0 2px 6px rgba(255,59,48,.4)" }}>{alertCount > 99 ? "99+" : alertCount}</span>
              )}
            </button>
            <div onClick={onGoMe} style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "var(--ib1)", display: "grid", placeItems: "center", cursor: "pointer", fontSize: 17, fontWeight: 800, color: "var(--t1)", border: "2.5px solid var(--card)", boxShadow: "0 4px 12px rgba(0,0,0,.12)" }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={22} />}
            </div>
          </div>
        </div>
      </div>

      {isPro && adh !== null && (
        <div style={{ margin: "14px 20px 4px" }}>
          <div className="card" style={{ padding: 18 }}>
            <div className="hero-label">Adherence this week</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 2 }}>
              <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1, color: "var(--t1)" }}>{adh}%</span>
              {stk > 1 && <span className="streak-badge fire">🔥 {stk}-day streak</span>}
            </div>
            <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 6 }}>
              {adh >= 80 ? "Great consistency — keep it up" : adh >= 50 ? "Some missed doses this week" : "Let's get back on track"}
            </div>
            <button onClick={onGoReports} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--teal)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: "8px 0 0", marginTop: 4 }}>
              View full report <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {!isPro && (
        <div style={{ margin: "14px 20px 4px" }}>
          <div className="card" style={{ padding: 18, background: "linear-gradient(135deg,#FFFFFF,var(--ib2))", border: "1px solid var(--ib3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--t1)" }}>Unlock Pro</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--t3)", lineHeight: 1.45 }}>
              Track unlimited medications, see weekly adherence insights, and export reports to share with your doctor.
            </div>
            <button className="btn btn-primary" style={{ width: "auto", marginTop: 12, padding: "10px 18px" }} onClick={onUpgrade}>
              See what's included →
            </button>
          </div>
        </div>
      )}

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
                  <Phone size={22} color="var(--red)" />
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
          <span>Today's medications</span>
          {slots.length > 0 && <span style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500 }}>{slots.filter(s => s.logged).length}/{slots.length} done</span>}
        </div>
        {slots.length === 0 ? (
          hasAnyMeds ? (
            <div className="empty-state" style={{ paddingTop: 24, paddingBottom: 24 }}>
              <div className="empty-state-title" style={{ fontSize: 15 }}>All doses logged for today 🎉</div>
              <div className="empty-state-sub" style={{ marginBottom: 0 }}>No more doses scheduled today.</div>
            </div>
          ) : (
            <div className="empty-state" style={{ paddingTop: 24, paddingBottom: 24 }}>
              <div className="empty-state-icon"><Pill size={40} strokeWidth={1.5} /></div>
              <div className="empty-state-title" style={{ fontSize: 15 }}>No medications yet</div>
              <div className="empty-state-sub" style={{ marginBottom: 0 }}>Add your first medication to start tracking doses.</div>
              <button className="btn btn-primary" style={{ width: "auto", padding: "11px 20px" }} onClick={onGoMeds}>Add medication</button>
            </div>
          )
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
                    <span style={{ fontSize: 11, fontWeight: 600, color: g.slots.some(s => s.overdue) ? "var(--red)" : "var(--t3)" }}>
                      {g.slots.filter(s => s.logged).length}/{g.slots.length}
                    </span>
                    <ChevronDown size={16} style={{ color: "var(--t4)", flexShrink: 0, transition: "transform .2s", transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </div>
                  {!isCollapsed && g.slots.map((s, i) => (
                    <div key={i} className="row" style={{ cursor: "default", alignItems: "center" }}>
                      <div className="row-icon" style={{ background: s.logged ? "var(--ib2)" : s.overdue ? "var(--ib6)" : "var(--ib1)" }}>
                        <Pill size={19} color={s.logged ? "var(--green)" : s.overdue ? "var(--red)" : "var(--teal)"} strokeWidth={2.2} />
                      </div>
                      <div className="row-body">
                        <div className="row-title" style={{ fontWeight: 600 }}>{s.med.name}</div>
                        <div className="row-sub">{s.med.dosage_amount}{s.med.dosage_unit} · {s.time}{s.overdue ? " · overdue" : ""}</div>
                      </div>
                      <LogButton slot={s} now={now} onMarkDose={onMarkDose} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="section" style={{ paddingTop: 4 }}>
        <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CalendarDays size={15} color="var(--teal)" strokeWidth={2.2} /> Upcoming visits
          </span>
          <button className="nav-action" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }} onClick={onScheduleVisit}>
            <Plus size={14} strokeWidth={2.5} /> Schedule
          </button>
        </div>
        {upcomingVisits.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 24, paddingBottom: 24 }}>
            <div className="empty-state-icon"><Building2 size={40} strokeWidth={1.5} /></div>
            <div className="empty-state-title" style={{ fontSize: 15 }}>No visits scheduled</div>
            <div className="empty-state-sub" style={{ marginBottom: 0 }}>Keep track of hospital & clinic appointments.</div>
            <button className="btn btn-primary" style={{ width: "auto", padding: "11px 20px" }} onClick={onScheduleVisit}>Schedule a visit</button>
          </div>
        ) : (
          <div className="list">
            {upcomingVisits.slice(0, 3).map(v => (
              <div key={v.id} className="row" style={{ cursor: "pointer" }} onClick={() => onEditVisit(v)}>
                <div className="row-icon" style={{ background: "var(--ib5)" }}><Building2 size={19} color="var(--t1)" strokeWidth={2.2} /></div>
                <div className="row-body">
                  <div className="row-title">{v.reason || "Hospital visit"}{v.doctor ? ` · ${v.doctor}` : ""}</div>
                  <div className="row-sub">{fmtVisitDate(v)}{v.facility ? ` · ${v.facility}` : ""}</div>
                </div>
                <ChevronRight size={18} color="var(--t4)" />
              </div>
            ))}
          </div>
        )}
        {upcomingVisits.length > 3 && (
          <div style={{ padding: "6px 4px 2px" }}>
            <button onClick={onOpenVisits} style={{ background: "none", border: "none", color: "var(--teal)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              View all {upcomingVisits.length} visits <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="section" style={{ paddingTop: 4 }}>
        <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <HeartPulse size={15} color="var(--teal)" strokeWidth={2.2} /> Vitals
          </span>
        </div>
        <div className="list">
          {isPro ? (() => {
            const self = household.find(m => m.kind === "self") || household[0] || {};
            const sum = latestVitals(self);
            const has = sum.length > 0;
            return (
              <div key={self.key || "self"} className="row" onClick={onGoVitals} style={{ cursor: "pointer" }}>
                <div className="row-icon" style={{ background: has ? "var(--ib2)" : "var(--ib6)" }}>
                  <HeartPulse size={19} color={has ? "var(--teal)" : "var(--t3)"} strokeWidth={2.2} />
                </div>
                <div className="row-body">
                  <div className="row-title">Check your vitals</div>
                  <div className="row-sub">{has ? vitalsLine(sum) : "No readings yet"}</div>
                </div>
                <ChevronRight size={18} color="var(--t4)" />
              </div>
            );
          })() : (
            <div key="teaser" className="row" onClick={onUpgrade} style={{ cursor: "pointer" }}>
              <div className="row-icon" style={{ background: "var(--ib6)" }}>
                <HeartPulse size={19} color="var(--t3)" strokeWidth={2.2} />
              </div>
              <div className="row-body">
                <div className="row-title">Track vitals with Pro</div>
                <div className="row-sub">Blood pressure, glucose, weight & more</div>
              </div>
              <ChevronRight size={18} color="var(--t4)" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
