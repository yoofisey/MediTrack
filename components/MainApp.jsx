"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { sb } from "@/lib/supabase";
import { CSS } from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { THEMES, calcStreak, initStockForMed, decrementStock, refillStock } from "@/lib/data";
import { scheduleDoseAlarms, scheduleVitalReminders, askNotifPerm, subscribeToPush, stopAlarmSound, clearAllTimers, initCapacitorNotifs, isNativePlatform } from "@/lib/notifications";
import { initPushNotifications, removePushToken } from "@/lib/push";
import { getCached, setCache, isOnline, queueDoseLog, flushQueue } from "@/lib/offline";
import { fetchPendingFamilyInvites, acceptFamilyInvite, fetchFamilyMembers, updateFamilyMember } from "@/lib/db";
import { makeSelfMember, buildMemberFromRow, pushManagedLog, nextDoseLock } from "@/lib/household";
import TodayTab from "@/components/TodayTab";
import ReportsTab from "@/components/ReportsTab";
import VitalsTab from "@/components/VitalsTab";
import FamilyTab from "@/components/FamilyTab";
import AlertsTab from "@/components/AlertsTab";
import MeTab from "@/components/MeTab";
import MemberDetail from "@/components/MemberDetail";
import MedSheet from "@/components/MedSheet";
import { DeleteConfirmModal, LogDoseModal } from "@/components/Modals";
import AlarmOverlay from "@/components/AlarmOverlay";
import VisitSheet from "@/components/VisitSheet";
import { JournalEntrySheet, getJournalEntry } from "@/components/HealthJournal";
import FamilyInviteSheet from "@/components/FamilyInviteSheet";
import { Home, Users, Bell, User } from "lucide-react";

