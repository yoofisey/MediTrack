"use client";

import { streak, weekAdherence } from "./household";

export const BADGES = [
  { id: "first_dose", icon: "Pill", title: "First Dose", desc: "Log your first medication dose", category: "getting_started" },
  { id: "streak_3", icon: "Flame", title: "3-Day Streak", desc: "Take all meds for 3 days straight", category: "streak" },
  { id: "streak_7", icon: "Zap", title: "Week Warrior", desc: "7-day perfect streak", category: "streak" },
  { id: "streak_14", icon: "Star", title: "Fortnight Champion", desc: "14-day streak", category: "streak" },
  { id: "streak_30", icon: "Crown", title: "Monthly Master", desc: "30-day streak", category: "streak" },
  { id: "streak_90", icon: "Trophy", title: "Quarter Legend", desc: "90-day streak", category: "streak" },
  { id: "journal_5", icon: "NotebookPen", title: "Journaler", desc: "Write 5 journal entries", category: "journal" },
  { id: "journal_30", icon: "BookOpen", title: "Diary Devotee", desc: "30 journal entries", category: "journal" },
  { id: "perfect_week", icon: "Gem", title: "Perfect Week", desc: "100% adherence for a full week", category: "adherence" },
  { id: "perfect_month", icon: "Medal", title: "Perfect Month", desc: "100% adherence for 30 days", category: "adherence" },
  { id: "vitals_logger", icon: "Stethoscope", title: "Vitals Pro", desc: "Log 10 vital readings", category: "vitals" },
  { id: "family_caregiver", icon: "Heart", title: "Family Caregiver", desc: "Add a family member", category: "family" },
  { id: "early_bird", icon: "Sunrise", title: "Early Bird", desc: "Log a dose before 8 AM", category: "special" },
  { id: "night_owl", icon: "Moon", title: "Night Owl", desc: "Log a dose after 10 PM", category: "special" },
];

export const CHALLENGES = [
  { id: "week_warrior", title: "Week Warrior", desc: "Take all meds for 7 days", goal: 7, type: "streak", reward: 100, badge: "streak_7" },
  { id: "journal_journey", title: "Journal Journey", desc: "Write 5 journal entries", goal: 5, type: "journal", reward: 75, badge: "journal_5" },
  { id: "vitals_vanguard", title: "Vitals Vanguard", desc: "Log 10 vital readings", goal: 10, type: "vitals", reward: 100, badge: "vitals_logger" },
  { id: "perfect_month", title: "Perfect Month", desc: "30 days of perfect adherence", goal: 30, type: "streak", reward: 200, badge: "perfect_month" },
];

const POINT_VALUES = {
  log_dose: 10,
  daily_checkin: 25,
  journal_entry: 15,
  log_vitals: 15,
  streak_per_day: 5,
};

function countJournalEntries(member) {
  try {
    const raw = localStorage.getItem("mt_journal");
    if (!raw) return 0;
    const entries = JSON.parse(raw);
    return Array.isArray(entries) ? entries.length : 0;
  } catch {
    return 0;
  }
}

function getJournalEntries(member) {
  try {
    const raw = localStorage.getItem("mt_journal");
    if (!raw) return [];
    const entries = JSON.parse(raw);
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function countVitals(member) {
  return (member.vitals || []).length;
}

function getCurrentStreak(member) {
  return streak(member);
}

function hasPerfectWeek(member, now = new Date()) {
  const adh = weekAdherence(member, now);
  return adh === 100;
}

function hasPerfectMonth(member, now = new Date()) {
  let perfectDays = 0;
  const logs = member.logs || [];
  const meds = member.meds || [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const active = meds.filter(m => {
      if (!m.active) return false;
      const s = new Date(m.start_date);
      const e = new Date(m.start_date);
      e.setDate(e.getDate() + (m.course_duration_days || 0));
      return s <= d && e >= d;
    });
    if (!active.length) continue;
    const full = active.every(m => {
      const need = m.times_per_day || 1;
      return logs.filter(l => l.medication_id === m.id && l.taken_at?.startsWith(ds)).length >= need;
    });
    if (full) perfectDays++;
    else break;
  }
  return perfectDays >= 30;
}

function countFamilyMembers() {
  try {
    const raw = localStorage.getItem("mt_family_rows");
    if (!raw) return 0;
    const rows = JSON.parse(raw);
    return Array.isArray(rows) ? rows.length : 0;
  } catch {
    return 0;
  }
}

export function checkBadges(member, journalEntries, vitalsCount) {
  const earned = [];
  const logs = member.logs || [];
  const streak = getCurrentStreak(member);
  const journalCount = journalEntries ?? countJournalEntries(member);
  const vitals = vitalsCount ?? countVitals(member);

  if (logs.length > 0) earned.push("first_dose");
  if (streak >= 3) earned.push("streak_3");
  if (streak >= 7) earned.push("streak_7");
  if (streak >= 14) earned.push("streak_14");
  if (streak >= 30) earned.push("streak_30");
  if (streak >= 90) earned.push("streak_90");
  if (journalCount >= 5) earned.push("journal_5");
  if (journalCount >= 30) earned.push("journal_30");
  if (hasPerfectWeek(member)) earned.push("perfect_week");
  if (hasPerfectMonth(member)) earned.push("perfect_month");
  if (vitals >= 10) earned.push("vitals_logger");
  if (countFamilyMembers() > 0) earned.push("family_caregiver");

  const now = new Date();
  const hasEarly = logs.some(l => {
    const h = new Date(l.taken_at).getHours();
    return h < 8;
  });
  const hasNight = logs.some(l => {
    const h = new Date(l.taken_at).getHours();
    return h >= 22;
  });
  if (hasEarly) earned.push("early_bird");
  if (hasNight) earned.push("night_owl");

  return earned;
}

export function awardPoints(action) {
  return POINT_VALUES[action] || 0;
}

export function getTotalPoints(member) {
  const logs = member.logs || [];
  const streak = getCurrentStreak(member);
  const journalCount = countJournalEntries(member);
  const vitals = countVitals(member);

  let points = 0;
  points += logs.length * POINT_VALUES.log_dose;
  points += journalCount * POINT_VALUES.journal_entry;
  points += vitals * POINT_VALUES.log_vitals;
  points += streak * POINT_VALUES.streak_per_day;
  points += 1 * POINT_VALUES.daily_checkin;

  const earned = checkBadges(member, journalCount, vitals);
  CHALLENGES.forEach(ch => {
    if (earned.includes(ch.badge)) points += ch.reward;
  });

  return points;
}

export function getChallengeProgress(challengeId, member) {
  const ch = CHALLENGES.find(c => c.id === challengeId);
  if (!ch) return { current: 0, goal: 0, pct: 0, completed: false };

  let current = 0;
  if (ch.type === "streak") {
    current = getCurrentStreak(member);
  } else if (ch.type === "journal") {
    current = countJournalEntries(member);
  } else if (ch.type === "vitals") {
    current = countVitals(member);
  }

  const pct = Math.min(Math.round((current / ch.goal) * 100), 100);
  return { current, goal: ch.goal, pct, completed: current >= ch.goal };
}

export function getEarnedBadges(badgeIds) {
  if (!Array.isArray(badgeIds)) return [];
  return BADGES.filter(b => badgeIds.includes(b.id));
}
