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
  wa:  { pro: { amount: 15,    label: "₵15" },  family: { amount: 28,    label: "₵28" },  note: "West African pricing" },
  ea:  { pro: { amount: 300,   label: "KSh300"},family: { amount: 550,   label: "KSh550"},note: "East African pricing" },
  sa:  { pro: { amount: 59,    label: "R59" },  family: { amount: 109,   label: "R109" }, note: "Southern African pricing" },
  na:  { pro: { amount: 39,    label: "39 MAD"},family: { amount: 69,    label: "69 MAD"},note: "North African pricing" },
  eu:  { pro: { amount: 3.99,  label: "€3.99"}, family: { amount: 6.99,  label: "€6.99"}, note: "European pricing" },
  na2: { pro: { amount: 3.99,  label: "$3.99"}, family: { amount: 7.99,  label: "$7.99"}, note: "International pricing" },
  as:  { pro: { amount: 199,   label: "₹199" }, family: { amount: 349,   label: "₹349" }, note: "South Asian pricing" },
  au:  { pro: { amount: 5.99,  label: "A$5.99"},family: { amount: 10.99, label: "A$10.99"},note: "Pacific pricing" },
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
};

export function canAddMed(plan, currentMedCount) {
  return currentMedCount < (TIER_LIMITS[plan]?.maxMeds ?? 3);
}

export const THEMES = {
  blue:   { accent:"#0A84FF", accent2:"#34C759", bg:"#F2F2F7", card:"#FFFFFF", sep:"#C6C6C8", t1:"#000000", t2:"#3C3C43", t3:"#8E8E93", t4:"#AEAEB2", bar:"rgba(249,249,249,0.94)", hover:"#E5E5EA", sel:"#EFF6FF", input:"#FFFFFF", ib1:"#EFF6FF", ib2:"#D1FAE5", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#F0FDF4", ib6:"#FEE2E2" },
  green:  { accent:"#34C759", accent2:"#30D158", bg:"#F0FDF4", card:"#FFFFFF", sep:"#C6C6C8", t1:"#000000", t2:"#3C3C43", t3:"#8E8E93", t4:"#AEAEB2", bar:"rgba(249,249,249,0.94)", hover:"#E5E5EA", sel:"#EFF6FF", input:"#FFFFFF", ib1:"#EFF6FF", ib2:"#D1FAE5", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#F0FDF4", ib6:"#FEE2E2" },
  purple: { accent:"#AF52DE", accent2:"#BF5AF2", bg:"#F5F0FF", card:"#FFFFFF", sep:"#C6C6C8", t1:"#000000", t2:"#3C3C43", t3:"#8E8E93", t4:"#AEAEB2", bar:"rgba(249,249,249,0.94)", hover:"#E5E5EA", sel:"#EFF6FF", input:"#FFFFFF", ib1:"#EFF6FF", ib2:"#D1FAE5", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#F0FDF4", ib6:"#FEE2E2" },
  orange: { accent:"#FF9500", accent2:"#FF6000", bg:"#FFF7ED", card:"#FFFFFF", sep:"#C6C6C8", t1:"#000000", t2:"#3C3C43", t3:"#8E8E93", t4:"#AEAEB2", bar:"rgba(249,249,249,0.94)", hover:"#E5E5EA", sel:"#EFF6FF", input:"#FFFFFF", ib1:"#EFF6FF", ib2:"#D1FAE5", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#F0FDF4", ib6:"#FEE2E2" },
  red:    { accent:"#FF3B30", accent2:"#FF453A", bg:"#FFF0F0", card:"#FFFFFF", sep:"#C6C6C8", t1:"#000000", t2:"#3C3C43", t3:"#8E8E93", t4:"#AEAEB2", bar:"rgba(249,249,249,0.94)", hover:"#E5E5EA", sel:"#EFF6FF", input:"#FFFFFF", ib1:"#EFF6FF", ib2:"#D1FAE5", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#F0FDF4", ib6:"#FEE2E2" },
  teal:   { accent:"#5AC8FA", accent2:"#0A84FF", bg:"#F0F9FF", card:"#FFFFFF", sep:"#C6C6C8", t1:"#000000", t2:"#3C3C43", t3:"#8E8E93", t4:"#AEAEB2", bar:"rgba(249,249,249,0.94)", hover:"#E5E5EA", sel:"#EFF6FF", input:"#FFFFFF", ib1:"#EFF6FF", ib2:"#D1FAE5", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#F0FDF4", ib6:"#FEE2E2" },
  pink:   { accent:"#FF2D55", accent2:"#FF375F", bg:"#FFF0F5", card:"#FFFFFF", sep:"#C6C6C8", t1:"#000000", t2:"#3C3C43", t3:"#8E8E93", t4:"#AEAEB2", bar:"rgba(249,249,249,0.94)", hover:"#E5E5EA", sel:"#EFF6FF", input:"#FFFFFF", ib1:"#EFF6FF", ib2:"#D1FAE5", ib3:"#FEF3C7", ib4:"#F3E8FF", ib5:"#F0FDF4", ib6:"#FEE2E2" },
  dark:   { accent:"#0A84FF", accent2:"#34C759", bg:"#1C1C1E", card:"#2C2C2E", sep:"#38383A", t1:"#FFFFFF", t2:"#EBEBF5", t3:"#8E8E93", t4:"#636366", bar:"rgba(28,28,30,0.94)", hover:"#3A3A3C", sel:"#1C1C1E", input:"#1C1C1E", ib1:"#1E2A4A", ib2:"#1A3A2A", ib3:"#3A3A1A", ib4:"#2A1A3A", ib5:"#1A2A1A", ib6:"#3A1A1A" },
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
