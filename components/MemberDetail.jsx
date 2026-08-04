"use client";

import { useState } from "react";
import { CSS } from "@/lib/constants";
import { activeMeds, missedDoses, weekDots, weekAdherence, streak, initials, expectedDosesToday, pushManagedMed } from "@/lib/household";
import { MemberSwitcher } from "@/components/ui";
import { ChevronLeft, Check, Pill, Plus, Phone, HeartPulse } from "lucide-react";

function MemberRing({ member, pct, size = 92, stroke = 6 }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const color = pct >= 1 ? "var(--green)" : pct >= 0.5 ? "var(--orange)" : "var(--red)";
  return (
    <div style={{ width: size, height: size, position: "relative", margin: "0 auto" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sep)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${Math.min(pct, 1) * c} ${c}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 8, borderRadius: "50%", overflow: "hidden", background: "var(--ib1)", display: "grid", placeItems: "center", fontSize: 34, fontWeight: 800, color: "var(--t1)", border: "3px solid var(--card)", boxShadow: "0 8px 24px rgba(0,0,0,.08)" }}>
        {member.avatarUrl ? <img src={member.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(member)}
      </div>
    </div>
  );
}

function ManagedMedForm({ member, onDone }) {
  const [f, setF] = useState({ name: "", dosage_amount: "", dosage_unit: "tablet(s)", times_per_day: "1", dose_interval_hours: "8", course_duration_days: "", start_date: new Date().toISOString().split("T")[0], pills_per_package: "" });
  const [err, setErr] = useState("");
  function save() {
    if (!f.name.trim() || !f.dosage_amount || !f.course_duration_days) { setErr("Fill in name, dosage, and duration."); return; }
    pushManagedMed(member.rowId, {
      id: "mm_" + Date.now() + Math.random().toString(36).slice(2, 6),
      name: f.name.trim(),
      dosage_amount: parseFloat(f.dosage_amount),
      dosage_unit: f.dosage_unit,
      times_per_day: parseInt(f.times_per_day) || 1,
      dose_interval_hours: parseFloat(f.dose_interval_hours),
      course_duration_days: parseInt(f.course_duration_days),
      start_date: f.start_date,
      pills_per_package: f.pills_per_package ? parseInt(f.pills_per_package) : null,
      active: true,
    });
    setF({ ...f, name: "", dosage_amount: "", course_duration_days: "" });
    onDone();
  }
  return (
    <div style={{ background: "var(--hover)", borderRadius: 18, padding: 16, marginBottom: 12 }}>
      {err && <div className="err-msg" style={{ marginBottom: 8 }}>{err}</div>}
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: .4, marginBottom: 10 }}>Add medication</div>
      <input className="sheet-input" placeholder="Medication name" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} style={{ marginBottom: 10 }} />
      <div className="sheet-row" style={{ marginBottom: 10 }}>
        <input className="sheet-input" type="number" inputMode="decimal" placeholder="Dosage (e.g. 2)" value={f.dosage_amount} onChange={e => setF(p => ({ ...p, dosage_amount: e.target.value }))} />
        <select className="sheet-input" value={f.dosage_unit} onChange={e => setF(p => ({ ...p, dosage_unit: e.target.value }))}>
          {["tablet(s)", "capsule(s)", "ml", "mg", "mcg", "drop(s)", "puff(s)"].map(u => <option key={u}>{u}</option>)}
        </select>
      </div>
      <div className="sheet-row" style={{ marginBottom: 10 }}>
        <input className="sheet-input" type="number" inputMode="numeric" placeholder="Times/day" value={f.times_per_day} onChange={e => setF(p => ({ ...p, times_per_day: e.target.value }))} />
        <input className="sheet-input" type="number" inputMode="numeric" placeholder="Days" value={f.course_duration_days} onChange={e => setF(p => ({ ...p, course_duration_days: e.target.value }))} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={save}><Plus size={14} /> Add</button>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}

