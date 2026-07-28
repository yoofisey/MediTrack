"use client";

import { useState, useEffect } from "react";
import { sb } from "@/lib/supabase";
import { CSS, fmtDateLong } from "@/lib/constants";
import { getStockStatus, getUpcomingVisits } from "@/lib/data";

export default function FamilyTab({ user, plan }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberLogs, setMemberLogs] = useState([]);
  const [memberMeds, setMemberMeds] = useState([]);

  const limits = { free: { profiles: 0 }, pro: { profiles: 0 }, family: { profiles: 5 } };
  const maxMembers = (limits[plan] || limits.free).profiles;

  useEffect(() => {
    if (!user?.id) return;
    loadMembers();
  }, [user?.id]);

  async function loadMembers() {
    try {
      const { data, error } = await sb.from("family_members")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) setMembers(data);
    } catch (e) {
      console.error("loadMembers:", e);
    } finally {
      setLoading(false);
    }
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
        setMemberLogs([]);
        setMemberMeds([]);
      }
      loadMembers();
    } catch (e) {
      console.error("removeMember:", e);
    }
  }

  async function viewMember(member) {
    setSelectedMember(member);
    setMemberLogs([]);
    setMemberMeds([]);
    if (!member.member_user_id) return;
    try {
      const [medsRes, logsRes] = await Promise.all([
        sb.from("medications").select("*").eq("user_id", member.member_user_id).order("created_at", { ascending: false }),
        sb.from("dose_logs").select("*, medications(name)").eq("user_id", member.member_user_id).order("taken_at", { ascending: false }).limit(100),
      ]);
      if (Array.isArray(medsRes.data)) setMemberMeds(medsRes.data);
      if (Array.isArray(logsRes.data)) setMemberLogs(logsRes.data);
    } catch (e) {
      console.error("viewMember:", e);
    }
  }

  function calcAdherence(meds, logs) {
    if (!meds.length) return 0;
    const now = new Date();
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

  const isOwner = true;

  if (loading) {
    return (
      <div className="scroll">
        <div className="nav-large">Family</div>
        <div style={{padding:16,textAlign:"center",color:"var(--t3)",fontSize:14}}>Loading family members…</div>
      </div>
    );
  }

  if (selectedMember) {
    const adherence = calcAdherence(memberMeds, memberLogs);
    const streak = calcStreak(memberMeds, memberLogs);
    const activeMeds = memberMeds.filter(m => m.active);

    return (
      <div className="scroll">
        <div style={{padding:"16px 16px 0",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={() => { setSelectedMember(null); setMemberLogs([]); setMemberMeds([]); }}
            style={{background:"none",border:"none",cursor:"pointer",padding:4,color:"var(--t2)"}}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
          <div style={{fontSize:20,fontWeight:700,color:"var(--t1)"}}>
            {selectedMember.member_name || selectedMember.member_email}
          </div>
        </div>

        <div className="chips" style={{marginTop:12}}>
          <div className="chip blue"><div className="chip-val">{memberMeds.length}</div><div className="chip-lbl">Medications</div></div>
          <div className="chip green"><div className="chip-val">{adherence}%</div><div className="chip-lbl">Adherence</div></div>
          <div className="chip purple"><div className="chip-val">{streak}</div><div className="chip-lbl">Streak</div></div>
        </div>

        {memberMeds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
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
                      <div style={{width:30,height:30,borderRadius:8,background:"var(--ib4)",display:"grid",placeItems:"center",fontSize:16,flexShrink:0}}>💊</div>
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
                          {s.status==="empty"?"⚠️":s.status==="low"?"📉":"📦"}
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

            {(() => {
              const visits = getUpcomingVisits(60);
              if (!visits.length) return null;
              return (
                <div className="section">
                  <div className="section-header">Upcoming visits</div>
                  <div style={{background:"var(--card)",borderRadius:"var(--rl)",overflow:"hidden",boxShadow:"var(--card-shadow)"}}>
                    {visits.slice(0, 3).map((v, i) => (
                      <div key={v.id} className="row" style={{borderTop:i>0?"0.5px solid var(--sep)":"none",cursor:"default"}}>
                        <div style={{width:28,height:28,borderRadius:7,background:"var(--ib5)",display:"grid",placeItems:"center",fontSize:14,flexShrink:0}}>🏥</div>
                        <div className="row-body">
                          <div className="row-title" style={{fontSize:14}}>{v.reason || "Hospital visit"}</div>
                          <div className="row-sub">{v.facility || v.doctor || ""} · {v.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {memberLogs.length > 0 && (
              <div className="section">
                <div className="section-header">Recent doses</div>
                <div style={{background:"var(--card)",borderRadius:"var(--rl)",overflow:"hidden",boxShadow:"var(--card-shadow)"}}>
                  {memberLogs.slice(0, 10).map((log, i) => (
                    <div key={log.id} className="row" style={{borderTop: i > 0 ? "0.5px solid var(--sep)" : "none", cursor: "default"}}>
                      <div style={{width:28,height:28,borderRadius:7,background:"var(--ib1)",display:"grid",placeItems:"center",fontSize:14,flexShrink:0}}>💊</div>
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
          <button className="btn btn-ghost" style={{width:"100%"}} onClick={() => { setSelectedMember(null); setMemberLogs([]); setMemberMeds([]); }}>← Back to family</button>
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
          <button className="upgrade-btn" onClick={() => {}}>Upgrade to Family →</button>
        </div>
      ) : (
        <>
          <div style={{padding:"0 16px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,color:"var(--t3)"}}>{members.length}/{maxMembers} members</div>
            {members.length < maxMembers && (
              <button className="btn btn-primary btn-sm" style={{width:"auto",fontSize:13}} onClick={() => setShowInvite(true)}>+ Invite</button>
            )}
          </div>

          {members.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👨‍👩‍👧</div>
              <div className="empty-state-title">No family members yet</div>
              <div className="empty-state-sub">Invite family members to track their medications together</div>
              <button className="btn btn-primary" style={{marginTop:12}} onClick={() => setShowInvite(true)}>+ Invite first member</button>
            </div>
          ) : (
            <div className="section" style={{padding:"0 16px"}}>
              <div style={{background:"var(--card)",borderRadius:"var(--rl)",overflow:"hidden",boxShadow:"var(--card-shadow)"}}>
                {members.map((m, i) => (
                  <div key={m.id} className="row" style={{borderTop: i > 0 ? "0.5px solid var(--sep)" : "none", cursor: "pointer"}} onClick={() => viewMember(m)}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"var(--ib4)",display:"grid",placeItems:"center",fontSize:16,flexShrink:0,color:"var(--t1)",fontWeight:600}}>
                      {m.member_name ? m.member_name.charAt(0).toUpperCase() : m.member_email?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="row-body">
                      <div className="row-title">{m.member_name || m.member_email}</div>
                      <div className="row-sub">
                        {m.status === "pending" ? "Invitation pending" : m.role === "admin" ? "Admin" : "Member"}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {m.status === "pending" && (
                        <span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:"var(--ib5)",color:"var(--t2)",fontWeight:500}}>Pending</span>
                      )}
                      <span style={{fontSize:14,color:"var(--t3)"}}>›</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  <div style={{fontSize:12,color:"var(--t3)"}}>They create an account or log in to link profiles</div>
                </div>
              </div>
              <div style={{background:"var(--card)",borderRadius:"var(--rl)",padding:14,boxShadow:"var(--card-shadow)",display:"flex",gap:12}}>
                <div style={{width:28,height:28,borderRadius:7,background:"var(--ib3)",display:"grid",placeItems:"center",fontSize:14,flexShrink:0}}>3</div>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--t1)"}}>Track together</div>
                  <div style={{fontSize:12,color:"var(--t3)"}}>View their medications, adherence, and dose history from your account</div>
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
    </div>
  );
}
