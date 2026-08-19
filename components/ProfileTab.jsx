"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { CSS, Chevron } from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { COUNTRIES, getPricing } from "@/lib/data";
import { getTierConfig } from "@/lib/tiers";
import { useTier } from "@/components/TierContext";
import { testAlarm, stopAlarmSound, askNotifPerm, clearAllTimers, getNotifPerm, isNativePlatform } from "@/lib/notifications";
import { FormControl } from "@/components/FormControls";
import { sb } from "@/lib/supabase";
import { fetchFamilyMembers, insertFamilyMember, removeFamilyMember } from "@/lib/db";
import { PrivacyModal, TermsModal, UpgradeModal, FamilyInviteModal } from "@/components/Modals";
import MedicalID from "@/components/MedicalID";
import AvatarPicker from "@/components/AvatarPicker";
import { Trash2, Pencil, Sun, Moon, Bell, Clock, ClipboardList, Timer, Volume2, Ruler, Droplet, AlertTriangle, Phone, Mail, Globe, Languages, LogOut, Download, FileSpreadsheet, UserPlus, Users, User, ShieldAlert, Pill, BarChart3, Crown, Sparkles, Stethoscope, Heart, Info, Check } from "lucide-react";
import { avatarIcon } from "@/lib/avatars";

function Ico({ children, ...props }) {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }} {...props}>{children}</span>;
}