export default function MemberDetail({ member, onBack, onMarkDose, onEditMed, onRefill, onSaveNote, onOpenVitals, isFamily, household, onSwitchMember, onChanged }) {
  const [showAddMed, setShowAddMed] = useState(false);
  const [editNote, setEditNote] = useState(false);
  const [noteText, setNoteText] = useState(member.careNote || "");
  const [savedNote, setSavedNote] = useState(false);
  const now = new Date();
  const slots = expectedDosesToday(member, now);
  const missed = missedDoses(member, now);
  const dots = weekDots(member, now);
  const adh = weekAdherence(member, now);
  const streakDays = streak(member);
  const meds = activeMeds(member);
  const phoneHref = member.phone ? `tel:${member.phone}` : null;

  function saveNote() {
    onSaveNote(member, noteText.trim());
    setEditNote(false);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 1500);
  }

  const dotColors = { taken: "var(--green)", partial: "var(--orange)", missed: "var(--red)", future: "var(--t4)", none: "var(--t4)" };

  return (
    <div className="scroll">
      <style>{CSS}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 8px 4px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--teal)", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <span style={{ fontSize: 13, color: "var(--t3)", fontWeight: 500 }}>Family</span>
        <span style={{ fontSize: 13, color: "var(--t4)" }}>/</span>
        <span style={{ fontSize: 13, color: "var(--t2)", fontWeight: 600 }}>{member.name}</span>
      </div>

      {household?.length > 1 && (
        <div style={{ padding: "6px 14px 0" }}>
          <MemberSwitcher members={household} value={member?.key} onChange={k => onSwitchMember?.(household.find(m => m.key === k) || member)} />
        </div>
      )}

      <div style={{ margin: "12px 20px 18px", textAlign: "center" }}>
        <MemberRing member={member} pct={slots.length ? slots.filter(s => s.logged).length / slots.length : 0} />
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.4, color: "var(--t1)", marginTop: 10 }}>{member.name}</div>
        <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 2 }}>
          {[member.relationship, member.age ? `${member.age} yrs` : null].filter(Boolean).join(" · ") || (member.pending ? "Invited" : member.kind === "self" ? "You" : "Family member")}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px", marginBottom: 20 }}>
        {[
          { v: adh === null ? "—" : `${adh}%`, l: "This week", c: adh === null ? "var(--t3)" : adh >= 80 ? "var(--green)" : adh >= 50 ? "var(--orange)" : "var(--red)" },
          { v: streakDays, l: "Day streak", c: "var(--purple)" },
        ].map(s => (
          <div key={s.l} style={{ background: "var(--card)", borderRadius: 18, padding: "16px 8px", textAlign: "center", boxShadow: "var(--card-shadow)", border: "var(--card-border)" }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.4, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500, marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {(member.kind === "self" || isFamily) && (() => {
        const memberVitals = member.vitals || [];
        const latestByType = {};
        memberVitals.forEach(v => { if (v.type && !latestByType[v.type]) latestByType[v.type] = v; });
        const vitalsTypes = Object.keys(latestByType);
        return (
          <div className="section" style={{ marginBottom: 12 }}>
            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Vitals</span>
              <button className="nav-action" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }} onClick={() => onOpenVitals && onOpenVitals(member)}>
                <Plus size={15} strokeWidth={2.5} /> Log reading
              </button>
            </div>
            {vitalsTypes.length === 0 ? (
              <div className="empty-state" style={{ paddingTop: 24, paddingBottom: 24 }}>
                <div className="empty-state-icon" style={{ fontSize: 36 }}><HeartPulse size={36} strokeWidth={1.5} /></div>
                <div className="empty-state-title" style={{ fontSize: 15 }}>No vitals yet</div>
                <div className="empty-state-sub" style={{ marginBottom: 0 }}>Log {member.kind === "self" ? "your" : `${member.name.split(" ")[0]}'s`} first reading — blood pressure, glucose, weight & more.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, padding: "0 16px 8px" }}>
                {vitalsTypes.map(type => {
                  const v = latestByType[type];
                  return (
                    <div key={type} style={{ background: "var(--card)", borderRadius: 12, padding: "10px 12px", boxShadow: "var(--card-shadow)", border: "var(--card-border)" }}>
                      <div style={{ fontSize: 10, color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: .3, marginBottom: 3 }}>{type.replace(/_/g, " ")}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)", lineHeight: 1 }}>
                        {v.value}{v.value_secondary != null ? `/${v.value_secondary}` : ""} <span style={{ fontSize: 11, fontWeight: 400, color: "var(--t3)" }}>{v.unit}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 3 }}>{v.created_at ? new Date(v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ padding: "0 16px 16px" }}>
              <button onClick={() => onOpenVitals && onOpenVitals(member)} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "1.5px solid var(--sep)", background: "var(--card)", color: "var(--teal)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                View full vitals
              </button>
            </div>
          </div>
        );
      })()}

      <div className="section" style={{ marginBottom: 12 }}>
        <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Today's medications</span>
          <button className="nav-action" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }} onClick={() => { if (member.managed) setShowAddMed(v => !v); else onEditMed(member, null); }}>
            <Plus size={15} strokeWidth={2.5} /> Add
          </button>
        </div>
        {member.managed && showAddMed && <ManagedMedForm member={member} onDone={() => { setShowAddMed(false); onChanged && onChanged(); }} />}
        {slots.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 24, paddingBottom: 24 }}>
            <div className="empty-state-icon" style={{ fontSize: 36 }}><Pill size={36} strokeWidth={1.5} /></div>
            <div className="empty-state-title" style={{ fontSize: 15 }}>Nothing due today</div>
            <div className="empty-state-sub" style={{ marginBottom: 0 }}>Add a medication to start tracking {member.name.split(" ")[0]}'s doses.</div>
          </div>
        ) : (
          <div className="list">
            {slots.map((s, i) => {
              const medRow = meds.find(m => m.id === s.med.id);
              return (
                <div key={i} className="row" style={{ cursor: "default" }}>
                  <div onClick={() => !s.logged && onMarkDose(member, s)}
                    style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, border: s.logged ? "none" : `2px solid ${s.overdue ? "var(--red)" : "var(--sep)"}`, background: s.logged ? "var(--ib2)" : "transparent", cursor: s.logged ? "default" : "pointer", transition: "transform .15s" }}>
                    {s.logged ? <Check size={18} strokeWidth={3} color="var(--green)" /> : <span style={{ fontSize: 10, fontWeight: 700, color: s.overdue ? "var(--red)" : "var(--t3)" }}>{s.time}</span>}
                  </div>
                  <div className="row-body">
                    <div className="row-title" style={{ fontWeight: 500 }}>{s.med.name} {s.med.dosage_amount}{s.med.dosage_unit}</div>
                    <div className="row-sub">{s.med.notes || `${s.time} · tap the circle when taken`}</div>
                  </div>
                  {medRow && medRow.pills_per_package && (
                    <button className="btn btn-sm btn-ghost" style={{ flexShrink: 0, fontSize: 11, padding: "5px 10px" }} onClick={() => onRefill(member, medRow)}>Refill</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {meds.length > 0 && !member.managed && (
        <div style={{ padding: "0 20px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {meds.map(m => (
            <div key={m.id} style={{ background: "var(--card)", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--card-shadow)", border: "var(--card-border)" }}>
              <Pill size={16} strokeWidth={2} color="var(--teal)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>{m.name}</div>
                <div style={{ fontSize: 12, color: "var(--t3)" }}>{m.dosage_amount} {m.dosage_unit} · {m.times_per_day}×/day</div>
              </div>
              <button onClick={() => onEditMed(member, m)} style={{ background: "none", border: "none", color: "var(--teal)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Edit</button>
            </div>
          ))}
        </div>
      )}

      <div className="section" style={{ marginBottom: 12 }}>
        <div className="section-header">This week</div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 18px" }}>
          {dots.map((d, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)" }}>{d.label}</span>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: d.state === "future" || d.state === "none" ? "var(--sep)" : dotColors[d.state], opacity: d.state === "future" || d.state === "none" ? 0.5 : 1 }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: "0 20px 20px", background: "#FFF8E7", borderRadius: 20, padding: "18px", border: "1px solid #F0DFB8" }}>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 15, lineHeight: 1.55, color: "#8A6D2F" }}>
          "{member.careNote || "Tap to add a care note — preferences, quirks, what makes them comfortable."}"
        </div>
        {editNote ? (
          <div style={{ marginTop: 12 }}>
            <textarea className="sheet-input" rows={3} value={noteText} onChange={e => setNoteText(e.target.value)} style={{ fontSize: 14, background: "#FFFDF6" }} autoFocus />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={saveNote}>{savedNote ? "Saved ✓" : "Save note"}</button>
              <button className="btn btn-sm btn-ghost" style={{ flex: 1, background: "#FFFDF6" }} onClick={() => setEditNote(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-sm" style={{ marginTop: 12, background: "#F5E6C4", color: "#8A6D2F", fontWeight: 600, border: "none", width: "auto", padding: "8px 16px" }}
            onClick={() => { setNoteText(member.careNote || ""); setEditNote(true); }}>
            {member.careNote ? "Edit note" : "Add a care note"}
          </button>
        )}
      </div>

      {missed.length > 0 && (
        <div style={{ margin: "0 20px 20px", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#FF3B30,#FF6B3A)", borderRadius: 18, padding: "14px 16px", color: "white" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{missed.length} missed dose{missed.length > 1 ? "s" : ""} today</div>
            <div style={{ fontSize: 12, opacity: .85 }}>{missed.map(m => `${m.time} · ${m.med.name}`).join(", ")}</div>
          </div>
          {phoneHref && <a href={phoneHref} style={{ width: 42, height: 42, borderRadius: "50%", background: "white", display: "grid", placeItems: "center", flexShrink: 0 }}><Phone size={19} color="var(--red)" /></a>}
        </div>
      )}
    </div>
  );
}
