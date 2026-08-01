"use client";

import { useState, useEffect } from "react";
import { sb } from "@/lib/supabase";
import { CSS, fmtDateLong } from "@/lib/constants";
import { getStockStatus, getUpcomingVisits, computeMissedDoses } from "@/lib/data";
import { UpgradeModal } from "@/components/Modals";
import { User, Pill, AlertTriangle, TrendingDown, Package, Hospital, Users, Bell, FileText, Sparkles, Crown } from "lucide-react";

export default function FamilyTab({ user, plan, onSaveProfile }) {
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
      if (selectedMember?.id === id) {
        setSelectedMember(null);
      }
      loadMembers();
    } catch (e) {
      console.error("removeMember:", e);
    }
  }

  async function viewMember(member) {
    setSelectedMember(member);
    if (memberData[member.id]) return;
    if (!member.member_user_id) return;
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

  if (loading) {
    return (
      <div className="scroll">
        <div className="nav-large">Family</div>
        <div style={{padding:16,textAlign:"center",color:"var(--t3)",fontSize:14}}>Loading family members…</div>
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
        <div style={{padding:"16px 16px 0",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={() => { setSelectedMember(null); }}
            style={{background:"none",border:"none",cursor:"pointer",padding:4,color:"var(--t2)"}}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
          <div style={{width:36,height:36,borderRadius:"50%",overflow:"hidden",background:"var(--ib4)",display:"grid",placeItems:"center",fontSize:15,fontWeight:700,color:"var(--t1)",flexShrink:0}}>
            {memberProfile.avatar_url ? <img src={memberProfile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : (name || "?").charAt(0).toUpperCase()}
          </div>
          <div style={{fontSize:20,fontWeight:700,color:"var(--t1)"}}>{name}</div>
        </div>

        <div className="chips" style={{marginTop:12}}>
          <div className="chip blue"><div className="chip-val">{memberMeds.length}</div><div className="chip-lbl">Medications</div></div>
          <div className="chip green"><div className="chip-val">{adherence}%</div><div className="chip-lbl">Adherence</div></div>
          <div className="chip purple"><div className="chip-val">{streak}</div><div className="chip-lbl">Streak</div></div>
        </div>

        {missed.length > 0 && (
          <div className="section">
            <div className="section-header" style={{display:"flex",alignItems:"center",gap:8,color:"var(--red)"}}>
              <Bell size={15} strokeWidth={2.2}/> Missed doses today
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {missed.map((m, i) => (
                <div key={i} style={{background:"var(--ib6)",borderRadius:"var(--rl)",padding:12,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:28,height:28,borderRadius:7,background:"var(--card)",display:"grid",placeItems:"center",flexShrink:0}}><AlertTriangle size={15} color="var(--red)"/></div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:"var(--t1)"}}>{m.med.name}</div>
                    <div style={{fontSize:12,color:"var(--red)"}}>Missed the {m.time} dose — remind them to take it</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {memberMeds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><User size={52} strokeWidth={1.5}/></div>
            <div className="empty-state-title">No data yet</div>
            <div className="empty-state-sub">This member hasn&apos;t added any medications</div>
          </div>
        ) : (
          <>
            <div className="section">
              <div className="section-header">Active medications</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {activeMeds.map((med, i) => {
                  const medLogs = memberLogs.filter(l => l.medication_id === med.id);
                  const expected = med.course_duration_days * (med.times_per_day || 1);
                  const pct = expected > 0 ? Math.min(Math.round((medLogs.length / expected) * 100), 100) : 0;
                  return (
                    <div key={med.id} style={{background:"var(--card)",borderRadius:"var(--rl)",padding:14,boxShadow:"var(--card-shadow)",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:30,height:30,borderRadius:8,background:"var(--ib4)",display:"grid",placeItems:"center",fontSize:16,flexShrink:0}}><Pill size={16}/></div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:600,color:"var(--t1)",marginBottom:2}}>{med.name}</div>
                        <div style={{fontSize:12,color:"var(--t3)",marginBottom:4}}>{med.dosage_amount} {med.dosage_unit} · {medLogs.length}/{expected} doses</div>
                        <div className="prog"><div className="prog-fill" style={{width:`${pct}%`,background:pct>=80?"var(--teal2)":pct>=50?"var(--orange)":"var(--red)"}}/></div>
                      </div>
                      <div style={{fontSize:16,fontWeight:700,color:pct>=80?"var(--teal2)":pct>=50?"var(--orange)":"var(--red)",flexShrink:0}}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {activeMeds.some(m => m.pills_per_package) && (
              <div className="section">
                <div className="section-header">Medication stock</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {activeMeds.filter(m => m.pills_per_package).map(med => {
                    const s = getStockStatus(med, memberLogs);
                    if (!s) return null;
                    return (
                      <div key={med.id} style={{background:"var(--card)",borderRadius:"var(--rl)",padding:12,boxShadow:"var(--card-shadow)",display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:28,height:28,borderRadius:7,background:s.status==="empty"?"var(--ib6)":s.status==="low"?"var(--ib3)":"var(--ib5)",display:"grid",placeItems:"center",fontSize:14,flexShrink:0}}>
                          {s.status==="empty"?<AlertTriangle size={15} style={{color:"var(--red)"}}/>:s.status==="low"?<TrendingDown size={15} style={{color:"var(--orange)"}}/>:<Package size={15} style={{color:"var(--teal)"}}/>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{med.name}</div>
                          <div style={{fontSize:12,color:s.status==="empty"?"var(--red)":s.status==="low"?"var(--orange)":"var(--t3)"}}>
                            {s.remaining} of {s.total} left{s.status==="low"?" · Refill soon!":s.status==="empty"?" · Out of stock!":""}
                          </div>
                        </div>
                        <div style={{width:36,height:6,borderRadius:3,background:"var(--sep)",overflow:"hidden",flexShrink:0}}>
                          <div style={{width:`${Math.min((s.remaining/s.total)*100,100)}%`,height:"100%",borderRadius:3,background:s.status==="empty"?"var(--red)":s.status==="low"?"var(--orange)":"var(--teal)",transition:"width .3s"}}/>
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
                <div style={{background:"var(--card)",borderRadius:"var(--rl)",overflow:"hidden",boxShadow:"var(--card-shadow)"}}>
                  {memberLogs.slice(0, 10).map((log, i) => (
                    <div key={log.id} className="row" style={{borderTop: i > 0 ? "0.5px solid var(--sep)" : "none", cursor: "default"}}>
                      <div style={{width:28,height:28,borderRadius:7,background:"var(--ib1)",display:"grid",placeItems:"center",fontSize:14,flexShrink:0}}><Pill size={15}/></div>
                      <div className="row-body">
                        <div className="row-title" style={{fontSize:14}}>{log.medications?.name || "Medication"}</div>
                      </div>
                      <span style={{fontSize:12,color:"var(--t3)"}}>{fmtDateLong(log.taken_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{padding:"16px"}}>
          <button className="btn btn-ghost" style={{width:"100%"}} onClick={() => setSelectedMember(null)}>← Back to family</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll">
      <div className="nav-large">Family</div>

      {maxMembers === 0 ? (
        <div className="upgrade-card" style={{margin:"0 16px 16px"}}>
          <div className="upgrade-title">Family dashboard</div>
          <div className="upgrade-sub">Track your loved ones&apos; medication adherence from one place. Upgrade to Family to add up to 5 profiles.</div>
          <button className="upgrade-btn" onClick={() => setShowUpgrade(true)}>Upgrade to Family →</button>
        </div>
      ) : (
        <>
          <div style={{padding:"0 16px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,color:"var(--t3)"}}>{members.length}/{maxMembers} members</div>
            <button className="btn btn-primary btn-sm" style={{width:"auto",fontSize:13}} onClick={() => setShowInvite(true)}>+ Invite</button>
          </div>

          {members.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={52} strokeWidth={1.5}/></div>
              <div className="empty-state-title">No family members yet</div>
              <div className="empty-state-sub">Invite family members to track their medications together</div>
              <button className="btn btn-primary" style={{marginTop:12}} onClick={() => setShowInvite(true)}>+ Invite first member</button>
            </div>
          ) : (
            <div className="section" style={{padding:"0 16px"}}>
              <div style={{background:"var(--card)",borderRadius:"var(--rl)",overflow:"hidden",boxShadow:"var(--card-shadow)"}}>
                {members.map((m, i) => {
                  const missed = missedFor(m);
                  return (
                    <div key={m.id} className="row" style={{borderTop: i > 0 ? "0.5px solid var(--sep)" : "none", cursor: m.member_user_id ? "pointer" : "default"}} onClick={() => m.member_user_id && viewMember(m)}>
                      <div style={{width:36,height:36,borderRadius:"50%",overflow:"hidden",background:"var(--ib4)",display:"grid",placeItems:"center",fontSize:16,flexShrink:0,color:"var(--t1)",fontWeight:600}}>
                        {memberData[m.id]?.profile?.avatar_url ? <img src={memberData[m.id].profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : (displayName(m) || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="row-body">
                        <div className="row-title">{displayName(m)}</div>
                        <div className="row-sub">
                          {m.status === "pending" ? "Invitation pending — they'll accept when they sign in" : missed.length > 0 ? `${missed.length} missed dose${missed.length>1?"s":""} today` : m.role === "admin" ? "Admin" : "Linked · up to date"}
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {m.status === "pending" && <span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:"var(--ib5)",color:"var(--t2)",fontWeight:500}}>Pending</span>}
                        {m.member_user_id && missed.length > 0 && <AlertTriangle size={15} color="var(--red)" style={{flexShrink:0}}/>}
                        <span style={{fontSize:14,color:"var(--t3)"}}>›</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{padding:"0 16px",marginBottom:12,marginTop:16}}>
            <button className="btn" style={{width:"100%",background:"var(--card)",color:"var(--t1)",fontWeight:600,border:"0.5px solid var(--sep)",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}
              onClick={generateFamilyReport} disabled={reporting}>
              <FileText size={15} strokeWidth={2.2}/> {reporting ? "Generating…" : "Family report for the doctor"}
            </button>
          </div>

          <div className="section" style={{padding:"0 16px",marginTop:16}}>
            <div className="section-header" style={{fontSize:14}}>How it works</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{background:"var(--card)",borderRadius:"var(--rl)",padding:14,boxShadow:"var(--card-shadow)",display:"flex",gap:12}}>
                <div style={{width:28,height:28,borderRadius:7,background:"var(--ib1)",display:"grid",placeItems:"center",fontSize:14,flexShrink:0}}>1</div>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--t1)"}}>Invite by email</div>
                  <div style={{fontSize:12,color:"var(--t3)"}}>Send an invite to a family member&apos;s email address</div>
                </div>
              </div>
              <div style={{background:"var(--card)",borderRadius:"var(--rl)",padding:14,boxShadow:"var(--card-shadow)",display:"flex",gap:12}}>
                <div style={{width:28,height:28,borderRadius:7,background:"var(--ib2)",display:"grid",placeItems:"center",fontSize:14,flexShrink:0}}>2</div>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--t1)"}}>They accept & sign up</div>
                  <div style={{fontSize:12,color:"var(--t3)"}}>They log in with the invited email and accept the invite</div>
                </div>
              </div>
              <div style={{background:"var(--card)",borderRadius:"var(--rl)",padding:14,boxShadow:"var(--card-shadow)",display:"flex",gap:12}}>
                <div style={{width:28,height:28,borderRadius:7,background:"var(--ib3)",display:"grid",placeItems:"center",fontSize:14,flexShrink:0}}>3</div>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--t1)"}}>Track together</div>
                  <div style={{fontSize:12,color:"var(--t3)"}}>View their medications, adherence, and missed doses — and get caregiver alerts</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showInvite && (
        <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setShowInvite(false)}>
          <div className="sheet" style={{maxHeight:"70vh"}} onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"/>
            <div style={{padding:"0 20px 20px"}}>
              <div style={{fontSize:20,fontWeight:700,marginBottom:16}}>Invite family member</div>
              <div style={{fontSize:14,color:"var(--t2)",marginBottom:12}}>They&apos;ll receive an email to join your family group. Once they accept, you can track their medications.</div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Email address</div>
                <input className="sheet-input" type="email" placeholder="family@example.com" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleInvite()}
                  style={{fontSize:16}}/>
              </div>
              <div className="sheet-actions" style={{gap:8}}>
                <button className="btn btn-primary" style={{flex:1}} onClick={handleInvite} disabled={!inviteEmail.trim() || sending}>
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
          onClose={() => setShowUpgrade(false)}
          onUpgrade={p => { onSaveProfile({ plan: p }); setShowUpgrade(false); }}
        />
      )}
    </div>
  );
}
