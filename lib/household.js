"use client";

import { getTodayExpectedDoseTimes } from "@/lib/data";

// Unified household model used by Today, Family, Alerts and MemberDetail.
// A member is one of:
//   self     – the caregiver's own profile (their meds/logs live in MainApp state)
//   linked   – a family member who accepted an invite (data lives in Supabase)
//   managed  – a child/elderly parent who won't use the app (meds/logs stored locally)
//   pending  – an invite that hasn't been accepted yet

export const MANAGED_STORAGE_KEY = "mt_managed_";

export function managedKey(memberId) {
  return `${MANAGED_STORAGE_KEY}${memberId}`;
}

export function getManagedData(memberId) {
  try {
    const raw = localStorage.getItem(managedKey(memberId));
    if (!raw) return { meds: [], logs: [], vitals: [] };
    const parsed = JSON.parse(raw);
    return {
      meds: Array.isArray(parsed.meds) ? parsed.meds : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      vitals: Array.isArray(parsed.vitals) ? parsed.vitals : [],
    };
  } catch {
    return { meds: [], logs: [], vitals: [] };
  }
}

export function saveManagedData(memberId, data) {
  try { localStorage.setItem(managedKey(memberId), JSON.stringify(data)); } catch {}
}

export function pushManagedLog(memberId, log) {
  const d = getManagedData(memberId);
  d.logs.unshift(log);
  saveManagedData(memberId, d);
}

export function pushManagedVital(memberId, vital) {
  const d = getManagedData(memberId);
  d.vitals.unshift(vital);
  saveManagedData(memberId, d);
}

export function pushManagedMed(memberId, med) {
  const d = getManagedData(memberId);
  d.meds.unshift(med);
  saveManagedData(memberId, d);
}

export function updateManagedMed(memberId, medId, patch) {
  const d = getManagedData(memberId);
  d.meds = d.meds.map(m => m.id === medId ? { ...m, ...patch } : m);
  saveManagedData(memberId, d);
}

export function removeManagedMed(memberId, medId) {
  const d = getManagedData(memberId);
  d.meds = d.meds.filter(m => m.id !== medId);
  d.logs = d.logs.filter(l => l.medication_id !== medId);
  saveManagedData(memberId, d);
}

export function makeSelfMember({ user, profile, meds, logs, vitals }) {
  const name = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Me";
  let selfCareNote = null;
  try { selfCareNote = localStorage.getItem("mt_self_care_note"); } catch {}
  return {
    key: "me",
    kind: "self",
    rowId: null,
    userId: user?.id || null,
    email: user?.email || null,
    name,
    relationship: "",
    age: null,
    phone: null,
    avatarUrl: profile?.avatar_url || null,
    avatarEmoji: profile?.avatar_emoji || null,
    careNote: selfCareNote,
    wakeTime: profile?.wake_time || "08:00",
    reminderLead: profile?.reminder_lead || 30,
    meds: meds || [],
    logs: logs || [],
    vitals: vitals || [],
    managed: false,
    linked: false,
    pending: false,
  };
}

// Turn family_members rows + fetched data into the unified shape.
export function buildMemberFromRow(row, linkedData) {
  const data = linkedData || {};
  const profile = data.profile || {};
  const name = row.member_name || profile?.full_name || row.member_email?.split("@")[0] || "Member";
  const kind = row.status === "managed" || row.managed ? "managed" : (row.member_user_id && row.status === "active") ? "linked" : "pending";
  const managed = kind === "managed";
  const pending = kind === "pending";
  const local = managed ? getManagedData(row.id) : null;
  return {
    key: `fm_${row.id}`,
    kind,
    rowId: row.id,
    userId: row.member_user_id || null,
    email: row.member_email || null,
    name,
    relationship: row.relationship || "",
    age: row.age ?? null,
    phone: row.phone || null,
    avatarUrl: profile?.avatar_url || null,
    avatarEmoji: profile?.avatar_emoji || null,
    careNote: row.care_note || null,
    wakeTime: profile?.wake_time || "08:00",
    reminderLead: profile?.reminder_lead || 30,
    meds: managed ? (local?.meds || []) : (data.meds || []),
    logs: managed ? (local?.logs || []) : (data.logs || []),
    vitals: managed ? (local?.vitals || []) : (data.vitals || []),
    managed,
    linked: kind === "linked",
    pending,
  };
}

export function activeMeds(member) {
  const now = new Date();
  return (member.meds || []).filter(m => {
    if (!m.active) return false;
    const start = new Date(m.start_date);
    if (start > now) return false;
    const end = new Date(m.start_date);
    end.setDate(end.getDate() + (m.course_duration_days || 0));
    return end >= now;
  });
}

