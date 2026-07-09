import { countries as allCountries, getEmojiFlag } from "countries-list";

const CONTINENT_REGION = { AF:"na", AS:"as", EU:"eu", NA:"na2", SA:"na2", OC:"au", AN:"na2" };
const REGION_OVERRIDES = {
  GH:"wa", NG:"wa", SN:"wa", CI:"wa", GN:"wa", SL:"wa", GW:"wa", LR:"wa", TG:"wa", BJ:"wa",
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
COUNTRIES.push({ code:"OTHER", name:"Other country", flag:"🌍", currency:"USD", region:"na2" });

const REGION_PRICING = {
  wa:  { pro: { amount: 15,    label: "₵15" },  family: { amount: 28,    label: "₵28" },  enterprise: { amount: 150,   label: "₵150",  contact: true }, note: "West African pricing" },
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

export const TIER_LIMITS = {
  free:   { maxMeds: 3,  history: 7,  caregiving: false, reports: false, refillReminder: false, interactionCheck: false },
  pro:    { maxMeds: 999,history: 999,caregiving: true,  reports: true,  refillReminder: true,  interactionCheck: true  },
  family: { maxMeds: 999,history: 999,caregiving: true,  reports: true,  refillReminder: true,  interactionCheck: true,  profiles: 5 },
  enterprise: { maxMeds: 9999, history: 9999, caregiving: true, reports: true, refillReminder: true, interactionCheck: true, profiles: 999, api: true, branding: true, hipaa: true, bulkPatients: true, dedicatedSupport: true },
};

export function canAddMed(plan, currentMedCount) {
  return currentMedCount < (TIER_LIMITS[plan]?.maxMeds ?? 3);
}

export function usesPaystack(countryCode) {
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES.find(c => c.code === "OTHER");
  return ["wa", "ea", "sa", "na"].includes(country?.region);
}

export const ENTERPRISE_TIERS = [
  { id: "small",   label: "Small",     range: "Up to 100 patients",   annualGhs: 50000,  annualLabel: "₵50,000",  annualUsd: 3499,  annualUsdLabel: "$3,499" },
  { id: "medium",  label: "Medium",    range: "100 – 1,000 patients", annualGhs: 100000, annualLabel: "₵100,000", annualUsd: 6999,  annualUsdLabel: "$6,999" },
  { id: "large",   label: "Large",     range: "1,000 – 10,000 patients", annualGhs: 300000, annualLabel: "₵300,000", annualUsd: 19999, annualUsdLabel: "$19,999" },
  { id: "enterprise", label: "Enterprise", range: "10,000+ patients", annualGhs: 1000000, annualLabel: "₵1M+",      annualUsd: 49999, annualUsdLabel: "$49,999+", custom: true },
];

export const THEMES = {
  blue:   { accent:"#2563EB", accent2:"#1D4ED8", bg:"#F8FAFC", card:"#FFFFFF", sep:"#E2E8F0", t1:"#0F172A", t2:"#334155", t3:"#64748B", t4:"#94A3B8", bar:"rgba(255,255,255,0.94)", hover:"#F1F5F9", sel:"rgba(37,99,235,0.12)", input:"#FFFFFF", ib1:"#DBEAFE", ib2:"#E0F2FE", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#CCFBF1", ib6:"#FEE2E2" },
  green:  { accent:"#059669", accent2:"#047857", bg:"#F0FDF4", card:"#FFFFFF", sep:"#D1D5DB", t1:"#0F172A", t2:"#334155", t3:"#64748B", t4:"#94A3B8", bar:"rgba(255,255,255,0.94)", hover:"#F1F5F9", sel:"rgba(5,150,105,0.12)", input:"#FFFFFF", ib1:"#DCFCE7", ib2:"#DBEAFE", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#CCFBF1", ib6:"#FEE2E2" },
  purple: { accent:"#7C3AED", accent2:"#6D28D9", bg:"#F5F3FF", card:"#FFFFFF", sep:"#D1D5DB", t1:"#0F172A", t2:"#334155", t3:"#64748B", t4:"#94A3B8", bar:"rgba(255,255,255,0.94)", hover:"#F1F5F9", sel:"rgba(124,58,237,0.12)", input:"#FFFFFF", ib1:"#EDE9FE", ib2:"#DBEAFE", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#CCFBF1", ib6:"#FEE2E2" },
  orange: { accent:"#EA580C", accent2:"#D97706", bg:"#FFF7ED", card:"#FFFFFF", sep:"#D1D5DB", t1:"#0F172A", t2:"#334155", t3:"#64748B", t4:"#94A3B8", bar:"rgba(255,255,255,0.94)", hover:"#F1F5F9", sel:"rgba(234,88,12,0.12)", input:"#FFFFFF", ib1:"#FFEDD5", ib2:"#DBEAFE", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#CCFBF1", ib6:"#FEE2E2" },
  red:    { accent:"#DC2626", accent2:"#B91C1C", bg:"#FEF2F2", card:"#FFFFFF", sep:"#D1D5DB", t1:"#0F172A", t2:"#334155", t3:"#64748B", t4:"#94A3B8", bar:"rgba(255,255,255,0.94)", hover:"#F1F5F9", sel:"rgba(220,38,38,0.12)", input:"#FFFFFF", ib1:"#FEE2E2", ib2:"#DBEAFE", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#CCFBF1", ib6:"#FEE2E2" },
  teal:   { accent:"#0D9488", accent2:"#0F766E", bg:"#F0FDFA", card:"#FFFFFF", sep:"#D1D5DB", t1:"#0F172A", t2:"#334155", t3:"#64748B", t4:"#94A3B8", bar:"rgba(255,255,255,0.94)", hover:"#F1F5F9", sel:"rgba(13,148,136,0.12)", input:"#FFFFFF", ib1:"#CCFBF1", ib2:"#DBEAFE", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#CCFBF1", ib6:"#FEE2E2" },
  pink:   { accent:"#DB2777", accent2:"#BE185D", bg:"#FDF2F8", card:"#FFFFFF", sep:"#D1D5DB", t1:"#0F172A", t2:"#334155", t3:"#64748B", t4:"#94A3B8", bar:"rgba(255,255,255,0.94)", hover:"#F1F5F9", sel:"rgba(219,39,119,0.12)", input:"#FFFFFF", ib1:"#FCE7F3", ib2:"#DBEAFE", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#CCFBF1", ib6:"#FEE2E2" },
  dark:   { accent:"#3B82F6", accent2:"#60A5FA", bg:"#0F172A", card:"#1E293B", sep:"#334155", t1:"#F8FAFC", t2:"#CBD5E1", t3:"#64748B", t4:"#475569", bar:"rgba(15,23,42,0.94)", hover:"#334155", sel:"rgba(59,130,246,0.15)", input:"#1E293B", ib1:"#1E3A5F", ib2:"#1E2A5A", ib3:"#4A4A1A", ib4:"#3A1A4A", ib5:"#1A4A4A", ib6:"#4A1A1A" },
};

export function themeVars(themeId) {
  const t = THEMES[themeId] || THEMES.blue;
  return `--teal:${t.accent};--teal2:${t.accent2};--bg:${t.bg};--card:${t.card};--sep:${t.sep};--t1:${t.t1};--t2:${t.t2};--t3:${t.t3};--t4:${t.t4};--bar:${t.bar};--hover:${t.hover};--sel:${t.sel};--input:${t.input};--ib1:${t.ib1};--ib2:${t.ib2};--ib3:${t.ib3};--ib4:${t.ib4};--ib5:${t.ib5};--ib6:${t.ib6};`;
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
