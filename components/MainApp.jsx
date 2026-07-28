"use client";

import { useState, useEffect, useCallback } from "react";
import { sb } from "@/lib/supabase";
import { CSS } from "@/lib/constants";
import { THEMES, calcStreak, initStockForMed, decrementStock, refillStock } from "@/lib/data";
import { scheduleDoseAlarms, scheduleVitalReminders, askNotifPerm, subscribeToPush, stopAlarmSound, clearAllTimers } from "@/lib/notifications";
import TodayTab from "@/components/TodayTab";
import MedsTab from "@/components/MedsTab";
import ReportsTab from "@/components/ReportsTab";
import FamilyTab from "@/components/FamilyTab";
import ProfileTab from "@/components/ProfileTab";
import VitalsTab from "@/components/VitalsTab";
import MedSheet from "@/components/MedSheet";
import { DeleteConfirmModal, LogDoseModal } from "@/components/Modals";
import AlarmOverlay from "@/components/AlarmOverlay";
import VisitSheet from "@/components/VisitSheet";

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
  const [alarmData, setAlarmData] = useState(null);
  const [alarmQueue, setAlarmQueue] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [viewFamily, setViewFamily] = useState(false);
  const [showVisitSheet, setShowVisitSheet] = useState(false);
  const [editVisit, setEditVisit] = useState(null);

  const notifOn = () => { const s = ls(); try { const v = s?.getItem("mt_notif_on"); return v === "1"; } catch { return false; } };
  function ls() { try { return localStorage; } catch { return null; } }

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const [mr, lr, vr] = await Promise.all([
          sb.from("medications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          sb.from("dose_logs").select("*, medications(name)").eq("user_id", user.id).order("taken_at", { ascending: false }).limit(300),
          sb.from("vitals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
        ]);
        if (!cancelled) {
          if (Array.isArray(mr.data)) {
            setMeds(mr.data);
            mr.data.filter(m => m.pills_per_package && m.active).forEach(m => initStockForMed(m));
          }
          if (Array.isArray(lr.data)) setLogs(lr.data);
          if (Array.isArray(vr.data)) setVitals(vr.data);
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
    try {
      const vitalReminders = JSON.parse(localStorage.getItem("mt_vital_reminders") || "{}");
      if (notifOn() && vitals.length) scheduleVitalReminders(vitalReminders, vitals);
    } catch {}
  }, [vitals]);
  useEffect(() => {
    if (notifOn() && user?.id && "serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then(async reg => {
        const existing = await reg.pushManager.getSubscription();
        if (!existing) await subscribeToPush(user.id);
      }).catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    function onMsg(e) { if (e.data?.type === "alarm-ack") stopAlarmSound(); }
    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", onMsg);
      navigator.serviceWorker.ready.then(r => { window._mt_swReady = true; }).catch(() => {});
      return () => { navigator.serviceWorker.removeEventListener("message", onMsg); };
    }
  }, []);
  useEffect(() => {
    function onAlarm(e) { setAlarmData(e.detail); }
    window.addEventListener("mt-alarm", onAlarm);
    return () => window.removeEventListener("mt-alarm", onAlarm);
  }, []);

  useEffect(() => {
    if (loading || !meds.length) return;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const wakeTime = profile?.wake_time || "08:00";
    const streak = calcStreak(logs, meds);
    const overdue = [];

    meds.forEach(med => {
      if (!med.active) return;
      const end = new Date(med.start_date);
      end.setDate(end.getDate() + med.course_duration_days);
      if (end < now) return;

      const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
      const lastLog = logs.filter(l => l.medication_id === med.id).sort((a, b) => b.taken_at.localeCompare(a.taken_at))[0];
      const todayStart = new Date(`${todayStr}T${wakeTime}:00`);

      let doseTimes = [];
      if (lastLog && new Date(lastLog.taken_at) >= todayStart) {
        const next = new Date(new Date(lastLog.taken_at).getTime() + intervalMs);
        if (next <= now) doseTimes.push(next);
      } else {
        const dosesToday = med.times_per_day || 1;
        for (let i = 0; i < dosesToday; i++) {
          const dt = new Date(todayStart.getTime() + i * intervalMs);
          if (dt <= now) doseTimes.push(dt);
        }
      }

      const todayCount = logs.filter(l => l.medication_id === med.id && l.taken_at?.startsWith(todayStr)).length;
      const expectedToday = med.times_per_day || 1;
      const alreadyDone = todayCount >= expectedToday;
      if (alreadyDone) return;

      doseTimes.forEach(doseAt => {
        const alreadyLogged = logs.some(l => l.medication_id === med.id && Math.abs(new Date(l.taken_at).getTime() - doseAt.getTime()) < 3600000);
        if (!alreadyLogged) {
          const dayNum = Math.max(1, Math.floor((now - new Date(med.start_date)) / 86400000) + 1);
          overdue.push({
            med: { id: med.id, name: med.name, dosage_amount: med.dosage_amount, dosage_unit: med.dosage_unit, notes: med.notes },
            day: `Day ${dayNum}/${med.course_duration_days}`,
            streak,
          });
        }
      });
    });

    if (overdue.length > 0) {
      setAlarmQueue(overdue);
      setAlarmData(overdue[0]);
    }
  }, [loading, meds, logs, profile]);

  const dismissAlarm = useCallback(() => {
    stopAlarmSound();
    setAlarmData(null);
    setAlarmQueue(q => {
      const next = q.slice(1);
      if (next.length > 0) {
        setTimeout(() => setAlarmData(next[0]), 400);
      }
      return next;
    });
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
      decrementStock(med.id, 1);
      reload();
    } catch (e) {
      console.error("Log dose exception:", e?.message || e);
    }
  }

  async function logRefill(medId) {
    try {
      const med = meds.find(m => m.id === medId);
      await sb.from("medications").eq("id", medId).update({ last_refill_date: new Date().toISOString() });
      if (med?.pills_per_package) refillStock(medId, med.pills_per_package);
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
      await subscribeToPush(user.id);
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
    { id:"vitals", label:"Vitals", icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:24,height:24}}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> },
    { id:"reports", label:"Reports", icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:24,height:24}}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg> },
    { id:"profile", label:"", icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:24,height:24}}><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z"/></svg> },
  ];

  if (loading) return <div className="loading-screen" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}><style>{CSS}</style><div style={{width:36,height:36,borderRadius:10,background:"var(--teal)",display:"grid",placeItems:"center",animation:"logoPulse 2.4s ease-in-out infinite",boxShadow:"0 4px 20px rgba(0,122,255,.3)"}}><svg viewBox="0 0 100 100" width={20} height={20} fill="white"><text x="22" y="70" fontFamily="system-ui,sans-serif" fontSize="58" fontWeight="700" fill="white">A</text></svg></div><div style={{fontSize:13,fontWeight:500,color:"var(--t3)"}}>Loading your medications…</div><div className="trans-dots" style={{gap:5}}><div className="trans-dot"/><div className="trans-dot"/><div className="trans-dot"/></div></div>;

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      <style>{CSS}</style>

      <div style={{paddingBottom:"calc(49px + env(safe-area-inset-bottom,0px))"}}>
        <div key={tab + (viewFamily ? "-family" : "")} className="tab-enter">
        {tab==="today" && <TodayTab meds={meds} logs={logs} onLog={(med)=>setLogDoseMed(med)} onAdd={()=>setShowAdd(true)} notifPerm={notifPerm} onEnableNotif={enableNotif} plan={profile?.plan||"free"} medCount={meds.length} onViewVisits={()=>setShowVisitSheet(true)} vitals={vitals} vitalReminders={(() => { try { return JSON.parse(localStorage.getItem("mt_vital_reminders") || "{}"); } catch { return {}; } })()} onNavigateVitals={()=>setTab("vitals")}/>}
        {tab==="medications" && <MedsTab meds={meds} logs={logs} onAdd={()=>setShowAdd(true)} onEdit={setEditMed} onDelete={deleteMed} onRefill={logRefill} plan={profile?.plan||"free"} medCount={meds.length}/>}
        {tab==="vitals" && <VitalsTab vitals={vitals} onRefresh={reload} user={user}/>}
        {tab==="reports" && !viewFamily && <ReportsTab logs={logs} meds={meds} plan={profile?.plan||"free"} onNavigate={setTab} onViewFamily={() => setViewFamily(true)}/>}
        {tab==="reports" && viewFamily && <FamilyTab user={user} plan={profile?.plan||"free"}/>}
        {tab==="profile" && <ProfileTab user={user} profile={profile} onSignOut={onSignOut} onSaveProfile={saveProfile} medCount={meds.length} meds={meds} logs={logs}/>}
        </div>
      </div>

      <div className="tabbar">
        {tabs.map(t=>(
          <div key={t.id} className={`tbi${tab===t.id?" on":""}`} onClick={()=>{setTab(t.id);if(t.id!=="reports")setViewFamily(false);}}>
            {t.icon}
            {t.label && <span>{t.label}</span>}
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
          allMeds={meds}
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
      <AlarmOverlay alarm={alarmData} onDismiss={dismissAlarm} onLogDose={(med) => { setAlarmData(null); setAlarmQueue([]); stopAlarmSound(); setLogDoseMed(med); }}/>
      {showVisitSheet && <VisitSheet onClose={() => { setShowVisitSheet(false); setEditVisit(null); }} editingVisit={editVisit} onSaved={() => { setShowVisitSheet(false); setEditVisit(null); reload(); }}/>}
    </div>
  );
}