export default function MainApp({ user, profile: initProfile, onSignOut }) {
  const { t } = useLang();
  const [tab, setTab] = useState("today");
  const [meds, setMeds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 5000); return () => clearTimeout(t); }, []);
  const [profile, setProfile] = useState(initProfile);
  const [notifPerm, setNotifPerm] = useState(() => "Notification" in window ? Notification.permission : "default");
  const [loadKey, setLoadKey] = useState(0);
  const [deleteMedId, setDeleteMedId] = useState(null);
  const [logDoseMed, setLogDoseMed] = useState(null);
  const [alarmData, setAlarmData] = useState(null);
  const [alarmQueue, setAlarmQueue] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [showVisitSheet, setShowVisitSheet] = useState(false);
  const [showVisitList, setShowVisitList] = useState(false);
  const [editVisit, setEditVisit] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalDate, setJournalDate] = useState(null);
  const [journalEntry, setJournalEntry] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [familyRows, setFamilyRows] = useState([]);
  const [linkedData, setLinkedData] = useState({});
  const [memberView, setMemberView] = useState(null);
  const [overlayTab, setOverlayTab] = useState(null);
  const [medSheetFor, setMedSheetFor] = useState(null);

  const notifOn = () => { const s = ls(); try { const v = s?.getItem("mt_notif_on"); return v === "1"; } catch { return false; } };
  function ls() { try { return localStorage; } catch { return null; } }

  useEffect(() => {
    if (!user?.id || !user?.email) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await fetchPendingFamilyInvites(user.email);
        if (!cancelled && Array.isArray(data) && data.length) {
          setPendingInvites(data);
          setShowInviteSheet(true);
        }
      } catch (e) { console.error("pending invites:", e); }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  async function handleAcceptInvite(id) {
    try {
      const name = profile?.full_name || user?.user_metadata?.full_name || user?.email;
      await acceptFamilyInvite(id, user.id, name);
      setPendingInvites(prev => {
        const rest = prev.filter(p => p.id !== id);
        if (!rest.length) setShowInviteSheet(false);
        return rest;
      });
    } catch (e) { console.error("accept invite:", e); }
  }

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const cachedMeds = getCached("meds");
    const cachedLogs = getCached("logs");
    const cachedVitals = getCached("vitals");
    if (cachedMeds && cachedMeds.length) { setMeds(cachedMeds); }
    if (cachedLogs && cachedLogs.length) { setLogs(cachedLogs); }
    if (cachedVitals && cachedVitals.length) { setVitals(cachedVitals); }

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
            setCache("meds", mr.data);
            mr.data.filter(m => m.pills_per_package && m.active).forEach(m => initStockForMed(m));
          }
          if (Array.isArray(lr.data)) { setLogs(lr.data); setCache("logs", lr.data); }
          if (Array.isArray(vr.data)) { setVitals(vr.data); setCache("vitals", vr.data); }
          try { const j = JSON.parse(localStorage.getItem("mt_journal") || "[]"); setJournalEntries(j); } catch (e) { console.error("journal load:", e); }
          try { const { checkRefillReminders } = await import("@/lib/notifications"); checkRefillReminders(mr.data||[], lr.data||[]); } catch (e) { console.error("refill check:", e); }
          flushQueue();
        }
      } catch (e) {
        if (!cancelled) console.error("load error:", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, loadKey]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: rows } = await fetchFamilyMembers(user.id);
        if (cancelled) return;
        const rowsArr = Array.isArray(rows) ? rows : [];
        setFamilyRows(rowsArr);
        const linked = rowsArr.filter(r => r.member_user_id && r.status === "active");
        const map = {};
        await Promise.all(linked.map(async m => {
          try {
            const [medsRes, logsRes, profRes] = await Promise.all([
              sb.from("medications").select("*").eq("user_id", m.member_user_id).order("created_at", { ascending: false }),
              sb.from("dose_logs").select("*, medications(name)").eq("user_id", m.member_user_id).order("taken_at", { ascending: false }).limit(120),
              sb.from("profiles").select("full_name, avatar_url, wake_time, reminder_lead").eq("id", m.member_user_id).maybeSingle(),
            ]);
            map[m.id] = { meds: medsRes.data || [], logs: logsRes.data || [], profile: profRes.data || null };
          } catch (e) { console.error("linked load:", e); }
        }));
        if (!cancelled) setLinkedData(map);
      } catch (e) { console.error("family load:", e); }
    })();
    return () => { cancelled = true; };
  }, [user?.id, loadKey]);

  const selfMember = useMemo(() => makeSelfMember({ user, profile, meds, logs }), [user, profile, meds, logs]);
  const household = useMemo(() => [selfMember, ...familyRows.map(r => buildMemberFromRow(r, linkedData[r.id]))], [selfMember, familyRows, linkedData]);

  function openMember(m) { setMemberView(m?.key || null); }
  function closeMember() { setMemberView(null); }

  async function markDose(member, slot) {
    if (!member || !slot) return;
    const lock = nextDoseLock(member, slot.med);
    if (lock.locked) {
      const waitM = Math.ceil(lock.waitMs / 60000);
      const name = slot.med.name;
      if (waitM < 60) alert(`⏳ ${name}: wait ${waitM} more minute${waitM === 1 ? "" : "s"} before the next dose.`);
      else alert(`⏳ ${name}: wait ~${Math.ceil(waitM / 60)} more hour${Math.ceil(waitM / 60) > 1 ? "s" : ""} before the next dose.`);
      return;
    }
    const takenAt = new Date().toISOString();
    if (member.kind === "managed") {
      pushManagedLog(member.rowId, { id: "ml_" + Date.now() + Math.random().toString(36).slice(2, 6), medication_id: slot.med.id, taken_at: takenAt });
      reload();
      return;
    }
    try {
      const { error } = await sb.from("dose_logs").insert([{ user_id: member.userId || user?.id, medication_id: slot.med.id, taken_at: takenAt }]);
      if (error) console.error("markDose:", error?.message || error);
      else if (member.kind === "self") decrementStock(slot.med.id, 1);
      reload();
    } catch (e) { console.error("markDose exception:", e); }
  }

  async function saveCareNote(member, note) {
    if (member.kind === "self") {
      try { localStorage.setItem("mt_self_care_note", note || ""); } catch {}
      reload();
      return;
    }
    try {
      const { error } = await updateFamilyMember(member.rowId, { care_note: note || null });
      if (!error) reload();
      else console.error("careNote:", error?.message || error);
    } catch (e) { console.error("careNote exception:", e); }
  }

  function openMedSheet(member, med) { setMedSheetFor({ member, med }); }

  async function memberRefill(member, med) {
    if (!med) return;
    try {
      if (member.kind !== "managed") await sb.from("medications").eq("id", med.id).update({ last_refill_date: new Date().toISOString() });
      if (med.pills_per_package) refillStock(med.id, med.pills_per_package);
      reload();
    } catch (e) { console.error("memberRefill:", e); }
  }

  async function generateFamilyReport() {
    const active = household.filter(m => m.kind !== "self" && m.kind !== "pending" && m.meds?.length);
    if (!active.length) { alert("No family members with medications yet."); return; }
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = 210, ml = 20, mr = 20;
      let y = 20;
      const checkPage = () => { if (y > 265) { doc.addPage(); y = 20; } };
      doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(0, 122, 255);
      doc.text("Adhera", ml, y);
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(140, 140, 140);
      doc.text("Family Medication Adherence Report", ml, y + 5);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, ml, y + 10);
      y += 18;
      doc.setDrawColor(0, 122, 255); doc.setLineWidth(0.6); doc.line(ml, y, pageW - mr, y); y += 10;
      active.forEach(m => {
        checkPage();
        const medsArr = m.meds || [];
        const logsArr = m.logs || [];
        const grouped = {};
        logsArr.forEach(l => { const d = l.taken_at?.split("T")[0]; if (d) { if (!grouped[d]) grouped[d] = []; grouped[d].push(l); } });
        const days = Object.keys(grouped).length;
        const totalExpected = days * medsArr.reduce((s, x) => s + (x.times_per_day || 1), 0);
        const adherence = totalExpected > 0 ? Math.min(Math.round((logsArr.length / totalExpected) * 100), 100) : 0;
        doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(20, 20, 20);
        doc.text(m.name, ml, y); y += 6;
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
        doc.text(`Overall adherence: ${adherence}%  |  Medications: ${medsArr.length}`, ml, y); y += 6;
        if (medsArr.length === 0) {
          doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(150, 150, 150);
          doc.text("No medications on record.", ml + 2, y); y += 5;
        } else {
          medsArr.forEach(x => {
            checkPage();
            const medLogs = logsArr.filter(l => l.medication_id === x.id);
            const exp = x.course_duration_days * (x.times_per_day || 1);
            const pct = exp > 0 ? Math.min(Math.round((medLogs.length / exp) * 100), 100) : 0;
            const status = pct >= 80 ? "Good" : pct >= 50 ? "Fair" : "Poor";
            doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30, 30, 30);
            doc.text(`- ${x.name}: ${pct}% (${status})`, ml + 2, y); y += 4;
            doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
            doc.text(`  ${medLogs.length}/${exp} doses taken  (${x.dosage_amount} ${x.dosage_unit})`, ml + 4, y); y += 4;
          });
        }
        y += 6;
      });
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(180, 180, 180);
      doc.text("Generated by Adhera · adhera.app · Confidential", ml, 287);
      doc.save(`adhera_family_report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) { console.error("family report:", e); alert("Could not generate the report. Please try again."); }
  }

  useEffect(() => { if (notifOn() && (meds.length || logs.length)) scheduleDoseAlarms(meds, logs, profile?.wake_time || "08:00", profile?.reminder_lead || 30); return () => { clearAllTimers(); }; }, [meds, profile?.reminder_lead, profile?.wake_time, logs]);
  useEffect(() => {
    try {
      const vitalReminders = JSON.parse(localStorage.getItem("mt_vital_reminders") || "{}");
      if (notifOn() && vitals.length) scheduleVitalReminders(vitalReminders, vitals);
    } catch {}
  }, [vitals, loadKey]);
  useEffect(() => {
    if (notifOn() && user?.id && "serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then(async reg => {
        const existing = await reg.pushManager.getSubscription();
        if (!existing) await subscribeToPush(user.id);
      }).catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => { initCapacitorNotifs(); }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(reg => {
        window._mt_swReady = true;
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (sw) sw.addEventListener("statechange", () => {
            if (sw.state === "activated") window._mt_swReady = true;
          });
        });
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && notifOn()) {
        if (meds.length) scheduleDoseAlarms(meds, logs, profile?.wake_time || "08:00", profile?.reminder_lead || 30);
        try {
          const vitalReminders = JSON.parse(localStorage.getItem("mt_vital_reminders") || "{}");
          if (vitals.length) scheduleVitalReminders(vitalReminders, vitals);
        } catch {}
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [meds, logs, profile?.wake_time, profile?.reminder_lead]);
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
    function onDeeplink(e) {
      const { medId, doseTimeMs } = e.detail || {};
      if (!medId) return;
      const med = meds.find(m => m.id === medId);
      if (med) setMedSheetFor({ member: selfMember, med });
    }
    window.addEventListener("mt-deeplink", onDeeplink);
    return () => window.removeEventListener("mt-deeplink", onDeeplink);
  }, [meds]);

  useEffect(() => {
    async function onLogDose(e) {
      const { medId, doseTimeMs } = e.detail || {};
      if (!medId) return;
      try {
        await sb.from("dose_logs").insert({
          medication_id: medId,
          taken_at: new Date(doseTimeMs || Date.now()).toISOString(),
          user_id: user?.id,
        });
        const { data } = await sb.from("dose_logs").select("*").eq("user_id", user?.id).order("taken_at", { ascending: false }).limit(500);
        if (Array.isArray(data)) setLogs(data);
      } catch {}
    }
    window.addEventListener("mt-log-dose", onLogDose);
    return () => window.removeEventListener("mt-log-dose", onLogDose);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && isNativePlatform()) {
      initPushNotifications(user.id);
      return () => { removePushToken(user.id); };
    }
  }, [user?.id]);

  function isToday(isoStr) {
    if (!isoStr) return false;
    const d = new Date(isoStr);
    const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }

  function makeDate(h, m) {
    const d = new Date(); d.setHours(h, m || 0, 0, 0); return d;
  }

  useEffect(() => {
    if (loading || !meds.length) return;
    const now = new Date();
    const wakeTime = profile?.wake_time || "08:00";
    const wakeHour = parseInt(wakeTime) || 8;
    const streak = calcStreak(logs, meds);
    const overdue = [];

    meds.forEach(med => {
      if (!med.active) return;
      const end = new Date(med.start_date);
      end.setDate(end.getDate() + med.course_duration_days);
      if (end < now) return;

      const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
      const lastLog = logs.filter(l => l.medication_id === med.id).sort((a, b) => b.taken_at.localeCompare(a.taken_at))[0];
      const todayStart = makeDate(wakeHour, 0);

      let doseTimes = [];
      if (lastLog && isToday(lastLog.taken_at)) {
        const next = new Date(new Date(lastLog.taken_at).getTime() + intervalMs);
        if (next <= now) doseTimes.push(next);
      } else {
        const dosesToday = med.times_per_day || 1;
        for (let i = 0; i < dosesToday; i++) {
          const dt = new Date(todayStart.getTime() + i * intervalMs);
          if (dt <= now) doseTimes.push(dt);
        }
      }

      const todayCount = logs.filter(l => l.medication_id === med.id && isToday(l.taken_at)).length;
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

  async function logDose(med, journal = "", takenAt) {
    if (!user?.id) return;
    const takenAtISO = takenAt || new Date().toISOString();
    if (!takenAt) {
      const lastLog = logs.filter(l => l.medication_id === med.id).sort((a, b) => b.taken_at.localeCompare(a.taken_at))[0];
      const logsToday = logs.filter(l => l.medication_id === med.id && isToday(l.taken_at));
      let nextDoseTime = null;
      if (med.reminder_times && med.reminder_times.trim()) {
        const times = med.reminder_times.split(",").map(t => {
          const [h, m] = t.trim().split(":");
          return makeDate(parseInt(h) || 8, parseInt(m) || 0);
        });
        const takenClosest = logsToday.map(l => new Date(l.taken_at)).sort((a,b) => b - a);
        const takenSet = new Set(takenClosest.map(d => d.getHours() * 60 + d.getMinutes()));
        const remaining = times.filter(dt => !takenSet.has(dt.getHours() * 60 + dt.getMinutes()) && dt > new Date());
        if (remaining.length === 0) { alert("All doses taken today!"); return; }
        nextDoseTime = remaining[0];
      } else {
        const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
        if (lastLog) {
          nextDoseTime = new Date(new Date(lastLog.taken_at).getTime() + intervalMs);
        } else {
          nextDoseTime = new Date();
        }
      }
      if (nextDoseTime && nextDoseTime > new Date()) {
        const remainingMs = nextDoseTime - new Date();
        const waitM = Math.ceil(remainingMs / 60000);
        if (waitM >= 1) {
          if (waitM < 60) { alert(`⏳ Wait ${waitM} more minutes before your next dose.`); return; }
          const waitH = Math.ceil(waitM / 60);
          alert(`⏳ Wait ~${waitH} more hour${waitH>1?"s":""} before your next dose.`); return;
        }
      }
    }
    if (!isOnline()) {
      await queueDoseLog({ userId: user.id, medId: med.id, takenAt: takenAtISO, notes: journal });
      reload();
      return;
    }
    try {
      const { error } = await sb.from("dose_logs").insert([{
        user_id: user.id,
        medication_id: med.id,
        taken_at: takenAtISO,
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
    { id: "today", label: t("nav.today"), icon: <Home size={23} strokeWidth={1.9} /> },
    { id: "family", label: t("nav.family"), icon: <Users size={23} strokeWidth={1.9} /> },
    { id: "alerts", label: t("nav.alerts"), icon: <Bell size={23} strokeWidth={1.9} /> },
    { id: "me", label: "", icon: <User size={23} strokeWidth={1.9} /> },
  ];

  if (loading) return (
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      <style>{CSS}</style>
      <div className="scroll" style={{paddingTop:0}}>
        <div className="skel-hero">
          <div className="skel-line skel-pulse" style={{width:"40%",height:14,marginBottom:14}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div className="skel-line skel-pulse" style={{width:90,height:42,marginBottom:8}}/>
              <div className="skel-line skel-pulse" style={{width:110,height:14}}/>
            </div>
            <div className="skel-line skel-pulse" style={{width:72,height:72,borderRadius:"50%"}}/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:22}}>
            {[1,2,3].map(i => (
              <div key={i} style={{flex:1,background:"var(--hover)",borderRadius:16,padding:"14px 8px",textAlign:"center"}}>
                <div className="skel-line skel-pulse" style={{width:32,height:20,margin:"0 auto 6px"}}/>
                <div className="skel-line skel-pulse" style={{width:48,height:10,margin:"0 auto"}}/>
              </div>
            ))}
          </div>
        </div>
        <div className="section">
          <div className="list">
            {[1,2,3].map(i => (
              <div key={i} className="row" style={{cursor:"default"}}>
                <div className="skel-line skel-pulse" style={{width:36,height:36,borderRadius:10,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div className="skel-line skel-pulse" style={{width:`${50 + i * 10}%`,height:14,marginBottom:6}}/>
                  <div className="skel-line skel-pulse" style={{width:`${30 + i * 8}%`,height:10}}/>
                </div>
                <div className="skel-line skel-pulse" style={{width:40,height:14,flexShrink:0}}/>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="tabbar">
        {tabs.map((t,i) => (
          <div key={t.id} className={`tbi${i===0?" on":""}`}>
            {t.icon}
            {t.label && <span>{t.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      <style>{CSS}</style>

      {memberView ? (() => {
        const activeMember = household.find(m => m.key === memberView);
        if (!activeMember) return null;
        return (
          <MemberDetail member={activeMember} onBack={closeMember} onMarkDose={markDose} onEditMed={openMedSheet} onRefill={memberRefill} onSaveNote={saveCareNote} onChanged={reload} />
        );
      })() : overlayTab ? (
        <div className="scroll">
          {overlayTab === "reports" && <ReportsTab logs={logs} meds={meds} plan={profile?.plan || "free"} onNavigate={(id) => { if (id === "profile") { setOverlayTab(null); setTab("me"); } }} />}
          {overlayTab === "vitals" && <VitalsTab vitals={vitals} onRefresh={reload} user={user} />}
          <div style={{ padding: "4px 20px 24px" }}>
            <button className="btn btn-ghost" onClick={() => setOverlayTab(null)}>Back</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ paddingBottom: "calc(49px + env(safe-area-inset-bottom,0px))" }}>
            <div className="content-reveal">
              {tab === "today" && <TodayTab household={household} user={user} profile={profile} onGoMe={() => setTab("me")} onGoFamily={() => setTab("family")} notifPerm={notifPerm} onEnableNotif={enableNotif} />}
              {tab === "family" && <FamilyTab household={household} plan={profile?.plan || "free"} country={user?.user_metadata?.country} userEmail={user?.email} onSaveProfile={saveProfile} onOpenMember={openMember} onChanged={reload} />}
              {tab === "alerts" && <AlertsTab household={household} onOpenMember={openMember} />}
              {tab === "me" && <MeTab user={user} profile={profile} household={household} plan={profile?.plan || "free"} country={user?.user_metadata?.country} notifPerm={notifPerm} onEnableNotif={enableNotif} onSaveProfile={saveProfile} onSignOut={onSignOut} onOpenMember={openMember} onGenerateReport={generateFamilyReport} onOpenReports={() => setOverlayTab("reports")} onOpenVitals={() => setOverlayTab("vitals")} />}
            </div>
          </div>

          <div className="tabbar">
            {tabs.map(t => (
              <div key={t.id} className={`tbi${tab === t.id ? " on" : ""}`} onClick={() => { setTab(t.id); setOverlayTab(null); }}>
                {t.icon}
                {t.label && <span>{t.label}</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {medSheetFor && (
        <MedSheet
          med={medSheetFor.med}
          userId={medSheetFor.member?.kind === "linked" && medSheetFor.member.userId ? medSheetFor.member.userId : user.id}
          reminderLead={profile?.reminder_lead || 30}
          plan={profile?.plan || "free"}
          medCount={medSheetFor.member?.meds?.length ?? meds.length}
          onSave={() => { setMedSheetFor(null); reload(); }}
          onClose={() => setMedSheetFor(null)}
          allMeds={medSheetFor.member?.meds?.length ? medSheetFor.member.meds : meds}
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
          onConfirm={(journal, takenAt) => { const m = logDoseMed; setLogDoseMed(null); logDose(m, journal, takenAt); }}
          onCancel={() => setLogDoseMed(null)}
        />
      )}
      <AlarmOverlay alarm={alarmData} onDismiss={dismissAlarm} onLogDose={(med) => { setAlarmData(null); setAlarmQueue([]); stopAlarmSound(); setLogDoseMed(med); }}/>
      {(showVisitSheet||showVisitList) && <VisitSheet initialView={showVisitList?"list":"form"} onClose={() => { setShowVisitSheet(false); setShowVisitList(false); setEditVisit(null); }} editingVisit={editVisit} onSaved={() => { setShowVisitSheet(false); setShowVisitList(false); setEditVisit(null); reload(); }}/>}
      {journalDate && <JournalEntrySheet date={journalDate} entry={journalEntry} onSave={() => { try { const j = JSON.parse(localStorage.getItem("mt_journal") || "[]"); setJournalEntries(j); } catch {} saveProfile({ last_checkin_date: new Date().toISOString().split("T")[0] }); }} onClose={() => { setJournalDate(null); setJournalEntry(null); }}/>}
      {showInviteSheet && pendingInvites.length > 0 && (
        <FamilyInviteSheet invites={pendingInvites} onAccept={handleAcceptInvite} onDismiss={() => setShowInviteSheet(false)}/>
      )}
    </div>
  );
}