function Row({ icon, bg, title, sub, onClick, children }) {
  return (
    <div className="row" onClick={onClick} style={{cursor:onClick?"pointer":"default"}}>
      <div className="row-icon" style={{background:bg||"var(--ib1)"}}>{icon}</div>
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

export default function ProfileTab({ user, profile, onSignOut, onSaveProfile, medCount, meds, logs }) {
  const { t, lang, setLang } = useLang();
  const [notifPerm, setNotifPerm] = useState(() => { if (isNativePlatform()) return "default"; if (!("Notification" in window)) return "unsupported"; return Notification.permission; });
  const [notifOn, setNotifOn] = useState(() => { try { return localStorage.getItem("mt_notif_on") === "1"; } catch { return false; } });
  const [reminderLead, setReminderLead] = useState(profile?.reminder_lead || 30);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ avatar_emoji: "", full_name: "", wake_time: "", sleep_time: "", goals: [], theme: "", country: "" });
  const [editSchedule, setEditSchedule] = useState(false);
  const [editCountryPick, setEditCountryPick] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [medSection, setMedSection] = useState(null);
  const [schedVals, setSchedVals] = useState({ wake: profile?.wake_time || "07:00", sleep: profile?.sleep_time || "22:00" });
  const [familyMembers, setFamilyMembers] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    fetchFamilyMembers(user.id).then(({ data, error }) => {
      if (!mounted) return;
      if (!error && Array.isArray(data)) setFamilyMembers(data);
    });
    return () => { mounted = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!isNativePlatform()) return;
    let mounted = true;
    getNotifPerm().then(p => { if (mounted) setNotifPerm(p); }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  const [uploading, setUploading] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [editLang, setEditLang] = useState(false);

  const LANGUAGES = [
    { code:"en", label:"English" },
    { code:"es", label:"Español" },
    { code:"fr", label:"Français" },
    { code:"ha", label:"Hausa" },
    { code:"ig", label:"Igbo" },
    { code:"yo", label:"Yoruba" },
    { code:"sw", label:"Kiswahili" },
    { code:"pt", label:"Português" },
    { code:"ar", label:"العربية" },
    { code:"zh", label:"中文" },
  ];
  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);
  const [personalDetails, setPersonalDetails] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem("adhera_personal") || "{}");
      return v && typeof v === "object" && !Array.isArray(v) ? v : {};
    } catch { return {}; }
  });
  const [medicalID, setMedicalID] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mt_medical_id") || "null") || {}; } catch { return {}; }
  });
  const fileInputRef = useRef(null);

  function ls() { try { return localStorage; } catch { return null; } }

  function savePersonalDetails(details) {
    setPersonalDetails(details);
    try { localStorage.setItem("adhera_personal", JSON.stringify(details)); } catch {}
  }

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
    onSaveProfile({ plan });
    setShowUpgrade(false);
    sessionStorage.removeItem("adhera_pending_plan");
  }

  async function handleInvite(email) {
    if (!user?.id || !email.trim()) return;
    const { error } = await insertFamilyMember(user.id, email);
    if (error) {
      console.error("invite error:", error?.message || error);
      return;
    }
    try {
      let token = "";
      try { const s = await sb.auth.getSession(); token = s?.data?.session?.access_token || ""; } catch {}
      await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ to: email, senderName: user?.email || "Adhera Team" }),
      });
    } catch (e) { console.error("invite email:", e); }
    const { data } = await fetchFamilyMembers(user.id);
    if (Array.isArray(data)) setFamilyMembers(data);
  }

  async function handleRemoveMember(id) {
    await removeFamilyMember(id);
    const { data } = await fetchFamilyMembers(user.id);
    if (Array.isArray(data)) setFamilyMembers(data);
  }

  function exportData(format) {
    const data = {
      exportedAt: new Date().toISOString(),
      user: { email: user?.email, name: profile?.full_name },
      medications: (meds || []).map(m => ({
        name: m.name, dosage: `${m.dosage_amount} ${m.dosage_unit}`,
        times_per_day: m.times_per_day, course_duration_days: m.course_duration_days,
        start_date: m.start_date, active: m.active, color: m.color,
      })),
      dose_logs: (logs || []).map(l => ({
        medication_id: l.medication_id, taken_at: l.taken_at, journal: l.journal,
      })),
    };

    let blob, filename;
    if (format === "csv") {
      const rows = [["Medication","Dosage","Times/Day","Course Days","Start Date","Active"]];
      (meds || []).forEach(m => {
        rows.push([m.name, `${m.dosage_amount} ${m.dosage_unit}`, m.times_per_day, m.course_duration_days, m.start_date, m.active]);
      });
      rows.push([]);
      rows.push(["Dose Log","Taken At","Journal"]);
      (logs || []).forEach(l => {
        const med = (meds || []).find(m => m.id === l.medication_id);
        rows.push([med?.name || l.medication_id, l.taken_at, l.journal || ""]);
      });
      blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
      filename = "adhera-data.csv";
    } else {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      filename = "adhera-data.json";
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== user?.email) return;
    try {
      await sb.from("dose_logs").delete().eq("user_id", user.id);
      await sb.from("medications").delete().eq("user_id", user.id);
      await sb.from("profiles").delete().eq("id", user.id);
      localStorage.clear();
      sessionStorage.clear();
      await sb.auth.signOut();
      window.location.reload();
    } catch (e) {
      alert("Error deleting account: " + (e?.message || "Unknown error"));
    }
  }

  function refreshMedicalID() {
    try {
      const raw = localStorage.getItem("mt_medical_id");
      setMedicalID(raw ? JSON.parse(raw) : {});
    } catch {}
  }

  const plan = profile?.plan || "free";
  const country = profile?.country || user?.user_metadata?.country || "GH";
  const { pricing } = getPricing(country);
  const selCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

  const { has, config } = useTier();
  const tierCfg = getTierConfig(plan);
  const pm = {
    label: tierCfg.label,
    color: tierCfg.theme.accent,
    badge: tierCfg.badge,
    icon: plan === "pro" ? <Crown size={13} strokeWidth={2.5} color={tierCfg.theme.accent}/> : plan === "family" ? <Users size={13} strokeWidth={2.5} color={tierCfg.theme.accent}/> : null,
  };

  function startEdit() {
    setEditData({
      avatar_emoji: profile?.avatar_emoji || "Smile",
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
          <span>{t("profile.editProfile")}</span>
          <button className="nav-action" onClick={saveEdit}>{t("btn.done")}</button>
      </div>

      <div className="section">
        <div className="section-header">{t("profile.avatar")}</div>
        <div style={{padding:"0 16px"}}>
          <AvatarPicker
            user={user}
            avatarKey={editData.avatar_emoji}
            avatarUrl={editData.avatar_url}
            onPick={k=>setEditData(p=>({...p,avatar_emoji:k}))}
            onUploaded={u=>{ setEditData(p=>({...p,avatar_url:u})); onSaveProfile({ avatar_url: u }); }}
            onRemovePhoto={()=>setEditData(p=>({...p,avatar_url:""}))}
          />
        </div>
      </div>

      <div className="section">
        <div className="section-header">{t("profile.name")}</div>
        <div style={{padding:"0 16px"}}>
          <input className="sheet-input" value={editData.full_name} onChange={e=>setEditData(p=>({...p,full_name:e.target.value}))}/>
        </div>
      </div>

      <div className="section">
        <div className="section-header">{t("profile.schedule")}</div>
        <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
          {[{label:"Wake up time",key:"wake_time"},{label:"Bedtime",key:"sleep_time"}].map(({label,key})=>(
            <div key={key} style={{background:"var(--card)",borderRadius:"var(--rl)",padding:"14px 16px",boxShadow:"var(--card-shadow)",border:"var(--card-border)"}}>
              <div style={{fontSize:13,color:"var(--t3)",marginBottom:8,fontWeight:500}}>{label}</div>
              <input type="time" value={editData[key]} onChange={e=>setEditData(p=>({...p,[key]:e.target.value}))} style={{fontSize:18,fontWeight:600,border:"none",background:"none",color:"var(--t1)",fontFamily:"inherit",width:"100%",minWidth:0,outline:"none",boxSizing:"border-box",maxWidth:150}}/>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header">{t("profile.country")}</div>
        <div style={{padding:"0 16px"}}>
          <select className="sheet-input" value={editData.country} onChange={e=>setEditData(p=>({...p,country:e.target.value}))} style={{width:"100%"}}>
            {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="section">
        <div className="section-header">{t("profile.healthGoals")}</div>
        <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:8}}>
          {[
            {icon:<Ico><Pill size={15} strokeWidth={2.2}/></Ico>,label:"Never miss a dose"},
            {icon:<Ico><BarChart3 size={15} strokeWidth={2.2}/></Ico>,label:"Track adherence over time"},
            {icon:<Ico><Stethoscope size={15} strokeWidth={2.2}/></Ico>,label:"Share reports with my doctor"},
            {icon:<Ico><Users size={15} strokeWidth={2.2}/></Ico>,label:"Manage family medications"},
            {icon:<Ico><Bell size={15} strokeWidth={2.2}/></Ico>,label:"Build a medication habit"},
            {icon:<Ico><Pill size={15} strokeWidth={2.2}/></Ico>,label:"Complete my full course"},
          ].map(g => {
            const s = editData.goals.includes(g.label);
            return (
              <div key={g.label} className={`goal-chip${s?" sel":""}`}
                onClick={()=>setEditData(p=>({...p,goals: s ? p.goals.filter(x=>x!==g.label) : [...p.goals,g.label]}))}>
                <div className="goal-chip-icon">{g.icon}</div>
                <div className="goal-chip-label">{g.label}</div>
                <div className={`goal-chip-check${s?" on":""}`}>{s&&<Check size={11} color="white" strokeWidth={3}/>}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-header">{t("profile.theme")}</div>
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
              {editData.theme===th.id && <div className="theme-swatch-check"><Check size={18} color="white" strokeWidth={3}/></div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"16px"}}>
        <button className="btn btn-ghost" onClick={()=>setEditing(false)} style={{color:"var(--t3)"}}>{t("btn.cancel")}</button>
      </div>
    </div>
  );

  return (
    <div className="scroll">
      <style>{CSS}</style>

      <div className="profile-header" style={{background:"var(--card)",margin:"0 20px 14px",borderRadius:"var(--rxl)",padding:"30px 20px 24px",boxShadow:"var(--card-shadow)",border:"var(--card-border)"}}>
        <div style={{position:"relative",width:88,height:88}}>
          <div className="profile-avatar" style={{cursor:profile?.avatar_url?"pointer":"default",overflow:"hidden",margin:0,boxShadow:"0 4px 16px rgba(0,0,0,.12)"}} onClick={() => profile?.avatar_url && setShowLightbox(true)}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>
            ) : (
              (() => { const A = avatarIcon(profile?.avatar_emoji); return <A size={34}/>; })()
            )}
            {uploading && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",display:"grid",placeItems:"center",color:"white",fontSize:13,borderRadius:"50%"}}>{t("profile.uploading")}</div>}
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
          <span style={{fontSize:13,fontWeight:600,color:pm.color,background:`${pm.color}14`,padding:"3px 12px",borderRadius:99,display:"flex",alignItems:"center",gap:4}}>{pm.icon} {pm.label}</span>
          <span style={{fontSize:13,color:"var(--t3)",display:"inline-flex",alignItems:"center",gap:4}}><Globe size={12}/> {selCountry.name}</span>
        </div>
        <div style={{display:"flex",gap:8,marginTop:6}}>
          <button className="btn btn-ghost btn-sm" style={{width:"auto",display:"flex",alignItems:"center",gap:4}} onClick={startEdit}><Ico><Pencil size={13} strokeWidth={2.2}/></Ico> {t("profile.editProfile")}</button>
          <button className="btn btn-ghost btn-sm" style={{width:"auto",display:"flex",alignItems:"center",gap:4}} onClick={() => onSaveProfile({ theme: (profile?.theme || "blue") === "dark" ? "blue" : "dark" })}>
            {(profile?.theme || "blue") === "dark" ? <><Ico><Sun size={13} strokeWidth={2.2}/></Ico> Light</> : <><Ico><Moon size={13} strokeWidth={2.2}/></Ico> Dark</>}
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
      <div className="section" style={{marginBottom:16}}>
        <div className="section-header">{t("profile.healthGoals")}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"0 16px"}}>
            {profile.goals.map(g => <span key={g} className="tag">{g}</span>)}
          </div>
        </div>
      )}

      {(config.upsell || plan === "pro") ? (
        <div className="upgrade-card" style={{margin:"0 20px 20px"}}>
          <div className="upgrade-title" style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>{plan === "pro" ? "Upgrade to Family" : t("profile.unlockPro")} <Ico><Sparkles size={16} strokeWidth={2.2} color="var(--orange)"/></Ico></div>
          <div className="upgrade-sub">{plan === "pro" ? "Track up to 5 family members with shared dashboards" : t("profile.unlimitedMedsAd")}</div>
          <div className="upgrade-features">
            {(plan === "pro"
              ? [t("profile.unlimitedMeds"),t("profile.fullHistory"),"Up to 5 family profiles",t("profile.adherenceReports"),"Caregiver mode with alerts"]
              : [t("profile.unlimitedMeds"),t("profile.fullHistory"),t("profile.refillReminders"),t("profile.adherenceReports"),t("profile.drugCheck")]
            ).map(f => (
              <div key={f} className="upgrade-feature"><Check size={13} color="var(--teal)" strokeWidth={3} style={{verticalAlign:"-2px"}}/> {f}</div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {(plan === "pro" ? ["family"] : ["pro","family"]).map(p => (
              <div key={p} style={{background:"rgba(255,255,255,.12)",borderRadius:10,padding:"10px 6px",textAlign:"center",position:"relative"}}>
                {p === plan && <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",background:"var(--teal)",color:"white",fontSize:8,fontWeight:700,padding:"1px 6px",borderRadius:99,letterSpacing:".3px"}}>CURRENT</div>}
                <div style={{fontSize:16,fontWeight:800}}>{getTierConfig(p).label}</div>
                <div style={{fontSize:10,opacity:.8}}>{pricing[p].label} / mo</div>
              </div>
            ))}
          </div>
          <button className="upgrade-btn" onClick={() => setShowUpgrade(true)}>{plan === "pro" ? "Upgrade to Family →" : t("profile.seeUpgrade")} →</button>
        </div>
      ) : null}

      {has("familyMembers") && (
    <div className="section" style={{marginBottom:16}}>
      <div className="section-header" style={{display:"flex",alignItems:"center",gap:8}}><Ico><Users size={15} strokeWidth={2.2} color="var(--t1)"/></Ico> {t("profile.familyDashboard")}</div>
          <div className="list">
            <Row icon={<Ico><User size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib1)" title={t("profile.primaryMember")} sub={profile?.full_name || user?.email}/>
            <Row icon={<Ico><UserPlus size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib4)" title={t("profile.addFamilyMember")} sub={t("profile.inviteViaEmail")} onClick={() => setShowAddMember(true)}/>
            <Row icon={<Ico><BarChart3 size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib3)" title={t("profile.sharedCompliance")} sub={t("profile.seeAdherence")}/>
            <Row icon={<Ico><Bell size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib6)" title={t("profile.caregiverNotif")} sub={t("profile.alertsMissed")}/>
          </div>
        </div>
      )}

    <div className="section" style={{marginBottom:16}}>
      <div className="section-header">{t("profile.notifications")}</div>
        <div className="list">
          <Row
            icon={<Ico><Bell size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib3)"
            title="Push notifications"
            sub={!notifOn || notifPerm !== "granted" ? notifPerm==="denied" ? t("profile.notifDenied") : notifPerm==="unsupported" ? t("profile.notifUnsupported") : t("profile.notifSub") : t("profile.notifOn")}
          >
            <Toggle on={notifOn && notifPerm === "granted"} onChange={notifPerm === "denied" ? undefined : enableNotifs} disabled={notifPerm === "denied"}/>
          </Row>
          <Row
            icon={<Ico><Clock size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib5)"
            title="Daily schedule"
            sub={`${profile?.wake_time || "07:00"} – ${profile?.sleep_time || "22:00"}`}
            onClick={()=>{setSchedVals({wake:profile?.wake_time||"07:00",sleep:profile?.sleep_time||"22:00"}); setEditSchedule(true);}}
          />
          {editSchedule ? (
            <div className="row" style={{cursor:"default",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
              <div className="row-icon" style={{background:"var(--ib5)",marginTop:2}}><Ico><Clock size={18} strokeWidth={2} color="var(--t1)"/></Ico></div>
              <div className="row-body" style={{minWidth:0}}>
                <div className="row-title">Schedule</div>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
                  <div>
                    <div style={{fontSize:11,color:"var(--t3)",marginBottom:4,fontWeight:500}}>Wake up</div>
                    <input type="time" value={schedVals.wake} onChange={e=>setSchedVals(p=>({...p,wake:e.target.value}))}
                      style={{fontSize:16,fontWeight:600,border:"1.5px solid var(--sep)",borderRadius:10,padding:"8px 10px",color:"var(--t1)",background:"var(--input)",fontFamily:"inherit",width:"100%",minWidth:0,maxWidth:150,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:"var(--t3)",marginBottom:4,fontWeight:500}}>Bedtime</div>
                    <input type="time" value={schedVals.sleep} onChange={e=>setSchedVals(p=>({...p,sleep:e.target.value}))}
                      style={{fontSize:16,fontWeight:600,border:"1.5px solid var(--sep)",borderRadius:10,padding:"8px 10px",color:"var(--t1)",background:"var(--input)",fontFamily:"inherit",width:"100%",minWidth:0,maxWidth:150,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,width:"100%",paddingLeft:"42px"}}>
                <button className="btn btn-sm btn-primary" style={{width:"auto"}} onClick={()=>{onSaveProfile({wake_time:schedVals.wake,sleep_time:schedVals.sleep}); setEditSchedule(false);}}>Save</button>
                <button className="btn btn-sm btn-ghost" style={{width:"auto",color:"var(--t3)"}} onClick={()=>{setSchedVals({wake:profile?.wake_time||"07:00",sleep:profile?.sleep_time||"22:00"}); setEditSchedule(false);}}>Cancel</button>
              </div>
            </div>
          ) : null}
          {notifPerm === "granted" && notifOn && (
            <>
              <div className="row" style={{cursor:"default"}}>
                <div className="row-icon" style={{background:"var(--ib1)"}}><Ico><Timer size={18} strokeWidth={2} color="var(--t1)"/></Ico></div>
                <div className="row-body"><div className="row-title">{t("profile.reminderBeforeDose")}</div><div className="row-sub">{t("profile.getNotified")}</div></div>
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
                <div className="row-icon" style={{background:"var(--ib3)"}}><Ico><Volume2 size={18} strokeWidth={2} color="var(--t1)"/></Ico></div>
                <div className="row-body"><div className="row-title">{t("profile.testAlarm")}</div><div className="row-sub">{t("profile.playTest")}</div></div>
                <span style={{fontSize:16,color:"var(--t3)"}}>▶</span>
              </div>
            </>
          )}
        </div>
      </div>

    <div className="section" style={{marginBottom:16}}>
      <div className="section-header">Age &amp; Demographics</div>
        <div className="list">
          <Row icon={<Ico><ClipboardList size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib5)" title="Age &amp; Demographics" sub={(()=>{const p=personalDetails;const parts=[];if(p.age)parts.push(`${p.age} years`);if(p.height)parts.push(`${p.height} cm`);if(p.weight)parts.push(`${p.weight} kg`);return parts.length?parts.join(" · "):"Add your details";})()} onClick={()=>setShowPersonalDetails(true)}/>
        </div>
      </div>

    <div className="section" style={{marginBottom:16}}>
      <div className="section-header">Medical ID</div>
        <div className="list">
          <Row icon={<Ico><Pill size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib5)" title="Current medications" sub={(medicalID.medication_ids||[]).length ? `${(medicalID.medication_ids||[]).length} listed in Medical ID` : "Not set"} onClick={()=>setMedSection("medications")}/>
          <Row icon={<Ico><Droplet size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib6)" title="Blood type" sub={medicalID.blood_type || "Not set"} onClick={()=>setMedSection("blood_type")}/>
          <Row icon={<Ico><AlertTriangle size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib3)" title="Allergies" sub={(medicalID.allergies||[]).length ? medicalID.allergies.join(", ") : "None recorded"} onClick={()=>setMedSection("allergies")}/>
          <Row icon={<Ico><Info size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib2)" title="Medical conditions" sub={(medicalID.conditions||[]).length ? medicalID.conditions.join(", ") : "None recorded"} onClick={()=>setMedSection("conditions")}/>
          <Row icon={<Ico><Phone size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib1)" title="Emergency contact" sub={medicalID.emergency_name ? `${medicalID.emergency_name}${medicalID.emergency_relation ? ` · ${medicalID.emergency_relation}` : ""}${medicalID.emergency_phone ? ` · ${medicalID.emergency_code || "+233"} ${medicalID.emergency_phone}` : ""}` : "Not set"} onClick={()=>setMedSection("contact")}/>
        </div>
      </div>

    <div className="section" style={{marginBottom:16}}>
      <div className="section-header">{t("profile.account")}</div>
        <div className="list">
          <Row icon={<Ico><Mail size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib1)" title={t("profile.email")} sub={user?.email}/>

          {editCountryPick ? (
            <div className="row" style={{cursor:"default",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
              <div className="row-icon" style={{background:"var(--ib4)",marginTop:2}}><Ico><Globe size={18} strokeWidth={2} color="var(--t1)"/></Ico></div>
              <div className="row-body" style={{flex:"1",minWidth:200}}>
                <div className="row-title">Country</div>
                <select className="sheet-input" value={country} onChange={e=>{const v=e.target.value; setEditCountryPick(false); onSaveProfile({country:v});}}
                  style={{marginTop:8,fontSize:14}} autoFocus>
            {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:8,width:"100%",paddingLeft:"42px"}}>
                <button className="btn btn-sm btn-ghost" style={{width:"auto",color:"var(--t3)"}} onClick={()=>setEditCountryPick(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <Row icon={<Ico><Globe size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib4)" title="Country" sub={<span style={{display:"inline-flex",alignItems:"center",gap:4}}><Globe size={12}/> {selCountry.name}</span>} onClick={()=>setEditCountryPick(true)}/>
          )}

          {editLang ? (
            <div className="row" style={{cursor:"default",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
              <div className="row-icon" style={{background:"var(--ib2)",marginTop:2}}><Ico><Languages size={18} strokeWidth={2} color="var(--t1)"/></Ico></div>
              <div className="row-body" style={{flex:"1",minWidth:200}}>
                <div className="row-title">{t("profile.language")}</div>
                <select className="sheet-input" value={lang} onChange={e=>{const v=e.target.value; setLang(v); setEditLang(false);}}
                  style={{marginTop:8,fontSize:14}} autoFocus>
                  {LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:8,width:"100%",paddingLeft:"42px"}}>
                <button className="btn btn-sm btn-ghost" style={{width:"auto",color:"var(--t3)"}} onClick={()=>setEditLang(false)}>{t("btn.cancel")}</button>
              </div>
            </div>
          ) : (
            <Row icon={<Ico><Languages size={18} strokeWidth={2} color="var(--t1)"/></Ico>} bg="var(--ib2)" title={t("profile.language")} sub={currentLang.label} onClick={()=>setEditLang(true)}/>
          )}

            <Row icon={<Ico><LogOut size={18} strokeWidth={2} color="var(--red)"/></Ico>} bg="var(--ib6)" title={<span style={{color:"var(--red)"}}>{t("profile.signOut")}</span>} onClick={onSignOut}/>
        </div>
      </div>

    <div className="section" style={{marginBottom:16}}>
      <div className="section-header">{t("profile.about")}</div>
        <div className="list">
          <div className="row" style={{cursor:"default"}}><div className="row-body"><div className="row-title">Adhera</div><div className="row-sub">Version 1.0.1</div></div></div>
          <div className="row" onClick={()=>setShowPrivacy(true)} style={{cursor:"pointer"}}><div className="row-body"><div className="row-title">Privacy Policy</div></div><Chevron/></div>
          <div className="row" onClick={()=>setShowTerms(true)} style={{cursor:"pointer"}}><div className="row-body"><div className="row-title">Terms of Service</div></div><Chevron/></div>
        </div>
      </div>

    <div className="section" style={{marginBottom:16}}>
      <div className="section-header">{t("profile.privacyData")}</div>
        <div className="list">
          <div className="row" onClick={() => exportData("json")} style={{cursor:"pointer"}}>
            <div className="row-icon" style={{background:"var(--ib1)"}}><Ico><Download size={18} strokeWidth={2} color="var(--t1)"/></Ico></div>
            <div className="row-body"><div className="row-title">{t("profile.exportJson")}</div><div className="row-sub">{t("profile.exportJsonSub")}</div></div>
            <Chevron/>
          </div>
          <div className="row" onClick={() => exportData("csv")} style={{cursor:"pointer"}}>
            <div className="row-icon" style={{background:"var(--ib2)"}}><Ico><FileSpreadsheet size={18} strokeWidth={2} color="var(--t1)"/></Ico></div>
            <div className="row-body"><div className="row-title">{t("profile.exportCsv")}</div><div className="row-sub">{t("profile.exportCsvSub")}</div></div>
            <Chevron/>
          </div>
          <div className="row" onClick={() => setShowDeleteAccount(true)} style={{cursor:"pointer"}}>
            <div className="row-icon" style={{background:"var(--ib6)"}}><Ico><Trash2 size={18} strokeWidth={2} color="var(--red)"/></Ico></div>
            <div className="row-body"><div className="row-title" style={{color:"var(--red)"}}>{t("profile.deleteAccount")}</div><div className="row-sub">{t("profile.deleteAccountSub")}</div></div>
            <Chevron/>
          </div>
        </div>
      </div>

      {createPortal(<>
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
            currentPlan={plan}
            onClose={() => setShowUpgrade(false)}
            onUpgrade={handleUpgrade}
          />
        )}
        {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
        {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
        {showPersonalDetails && (
          <PersonalDetailsModal details={personalDetails} onSave={savePersonalDetails} onClose={() => setShowPersonalDetails(false)}/>
        )}
        {medSection && <MedicalID meds={meds} section={medSection} onClose={() => { setMedSection(null); refreshMedicalID(); }}/>}
        {showDeleteAccount && (
          <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setShowDeleteAccount(false)}>
            <div className="sheet" style={{maxHeight:"80vh"}} onClick={e => e.stopPropagation()}>
              <div className="sheet-handle"/>
              <div style={{padding:"20px 20px calc(16px + var(--safe-bottom))",textAlign:"center"}}>
                <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><Ico><ShieldAlert size={44} strokeWidth={1.8} color="var(--red)"/></Ico></div>
                <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>{t("profile.deleteTitle")}</div>
                <div style={{fontSize:14,color:"var(--t3)",lineHeight:1.6,marginBottom:20}}>
                  {t("profile.deleteDesc")}
                </div>
                <div style={{marginBottom:16,textAlign:"left"}}>
                  <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>{t("profile.typeEmail")}</div>
                  <input className="sheet-input" type="email" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder={user?.email} style={{fontSize:14}}/>
                </div>
                <div className="sheet-actions" style={{gap:8}}>
                  <button className="btn" onClick={handleDeleteAccount} disabled={deleteConfirm !== user?.email}
                    style={{flex:1,background:"var(--red)",color:"white",opacity:deleteConfirm===user?.email?1:0.5}}>
                    {t("profile.deletePermanently")}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setShowDeleteAccount(false); setDeleteConfirm(""); }}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>, document.body)}
    </div>
  );
}

function PersonalDetailsModal({ details, onSave, onClose }) {
  const [f, setF] = useState({ ...details });

  function set(k, v) { setF(p => ({ ...p, [k]: v })); }

  function handleSave() {
    onSave(f);
    onClose();
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{maxHeight:"90vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div className="sheet-title">Age &amp; Demographics</div>
        <div style={{padding:"8px 20px 20px",overflowY:"auto",maxHeight:"calc(90vh - 80px)"}}>
          <FormControl label="Date of birth">
            <input className="sheet-input" type="date" value={f.dob || ""} onChange={e => set("dob", e.target.value)}/>
          </FormControl>

          <FormRow>
            <FormControl label="Age" className="!mb-0">
              <input className="sheet-input" type="number" inputMode="numeric" placeholder="e.g. 35" value={f.age || ""} onChange={e => set("age", e.target.value)}/>
            </FormControl>
            <FormControl label="Gender" className="!mb-0">
              <select className="sheet-input" value={f.gender || ""} onChange={e => set("gender", e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not">Prefer not to say</option>
              </select>
            </FormControl>
          </FormRow>

          <FormRow>
            <FormControl label="Height (cm)" className="!mb-0">
              <input className="sheet-input" type="number" inputMode="decimal" placeholder="e.g. 170" value={f.height || ""} onChange={e => set("height", e.target.value)}/>
            </FormControl>
            <FormControl label="Weight (kg)" className="!mb-0">
              <input className="sheet-input" type="number" inputMode="decimal" placeholder="e.g. 70" value={f.weight || ""} onChange={e => set("weight", e.target.value)}/>
            </FormControl>
          </FormRow>

          <div className="sheet-actions">
            <button className="btn btn-primary" onClick={handleSave}>Save details</button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