export function expectedDosesToday(member, now = new Date()) {
  const profile = { wake_time: member.wakeTime, reminder_lead: member.reminderLead };
  const slots = [];
  activeMeds(member).forEach(med => {
    const times = getTodayExpectedDoseTimes(med, profile);
    times.forEach(t => {
      const [h, m] = t.split(":");
      const due = new Date(now);
      due.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      const todayStr = now.toISOString().split("T")[0];
      const dayLogs = (member.logs || []).filter(l => l.medication_id === med.id && l.taken_at?.startsWith(todayStr));
      const logged = dayLogs.some(l => Math.abs(new Date(l.taken_at).getTime() - due.getTime()) < 45 * 60000);
      slots.push({ member, med, time: t, dueMs: due.getTime(), logged });
    });
  });
  return slots.sort((a, b) => a.dueMs - b.dueMs);
}

export function takenTodayCount(member, now = new Date()) {
  const todayStr = now.toISOString().split("T")[0];
  return (member.logs || []).filter(l => l.taken_at?.startsWith(todayStr)).length;
}

export function ringPct(member, now = new Date()) {
  const slots = expectedDosesToday(member, now);
  const expected = slots.length;
  if (!expected) return 0;
  const taken = slots.filter(s => s.logged).length;
  return taken / expected;
}

export function missedDoses(member, now = new Date()) {
  return expectedDosesToday(member, now).filter(s => !s.logged && now.getTime() - s.dueMs > 20 * 60000);
}

export function remainingDoses(member, now = new Date()) {
  return expectedDosesToday(member, now).filter(s => !s.logged);
}

// A medication is locked after a log until the next dose interval elapses.
// Mirrors the lock used by the notification scheduler and the legacy log flow.
export function nextDoseLock(member, med, now = new Date()) {
  const logsForMed = (member.logs || []).filter(l => l.medication_id === med.id);
  const lastLog = logsForMed.slice().sort((a, b) => (b.taken_at || "").localeCompare(a.taken_at || ""))[0];

  let nextDue = null;
  if (med.reminder_times && String(med.reminder_times).trim()) {
    const times = String(med.reminder_times).split(",").map(t => {
      const [h, m] = t.trim().split(":");
      const d = new Date(now);
      d.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
      return d;
    });
    if (lastLog) {
      const lastAt = new Date(lastLog.taken_at);
      nextDue = times.find(dt => dt.getTime() > lastAt.getTime()) || null;
    }
  } else if (lastLog) {
    const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
    nextDue = new Date(new Date(lastLog.taken_at).getTime() + intervalMs);
  }

  if (nextDue && nextDue.getTime() > now.getTime()) {
    return { locked: true, nextDue, waitMs: nextDue.getTime() - now.getTime() };
  }
  return { locked: false, nextDue: null, waitMs: 0 };
}

// Per-med state for the "one Log button per med" UI: whether a dose is due now,
// already taken, or locked until the next dose interval elapses. Never shows times.
export function medLogState(member, med, now = new Date()) {
  const slots = expectedDosesToday(member, now).filter(s => s.med.id === med.id);
  const next = slots.find(s => !s.logged);
  const lock = nextDoseLock(member, med, now);
  return {
    slots,
    next,
    allLogged: !next,
    loggedCount: slots.filter(s => s.logged).length,
    total: slots.length,
    locked: !!(next && (lock.locked || now.getTime() < next.dueMs)),
    overdue: !!(next && !next.logged && now.getTime() - next.dueMs > 20 * 60000),
    waitMs: lock.locked ? lock.waitMs : (next && now.getTime() < next.dueMs ? next.dueMs - now.getTime() : 0),
  };
}

export function memberStatus(member, now = new Date()) {
  if (member.pending) return { label: "Invited", tone: "gray" };
  if (!activeMeds(member).length) return { label: "No meds", tone: "gray" };
  const missed = missedDoses(member, now).length;
  if (missed > 0) return { label: missed === 1 ? "1 missed" : `${missed} missed`, tone: "red" };
  const remaining = remainingDoses(member, now).length;
  if (remaining > 0) return { label: "On track", tone: "teal" };
  return { label: "All done", tone: "green" };
}

// Pick the member who needs the most attention right now.
export function focusMember(members, now = new Date()) {
  const withMeds = members.filter(m => !m.pending && activeMeds(m).length);
  if (!withMeds.length) return null;
  let best = null;
  withMeds.forEach(m => {
    const missed = missedDoses(m, now).length;
    const remaining = remainingDoses(m, now).length;
    const score = missed * 1000 + remaining;
    if (!best || score > best.score) best = { member: m, score, missed, remaining };
  });
  return best;
}

