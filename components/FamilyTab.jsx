"use client";

import { useState, useEffect } from "react";
import { sb } from "@/lib/supabase";
import { CSS, fmtDateLong } from "@/lib/constants";
import { getStockStatus, getUpcomingVisits, computeMissedDoses } from "@/lib/data";
import { UpgradeModal } from "@/components/Modals";
import { User, Pill, AlertTriangle, TrendingDown, Package, Bell, FileText, Users, Plus, ChevronLeft, HeartPulse, Activity } from "lucide-react";

function Ico({ children, ...props }) {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }} {...props}>{children}</span>;
}

function MemberRing({ pct, size = 40, stroke = 3.5 }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const p = Math.min(Math.max(pct, 0), 1);
  const color = p >= 0.8 ? "#34C759" : p >= 0.5 ? "#FF9500" : "#FF3B30";
  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${p * c} ${c}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.28, fontWeight: 800, color }}>
        {Math.round(p * 100)}%
      </div>
    </div>
  );
}

export default function FamilyTab({ user, plan, onSaveProfile, onBack }) {
  const [members, setMembers] = useState([]);
  const [memberData, setMemberData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [reporting, setReporting] = useState(false);

  const limits = { free: { profiles: 0 }, pro: { profiles: 0 }, family: { profiles: 5 } };
  const maxMembers = (limits[plan] || limits.free).profiles;
  const isFamily = plan === "family";

  useEffect(() => {
    if (!user?.id) return;
    loadMembers();
  }, [user?.id, plan]);

  async function loadMembers() {
    try {
      const { data, error } = await sb.from("family_members")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      setMembers(rows);

      const linked = rows.filter(m => m.member_user_id && m.status === "active");
      if (linked.length) {
        const entries = await Promise.all(linked.map(async m => {
          const [medsRes, logsRes, profRes] = await Promise.all([
            sb.from("medications").select("*").eq("user_id", m.member_user_id).order("created_at", { ascending: false }),
            sb.from("dose_logs").select("*, medications(name)").eq("user_id", m.member_user_id).order("taken_at", { ascending: false }).limit(120),
            sb.from("profiles").select("full_name, avatar_url, wake_time, reminder_lead").eq("id", m.member_user_id).maybeSingle(),
          ]);
          return { id: m.id, meds: medsRes.data || [], logs: logsRes.data || [], profile: profRes.data || null };
        }));
        const map = {};
        entries.forEach(e => { map[e.id] = e; });
        setMemberData(map);
      } else {
        setMemberData({});
      }
    } catch (e) {
      console.error("loadMembers:", e);
    } finally {
      setLoading(false);
    }
  }

  function displayName(m) {
    return m.member_name || memberData[m.id]?.profile?.full_name || m.member_email;
  }

  function missedFor(m) {
    const d = memberData[m.id];
    if (!d) return [];
    return computeMissedDoses(d.meds, d.logs, d.profile || {});
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !user?.id) return;
    setSending(true);
    try {
      const { error } = await sb.from("family_members").insert([{
        owner_id: user.id,
        member_email: inviteEmail.trim().toLowerCase(),
        role: "member",
        status: "pending",
      }]);
      if (!error) {
        setInviteEmail("");
        setShowInvite(false);
        loadMembers();
      } else {
        console.error("invite error:", error.message || error);
      }
    } catch (e) {
      console.error("invite error:", e);
    } finally {
      setSending(false);
    }
  }

  async function removeMember(id) {
    if (!confirm("Remove this family member?")) return;
    try {
      await sb.from("family_members").eq("id", id).delete();
      if (selectedMember?.id === id) setSelectedMember(null);
      loadMembers();
    } catch (e) {
      console.error("removeMember:", e);
    }
  }

  async function viewMember(member) {
    setSelectedMember(member);
    if (memberData[member.id] || !member.member_user_id) return;
    try {
      const [medsRes, logsRes, profRes] = await Promise.all([
        sb.from("medications").select("*").eq("user_id", member.member_user_id).order("created_at", { ascending: false }),
        sb.from("dose_logs").select("*, medications(name)").eq("user_id", member.member_user_id).order("taken_at", { ascending: false }).limit(120),
        sb.from("profiles").select("full_name, avatar_url, wake_time, reminder_lead").eq("id", member.member_user_id).maybeSingle(),
      ]);
      setMemberData(prev => ({ ...prev, [member.id]: { meds: medsRes.data || [], logs: logsRes.data || [], profile: profRes.data || null } }));
    } catch (e) {
      console.error("viewMember:", e);
    }
  }

  function calcAdherence(meds, logs) {
    if (!meds.length) return 0;
    const grouped = {};
    logs.forEach(l => { const d = l.taken_at?.split("T")[0]; if (d) { if (!grouped[d]) grouped[d] = []; grouped[d].push(l); } });
    const daysTracked = Object.keys(grouped).length;
    if (!daysTracked) return 0;
    const totalExpected = daysTracked * meds.reduce((s, m) => s + (m.times_per_day || 1), 0);
    return totalExpected > 0 ? Math.min(Math.round((logs.length / totalExpected) * 100), 100) : 0;
  }

  function calcStreak(meds, logs) {
    const now = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const dayLogs = logs.filter(l => l.taken_at?.startsWith(ds));
      const totalExpected = meds.reduce((s, m) => s + (m.times_per_day || 1), 0);
      if (totalExpected === 0) break;
      if (dayLogs.length >= totalExpected) streak++;
      else if (i > 0) break;
    }
    return streak;
  }

  async function generateFamilyReport() {
    const active = members.filter(m => m.member_user_id && m.status === "active");
    if (!active.length) { alert("No linked family members yet. Ask a member to accept your invite first."); return; }
    setReporting(true);
    try {
      const data = await Promise.all(active.map(async m => {
        const [medsRes, logsRes] = await Promise.all([
          sb.from("medications").select("*").eq("user_id", m.member_user_id),
          sb.from("dose_logs").select("*").eq("user_id", m.member_user_id),
        ]);
        return { member: m, meds: medsRes.data || [], logs: logsRes.data || [] };
      }));

      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = 210, ml = 20, mr = 20;
      let y = 20;

      const checkPage = () => { if (y > 265) { doc.addPage(); y = 20; } };

      doc.setFont("helvetica", "bold"); doc.setFontSize(22);
      doc.setTextColor(0, 122, 255);
      doc.text("Adhera", ml, y);
      doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      doc.setTextColor(140, 140, 140);
      doc.text("Family Medication Adherence Report", ml, y + 5);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, ml, y + 10);
      y += 18;
      doc.setDrawColor(0, 122, 255); doc.setLineWidth(0.6);
      doc.line(ml, y, pageW - mr, y); y += 10;

      data.forEach(({ member, meds, logs }) => {
        checkPage();
        const name = member.member_name || member.member_email;
        const adherence = calcAdherence(meds, logs);
        const streak = calcStreak(meds, logs);
        const pm = meds.map(med => {
          const medLogs = logs.filter(l => l.medication_id === med.id);
          const expected = med.course_duration_days * (med.times_per_day || 1);
          const pct = expected > 0 ? Math.min(Math.round((medLogs.length / expected) * 100), 100) : 0;
          return { ...med, taken: medLogs.length, expected, pct };
        });

        doc.setFont("helvetica", "bold"); doc.setFontSize(14);
        doc.setTextColor(20, 20, 20);
        doc.text(name, ml, y); y += 6;
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Overall adherence: ${adherence}%  |  Streak: ${streak} days  |  Medications: ${meds.length}`, ml, y); y += 6;

        if (pm.length === 0) {
          doc.setFont("helvetica", "italic"); doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text("No medications on record.", ml + 2, y); y += 5;
        } else {
          pm.forEach(m => {
            checkPage();
            const status = m.pct >= 80 ? "Good" : m.pct >= 50 ? "Fair" : "Poor";
            doc.setFont("helvetica", "bold"); doc.setFontSize(10);
            doc.setTextColor(30, 30, 30);
            doc.text(`- ${m.name}: ${m.pct}% (${status})`, ml + 2, y); y += 4;
            doc.setFont("helvetica", "normal"); doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`  ${m.taken}/${m.expected} doses taken  (${m.dosage_amount} ${m.dosage_unit})`, ml + 4, y); y += 4;
          });
        }
        y += 6;
      });

      doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text("Generated by Adhera · adhera.app · Confidential", ml, 287);
      doc.save(`adhera_family_report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error("family report:", e);
      alert("Could not generate the report. Please try again.");
    } finally {
      setReporting(false);
    }
  }

  const linkedMembers = members.filter(m => m.member_user_id && m.status === "active");
  const allMissed = members.flatMap(m => missedFor(m));
  const householdAdherence = linkedMembers.length
    ? Math.round(linkedMembers.reduce((s, m) => s + calcAdherence(memberData[m.id]?.meds || [], memberData[m.id]?.logs || []), 0) / linkedMembers.length)
    : 0;
  const householdMeds = linkedMembers.reduce((s, m) => s + (memberData[m.id]?.meds || []).filter(x => x.active).length, 0);

  if (loading) {
    return (
      <div className="scroll" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 120 }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--sep)", borderTopColor: "var(--teal)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontSize: 14, color: "var(--t3)", marginTop: 14 }}>Loading family dashboard…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (selectedMember) {
    const d = memberData[selectedMember.id] || { meds: [], logs: [], profile: null };
    const memberMeds = d.meds || [];
    const memberLogs = d.logs || [];
    const memberProfile = d.profile || {};
    const name = displayName(selectedMember);
    const adherence = calcAdherence(memberMeds, memberLogs);
    const streak = calcStreak(memberMeds, memberLogs);
    const activeMeds = memberMeds.filter(m => m.active);
    const missed = computeMissedDoses(memberMeds, memberLogs, memberProfile);

    return (
      <div className="scroll">
        <style>{CSS}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 8px 4px" }}>
          {onBack && (
            <button onClick={() => setSelectedMember(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--teal)", display: "flex", alignItems: "center" }}>
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
          )}
          <span style={{ fontSize: 13, color: "var(--t3)", fontWeight: 500 }}>Family</span>
          <span style={{ fontSize: 13, color: "var(--t4)" }}>/</span>
          <span style={{ fontSize: 13, color: "var(--t2)", fontWeight: 600 }}>{name}</span>
        </div>

        <div style={{ margin: "12px 20px 18px", textAlign: "center" }}>
          <div style={{ width: 84, height: 84, borderRadius: "50%", margin: "0 auto 12px", overflow: "hidden", background: "linear-gradient(135deg,#E8F4FD,#F5E8FF)", display: "grid", placeItems: "center", fontSize: 34, fontWeight: 800, color: "var(--t1)", boxShadow: "0 8px 24px rgba(0,0,0,.08)", border: "3px solid #fff" }}>
            {memberProfile.avatar_url ? <img src={memberProfile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (name || "?").charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.4, color: "var(--t1)" }}>{name}</div>
          <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 4 }}>{selectedMember.member_email}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "0 20px", marginBottom: 20 }}>
          {[
            { v: memberMeds.length, l: "Medications", c: "var(--teal)" },
            { v: `${adherence}%`, l: "Adherence", c: adherence >= 80 ? "#34C759" : adherence >= 50 ? "var(--orange)" : "var(--red)" },
            { v: streak, l: "Day streak", c: "var(--purple)" },
          ].map(s => (
            <div key={s.l} style={{ background: "var(--card)", borderRadius: 18, padding: "14px 8px", textAlign: "center", boxShadow: "var(--card-shadow)", border: "var(--card-border)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -.3, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {missed.length > 0 && (
          <div className="section" style={{ marginBottom: 12 }}>
            <div style={{ background: "linear-gradient(135deg,#FF3B30,#FF6B3A)", borderRadius: 20, padding: "16px 18px", color: "white", boxShadow: "0 8px 24px rgba(255,59,48,.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                <Bell size={16} strokeWidth={2.2} /> Missed doses today
              </div>
              {missed.map((m, i) => (
                <div key={i} style={{ fontSize: 13, opacity: .95, marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={13} strokeWidth={2.2} /> {m.med.name} — missed the {m.time} dose
                </div>
              ))}
              <div style={{ fontSize: 11, opacity: .7, marginTop: 4 }}>Remind them to take it</div>
            </div>
          </div>
        )}

        {memberMeds.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 40 }}>
            <div className="empty-state-icon"><User size={52} strokeWidth={1.5} /></div>
            <div className="empty-state-title">No data yet</div>
            <div className="empty-state-sub">This member hasn&apos;t added any medications</div>
          </div>
        ) : (
          <>
            <div className="section">
              <div className="section-header">Active medications</div>
              <div className="list">
                {activeMeds.map((med, i) => {
                  const medLogs = memberLogs.filter(l => l.medication_id === med.id);
                  const expected = med.course_duration_days * (med.times_per_day || 1);
                  const pct = expected > 0 ? Math.min(Math.round((medLogs.length / expected) * 100), 100) : 0;
                  return (
                    <div key={med.id} className="row" style={{ cursor: "default" }}>
                      <div className="row-icon" style={{ background: "var(--ib1)" }}><Pill size={18} /></div>
                      <div className="row-body">
                        <div className="row-title">{med.name}</div>
                        <div className="row-sub">{med.dosage_amount} {med.dosage_unit} · {medLogs.length}/{expected} doses</div>
                        <div className="prog" style={{ marginTop: 6 }}><div className="prog-fill" style={{ width: `${pct}%`, background: pct >= 80 ? "#34C759" : pct >= 50 ? "var(--orange)" : "var(--red)" }} /></div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: pct >= 80 ? "#34C759" : pct >= 50 ? "var(--orange)" : "var(--red)", flexShrink: 0 }}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {activeMeds.some(m => m.pills_per_package) && (
              <div className="section">
                <div className="section-header">Medication stock</div>
                <div className="list">
                  {activeMeds.filter(m => m.pills_per_package).map(med => {
                    const s = getStockStatus(med, memberLogs);
                    if (!s) return null;
                    return (
                      <div key={med.id} className="row" style={{ cursor: "default" }}>
                        <div className="row-icon" style={{ background: s.status === "empty" ? "var(--ib6)" : s.status === "low" ? "var(--ib3)" : "var(--ib5)" }}>
                          {s.status === "empty" ? <AlertTriangle size={16} color="var(--red)" /> : s.status === "low" ? <TrendingDown size={16} color="var(--orange)" /> : <Package size={16} color="var(--teal)" />}
                        </div>
                        <div className="row-body">
                          <div className="row-title" style={{ fontSize: 15 }}>{med.name}</div>
                          <div className="row-sub" style={{ color: s.status === "empty" ? "var(--red)" : s.status === "low" ? "var(--orange)" : "var(--t3)" }}>
                            {s.remaining} of {s.total} left{s.status === "low" ? " · Refill soon!" : s.status === "empty" ? " · Out of stock!" : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {memberLogs.length > 0 && (
              <div className="section">
                <div className="section-header">Recent doses</div>
                <div className="list">
                  {memberLogs.slice(0, 10).map((log, i) => (
                    <div key={log.id} className="row" style={{ cursor: "default" }}>
                      <div className="row-icon" style={{ background: "var(--ib1)" }}><Pill size={15} /></div>
                      <div className="row-body"><div className="row-title" style={{ fontSize: 14 }}>{log.medications?.name || "Medication"}</div></div>
                      <div className="row-value" style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500 }}>{fmtDateLong(log.taken_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ padding: "4px 20px 20px" }}>
          <button className="btn btn-ghost" onClick={() => setSelectedMember(null)}>Back to family</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll">
      <style>{CSS}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--teal)", display: "flex", alignItems: "center" }}>
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
          )}
          <div className="nav-large" style={{ padding: 0 }}>Family</div>
        </div>
        {isFamily && (
          <button className="nav-action" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }} onClick={() => setShowInvite(true)}>
            <Plus size={16} strokeWidth={2.5} /> Invite
          </button>
        )}
      </div>

      {!isFamily ? (
        <div className="upgrade-card" style={{ margin: "16px 20px" }}>
          <div className="upgrade-title">Family dashboard</div>
          <div className="upgrade-sub">Track your loved ones&apos; medication adherence from one place. Upgrade to Family to add up to 5 profiles.</div>
          <button className="upgrade-btn" onClick={() => setShowUpgrade(true)}>Upgrade to Family →</button>
        </div>
      ) : (
        <>
          <div style={{ margin: "16px 20px 14px", borderRadius: 26, overflow: "hidden", background: "linear-gradient(135deg,#007AFF,#5856D6 70%,#AF52DE)", padding: 24, color: "white", boxShadow: "0 16px 40px rgba(0,122,255,.28)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, opacity: .85, marginBottom: 4 }}>
              <HeartPulse size={15} strokeWidth={2.2} /> HOUSEHOLD
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1 }}>{linkedMembers.length}</div>
                <div style={{ fontSize: 14, opacity: .85, marginTop: 4 }}>linked member{linkedMembers.length !== 1 ? "s" : ""} · {householdMeds} active meds</div>
              </div>
              <div style={{ width: 92, height: 92, borderRadius: 30, background: "rgba(255,255,255,.16)", backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.5 }}>{householdAdherence}%</div>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: .8 }}>ADHERENCE</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,.14)", borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{allMissed.length}</div>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: .8, marginTop: 2 }}>MISSED TODAY</div>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,.14)", borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{members.filter(m => m.status === "pending").length}</div>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: .8, marginTop: 2 }}>PENDING</div>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,.14)", borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{maxMembers - members.length}</div>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: .8, marginTop: 2 }}>SLOTS LEFT</div>
              </div>
            </div>
          </div>

          {allMissed.length > 0 && (
            <div style={{ margin: "0 20px 14px", background: "linear-gradient(135deg,#FF3B30,#FF6B3A)", borderRadius: 20, padding: "16px 18px", color: "white", boxShadow: "0 8px 24px rgba(255,59,48,.25)", display: "flex", alignItems: "center", gap: 12 }}>
              <Ico><AlertTriangle size={22} strokeWidth={2.2} /></Ico>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{allMissed.length} dose{allMissed.length > 1 ? "s" : ""} missed today</div>
                <div style={{ fontSize: 12, opacity: .85 }}>Tap a member to see details and remind them</div>
              </div>
            </div>
          )}

          {members.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 40 }}>
              <div className="empty-state-icon"><Users size={52} strokeWidth={1.5} /></div>
              <div className="empty-state-title">No family members yet</div>
              <div className="empty-state-sub">Invite family members to track their medications together</div>
              <button className="btn btn-primary" style={{ width: "auto", marginTop: 14, padding: "12px 24px" }} onClick={() => setShowInvite(true)}>Invite first member</button>
            </div>
          ) : (
            <div className="section" style={{ padding: 0, margin: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 8px" }}>
                <span className="section-header" style={{ padding: 0 }}>Household</span>
                <span style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500 }}>{members.length}/{maxMembers}</span>
              </div>
              <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {members.map(m => {
                  const missed = missedFor(m);
                  const d = memberData[m.id];
                  const adh = d ? calcAdherence(d.meds, d.logs) : 0;
                  const name = displayName(m);
                  const linked = !!m.member_user_id && m.status === "active";
                  return (
                    <div key={m.id} onClick={() => linked && viewMember(m)} style={{
                      background: "var(--card)", borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", border: "var(--card-border)",
                      display: "flex", alignItems: "center", gap: 14, cursor: linked ? "pointer" : "default",
                    }}>
                      <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,#E8F4FD,#F5E8FF)", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 800, color: "var(--t1)", flexShrink: 0, border: "2px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
                        {d?.profile?.avatar_url ? <img src={d.profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                          {m.status === "pending" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "var(--ib3)", color: "var(--orange)" }}>PENDING</span>}
                        </div>
                        <div style={{ fontSize: 13, color: m.status === "pending" ? "var(--t3)" : missed.length > 0 ? "var(--red)" : "var(--t3)", marginTop: 3 }}>
                          {m.status === "pending" ? "They'll accept when they sign in" : missed.length > 0 ? `${missed.length} missed dose${missed.length > 1 ? "s" : ""} today` : `${d?.meds?.length || 0} active meds · up to date`}
                        </div>
                      </div>
                      {linked ? <MemberRing pct={adh / 100} /> : <span style={{ fontSize: 20, color: "var(--t4)" }}>›</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn btn-primary" style={{ borderRadius: 18 }} onClick={() => setShowInvite(true)}>
              <Plus size={18} strokeWidth={2.5} /> Invite family member
            </button>
            <button className="btn" style={{ background: "var(--card)", color: "var(--t1)", fontWeight: 600, border: "0.5px solid var(--sep)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={generateFamilyReport} disabled={reporting}>
              <FileText size={15} strokeWidth={2.2} /> {reporting ? "Generating…" : "Family report for the doctor"}
            </button>
          </div>

          <div className="section" style={{ padding: "0 20px", marginTop: 6 }}>
            <div style={{ background: "var(--card)", borderRadius: 22, padding: 18, boxShadow: "var(--card-shadow)", border: "var(--card-border)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t2)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Activity size={15} strokeWidth={2.2} color="var(--teal)" /> How it works
              </div>
              {[
                ["Invite by email", "Send an invite to a family member's email address"],
                ["They accept & sign up", "They log in with the invited email and accept the invite"],
                ["Track together", "View their medications, adherence, and missed doses — and get caregiver alerts"],
              ].map(([t, s], i) => (
                <div key={t} style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: i > 0 ? "0.5px solid var(--sep)" : "none" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--ib1)", color: "var(--teal)", fontSize: 13, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>{t}</div>
                    <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showInvite && (
        <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setShowInvite(false)}>
          <div className="sheet" style={{ maxHeight: "70vh" }} onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Invite family member</div>
              <div style={{ fontSize: 14, color: "var(--t2)", marginBottom: 12 }}>They&apos;ll receive an email to join your family group. Once they accept, you can track their medications.</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 6, fontWeight: 500 }}>Email address</div>
                <input className="sheet-input" type="email" placeholder="family@example.com" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleInvite()}
                  style={{ fontSize: 16 }} />
              </div>
              <div className="sheet-actions" style={{ gap: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleInvite} disabled={!inviteEmail.trim() || sending}>
                  {sending ? "Sending…" : "Send invite"}
                </button>
                <button className="btn btn-ghost" onClick={() => { setShowInvite(false); setInviteEmail(""); }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpgrade && (
        <UpgradeModal
          country={user?.user_metadata?.country}
          userEmail={user?.email}
          currentPlan={plan}
          onClose={() => setShowUpgrade(false)}
          onUpgrade={p => { onSaveProfile({ plan: p }); setShowUpgrade(false); }}
        />
      )}
    </div>
  );
}
