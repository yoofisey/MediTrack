"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLang } from "@/lib/i18n";
import { useTier } from "@/components/TierContext";
import { expectedDosesToday, activeMeds, missedDoses, weekAdherence, streak, initials, ringPct, memberStatus } from "@/lib/household";
import { getUpcomingVisits, getVisitTime, markVisitStatus } from "@/lib/data";
import { Users, User, Pill, CalendarDays, HeartPulse, ChevronRight, Check, Lock, Phone, Activity, BarChart3, Clock, Plus, Pencil, Trash2 } from "lucide-react";
import { AddMemberModal } from "@/components/Modals";
import { insertFamilyMember, insertManagedFamilyMember, fetchFamilyMembers } from "@/lib/db";
import MedLogButton from "@/components/MedLogButton";

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

function fmtVisitDate(v) {
  const d = new Date(v.date + "T" + (v.time || "09:00"));
  return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} · ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

export default function FamilyTab({ household, onMarkDose, onOpenVitals, onGoReports, user, onRefresh, onScheduleVisitForMember, onEditMed, onDeleteMed, onRemoveMember }) {
  const { t } = useLang();
  const { has, config } = useTier();
  const now = useMemo(() => new Date(), []);
  const [selectedKey, setSelectedKey] = useState(null);
  const [visitsTick, setVisitsTick] = useState(0);
  const [showAddMember, setShowAddMember] = useState(false);

  const members = useMemo(() => household, [household]);
  const selected = selectedKey ? household.find(m => m.key === selectedKey) : null;

  const allVisits = useMemo(() => getUpcomingVisits(60), [visitsTick]);
  const visits = useMemo(() => {
    if (!selected) return allVisits;
    if (selected.kind === "self") return allVisits.filter(v => !v.member_key || v.member_key === "self");
    return allVisits.filter(v => v.member_key === selected.key);
  }, [allVisits, selected]);

  function markVisit(id, status) {
    markVisitStatus(id, status);
    setVisitsTick(x => x + 1);
  }

  async function handleInviteEmail(email) {
    if (!user?.id || !email) return;
    const { error } = await insertFamilyMember(user.id, email);
    if (error) { console.error("invite insert error:", error?.message || error); return; }
    try {
      await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, senderName: user?.email || "Adhera Team" }),
      });
    } catch (e) { console.error("invite email:", e); }
    onRefresh?.();
  }

  async function handleAddManaged(fields) {
    if (!user?.id) return;
    await insertManagedFamilyMember(user.id, fields);
    onRefresh?.();
  }

  const selectedSlots = useMemo(() => selected ? expectedDosesToday(selected, now) : [], [selected, now]);
  const selectedDone = selectedSlots.filter(s => s.logged).length;
  const selectedMedRows = useMemo(() => {
    const byMed = {};
    selectedSlots.forEach(s => {
      if (!byMed[s.med.id]) byMed[s.med.id] = [];
      byMed[s.med.id].push(s);
    });
    return Object.values(byMed).map(ms => {
      const next = ms.find(s => !s.logged);
      return {
        med: ms[0].med,
        next,
        loggedCount: ms.filter(s => s.logged).length,
        total: ms.length,
        overdue: !!(next && now.getTime() - next.dueMs > 20 * 60000),
      };
    });
  }, [selectedSlots, now]);
  const selectedAdh = useMemo(() => selected ? weekAdherence(selected) : null, [selected]);
  const selectedStreak = useMemo(() => selected ? streak(selected) : 0, [selected]);
  const selectedMeds = useMemo(() => selected ? activeMeds(selected) : [], [selected]);
  const selectedVitals = selected?.vitals || [];

  function latestVitals(member, limit = 3) {
    const latest = {};
    (member.vitals || []).forEach(v => {
      if (!latest[v.type] || new Date(v.created_at) > new Date(latest[v.type].created_at)) latest[v.type] = v;
    });
    return Object.values(latest).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
  }

  return (
    <div className="scroll">
      <div className="nav-large">{t("nav.family")}</div>

      {members.length <= 1 ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ib4)", display: "grid", placeItems: "center" }}>
              <Users size={28} color="var(--teal2)" strokeWidth={2} />
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)", marginBottom: 6 }}>No family members yet</div>
          <div style={{ fontSize: 13, color: "var(--t3)", lineHeight: 1.5, marginBottom: 16 }}>Add family members to start tracking together.</div>
          <button onClick={() => setShowAddMember(true)} className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} strokeWidth={2.5} /> Add family member
          </button>
        </div>
      ) : (
        <>
          {/* Member selector */}
          <div style={{ padding: "0 20px", marginBottom: 8, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div style={{ display: "flex", gap: 10, paddingBottom: 8, minWidth: "min-content" }}>
              {members.map(m => {
                const isSel = m.key === selectedKey;
                const status = memberStatus(m);
                return (
                  <div key={m.key} onClick={() => setSelectedKey(m.key === selectedKey ? null : m.key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", minWidth: 62, flexShrink: 0 }}>
                    <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", background: isSel ? config.theme.accent : "var(--ib1)", display: "grid", placeItems: "center", fontSize: 17, fontWeight: 800, color: isSel ? "white" : "var(--t1)", border: isSel ? `3px solid ${config.theme.accent}` : "3px solid var(--card)", boxShadow: isSel ? `0 2px 12px ${config.theme.accent}40` : "0 2px 8px rgba(0,0,0,.08)", transition: "all .2s" }}>
                      {m.avatarUrl ? <img src={m.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(m)}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isSel ? config.theme.accent : "var(--t2)", whiteSpace: "nowrap" }}>{m.kind === "self" ? "You" : m.name}</span>
                    {status.label && m.kind !== "self" && (
                      <span style={{ fontSize: 9, fontWeight: 600, color: status.tone === "green" ? "var(--green)" : status.tone === "red" ? "var(--red)" : "var(--t3)", background: status.tone === "green" ? "var(--ib2)" : status.tone === "red" ? "var(--ib6)" : "var(--bg)", padding: "1px 6px", borderRadius: 99, whiteSpace: "nowrap" }}>{status.label}</span>
                    )}
                  </div>
                );
              })}
              {/* Add member button */}
              <div onClick={() => setShowAddMember(true)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", minWidth: 62, flexShrink: 0 }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--card)", border: "2px dashed var(--sep)", display: "grid", placeItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                  <Plus size={20} color="var(--teal)" strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--teal)", whiteSpace: "nowrap" }}>Add</span>
              </div>
            </div>
          </div>

          {/* Selected member content */}
          {selected ? (
            <div style={{ padding: "0 20px 24px" }}>
              {/* Summary card */}
              <div className="card" style={{ padding: 18, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: config.theme.accent, display: "grid", placeItems: "center", fontSize: 17, fontWeight: 800, color: "white", flexShrink: 0 }}>
                    {selected.avatarUrl ? <img src={selected.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(selected)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "var(--t1)" }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: "var(--t3)" }}>{selected.relationship || (selected.kind === "self" ? "You" : selected.email || "")}</div>
                  </div>
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ib2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Phone size={18} color="var(--teal)" strokeWidth={2.2} />
                    </a>
                  )}
                  {selected.kind !== "self" && onRemoveMember && (
                    <button onClick={() => onRemoveMember(selected)} aria-label="Remove member" title="Remove from plan" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ib6)", border: "none", display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer" }}>
                      <Trash2 size={18} color="var(--red)" strokeWidth={2.2} />
                    </button>
                  )}
                </div>

                {/* Stats row */}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <div style={{ flex: 1, background: "var(--bg)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: selectedAdh != null && selectedAdh >= 80 ? "var(--green)" : selectedAdh != null && selectedAdh >= 50 ? "var(--orange)" : "var(--t1)" }}>{selectedAdh != null ? `${selectedAdh}%` : "—"}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase" }}>This week</div>
                  </div>
                  <div style={{ flex: 1, background: "var(--bg)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--t1)" }}>{selectedDone}/{selectedSlots.length}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase" }}>Today</div>
                  </div>
                  <div style={{ flex: 1, background: "var(--bg)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--t1)" }}>{selectedStreak}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase" }}>Streak</div>
                  </div>
                </div>
              </div>

              {/* Today's Medications */}
              <div className="section">
                <div className="section-header">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Pill size={15} color="var(--teal)" strokeWidth={2.2} /> Today&apos;s medications
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    {selected.kind === "managed" && (
                      <button className="nav-action" onClick={() => onEditMed?.(selected, null)} style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}><Plus size={13} strokeWidth={2.5} /> Add</button>
                    )}
                    <span style={{ fontSize: 12, color: "var(--t3)" }}>{selectedDone}/{selectedSlots.length} done</span>
                  </span>
                </div>
                {selectedMedRows.length === 0 ? (
                  <div className="empty-state" style={{ paddingTop: 16, paddingBottom: 16 }}>
                    <div className="empty-state-title" style={{ fontSize: 14 }}>No medications scheduled</div>
                  </div>
                ) : (
                  <div className="list">
                    {selectedMedRows.map(r => (
                      <div key={r.med.id} className="row" style={{ cursor: "default", alignItems: "center" }}>
                        <div className="row-icon" style={{ background: !r.next ? "var(--ib2)" : r.overdue ? "var(--ib6)" : "var(--ib1)" }}>
                          <Pill size={19} color={!r.next ? "var(--green)" : r.overdue ? "var(--red)" : "var(--teal)"} strokeWidth={2.2} />
                        </div>
                        <div className="row-body">
                          <div className="row-title" style={{ fontSize: 14 }}>
                            {r.med.name}
                            <span style={{ fontSize: 12, color: "var(--t3)", marginLeft: 8 }}>{r.med.dosage_amount} {r.med.dosage_unit}</span>
                          </div>
                          <div className="row-sub">{r.loggedCount}/{r.total} doses today{!r.next ? " · taken" : r.overdue ? " · overdue" : ""}</div>
                        </div>
                        <MedLogButton member={selected} med={r.med} now={now} onMarkDose={onMarkDose} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Medications list (managed members can add/edit/delete) */}
              {selected.kind === "managed" && (
                <div className="section">
                  <div className="section-header">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Pill size={15} color="var(--teal)" strokeWidth={2.2} /> Medications
                    </span>
                    <button className="nav-action" onClick={() => onEditMed?.(selected, null)} style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}><Plus size={13} strokeWidth={2.5} /> Add</button>
                  </div>
                  {selectedMeds.length === 0 ? (
                    <div className="empty-state" style={{ paddingTop: 16, paddingBottom: 16 }}>
                      <div className="empty-state-title" style={{ fontSize: 14 }}>No medications yet</div>
                      <div className="empty-state-sub" style={{ marginBottom: 0 }}>Add {selected.name.split(" ")[0]}&apos;s first medication to start tracking doses.</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 4px" }}>
                      {selectedMeds.map(med => (
                        <div key={med.id} style={{ background: "var(--card)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--card-shadow)", border: "var(--card-border)" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--ib1)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <Pill size={17} color="var(--teal)" strokeWidth={2.2} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>{med.name}</div>
                            <div style={{ fontSize: 12, color: "var(--t3)" }}>{med.dosage_amount} {med.dosage_unit} · {med.times_per_day}×/day</div>
                          </div>
                          <button onClick={() => onEditMed?.(selected, med)} style={{ background: "none", border: "none", color: "var(--teal)", padding: 6, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }} aria-label="Edit medication">
                            <Pencil size={16} strokeWidth={2.2} />
                          </button>
                          <button onClick={() => onDeleteMed?.(selected, med)} style={{ background: "none", border: "none", color: "var(--red)", padding: 6, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }} aria-label="Delete medication">
                            <Trash2 size={16} strokeWidth={2.2} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Upcoming Visits */}
              <div className="section">
                <div className="section-header">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <CalendarDays size={15} color="var(--teal)" strokeWidth={2.2} /> Hospital visits
                  </span>
                  {selected.kind !== "self" && onScheduleVisitForMember && (
                    <button className="nav-action" onClick={() => onScheduleVisitForMember(selected.key)} style={{ fontSize: 12 }}>+ Schedule</button>
                  )}
                </div>
                {visits.length === 0 ? (
                  <div className="empty-state" style={{ paddingTop: 16, paddingBottom: 16 }}>
                    <div className="empty-state-title" style={{ fontSize: 14 }}>No visits scheduled</div>
                  </div>
                ) : (
                  <div className="list">
                    {visits.slice(0, 3).map(v => {
                      const visitTime = getVisitTime(v);
                      const isLocked = !v.status && visitTime > now;
                      return (
                        <div key={v.id} className="row" style={{ cursor: "default" }}>
                          <div className="row-icon" style={{ background: "var(--ib5)" }}>
                            <CalendarDays size={19} color="var(--t1)" strokeWidth={2.2} />
                          </div>
                          <div className="row-body">
                            <div className="row-title" style={{ fontSize: 14 }}>{v.reason || "Hospital visit"}{v.doctor ? ` · ${v.doctor}` : ""}</div>
                            <div className="row-sub">{fmtVisitDate(v)}{v.facility ? ` · ${v.facility}` : ""}</div>
                          </div>
                          {v.status === "attended" ? (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", background: "var(--ib2)", padding: "3px 10px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={12} strokeWidth={3} /> Attended</span>
                          ) : v.status === "missed" ? (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--red)", background: "var(--ib6)", padding: "3px 10px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 4 }}><Lock size={12} /> Missed</span>
                          ) : isLocked ? (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", background: "var(--bg)", padding: "3px 10px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 4 }}><Lock size={12} /> {v.time}</span>
                          ) : (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => markVisit(v.id, "attended")} style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", background: "var(--ib2)", padding: "4px 10px", borderRadius: 99, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><Check size={11} strokeWidth={3} /> Attended</button>
                              <button onClick={() => markVisit(v.id, "missed")} style={{ fontSize: 11, fontWeight: 600, color: "var(--red)", background: "var(--ib6)", padding: "4px 10px", borderRadius: 99, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}><Lock size={11} /> Missed</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Vitals (per-member) */}
              {has("perMemberVitals") && (
                <div className="section">
                  <div className="section-header">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <HeartPulse size={15} color="var(--teal)" strokeWidth={2.2} /> Vitals
                    </span>
                    <button className="nav-action" onClick={() => onOpenVitals?.(selected)} style={{ fontSize: 12 }}>View all</button>
                  </div>
                  {(() => {
                    const latest = latestVitals(selected);
                    if (latest.length === 0) {
                      return <div className="empty-state" style={{ paddingTop: 16, paddingBottom: 16 }}>
                        <div className="empty-state-title" style={{ fontSize: 14 }}>No vitals recorded</div>
                      </div>;
                    }
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 4px" }}>
                        {latest.map(v => {
                          const label = VITAL_LABELS[v.type] || v.type;
                          const unit = VITAL_UNITS[v.type] || v.unit || "";
                          const val = v.type === "blood_pressure" && v.value_secondary != null ? `${v.value}/${v.value_secondary}` : `${v.value}`;
                          return (
                            <div key={v.type} style={{ background: "var(--card)", borderRadius: 14, padding: 12, boxShadow: "var(--card-shadow)", border: "var(--card-border)" }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t1)" }}>{val}</div>
                              <div style={{ fontSize: 11, color: "var(--t3)" }}>{unit}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Per-Member Reports */}
              {has("perMemberReports") && (
                <div className="section">
                  <div className="section-header">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <BarChart3 size={15} color="var(--teal)" strokeWidth={2.2} /> Reports
                    </span>
                    <button className="nav-action" onClick={() => onGoReports?.(selected)} style={{ fontSize: 12 }}>Full report</button>
                  </div>
                  {selectedMeds.length === 0 ? (
                    <div className="empty-state" style={{ paddingTop: 16, paddingBottom: 16 }}>
                      <div className="empty-state-title" style={{ fontSize: 14 }}>No active medications</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 4px" }}>
                      {selectedMeds.map(med => {
                        const weekLogs = (selected.logs || []).filter(l => l.medication_id === med.id && (now - new Date(l.taken_at)) < 7 * 86400000);
                        const expectedPerDay = med.times_per_day || 1;
                        const totalExpected = expectedPerDay * 7;
                        const pct = totalExpected > 0 ? Math.min(Math.round((weekLogs.length / totalExpected) * 100), 100) : 0;
                        return (
                          <div key={med.id} style={{ background: "var(--card)", borderRadius: 14, padding: 12, boxShadow: "var(--card-shadow)", border: "var(--card-border)" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{med.name}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 80 ? "var(--green)" : pct >= 50 ? "var(--orange)" : "var(--red)" }}>{pct}%</span>
                            </div>
                            <div style={{ height: 4, borderRadius: 99, background: "var(--sep)", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: pct >= 80 ? "var(--green)" : pct >= 50 ? "var(--orange)" : "var(--red)", transition: "width .4s ease" }} />
                            </div>
                            <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>{weekLogs.length}/{totalExpected} doses this week · {med.dosage_amount} {med.dosage_unit}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: "30px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "var(--t3)" }}>Tap a member above to view their details</div>
            </div>
          )}
        </>
      )}
      {createPortal(
        showAddMember && (
          <AddMemberModal
            onInviteEmail={handleInviteEmail}
            onAddManaged={handleAddManaged}
            onClose={() => setShowAddMember(false)}
          />
        ),
        document.body
      )}
    </div>
  );
}