// Flat list of the day's remaining doses across the household.
export function buildUpNext(members, now = new Date()) {
  const slots = [];
  members.filter(m => !m.pending).forEach(m => {
    expectedDosesToday(m, now).forEach(s => {
      if (!s.logged) slots.push({ member: m, med: s.med, time: s.time, dueMs: s.dueMs, overdue: now.getTime() - s.dueMs > 20 * 60000 });
    });
  });
  return slots.sort((a, b) => a.dueMs - b.dueMs).slice(0, 16);
}

export function totalExpectedToday(members, now = new Date()) {
  return members.filter(m => !m.pending).reduce((s, m) => s + expectedDosesToday(m, now).length, 0);
}

// Seven dots: taken / missed / future / none for the last 7 days.
export function weekDots(member, now = new Date()) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const dayMeds = (member.meds || []).filter(m => {
      if (!m.active) return false;
      const start = new Date(m.start_date);
      const end = new Date(m.start_date);
      end.setDate(end.getDate() + (m.course_duration_days || 0));
      return start <= d && end >= d;
    });
    const dayLogs = (member.logs || []).filter(l => l.taken_at?.startsWith(ds));
    const expected = dayMeds.reduce((s, m) => s + (m.times_per_day || 1), 0);
    const taken = dayLogs.length;
    let state = "none";
    if (d > now) state = "future";
    else if (expected > 0 && taken >= expected) state = "taken";
    else if (expected > 0 && taken > 0) state = "partial";
    else if (expected > 0) state = "missed";
    days.push({ day: ds, label: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()], state, expected, taken });
  }
  return days;
}

export function weekAdherence(member, now = new Date()) {
  const dots = weekDots(member, now).filter(d => d.state !== "future" && d.state !== "none");
  const total = dots.reduce((s, d) => s + d.expected, 0);
  if (!total) return null;
  const taken = dots.reduce((s, d) => s + d.taken, 0);
  return Math.round((taken / total) * 100);
}

export function streak(member) {
  return calcStreakLocal(member.logs, member.meds);
}

function calcStreakLocal(logs, meds) {
  if (!logs?.length || !meds?.length) return 0;
  const now = new Date();
  let streak = 0;
  for (let d = 0; d <= 365; d++) {
    const day = new Date(now);
    day.setDate(now.getDate() - d);
    const ds = day.toISOString().split("T")[0];
    const active = meds.filter(m => {
      if (!m.active) return false;
      const s = new Date(m.start_date), e = new Date(m.start_date);
      e.setDate(e.getDate() + (m.course_duration_days || 0));
      return s <= day && e >= day;
    });
    if (!active.length) { if (d === 0) continue; break; }
    const full = active.every(m => {
      const need = m.times_per_day || 1;
      return logs.filter(l => l.medication_id === m.id && l.taken_at?.startsWith(ds)).length >= need;
    });
    if (full) streak++;
    else if (d > 0) break;
  }
  return streak;
}

export function lowStockMeds(member) {
  return (member.meds || []).filter(m => {
    if (!m.active || !m.pills_per_package) return false;
    const stock = stockOf(m);
    if (stock === null) return false;
    return stock <= (m.refill_reminder_at || 5);
  });
}

function stockOf(med) {
  try {
    const d = JSON.parse(localStorage.getItem("mt_stock") || "{}");
    return d[med.id]?.remaining ?? null;
  } catch { return null; }
}

// Alerts grouped by urgency window.
export function buildAlerts(members, now = new Date()) {
  const today = [], week = [];
  const todayStr = now.toISOString().split("T")[0];
  members.filter(m => !m.pending).forEach(m => {
    missedDoses(m, now).forEach(s => {
      const mins = Math.max(0, Math.round((now.getTime() - s.dueMs) / 60000));
      today.push({ kind: "missed", member: m, med: s.med, time: s.time, dueMs: s.dueMs, overdueMins: mins });
    });
    lowStockMeds(m).forEach(med => {
      const s = stockOf(med);
      week.push({ kind: "refill", member: m, med, remaining: s, total: parseInt(med.pills_per_package) });
    });
  });
  today.sort((a, b) => b.overdueMins - a.overdueMins);
  return { today, week };
}

export function callHref(member) {
  if (member.kind === "self") {
    try {
      const p = JSON.parse(localStorage.getItem("adhera_personal") || "{}");
      const phone = p?.emergency_phone || p?.phone || p?.phone_number;
      if (phone) return `tel:${phone}`;
    } catch {}
    return null;
  }
  return member.phone ? `tel:${member.phone}` : null;
}

export function initials(member) {
  const parts = (member?.name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}
