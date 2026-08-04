import { countries as allCountries, getEmojiFlag } from "countries-list";

const CONTINENT_REGION = { AF:"na", AS:"as", EU:"eu", NA:"na2", SA:"na2", OC:"au", AN:"na2" };
const REGION_OVERRIDES = {
  GH:"wa",
  NG:"ng",
  SN:"xw", CI:"xw", GN:"xw", SL:"xw", GW:"xw", LR:"xw", TG:"xw", BJ:"xw",
  KE:"ea", TZ:"ea", UG:"ea", ET:"ea", RW:"ea",
  ZA:"sa", ZW:"sa", ZM:"sa", BW:"sa",
  EG:"na", MA:"na",
  GB:"eu", DE:"eu", FR:"eu", NL:"eu", IT:"eu",
  US:"na2", CA:"na2",
  IN:"as", AU:"au",
};

export const COUNTRIES = Object.keys(allCountries)
  .map(code => {
    const c = allCountries[code];
    return {
      code,
      name: c.name,
      flag: getEmojiFlag(code),
      currency: (c.currency && c.currency[0]) || "USD",
      region: REGION_OVERRIDES[code] || CONTINENT_REGION[c.continent] || "na2",
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
COUNTRIES.push({ code:"OTHER", name:"Other country", flag:"", currency:"USD", region:"na2" });

const REGION_PRICING = {
  wa:  { pro: { amount: 15,    label: "₵15" },  family: { amount: 28,    label: "₵28" },  enterprise: { amount: 150,   label: "₵150",  contact: true }, note: "Ghana pricing" },
  ng:  { pro: { amount: 2500,  label: "₦2,500" },family: { amount: 4500, label: "₦4,500"},enterprise: { amount: 25000, label: "₦25,000", contact: true }, note: "Nigerian pricing" },
  xw:  { pro: { amount: 0,     label: "Coming soon" }, family: { amount: 0, label: "Coming soon" }, enterprise: { amount: 0, label: "Coming soon", contact: true }, note: "Payments coming soon in your country" },
  ea:  { pro: { amount: 300,   label: "KSh300"},family: { amount: 550,   label: "KSh550"},enterprise: { amount: 5000,  label: "KSh5,000",contact: true }, note: "East African pricing" },
  sa:  { pro: { amount: 59,    label: "R59" },  family: { amount: 109,   label: "R109" }, enterprise: { amount: 999,   label: "R999",  contact: true }, note: "Southern African pricing" },
  na:  { pro: { amount: 39,    label: "39 MAD"},family: { amount: 69,    label: "69 MAD"},enterprise: { amount: 599,   label: "599 MAD",contact: true }, note: "North African pricing" },
  eu:  { pro: { amount: 3.99,  label: "€3.99"}, family: { amount: 6.99,  label: "€6.99"}, enterprise: { amount: 49,    label: "€49",   contact: true }, note: "European pricing" },
  na2: { pro: { amount: 3.99,  label: "$3.99"}, family: { amount: 7.99,  label: "$7.99"}, enterprise: { amount: 49,    label: "$49",   contact: true }, note: "International pricing" },
  as:  { pro: { amount: 199,   label: "₹199" }, family: { amount: 349,   label: "₹349" }, enterprise: { amount: 2999,  label: "₹2,999",contact: true }, note: "South Asian pricing" },
  au:  { pro: { amount: 5.99,  label: "A$5.99"},family: { amount: 10.99, label: "A$10.99"},enterprise: { amount: 79,    label: "A$79",  contact: true }, note: "Pacific pricing" },
};

export function getPricing(countryCode) {
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES.find(c => c.code === "OTHER");
  const pricing = REGION_PRICING[country.region] || REGION_PRICING.na2;
  return { country, pricing };
}

export { TIER_CONFIG as TIER_LIMITS, getTierConfig, canAddMed } from "@/lib/tiers";

export function usesPaystack(countryCode) {
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES.find(c => c.code === "OTHER");
  return ["wa", "ng", "ea", "sa", "na"].includes(country?.region);
}

export const ENTERPRISE_TIERS = [
  { id: "small",   label: "Small",     range: "Up to 100 patients",   annualGhs: 50000,  annualLabel: "₵50,000",  annualUsd: 3499,  annualUsdLabel: "$3,499" },
  { id: "medium",  label: "Medium",    range: "100 – 1,000 patients", annualGhs: 100000, annualLabel: "₵100,000", annualUsd: 6999,  annualUsdLabel: "$6,999" },
  { id: "large",   label: "Large",     range: "1,000 – 10,000 patients", annualGhs: 300000, annualLabel: "₵300,000", annualUsd: 19999, annualUsdLabel: "$19,999" },
  { id: "enterprise", label: "Enterprise", range: "10,000+ patients", annualGhs: 1000000, annualLabel: "₵1M+",      annualUsd: 49999, annualUsdLabel: "$49,999+", custom: true },
];

export const THEMES = {
  blue:   { accent:"#007AFF", accent2:"#0055CC", bg:"#F2F2F7", card:"#FFFFFF", sep:"#E5E5EA", t1:"#1C1C1E", t2:"#3A3A3C", t3:"#8E8E93", t4:"#C7C7CC", bar:"rgba(255,255,255,0.72)", hover:"#F2F2F7", sel:"rgba(0,122,255,0.10)", input:"#F2F2F7", ib1:"#E8F0FE", ib2:"#E8F0FE", ib3:"#FFF4E5", ib4:"#F5E8FF", ib5:"#E0F7F4", ib6:"#FFEBEE" },
  green:  { accent:"#34C759", accent2:"#2DB84E", bg:"#F2F2F7", card:"#FFFFFF", sep:"#E5E5EA", t1:"#1C1C1E", t2:"#3A3A3C", t3:"#8E8E93", t4:"#C7C7CC", bar:"rgba(255,255,255,0.72)", hover:"#F2F2F7", sel:"rgba(52,199,89,0.10)", input:"#F2F2F7", ib1:"#E8F8EF", ib2:"#E8F0FE", ib3:"#FFF4E5", ib4:"#F5E8FF", ib5:"#E0F7F4", ib6:"#FFEBEE" },
  purple: { accent:"#AF52DE", accent2:"#983CC9", bg:"#F2F2F7", card:"#FFFFFF", sep:"#E5E5EA", t1:"#1C1C1E", t2:"#3A3A3C", t3:"#8E8E93", t4:"#C7C7CC", bar:"rgba(255,255,255,0.72)", hover:"#F2F2F7", sel:"rgba(175,82,222,0.10)", input:"#F2F2F7", ib1:"#F0E8F8", ib2:"#E8F0FE", ib3:"#FFF4E5", ib4:"#F5E8FF", ib5:"#E0F7F4", ib6:"#FFEBEE" },
  orange: { accent:"#FF9500", accent2:"#E68A00", bg:"#F2F2F7", card:"#FFFFFF", sep:"#E5E5EA", t1:"#1C1C1E", t2:"#3A3A3C", t3:"#8E8E93", t4:"#C7C7CC", bar:"rgba(255,255,255,0.72)", hover:"#F2F2F7", sel:"rgba(255,149,0,0.10)", input:"#F2F2F7", ib1:"#FFF4E5", ib2:"#E8F0FE", ib3:"#FFF4E5", ib4:"#F5E8FF", ib5:"#E0F7F4", ib6:"#FFEBEE" },
  red:    { accent:"#FF3B30", accent2:"#D6342A", bg:"#F2F2F7", card:"#FFFFFF", sep:"#E5E5EA", t1:"#1C1C1E", t2:"#3A3A3C", t3:"#8E8E93", t4:"#C7C7CC", bar:"rgba(255,255,255,0.72)", hover:"#F2F2F7", sel:"rgba(255,59,48,0.10)", input:"#F2F2F7", ib1:"#FFEBEE", ib2:"#E8F0FE", ib3:"#FFF4E5", ib4:"#F5E8FF", ib5:"#E0F7F4", ib6:"#FFEBEE" },
  teal:   { accent:"#5AC8FA", accent2:"#42B0E0", bg:"#F2F2F7", card:"#FFFFFF", sep:"#E5E5EA", t1:"#1C1C1E", t2:"#3A3A3C", t3:"#8E8E93", t4:"#C7C7CC", bar:"rgba(255,255,255,0.72)", hover:"#F2F2F7", sel:"rgba(90,200,250,0.10)", input:"#F2F2F7", ib1:"#E8F6FC", ib2:"#E8F0FE", ib3:"#FFF4E5", ib4:"#F5E8FF", ib5:"#E0F7F4", ib6:"#FFEBEE" },
  pink:   { accent:"#FF2D55", accent2:"#D92548", bg:"#F2F2F7", card:"#FFFFFF", sep:"#E5E5EA", t1:"#1C1C1E", t2:"#3A3A3C", t3:"#8E8E93", t4:"#C7C7CC", bar:"rgba(255,255,255,0.72)", hover:"#F2F2F7", sel:"rgba(255,45,85,0.10)", input:"#F2F2F7", ib1:"#FFEBF0", ib2:"#E8F0FE", ib3:"#FFF4E5", ib4:"#F5E8FF", ib5:"#E0F7F4", ib6:"#FFEBEE" },
  dark:   { accent:"#0A84FF", accent2:"#409CFF", bg:"#1C1C1E", card:"#2C2C2E", sep:"#3A3A3C", t1:"#F2F2F7", t2:"#D1D1D6", t3:"#8E8E93", t4:"#636366", bar:"rgba(28,28,30,0.85)", hover:"#3A3A3C", sel:"rgba(10,132,255,0.15)", input:"#2C2C2E", ib1:"#1A2A3F", ib2:"#1A2A3F", ib3:"#3A2A10", ib4:"#2A1A3F", ib5:"#1A2F2A", ib6:"#3F1A1A" },
};

export function themeVars(themeId) {
  const t = THEMES[themeId] || THEMES.blue;
  return `--teal:${t.accent};--teal2:${t.accent2};--bg:${t.bg};--card:${t.card};--sep:${t.sep};--t1:${t.t1};--t2:${t.t2};--t3:${t.t3};--t4:${t.t4};--bar:${t.bar};--hover:${t.hover};--sel:${t.sel};--input:${t.input};--ib1:${t.ib1};--ib2:${t.ib2};--ib3:${t.ib3};--ib4:${t.ib4};--ib5:${t.ib5};--ib6:${t.ib6};`;
}

export function getStock(medId) {
  try { const d = JSON.parse(localStorage.getItem("mt_stock") || "{}"); return d[medId] || null; } catch { return null; }
}

export function setStock(medId, remaining) {
  try {
    const d = JSON.parse(localStorage.getItem("mt_stock") || "{}");
    d[medId] = { remaining, updatedAt: Date.now() };
    localStorage.setItem("mt_stock", JSON.stringify(d));
  } catch (e) { console.error("stock set:", e); }
}

export function initStockForMed(med) {
  if (!med?.pills_per_package) return;
  const existing = getStock(med.id);
  if (!existing) setStock(med.id, parseInt(med.pills_per_package));
}

export function decrementStock(medId, amount = 1) {
  try {
    const d = JSON.parse(localStorage.getItem("mt_stock") || "{}");
    const entry = d[medId];
    if (entry) {
      entry.remaining = Math.max(0, (entry.remaining || 0) - amount);
      entry.updatedAt = Date.now();
      localStorage.setItem("mt_stock", JSON.stringify(d));
      return entry.remaining;
    }
  } catch (e) { console.error("stock decrement:", e); }
  return null;
}

export function refillStock(medId, pillsPerPackage) {
  setStock(medId, parseInt(pillsPerPackage) || 0);
}

export function getStockStatus(med, logs) {
  if (!med?.pills_per_package) return null;
  const stock = getStock(med.id);
  const remaining = stock?.remaining ?? null;
  if (remaining === null) return null;
  const alertAt = med.refill_reminder_at || 5;
  const status = remaining <= 0 ? "empty" : remaining <= alertAt ? "low" : "ok";
  return { remaining, alertAt, status, total: parseInt(med.pills_per_package) };
}

export function getVisits() {
  try { return JSON.parse(localStorage.getItem("mt_visits") || "[]"); } catch { return []; }
}

export function saveVisits(visits) {
  try { localStorage.setItem("mt_visits", JSON.stringify(visits)); } catch {}
}

export function addVisit(visit) {
  const visits = getVisits();
  const newVisit = { id: "v_" + Date.now() + Math.random().toString(36).slice(2,6), createdAt: new Date().toISOString(), ...visit };
  visits.push(newVisit);
  saveVisits(visits);
  return newVisit;
}

export function updateVisit(id, patch) {
  const visits = getVisits();
  const idx = visits.findIndex(v => v.id === id);
  if (idx >= 0) { visits[idx] = { ...visits[idx], ...patch }; saveVisits(visits); }
}

export function getVisitTime(v) {
  return new Date(v.date + "T" + (v.time || "09:00"));
}

export function markVisitStatus(id, status) {
  updateVisit(id, { status });
}

export function deleteVisit(id) {
  saveVisits(getVisits().filter(v => v.id !== id));
}

export function getUpcomingVisits(daysAhead = 30) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cutoff = new Date(now.getTime() + daysAhead * 86400000);
  return getVisits().filter(v => {
    const d = getVisitTime(v);
    return d >= startOfToday && d <= cutoff;
  }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export function calcStreak(logs, meds) {
  if (!logs.length || !meds.length) return 0;
  let streak = 0;
  const now = new Date();
  for (let d = 0; d <= 180; d++) {
    const day = new Date(now); day.setDate(now.getDate() - d);
    const ds = day.toISOString().split("T")[0];
    const active = meds.filter(m => {
      const s = new Date(m.start_date), e = new Date(m.start_date);
      e.setDate(e.getDate() + m.course_duration_days);
      return s <= day && e >= day && m.active;
    });
    if (!active.length) { if (d === 0) continue; break; }
    const full = active.every(m => {
      const need = m.times_per_day || 1;
      return logs.filter(l => l.medication_id === m.id && l.taken_at?.startsWith(ds)).length >= need;
    });
    if (full) streak++; else if (d > 0) break;
  }
  return streak;
}

export function getTodayExpectedDoseTimes(med, profile) {
  const times = [];
  if (med?.reminder_times && String(med.reminder_times).trim()) {
    String(med.reminder_times).split(",").forEach(t => {
      const [h, m] = t.trim().split(":");
      times.push(`${String(parseInt(h, 10) || 0).padStart(2, "0")}:${String(parseInt(m, 10) || 0).padStart(2, "0")}`);
    });
  } else {
    const wake = String(profile?.wake_time || "08:00").split(":");
    const wakeMin = (parseInt(wake[0] || "8", 10) * 60) + (parseInt(wake[1] || "0", 10));
    const intervalMs = (med?.dose_interval_hours || 24 / (med?.times_per_day || 1)) * 3600000;
    for (let i = 0; i < (med?.times_per_day || 1); i++) {
      const mins = wakeMin + Math.floor((i * intervalMs) / 60000);
      times.push(`${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`);
    }
  }
  return times;
}

export function computeMissedDoses(meds, logs, profile, now = new Date()) {
  if (!meds?.length) return [];
  const todayStr = now.toISOString().split("T")[0];
  const missed = [];
  meds.filter(m => m.active).forEach(med => {
    const start = new Date(med.start_date);
    if (start > now) return;
    const end = new Date(med.start_date);
    end.setDate(end.getDate() + (med.course_duration_days || 0));
    if (end < now) return;
    const dayLogs = (logs || []).filter(l => l.medication_id === med.id && l.taken_at?.startsWith(todayStr));
    getTodayExpectedDoseTimes(med, profile).forEach(t => {
      const [h, m] = t.split(":");
      const due = new Date(now);
      due.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      if (now - due.getTime() > 20 * 60000) {
        const logged = dayLogs.some(l => new Date(l.taken_at).getTime() >= due.getTime() - 10 * 60000);
        if (!logged) missed.push({ med, time: t, dueMs: due.getTime() });
      }
    });
  });
  return missed;
}
