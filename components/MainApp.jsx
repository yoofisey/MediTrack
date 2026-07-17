"use client";

import { useState, useEffect } from "react";
import { sb } from "@/lib/supabase";
import { CSS } from "@/lib/constants";
import { THEMES } from "@/lib/data";
import { scheduleDoseAlarms, askNotifPerm, stopAlarmSound, clearAllTimers } from "@/lib/notifications";
import TodayTab from "@/components/TodayTab";
import MedsTab from "@/components/MedsTab";
import HistoryTab from "@/components/HistoryTab";
import ReportsTab from "@/components/ReportsTab";
import ProfileTab from "@/components/ProfileTab";
import MedSheet from "@/components/MedSheet";
import { DeleteConfirmModal, LogDoseModal } from "@/components/Modals";

export default function MainApp({ user, profile: initProfile, onSignOut }) {
  const [tab, setTab] = useState("today");
  const [meds, setMeds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 5000); return () => clearTimeout(t); }, []);
  const [editMed, setEditMed] = useState(null);
  const [profile, setProfile] = useState(initProfile);
  const [notifPerm, setNotifPerm] = useState(() => "Notification" in window ? Notification.permission : "default");
  const [loadKey, setLoadKey] = useState(0);
  const [deleteMedId, setDeleteMedId] = useState(null);
  const [logDoseMed, setLogDoseMed] = useState(null);

  const notifOn = () => { const s = ls(); try { const v = s?.getItem("mt_notif_on"); return v === "1"; } catch { return false; } };
  function ls() { try { return localStorage; } catch { return null; } }

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const [mr, lr] = await Promise.all([
          sb.from("medications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          sb.from("dose_logs").select("*, medications(name)").eq("user_id", user.id).order("taken_at", { ascending: false }).limit(300),
        ]);
        if (!cancelled) {
          if (Array.isArray(mr.data)) setMeds(mr.data);
          if (Array.isArray(lr.data)) setLogs(lr.data);
        }
      } catch (e) {
        if (!cancelled) console.error("load error:", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, loadKey]);
  useEffect(() => { if (notifOn() && (meds.length || logs.length)) scheduleDoseAlarms(meds, logs, profile?.wake_time || "08:00", profile?.reminder_lead || 30); return () => { clearAllTimers(); }; }, [meds, profile?.reminder_lead, profile?.wake_time, logs]);
  useEffect(() => {
    function onMsg(e) { if (e.data?.type === "alarm-ack") stopAlarmSound(); }
    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", onMsg);
      navigator.serviceWorker.ready.then(r => { window._mt_swReady = true; }).catch(() => {});
      return () => { navigator.serviceWorker.removeEventListener("message", onMsg); };
    }
  }, []);
  useEffect(() => {
    const t = THEMES[profile?.theme] || THEMES.blue;
    const root = document.documentElement;
    root.style.setProperty("--teal", t.accent);
    root.style.setProperty("--teal2", t.accent2);
    root.style.setProperty("--bg", t.bg);
    root.style.setProperty("--card", t.card);
    root.style.setProperty("--sep", t.sep);
    root.style.setProperty("--t1", t.t1);
    root.style.setProperty("--t2", t.t2);
    root.style.setProperty("--t3", t.t3);
    root.style.setProperty("--t4", t.t4);
    root.style.setProperty("--bar", t.bar);
    root.style.setProperty("--hover", t.hover);
    root.style.setProperty("--sel", t.sel);
    root.style.setProperty("--input", t.input);
    root.style.setProperty("--ib1", t.ib1);
    root.style.setProperty("--ib2", t.ib2);
    root.style.setProperty("--ib3", t.ib3);
    root.style.setProperty("--ib4", t.ib4);
    root.style.setProperty("--ib5", t.ib5);
    root.style.setProperty("--ib6", t.ib6);
  }, [profile?.theme]);

  function reload() { setLoadKey(k => k + 1); }

  async function logDose(med, journal = "") {
    if (!user?.id) return;
    const lastLog = logs.filter(l => l.medication_id === med.id).sort((a, b) => b.taken_at.localeCompare(a.taken_at))[0];
    if (lastLog) {
      const elapsed = (Date.now() - new Date(lastLog.taken_at).getTime()) / 3600000;
      if (elapsed < (med.dose_interval_hours || 24/med.times_per_day)) {
        const waitH = Math.ceil((med.dose_interval_hours || 24/med.times_per_day) - elapsed);
        const waitM = Math.round(waitH * 60);
        if (waitM < 60) { alert(`⏳ Wait ${waitM} more minutes before your next dose.`); return; }
        alert(`⏳ Wait ~${waitH} more hour${waitH>1?"s":""} before your next dose.`); return;
      }
    }
    try {
      const { error } = await sb.from("dose_logs").insert([{
        user_id: user.id,
        medication_id: med.id,
        taken_at: new Date().toISOString(),
        journal: journal || null,
      }]);
      if (error) {
        console.error("Log dose error:", error?.message || error);
        return;
      }
      reload();
    } catch (e) {
      console.error("Log dose exception:", e?.message || e);
    }
  }

  async function logRefill(medId) {
    try {
      await sb.from("medications").eq("id", medId).update({ last_refill_date: new Date().toISOString() });
      reload();
    } catch (e) {
      console.error("refill error:", e?.message || e);
    }
  }

  async function confirmDelete() {
    if (!user?.id || !deleteMedId) return;
    const id = deleteMedId;
    setDeleteMedId(null);
    try {
      await sb.from("dose_logs").eq("medication_id", id).delete();
      await sb.from("medications").eq("id", id).delete();
      reload();
    } catch (e) {
      console.error("deleteMed error:", e?.message || e);
    }
  }

  function deleteMed(id) {
    setDeleteMedId(id);
  }

  async function saveProfile(patch) {
    if (!user?.id) return;
    const updated = { ...profile, ...patch };
    setProfile(updated);
    try {
      await sb.from("profiles").eq("id", user.id).update(patch);
    } catch (e) {
      console.error("saveProfile error:", e?.message || e);
    }
  }

  async function enableNotif() {
    const s = ls();
    const wasOn = notifOn();
    if (wasOn) {
      s?.setItem("mt_notif_on", "0");
      clearAllTimers();
      sendToSW("clear-alarms");
      setNotifPerm(Notification.permission);
      return;
    }
    const p = await askNotifPerm();
    setNotifPerm(p);
    if (p === "granted") {
      s?.setItem("mt_notif_on", "1");
      scheduleDoseAlarms(meds, logs, profile?.wake_time || "08:00", profile?.reminder_lead || 30);
    } else if (p === "denied") {
      s?.setItem("mt_notif_on", "0");
    }
  }

  function sendToSW(type, payload) {
    try {
      if (navigator.serviceWorker?.controller) navigator.serviceWorker.controller.postMessage({ type, payload });
    } catch {}
  }

  const tabs = [
    { id:"today", label:"Today", icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:24,height:24}}><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg> },
    { id:"medications", label:"Meds", icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:24,height:24}}><path d="M6.5 10h-2v5h2v-5zm4 0h-2v5h2v-5zm8.5 7H4v2h15v-2zm-4.5-7h-2v5h2v-5zM11.5 1L2 6v2h19V6l-9.5-5z"/></svg> },
    { id:"history", label:"History", icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:24,height:24}}><path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8H12z"/></svg> },
    { id:"reports", label:"Reports", icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:24,height:24}}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg> },
    { id:"profile", label:"Profile" },
  ];

  if (loading) return <div className="loading-screen"><style>{CSS}</style><div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}><div style={{fontSize:48,animation:"pulse 1.2s ease-in-out infinite"}}>💊</div><div style={{fontSize:15,color:"var(--t3)",fontWeight:500}}>Loading your medications...</div></div></div>;

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      <style>{CSS}</style>

      <div style={{paddingBottom:"calc(49px + env(safe-area-inset-bottom,0px))"}}>
        {tab==="today" && <TodayTab meds={meds} logs={logs} onLog={(med)=>setLogDoseMed(med)} onAdd={()=>setShowAdd(true)} notifPerm={notifPerm} onEnableNotif={enableNotif} plan={profile?.plan||"free"} medCount={meds.length}/>}
        {tab==="medications" && <MedsTab meds={meds} logs={logs} onAdd={()=>setShowAdd(true)} onEdit={setEditMed} onDelete={deleteMed} onRefill={logRefill} plan={profile?.plan||"free"} medCount={meds.length}/>}
        {tab==="history" && <HistoryTab logs={logs} meds={meds} plan={profile?.plan||"free"}/>}
        {tab==="reports" && <ReportsTab logs={logs} meds={meds} plan={profile?.plan||"free"} onNavigate={setTab}/>}
        {tab==="profile" && <ProfileTab user={user} profile={profile} onSignOut={onSignOut} onSaveProfile={saveProfile} medCount={meds.length}/>}
      </div>

      <div className="tabbar">
        {tabs.map(t=>(
          <div key={t.id} className={`tbi${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
            {t.id === "profile" ? (
              <div style={{width:24,height:24,borderRadius:"50%",background:"var(--ib3)",display:"grid",placeItems:"center",fontSize:13,overflow:"hidden"}}>
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : profile?.avatar_emoji || "😊"}
              </div>
            ) : t.icon}
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      {(showAdd||editMed) && (
        <MedSheet
          med={editMed}
          userId={user.id}
          reminderLead={profile?.reminder_lead||30}
          plan={profile?.plan||"free"}
          medCount={meds.length}
          onSave={()=>{setShowAdd(false);setEditMed(null);reload();}}
          onClose={()=>{setShowAdd(false);setEditMed(null);}}
        />
      )}
      {deleteMedId && (
        <DeleteConfirmModal
          medName={meds.find(m => m.id === deleteMedId)?.name || "this medication"}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteMedId(null)}
        />
      )}
      {logDoseMed && (
        <LogDoseModal
          med={logDoseMed}
          onConfirm={(journal) => { const m = logDoseMed; setLogDoseMed(null); logDose(m, journal); }}
          onCancel={() => setLogDoseMed(null)}
        />
      )}
    </div>
  );
}
