"use client";

import { useState } from "react";
import { CSS, Chevron } from "@/lib/constants";
import { COUNTRIES, getPricing } from "@/lib/data";
import { askNotifPerm } from "@/lib/notifications";
import { PrivacyModal, TermsModal, UpgradeModal } from "@/components/Modals";

export default function ProfileTab({ user, profile, onSignOut, onSaveProfile }) {
  const [notifPerm, setNotifPerm] = useState(() => "Notification" in window ? Notification.permission : "default");
  const [reminderLead, setReminderLead] = useState(profile?.reminder_lead || 30);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ avatar_emoji: "", full_name: "", wake_time: "", sleep_time: "", goals: [], theme: "", country: "" });
  const [editCondition, setEditCondition] = useState(false);
  const [editSchedule, setEditSchedule] = useState(false);
  const [editCountryPick, setEditCountryPick] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [conditionVal, setConditionVal] = useState(profile?.condition || "");
  const [schedVals, setSchedVals] = useState({ wake: profile?.wake_time || "07:00", sleep: profile?.sleep_time || "22:00" });

  async function enableNotifs() {
    const p = await askNotifPerm();
    setNotifPerm(p);
  }

  function handleUpgrade(plan) {
    alert(`Upgrade to ${plan} — integrate Paystack/Stripe here with country: ${profile?.country || "GH"}`);
    onSaveProfile({ plan });
    setShowUpgrade(false);
  }

  const plan = profile?.plan || "free";
  const country = profile?.country || user?.user_metadata?.country || "GH";
  const { pricing } = getPricing(country);
  const selCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

  const planLabel = plan === "pro" ? "⭐ Pro Plan" : plan === "family" ? "👨‍👩‍👧 Family Plan" : "Free Plan";
  const planColor = plan === "pro" ? "#0A84FF" : plan === "family" ? "#AF52DE" : "var(--t3)";

  const profileEmojis = ["😊","🧑","👩","👨","🧓","👴","👵","🧒","👦","👧","🙂","😄","💪","🌟","❤️","🌸","🐻","🦁","🐼","🌴"];

  function startEdit() {
    setEditData({
      avatar_emoji: profile?.avatar_emoji || "😊",
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
    onSaveProfile(editData);
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
            <div key={key} style={{background:"var(--card)",borderRadius:"var(--rl)",padding:"14px 16px"}}>
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
            {id:"blue",  colors:["#0A84FF","#32ADE6"]},
            {id:"green", colors:["#34C759","#30D158"]},
            {id:"purple",colors:["#AF52DE","#BF5AF2"]},
            {id:"orange",colors:["#FF9500","#FF6000"]},
            {id:"red",   colors:["#FF3B30","#FF453A"]},
            {id:"teal",  colors:["#5AC8FA","#0A84FF"]},
            {id:"pink",  colors:["#FF2D55","#FF375F"]},
            {id:"dark",  colors:["#1C1C1E","#2C2C2E"]},
          ].map(th=>(
            <div key={th.id} className={`theme-swatch${editData.theme===th.id?" sel":""}`}
              style={{background:`linear-gradient(135deg,${th.colors[0]},${th.colors[1]})`}}
              onClick={()=>setEditData(p=>({...p,theme:th.id}))}>
              {editData.theme===th.id && <div className="theme-swatch-check">✓</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"16px"}}>
        <button className="btn btn-ghost" onClick={()=>setEditing(false)}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="scroll">
      <style>{CSS}</style>

      <div className="profile-header">
        <div className="profile-avatar" style={{cursor:"pointer"}} onClick={startEdit}>{profile?.avatar_emoji || "😊"}</div>
        <div className="profile-name">{profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0]}</div>
        <div style={{fontSize:14,color:planColor,fontWeight:600,marginTop:2}}>{planLabel}</div>
        <div style={{fontSize:13,color:"var(--t3)",marginTop:2}}>{selCountry.flag} {selCountry.name}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
          <button className="btn btn-ghost btn-sm" style={{width:"auto"}} onClick={startEdit}>✏️ Edit profile</button>
          <button className="btn btn-ghost btn-sm" style={{width:"auto"}} onClick={() => onSaveProfile({ theme: (profile?.theme || "blue") === "dark" ? "blue" : "dark" })}>
            {(profile?.theme || "blue") === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      {profile?.goals?.length > 0 && (
        <div className="section">
          <div className="section-header">Health goals</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"0 16px"}}>
            {profile.goals.map(g => <span key={g} className="tag">{g}</span>)}
          </div>
        </div>
      )}

      {plan === "free" && (
        <div style={{margin:"0 16px 16px"}}>
          <div style={{background:"linear-gradient(135deg,#0A84FF,#AF52DE)",borderRadius:20,padding:20,color:"white"}}>
            <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Unlock Pro ⭐</div>
            <div style={{fontSize:13,opacity:.9,marginBottom:12,lineHeight:1.5}}>
              Unlimited medications, caregiver sharing, adherence reports and more.
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              {["Unlimited meds","Full history","Refill reminders","Reports"].map(f=>(
                <div key={f} style={{background:"rgba(255,255,255,.2)",borderRadius:99,padding:"4px 10px",fontSize:12}}>✓ {f}</div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              <div style={{background:"rgba(255,255,255,.15)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:800}}>{pricing.pro.label}</div>
                <div style={{fontSize:11,opacity:.8}}>Pro / month</div>
              </div>
              <div style={{background:"rgba(255,255,255,.15)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:800}}>{pricing.family.label}</div>
                <div style={{fontSize:11,opacity:.8}}>Family / month</div>
              </div>
            </div>
            <button
              style={{background:"white",color:"#0A84FF",border:"none",borderRadius:10,padding:"12px 20px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%"}}
              onClick={() => setShowUpgrade(true)}
            >
              See upgrade options →
            </button>
          </div>
        </div>
      )}

      {plan !== "free" && (
        <div className="section">
          <div className="section-header">Your plan includes</div>
          <div className="list">
            {[
              ["💊","Unlimited medications","No cap on medications"],
              ["📊","Full history & analytics","All-time dose history"],
              ["🔔","Smart refill reminders","Never run out"],
              ["⚠️","Drug interaction checker","Stay safe"],
              ["📄","PDF adherence reports","Share with your doctor"],
              plan === "family" ? ["👨‍👩‍👧","Family dashboard","5 profiles"] : null,
            ].filter(Boolean).map(([icon,title,sub]) => (
              <div key={title} className="row" style={{cursor:"default"}}>
                <div className="row-icon" style={{background:"var(--ib1)",fontSize:18}}>{icon}</div>
                <div className="row-body"><div className="row-title">{title}</div><div className="row-sub">{sub}</div></div>
                <span style={{color:"var(--teal2)",fontSize:14,fontWeight:700}}>✓</span>
              </div>
            ))}
          </div>
          <div style={{padding:"10px 4px"}}>
            <button className="btn btn-ghost" style={{border:"1.5px solid var(--sep)"}} onClick={() => setShowUpgrade(true)}>
              {plan === "pro" ? "Upgrade to Family →" : "Manage subscription →"}
            </button>
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-header">Notifications</div>
        <div className="list">
          <div className="row" style={{cursor:"default"}}>
            <div className="row-icon" style={{background:"var(--ib3)",fontSize:18}}>🔔</div>
            <div className="row-body">
              <div className="row-title">Push notifications</div>
              <div className="row-sub">{notifPerm === "granted" ? "Enabled" : "Tap to enable"}</div>
            </div>
            {notifPerm !== "granted"
              ? <button className="btn btn-primary btn-sm" style={{width:"auto"}} onClick={enableNotifs}>Enable</button>
              : <span style={{color:"var(--teal2)",fontSize:14,fontWeight:600}}>On ✓</span>}
          </div>
          {notifPerm === "granted" && (
            <div className="row" style={{cursor:"default"}}>
              <div className="row-icon" style={{background:"var(--ib1)",fontSize:18}}>⏱</div>
              <div className="row-body"><div className="row-title">Default reminder timing</div></div>
              <select
                value={reminderLead}
                onChange={e => { setReminderLead(Number(e.target.value)); onSaveProfile({ reminder_lead: Number(e.target.value) }); }}
                style={{border:"none",background:"none",color:"var(--teal)",fontSize:15,fontWeight:500,fontFamily:"inherit",cursor:"pointer"}}
              >
                <option value={0}>At time</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 hr</option>
                <option value={120}>2 hrs</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-header">Account</div>
        <div className="list">
          <div className="row" style={{cursor:"default"}}>
            <div className="row-icon" style={{background:"var(--ib1)",fontSize:18}}>📧</div>
            <div className="row-body"><div className="row-title">Email</div><div className="row-sub">{user?.email}</div></div>
          </div>

          {editCountryPick ? (
            <div className="row" style={{cursor:"default",flexWrap:"wrap",gap:8}}>
              <div className="row-icon" style={{background:"var(--ib4)",fontSize:18}}>🌍</div>
              <div className="row-body" style={{flex:"1 1 auto"}}>
                <div className="row-title">Country</div>
                <select className="sheet-input" value={country} onChange={e=>{const v=e.target.value; setEditCountryPick(false); onSaveProfile({country:v});}}
                  style={{marginTop:6,fontSize:14}} autoFocus>
                  {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </div>
              <button className="btn btn-sm btn-ghost" style={{width:"auto"}} onClick={()=>setEditCountryPick(false)}>Cancel</button>
            </div>
          ) : (
            <div className="row" onClick={()=>setEditCountryPick(true)} style={{cursor:"pointer"}}>
              <div className="row-icon" style={{background:"var(--ib4)",fontSize:18}}>🌍</div>
              <div className="row-body"><div className="row-title">Country</div><div className="row-sub">{selCountry.flag} {selCountry.name}</div></div>
              <Chevron/>
            </div>
          )}

          {editCondition ? (
            <div className="row" style={{cursor:"default",flexWrap:"wrap",gap:8}}>
              <div className="row-icon" style={{background:"var(--ib5)",fontSize:18}}>📋</div>
              <div className="row-body" style={{flex:"1 1 auto"}}>
                <div className="row-title">Health condition</div>
                <input className="sheet-input" value={conditionVal} onChange={e=>setConditionVal(e.target.value)}
                  placeholder="e.g. Hypertension, Diabetes" style={{marginTop:6,fontSize:14}} autoFocus/>
              </div>
              <button className="btn btn-sm btn-primary" style={{width:"auto"}} onClick={()=>{onSaveProfile({condition:conditionVal.trim()||null}); setEditCondition(false);}}>Save</button>
              <button className="btn btn-sm btn-ghost" style={{width:"auto"}} onClick={()=>{setConditionVal(profile?.condition||""); setEditCondition(false);}}>Cancel</button>
            </div>
          ) : (
            <div className="row" onClick={()=>{setConditionVal(profile?.condition||""); setEditCondition(true);}} style={{cursor:"pointer"}}>
              <div className="row-icon" style={{background:"var(--ib5)",fontSize:18}}>📋</div>
              <div className="row-body"><div className="row-title">Health condition</div><div className="row-sub">{profile?.condition || "Not set"}</div></div>
              <Chevron/>
            </div>
          )}

          {editSchedule ? (
            <div className="row" style={{cursor:"default",flexWrap:"wrap",gap:8}}>
              <div className="row-icon" style={{background:"var(--ib5)",fontSize:18}}>⏰</div>
              <div className="row-body" style={{flex:"1 1 auto"}}>
                <div className="row-title">Schedule</div>
                <div style={{display:"flex",gap:8,marginTop:6}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:"var(--t3)",marginBottom:2}}>Wake up</div>
                    <input type="time" value={schedVals.wake} onChange={e=>setSchedVals(p=>({...p,wake:e.target.value}))}
                      style={{fontSize:16,fontWeight:600,border:"1.5px solid var(--sep)",borderRadius:10,padding:"8px 10px",color:"var(--t1)",background:"var(--input)",fontFamily:"inherit",width:"100%",outline:"none"}}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:"var(--t3)",marginBottom:2}}>Bedtime</div>
                    <input type="time" value={schedVals.sleep} onChange={e=>setSchedVals(p=>({...p,sleep:e.target.value}))}
                      style={{fontSize:16,fontWeight:600,border:"1.5px solid var(--sep)",borderRadius:10,padding:"8px 10px",color:"var(--t1)",background:"var(--input)",fontFamily:"inherit",width:"100%",outline:"none"}}/>
                  </div>
                </div>
              </div>
              <button className="btn btn-sm btn-primary" style={{width:"auto"}} onClick={()=>{onSaveProfile({wake_time:schedVals.wake,sleep_time:schedVals.sleep}); setEditSchedule(false);}}>Save</button>
              <button className="btn btn-sm btn-ghost" style={{width:"auto"}} onClick={()=>{setSchedVals({wake:profile?.wake_time||"07:00",sleep:profile?.sleep_time||"22:00"}); setEditSchedule(false);}}>Cancel</button>
            </div>
          ) : (
            <div className="row" onClick={()=>{setSchedVals({wake:profile?.wake_time||"07:00",sleep:profile?.sleep_time||"22:00"}); setEditSchedule(true);}} style={{cursor:"pointer"}}>
              <div className="row-icon" style={{background:"var(--ib5)",fontSize:18}}>⏰</div>
              <div className="row-body"><div className="row-title">Schedule</div><div className="row-sub">{profile?.wake_time||"07:00"} – {profile?.sleep_time||"22:00"}</div></div>
              <Chevron/>
            </div>
          )}

          <div className="row" onClick={onSignOut} style={{cursor:"pointer"}}>
            <div className="row-icon" style={{background:"var(--ib6)",fontSize:18}}>🚪</div>
            <div className="row-body"><div className="row-title" style={{color:"var(--red)"}}>Sign out</div></div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">About</div>
        <div className="list">
          <div className="row" style={{cursor:"default"}}><div className="row-body"><div className="row-title">MediTrack</div><div className="row-sub">Version 1.0.0</div></div></div>
          <div className="row" onClick={()=>setShowPrivacy(true)} style={{cursor:"pointer"}}><div className="row-body"><div className="row-title">Privacy Policy</div></div><Chevron/></div>
          <div className="row" onClick={()=>setShowTerms(true)} style={{cursor:"pointer"}}><div className="row-body"><div className="row-title">Terms of Service</div></div><Chevron/></div>
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          country={country}
          onClose={() => setShowUpgrade(false)}
          onUpgrade={handleUpgrade}
        />
      )}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}
