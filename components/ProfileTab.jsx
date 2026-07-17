"use client";

import { useState, useRef } from "react";
import { CSS, Chevron } from "@/lib/constants";
import { COUNTRIES, getPricing } from "@/lib/data";
import { testAlarm, stopAlarmSound, askNotifPerm, clearAllTimers } from "@/lib/notifications";
import { sb } from "@/lib/supabase";
import { PrivacyModal, TermsModal, UpgradeModal, FamilyInviteModal } from "@/components/Modals";

function Row({ icon, bg, title, sub, onClick, children }) {
  return (
    <div className="row" onClick={onClick} style={{cursor:onClick?"pointer":"default"}}>
      <div className="row-icon" style={{background:bg||"var(--ib1)",fontSize:18}}>{icon}</div>
      <div className="row-body"><div className="row-title">{title}</div>{sub && <div className="row-sub">{sub}</div>}</div>
      {children}
      {onClick && !children && <Chevron/>}
    </div>
  );
}

function Toggle({ on, onChange, disabled }) {
  return (
    <div onClick={disabled ? undefined : onChange}
      style={{width:48,height:28,borderRadius:99,background:on?"var(--teal)":"var(--sep)",position:"relative",cursor:disabled?"not-allowed":"pointer",transition:"background .2s",opacity:disabled?0.5:1,flexShrink:0}}>
      <div style={{width:22,height:22,borderRadius:"50%",background:"white",position:"absolute",top:3,left:on?23:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}/>
    </div>
  );
}

export default function ProfileTab({ user, profile, onSignOut, onSaveProfile, medCount }) {
  const [notifPerm, setNotifPerm] = useState(() => { if (!("Notification" in window)) return "unsupported"; return Notification.permission; });
  const [notifOn, setNotifOn] = useState(() => { try { return localStorage.getItem("mt_notif_on") === "1"; } catch { return false; } });
  const [reminderLead, setReminderLead] = useState(profile?.reminder_lead || 30);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ avatar_emoji: "", full_name: "", wake_time: "", sleep_time: "", goals: [], theme: "", country: "" });
  const [editCondition, setEditCondition] = useState(false);
  const [editSchedule, setEditSchedule] = useState(false);
  const [editCountryPick, setEditCountryPick] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [conditionVal, setConditionVal] = useState(profile?.condition || "");
  const [schedVals, setSchedVals] = useState({ wake: profile?.wake_time || "07:00", sleep: profile?.sleep_time || "22:00" });
  const [familyMembers, setFamilyMembers] = useState(() => {
    try { return JSON.parse(localStorage.getItem("adhera_family") || "[]"); } catch { return []; }
  });
  const [uploading, setUploading] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const fileInputRef = useRef(null);

  function ls() { try { return localStorage; } catch { return null; } }

  async function enableNotifs() {
    const s = ls();
    if (notifOn) {
      s?.setItem("mt_notif_on", "0");
      setNotifOn(false);
      clearAllTimers();
      try { navigator.serviceWorker?.controller?.postMessage({ type:"clear-alarms" }); } catch {}
      return;
    }
    // Optimistic: show toggle ON immediately
    setNotifOn(true);
    s?.setItem("mt_notif_on", "1");
    const p = await askNotifPerm();
    setNotifPerm(p);
    if (p !== "granted") {
      s?.setItem("mt_notif_on", "0");
      setNotifOn(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target?.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await sb.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = sb.storage.from("avatars").getPublicUrl(path);
      onSaveProfile({ avatar_url: publicUrl });
      setEditData(p => ({ ...p, avatar_url: publicUrl }));
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Upload failed: ${err?.message || err}. Make sure the 'avatars' storage bucket exists and has INSERT policies for authenticated users.`);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  }

  function handleUpgrade(plan) {
    const msg = plan === "enterprise"
      ? "Enterprise plan activated! Your account manager will reach out within 24 hours."
      : `Upgraded to ${plan.charAt(0).toUpperCase()+plan.slice(1)}!`;
    alert(msg);
    onSaveProfile({ plan });
    setShowUpgrade(false);
  }

  function handleInvite(email) {
    const updated = [...familyMembers, { email, status: "pending", invitedAt: new Date().toISOString() }];
    setFamilyMembers(updated);
    localStorage.setItem("adhera_family", JSON.stringify(updated));
  }

  function handleRemoveMember(index) {
    const updated = familyMembers.filter((_, i) => i !== index);
    setFamilyMembers(updated);
    localStorage.setItem("adhera_family", JSON.stringify(updated));
  }

  const plan = profile?.plan || "free";
  const country = profile?.country || user?.user_metadata?.country || "GH";
  const { pricing } = getPricing(country);
  const selCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

  const planMeta = {
    free:      { label:"Free Plan",            color:"var(--t3)",        badge:"" },
    pro:       { label:"⭐ Pro Plan",          color:"var(--teal)",     badge:"Pro" },
    family:    { label:"👨‍👩‍👧 Family Plan",   color:"var(--teal2)",   badge:"Family" },
    enterprise:{ label:"🏥 Enterprise",        color:"var(--teal)",    badge:"Enterprise" },
  };
  const pm = planMeta[plan] || planMeta.free;
  const profileEmojis = ["😊","🧑","👩","👨","🧓","👴","👵","🧒","👦","👧","🙂","😄","💪","🌟","❤️","🌸","🐻","🦁","🐼","🌴"];

  function startEdit() {
    setEditData({
      avatar_emoji: profile?.avatar_emoji || "😊",
      avatar_url: profile?.avatar_url || "",
      full_name: profile?.full_name || "",
      wake_time: profile?.wake_time || "07:00",
      sleep_time: profile?.sleep_time || "22:00",
      goals: profile?.goals || [],
      theme: profile?.theme || "blue",
      country: profile?.country || user?.user_metadata?.country || "GH",
    });
    setEditing(true);
  }

  function saveEdit() {
    const data = { ...editData };
    if (!data.avatar_url) data.avatar_url = null;
    onSaveProfile(data);
    setEditing(false);
  }

  if (editing) return (
    <div className="scroll">
      <style>{CSS}</style>
      <div className="nav-large" style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingRight:16}}>
        <span>Edit Profile</span>
        <button className="nav-action" onClick={saveEdit}>Done</button>
      </div>

      <div className="section">
        <div className="section-header">Avatar</div>
        <div style={{display:"flex",gap:14,padding:"0 16px",alignItems:"center",marginBottom:14}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:"var(--ib3)",display:"grid",placeItems:"center",fontSize:30,flexShrink:0,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>
            {editData.avatar_url ? <img src={editData.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : editData.avatar_emoji}
          </div>
          <button className="btn btn-ghost btn-sm" style={{width:"auto"}} onClick={() => fileInputRef.current?.click()}>
            {uploading ? "Uploading..." : "📷 Upload photo"}
          </button>
          {editData.avatar_url && (
            <button className="btn btn-ghost btn-sm" style={{width:"auto",color:"var(--red)"}} onClick={() => setEditData(p=>({...p,avatar_url:""}))}>Remove</button>
          )}
        </div>
        <div className="emoji-grid" style={{margin:"0 16px"}}>
          {profileEmojis.map(em => (
            <div key={em} className={`emoji-opt${editData.avatar_emoji===em?" sel":""}`} onClick={()=>setEditData(p=>({...p,avatar_emoji:em}))}>{em}</div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header">Name</div>
        <div style={{padding:"0 16px"}}>
          <input className="sheet-input" value={editData.full_name} onChange={e=>setEditData(p=>({...p,full_name:e.target.value}))}/>
        </div>
      </div>

      <div className="section">
        <div className="section-header">Schedule</div>
        <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
          {[{label:"Wake up time",key:"wake_time"},{label:"Bedtime",key:"sleep_time"}].map(({label,key})=>(
            <div key={key} style={{background:"var(--card)",borderRadius:"var(--rl)",padding:"14px 16px",boxShadow:"var(--card-shadow)",border:"var(--card-border)"}}>
              <div style={{fontSize:13,color:"var(--t3)",marginBottom:8,fontWeight:500}}>{label}</div>
              <input type="time" value={editData[key]} onChange={e=>setEditData(p=>({...p,[key]:e.target.value}))} style={{fontSize:18,fontWeight:600,border:"none",background:"none",color:"var(--t1)",fontFamily:"inherit",width:"100%",outline:"none"}}/>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header">Country</div>
        <div style={{padding:"0 16px"}}>
          <select className="sheet-input" value={editData.country} onChange={e=>setEditData(p=>({...p,country:e.target.value}))}>
            {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="section">
        <div className="section-header">Goals</div>
        <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:8}}>
          {[
            {icon:"💊",label:"Never miss a dose"},
            {icon:"📊",label:"Track adherence over time"},
            {icon:"👨‍⚕️",label:"Share reports with my doctor"},
            {icon:"👨‍👩‍👧",label:"Manage family medications"},
            {icon:"🔔",label:"Build a medication habit"},
            {icon:"💊",label:"Complete my full course"},
          ].map(g => {
            const s = editData.goals.includes(g.label);
            return (
              <div key={g.label} className={`goal-chip${s?" sel":""}`}
                onClick={()=>setEditData(p=>({...p,goals: s ? p.goals.filter(x=>x!==g.label) : [...p.goals,g.label]}))}>
                <div className="goal-chip-icon">{g.icon}</div>
                <div className="goal-chip-label">{g.label}</div>
                <div className={`goal-chip-check${s?" on":""}`}>{s&&<span style={{color:"white",fontSize:11}}>✓</span>}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-header">Theme</div>
        <div className="theme-grid" style={{margin:"0 16px"}}>
          {[
            {id:"blue",  colors:["#007AFF","#0055CC"]},
            {id:"green", colors:["#34C759","#2DB84E"]},
            {id:"purple",colors:["#AF52DE","#983CC9"]},
            {id:"orange",colors:["#FF9500","#E68A00"]},
            {id:"red",   colors:["#FF3B30","#D6342A"]},
            {id:"teal",  colors:["#5AC8FA","#42B0E0"]},
            {id:"pink",  colors:["#FF2D55","#D92548"]},
            {id:"dark",  colors:["#0A84FF","#409CFF"]},
          ].map(th=>(
            <div key={th.id} className={`theme-swatch${editData.theme===th.id?" sel":""}`}
              style={{background:`linear-gradient(135deg,${th.colors[0]},${th.colors[1]})`}}
              onClick={()=>setEditData(p=>({...p,theme:th.id}))}>
              {editData.theme===th.id && <div className="theme-swatch-check">✓</div>}
            </div>
          ))}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleAvatarUpload}/>

      <div style={{padding:"16px"}}>
        <button className="btn btn-ghost" onClick={()=>setEditing(false)} style={{color:"var(--t3)"}}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="scroll">
      <style>{CSS}</style>

      <div className="profile-header" style={{background:"var(--card)",margin:"0 16px 20px",borderRadius:"var(--rxl)",padding:"28px 16px 22px",boxShadow:"var(--card-shadow)",border:"var(--card-border)"}}>
        <div style={{position:"relative",width:88,height:88}}>
          <div className="profile-avatar" style={{cursor:profile?.avatar_url?"pointer":"default",overflow:"hidden",margin:0,boxShadow:"0 4px 16px rgba(0,0,0,.12)"}} onClick={() => profile?.avatar_url && setShowLightbox(true)}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>
            ) : (
              profile?.avatar_emoji || "😊"
            )}
            {uploading && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",display:"grid",placeItems:"center",color:"white",fontSize:13,borderRadius:"50%"}}>Uploading...</div>}
          </div>
          <div onClick={() => fileInputRef.current?.click()}
            style={{position:"absolute",bottom:-2,right:-2,width:30,height:30,borderRadius:"50%",background:"var(--teal)",border:"3px solid var(--card)",display:"grid",placeItems:"center",fontSize:18,color:"white",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.2)",transition:"transform .15s",userSelect:"none",lineHeight:1}}
            onMouseDown={e => { const t=e.currentTarget; t.style.transform="scale(.85)"; }}
            onMouseUp={e => { const t=e.currentTarget; t.style.transform="scale(1)"; }}>
            +
          </div>
        </div>
        <div className="profile-name">{profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0]}</div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:-4}}>
          <span style={{fontSize:13,fontWeight:600,color:pm.color,background:`${pm.color}14`,padding:"3px 12px",borderRadius:99}}>{pm.label}</span>
          <span style={{fontSize:13,color:"var(--t3)"}}>{selCountry.flag} {selCountry.name}</span>
        </div>
        <div style={{display:"flex",gap:8,marginTop:6}}>
          <button className="btn btn-ghost btn-sm" style={{width:"auto"}} onClick={startEdit}>✏️ Edit profile</button>
          <button className="btn btn-ghost btn-sm" style={{width:"auto"}} onClick={() => onSaveProfile({ theme: (profile?.theme || "blue") === "dark" ? "blue" : "dark" })}>
            {(profile?.theme || "blue") === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleAvatarUpload}/>

      {showLightbox && profile?.avatar_url && (
        <div onClick={() => setShowLightbox(false)}
          style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.85)",display:"grid",placeItems:"center",cursor:"pointer",animation:"fadeIn .2s"}}>
          <div style={{position:"relative",maxWidth:"90vw",maxHeight:"90vh"}}>
            <img src={profile.avatar_url} alt="" style={{width:"auto",height:"auto",maxWidth:"90vw",maxHeight:"90vh",borderRadius:12,boxShadow:"0 8px 40px rgba(0,0,0,.5)"}}/>
          </div>
        </div>
      )}

      {profile?.goals?.length > 0 && (
        <div className="section" style={{marginBottom:12}}>
          <div className="section-header">Health goals</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"0 16px"}}>
            {profile.goals.map(g => <span key={g} className="tag">{g}</span>)}
          </div>
        </div>
      )}

      {plan === "free" ? (
        <div className="upgrade-card" style={{margin:"0 16px 20px"}}>
          <div className="upgrade-title">Unlock Pro ⭐</div>
          <div className="upgrade-sub">Unlimited medications, caregiver sharing, adherence reports and more.</div>
          <div className="upgrade-features">
            {["Unlimited medications","Full history","Refill reminders","Adherence reports","Drug interaction check"].map(f => (
              <div key={f} className="upgrade-feature"><span>✓</span> {f}</div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {[{p:"pro",l:"Pro"},{p:"family",l:"Family"},{p:"enterprise",l:"Enterprise"}].map(({p,l}) => (
              <div key={p} style={{background:"rgba(255,255,255,.12)",borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                <div style={{fontSize:16,fontWeight:800}}>{pricing[p].label}</div>
                <div style={{fontSize:10,opacity:.8}}>{l} / mo</div>
              </div>
            ))}
          </div>
          <button className="upgrade-btn" onClick={() => setShowUpgrade(true)}>See upgrade options →</button>
        </div>
      ) : (
        <div className="section" style={{marginBottom:12}}>
          <div className="section-header">Your plan includes</div>
          <div className="list">
            {[
              ["💊","Unlimited medications","No cap on medications"],
              ["📊","Full history & analytics","All-time dose history"],
              ["🔔","Smart refill reminders","Never run out"],
              ["⚠️","Drug interaction checker","Stay safe"],
              ["📄","PDF adherence reports","Share with your doctor"],
              plan === "family" || plan === "enterprise" ? ["👨‍👩‍👧","Family dashboard","5 profiles"] : null,
              plan === "enterprise" ? ["🏥","Bulk patient management","Manage unlimited patients"] : null,
              plan === "enterprise" ? ["🔌","API & integrations","Connect your EMR/HIS"] : null,
              plan === "enterprise" ? ["🎨","Custom branding","White-label experience"] : null,
              plan === "enterprise" ? ["🛡️","HIPAA-compliant","Enterprise-grade security"] : null,
              plan === "enterprise" ? ["👤","Dedicated account manager","24/7 priority support"] : null,
            ].filter(Boolean).map(([icon,title,sub]) => (
              <Row key={title} icon={icon} title={title} sub={sub}/>
            ))}
          </div>
          <div style={{padding:"10px 4px"}}>
            <button className="btn btn-ghost" style={{border:"1.5px solid var(--sep)"}} onClick={() => setShowUpgrade(true)}>
              {plan === "pro" ? "Upgrade to Family →" : plan === "enterprise" ? "Manage enterprise account →" : "Manage subscription →"}
            </button>
          </div>
        </div>
      )}

      {(plan === "family" || plan === "enterprise") && (
        <div className="section" style={{marginBottom:12}}>
          <div className="section-header">👨‍👩‍👧 Family dashboard</div>
          <div className="list">
            <Row icon="👤" bg="var(--ib1)" title="Primary member" sub={profile?.full_name || user?.email}/>
            <Row icon="➕" bg="var(--ib4)" title="Add family member" sub="Invite via email to link profiles" onClick={() => setShowAddMember(true)}/>
            <Row icon="📊" bg="var(--ib3)" title="Shared compliance view" sub="See everyone's adherence at a glance"/>
            <Row icon="🔔" bg="var(--ib6)" title="Caregiver notifications" sub="Alerts when loved ones miss doses"/>
          </div>
        </div>
      )}

      <div className="section" style={{marginBottom:12}}>
        <div className="section-header">Notifications & Schedule</div>
        <div className="list">
          <Row
            icon="🔔" bg="var(--ib3)"
            title="Push notifications"
            sub={!notifOn || notifPerm !== "granted" ? notifPerm==="denied" ? "Blocked — enable in Settings" : notifPerm==="unsupported" ? "Add to home screen to enable" : "Tap to enable" : "Alarms & reminders on"}
          >
            <Toggle on={notifOn && notifPerm === "granted"} onChange={notifPerm === "denied" ? undefined : enableNotifs} disabled={notifPerm === "denied"}/>
          </Row>
          <Row
            icon="⏰" bg="var(--ib5)"
            title="Daily schedule"
            sub={`${profile?.wake_time || "07:00"} – ${profile?.sleep_time || "22:00"}`}
            onClick={()=>{setSchedVals({wake:profile?.wake_time||"07:00",sleep:profile?.sleep_time||"22:00"}); setEditSchedule(true);}}
          />
          {editSchedule ? (
            <div className="row" style={{cursor:"default",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
              <div className="row-icon" style={{background:"var(--ib5)",fontSize:18,marginTop:2}}>⏰</div>
              <div className="row-body" style={{flex:"1",minWidth:200}}>
                <div className="row-title">Schedule</div>
                <div style={{display:"flex",gap:10,marginTop:8}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:"var(--t3)",marginBottom:4,fontWeight:500}}>Wake up</div>
                    <input type="time" value={schedVals.wake} onChange={e=>setSchedVals(p=>({...p,wake:e.target.value}))}
                      style={{fontSize:16,fontWeight:600,border:"1.5px solid var(--sep)",borderRadius:10,padding:"10px 12px",color:"var(--t1)",background:"var(--input)",fontFamily:"inherit",width:"100%",outline:"none"}}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:"var(--t3)",marginBottom:4,fontWeight:500}}>Bedtime</div>
                    <input type="time" value={schedVals.sleep} onChange={e=>setSchedVals(p=>({...p,sleep:e.target.value}))}
                      style={{fontSize:16,fontWeight:600,border:"1.5px solid var(--sep)",borderRadius:10,padding:"10px 12px",color:"var(--t1)",background:"var(--input)",fontFamily:"inherit",width:"100%",outline:"none"}}/>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,width:"100%",paddingLeft:"42px"}}>
                <button className="btn btn-sm btn-primary" style={{width:"auto"}} onClick={()=>{onSaveProfile({wake_time:schedVals.wake,sleep_time:schedVals.sleep}); setEditSchedule(false);}}>Save</button>
                <button className="btn btn-sm btn-ghost" style={{width:"auto",color:"var(--t3)"}} onClick={()=>{setSchedVals({wake:profile?.wake_time||"07:00",sleep:profile?.sleep_time||"22:00"}); setEditSchedule(false);}}>Cancel</button>
              </div>
            </div>
          ) : null}
          <Row
            icon="📋" bg="var(--ib5)"
            title="Health condition"
            sub={profile?.condition || "Not set"}
            onClick={()=>{setConditionVal(profile?.condition||""); setEditCondition(true);}}
          />
          {editCondition ? (
            <div className="row" style={{cursor:"default",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
              <div className="row-icon" style={{background:"var(--ib5)",fontSize:18,marginTop:2}}>📋</div>
              <div className="row-body" style={{flex:"1",minWidth:200}}>
                <div className="row-title">Health condition</div>
                <input className="sheet-input" value={conditionVal} onChange={e=>setConditionVal(e.target.value)}
                  placeholder="e.g. Hypertension, Diabetes" style={{marginTop:8,fontSize:15}} autoFocus/>
              </div>
              <div style={{display:"flex",gap:8,width:"100%",paddingLeft:"42px"}}>
                <button className="btn btn-sm btn-primary" style={{width:"auto"}} onClick={()=>{onSaveProfile({condition:conditionVal.trim()||null}); setEditCondition(false);}}>Save</button>
                <button className="btn btn-sm btn-ghost" style={{width:"auto",color:"var(--t3)"}} onClick={()=>{setConditionVal(profile?.condition||""); setEditCondition(false);}}>Cancel</button>
              </div>
            </div>
          ) : null}
          {notifPerm === "granted" && notifOn && (
            <>
              <div className="row" style={{cursor:"default"}}>
                <div className="row-icon" style={{background:"var(--ib1)",fontSize:18}}>⏱</div>
                <div className="row-body"><div className="row-title">Reminder before dose</div><div className="row-sub">Get notified before each scheduled dose</div></div>
                <div style={{position:"relative",flexShrink:0}}>
                  <select
                    value={reminderLead}
                    onChange={e => { setReminderLead(Number(e.target.value)); onSaveProfile({ reminder_lead: Number(e.target.value) }); }}
                    style={{border:"1.5px solid var(--sep)",background:"var(--card)",color:"var(--t1)",fontSize:14,fontWeight:600,fontFamily:"inherit",cursor:"pointer",borderRadius:10,padding:"8px 30px 8px 12px",outline:"none",appearance:"none",WebkitAppearance:"none",minWidth:120}}
                  >
                    <option value={0}>At time</option>
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                  <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:10,color:"var(--t4)",pointerEvents:"none"}}>▼</span>
                </div>
              </div>
              <div className="row" style={{cursor:"pointer"}} onClick={() => { stopAlarmSound(); testAlarm(); }}>
                <div className="row-icon" style={{background:"var(--ib3)",fontSize:18}}>🔊</div>
                <div className="row-body"><div className="row-title">Test alarm</div><div className="row-sub">Play test notification & sound</div></div>
                <span style={{fontSize:16,color:"var(--t3)"}}>▶</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="section" style={{marginBottom:12}}>
        <div className="section-header">Account</div>
        <div className="list">
          <Row icon="📧" bg="var(--ib1)" title="Email" sub={user?.email}/>

          {editCountryPick ? (
            <div className="row" style={{cursor:"default",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
              <div className="row-icon" style={{background:"var(--ib4)",fontSize:18,marginTop:2}}>🌍</div>
              <div className="row-body" style={{flex:"1",minWidth:200}}>
                <div className="row-title">Country</div>
                <select className="sheet-input" value={country} onChange={e=>{const v=e.target.value; setEditCountryPick(false); onSaveProfile({country:v});}}
                  style={{marginTop:8,fontSize:14}} autoFocus>
                  {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:8,width:"100%",paddingLeft:"42px"}}>
                <button className="btn btn-sm btn-ghost" style={{width:"auto",color:"var(--t3)"}} onClick={()=>setEditCountryPick(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <Row icon="🌍" bg="var(--ib4)" title="Country" sub={`${selCountry.flag} ${selCountry.name}`} onClick={()=>setEditCountryPick(true)}/>
          )}

          <Row icon="🚪" bg="var(--ib6)" title={<span style={{color:"var(--red)"}}>Sign out</span>} onClick={onSignOut}/>
        </div>
      </div>

      <div className="section" style={{marginBottom:12}}>
        <div className="section-header">About</div>
        <div className="list">
          <div className="row" style={{cursor:"default"}}><div className="row-body"><div className="row-title">Adhera</div><div className="row-sub">Version 1.0.0</div></div></div>
          <div className="row" onClick={()=>setShowPrivacy(true)} style={{cursor:"pointer"}}><div className="row-body"><div className="row-title">Privacy Policy</div></div><Chevron/></div>
          <div className="row" onClick={()=>setShowTerms(true)} style={{cursor:"pointer"}}><div className="row-body"><div className="row-title">Terms of Service</div></div><Chevron/></div>
        </div>
      </div>

      {showAddMember && (
        <FamilyInviteModal
          members={familyMembers}
          onInvite={handleInvite}
          onRemove={handleRemoveMember}
          onClose={() => setShowAddMember(false)}
        />
      )}
      {showUpgrade && (
        <UpgradeModal
          country={country}
          userEmail={user?.email}
          onClose={() => setShowUpgrade(false)}
          onUpgrade={handleUpgrade}
        />
      )}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}
