"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Read OAuth tokens from URL synchronously at module load ──────────────────
// This MUST run before React renders so Next.js router can't strip the hash.
// We store any found tokens immediately and clean the URL.
(function captureOAuthTokens() {
  if (typeof window === "undefined") return;
  try {
    // Implicit flow: tokens in hash
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const at = hash.get("access_token");
    const rt = hash.get("refresh_token");
    if (at) {
      localStorage.setItem("mt_at", at);
      if (rt) localStorage.setItem("mt_rt", rt);
      // Clean URL immediately — before any router sees it
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }
    // PKCE flow: code in query string — store it so getUser can exchange it
    const qs = new URLSearchParams(window.location.search);
    const code = qs.get("code");
    if (code) {
      sessionStorage.setItem("mt_code", code);
      window.history.replaceState(null, "", window.location.pathname);
    }
  } catch {}
})();

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://luxtopkzdyflbejwgniq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1eHRvcGt6ZHlmbGJlandnbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY5NzAsImV4cCI6MjA5NzkxMjk3MH0.zcvzd5vOBxw6xE00EIrt7NBcEnFa95FxODsD2h1M-OU";

// ─── COUNTRY & PRICING DATA ──────────────────────────────────────────────────
const COUNTRIES = [
  // West Africa (GHS, NGN, XOF)
  { code:"GH", name:"Ghana",           flag:"🇬🇭", currency:"GHS", symbol:"₵",  region:"wa" },
  { code:"NG", name:"Nigeria",          flag:"🇳🇬", currency:"NGN", symbol:"₦",  region:"wa" },
  { code:"SN", name:"Senegal",          flag:"🇸🇳", currency:"XOF", symbol:"CFA",region:"wa" },
  { code:"CI", name:"Côte d'Ivoire",    flag:"🇨🇮", currency:"XOF", symbol:"CFA",region:"wa" },
  { code:"GN", name:"Guinea",           flag:"🇬🇳", currency:"GNF", symbol:"FG", region:"wa" },
  { code:"SL", name:"Sierra Leone",     flag:"🇸🇱", currency:"SLL", symbol:"Le", region:"wa" },
  { code:"GW", name:"Guinea-Bissau",    flag:"🇬🇼", currency:"XOF", symbol:"CFA",region:"wa" },
  { code:"LR", name:"Liberia",          flag:"🇱🇷", currency:"LRD", symbol:"L$", region:"wa" },
  { code:"TG", name:"Togo",             flag:"🇹🇬", currency:"XOF", symbol:"CFA",region:"wa" },
  { code:"BJ", name:"Benin",            flag:"🇧🇯", currency:"XOF", symbol:"CFA",region:"wa" },
  // East Africa
  { code:"KE", name:"Kenya",            flag:"🇰🇪", currency:"KES", symbol:"KSh",region:"ea" },
  { code:"TZ", name:"Tanzania",         flag:"🇹🇿", currency:"TZS", symbol:"TSh",region:"ea" },
  { code:"UG", name:"Uganda",           flag:"🇺🇬", currency:"UGX", symbol:"USh",region:"ea" },
  { code:"ET", name:"Ethiopia",         flag:"🇪🇹", currency:"ETB", symbol:"Br", region:"ea" },
  { code:"RW", name:"Rwanda",           flag:"🇷🇼", currency:"RWF", symbol:"RF", region:"ea" },
  // Southern Africa
  { code:"ZA", name:"South Africa",     flag:"🇿🇦", currency:"ZAR", symbol:"R",  region:"sa" },
  { code:"ZW", name:"Zimbabwe",         flag:"🇿🇼", currency:"USD", symbol:"$",  region:"sa" },
  { code:"ZM", name:"Zambia",           flag:"🇿🇲", currency:"ZMW", symbol:"ZK", region:"sa" },
  { code:"BW", name:"Botswana",         flag:"🇧🇼", currency:"BWP", symbol:"P",  region:"sa" },
  // North Africa
  { code:"EG", name:"Egypt",            flag:"🇪🇬", currency:"EGP", symbol:"E£", region:"na" },
  { code:"MA", name:"Morocco",          flag:"🇲🇦", currency:"MAD", symbol:"MAD",region:"na" },
  // Europe
  { code:"GB", name:"United Kingdom",   flag:"🇬🇧", currency:"GBP", symbol:"£",  region:"eu" },
  { code:"DE", name:"Germany",          flag:"🇩🇪", currency:"EUR", symbol:"€",  region:"eu" },
  { code:"FR", name:"France",           flag:"🇫🇷", currency:"EUR", symbol:"€",  region:"eu" },
  { code:"NL", name:"Netherlands",      flag:"🇳🇱", currency:"EUR", symbol:"€",  region:"eu" },
  { code:"IT", name:"Italy",            flag:"🇮🇹", currency:"EUR", symbol:"€",  region:"eu" },
  // North America
  { code:"US", name:"United States",    flag:"🇺🇸", currency:"USD", symbol:"$",  region:"na2" },
  { code:"CA", name:"Canada",           flag:"🇨🇦", currency:"CAD", symbol:"CA$",region:"na2" },
  // Asia / Pacific
  { code:"IN", name:"India",            flag:"🇮🇳", currency:"INR", symbol:"₹",  region:"as" },
  { code:"AU", name:"Australia",        flag:"🇦🇺", currency:"AUD", symbol:"A$", region:"au" },
  { code:"OTHER", name:"Other country", flag:"🌍", currency:"USD", symbol:"$",   region:"na2" },
];

// Pricing by region (monthly)
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

function getPricing(countryCode) {
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES.find(c => c.code === "OTHER");
  const pricing = REGION_PRICING[country.region] || REGION_PRICING.na2;
  return { country, pricing };
}

// Tier feature gates
const TIER_LIMITS = {
  free:   { maxMeds: 3,  history: 7,  caregiving: false, reports: false, refillReminder: false, interactionCheck: false },
  pro:    { maxMeds: 999,history: 999,caregiving: true,  reports: true,  refillReminder: true,  interactionCheck: true  },
  family: { maxMeds: 999,history: 999,caregiving: true,  reports: true,  refillReminder: true,  interactionCheck: true,  profiles: 5 },
};

function canAddMed(plan, currentMedCount) {
  return currentMedCount < (TIER_LIMITS[plan]?.maxMeds ?? 3);
}

// ─── SUPABASE SETUP CHECKLIST ────────────────────────────────────────────────
// 1. Authentication → URL Configuration → add these Redirect URLs:
//      http://localhost:3000
//      https://your-production-domain.com
// 2. Authentication → Providers → Google:
//      Enable it, paste Client ID + Secret from console.cloud.google.com
//      Authorised redirect URI in Google Console:
//        https://luxtopkzdyflbejwgniq.supabase.co/auth/v1/callback
// 3. Run the SQL below once in Supabase SQL Editor
// ─────────────────────────────────────────────────────────────────────────────
// ─── SQL (run once in Supabase SQL Editor) ────────────────────────────────────
/*
create extension if not exists "uuid-ossp";

create table if not exists public.medications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  dosage_amount numeric(10,2) not null,
  dosage_unit text not null default 'tablet(s)',
  times_per_day integer not null default 1,
  dose_interval_hours numeric(5,2) not null default 8,
  course_duration_days integer not null,
  start_date date not null,
  reminder_minutes integer not null default 30,
  notes text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.dose_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  medication_id uuid references public.medications(id) on delete cascade not null,
  taken_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_emoji text default '😊',
  condition text,
  wake_time text default '07:00',
  sleep_time text default '22:00',
  reminder_lead integer default 30,
  plan text default 'free',
  onboarded boolean default false,
  created_at timestamptz default now()
);

alter table public.medications enable row level security;
alter table public.dose_logs enable row level security;
alter table public.profiles enable row level security;

create policy "own_meds" on public.medications for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own_logs" on public.dose_logs for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own_profile" on public.profiles for all using (auth.uid()=id) with check (auth.uid()=id);
*/

// ─── Supabase client ──────────────────────────────────────────────────────────
function mkClient(url, key) {
  let tok = key;

  // ── Core fetch wrapper ────────────────────────────────────────────────────
  async function safeJson(r) {
    const t = await r.text().catch(() => "");
    if (!t?.trim()) return null;
    try { return JSON.parse(t); } catch { return null; }
  }

  async function api(path, opts = {}) {
    const r = await fetch(url + path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${tok}`,
        ...(opts.headers || {}),
      },
    });
    if (!r.ok) {
      const e = await safeJson(r) || {};
      throw new Error(e.message || e.error_description || `HTTP ${r.status}`);
    }
    if (r.status === 204) return null;
    return safeJson(r);
  }

  // ── LocalStorage helpers — never throw ───────────────────────────────────
  const ls = {
    get: k   => { try { return localStorage.getItem(k); }    catch { return null; } },
    set: (k,v)=>{ try { localStorage.setItem(k, v); }        catch {} },
    del: k   => { try { localStorage.removeItem(k); }        catch {} },
  };

  // ── Session helpers ───────────────────────────────────────────────────────
  function saveSession(d) {
    if (!d?.access_token) return d?.user ?? null;
    tok = d.access_token;
    ls.set("mt_at", d.access_token);
    if (d.refresh_token) ls.set("mt_rt", d.refresh_token);
    return d.user ?? null;
  }

  function clearSession() {
    tok = key;
    ls.del("mt_at");
    ls.del("mt_rt");
  }

  // ── Read any OAuth tokens captured at module load time ──────────────────
  // captureOAuthTokens() (top of file) already read the hash/query and stored
  // them in localStorage/sessionStorage before React mounted.
  function consumeCapturedTokens() {
    // Implicit flow tokens are already in localStorage as mt_at / mt_rt
    // Just check if they were freshly written by the capture function
    const at = ls.get("mt_at");
    const rt = ls.get("mt_rt");
    // Also handle PKCE code if present
    const code = (() => { try { return sessionStorage.getItem("mt_code"); } catch { return null; } })();
    if (code) {
      try { sessionStorage.removeItem("mt_code"); } catch {}
      return { type: "pkce", code };
    }
    if (at) return { type: "token", access_token: at, refresh_token: rt };
    return null;
  }

  const auth = {
    // ── Email sign-up ────────────────────────────────────────────────────────
    async signUp({ email, password, options }) {
      try {
        const d = await api("/auth/v1/signup", {
          method: "POST",
          body: JSON.stringify({ email, password, data: options?.data }),
        });
        const u = saveSession(d) ?? d?.user ?? null;
        return { data: { user: u, session: d }, error: null };
      } catch (e) {
        return { data: null, error: e instanceof Error ? e : new Error(e?.message || String(e)) };
      }
    },

    // ── Email sign-in ────────────────────────────────────────────────────────
    async signInWithPassword({ email, password }) {
      try {
        const d = await api("/auth/v1/token?grant_type=password", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const u = saveSession(d);
        return { data: { user: u, session: d }, error: null };
      } catch (e) {
        return { data: null, error: e instanceof Error ? e : new Error(e?.message || String(e)) };
      }
    },

    // ── OAuth — Google / Apple / Facebook ────────────────────────────────────
    // IMPORTANT — forces implicit flow so tokens come back in the URL hash.
    // No PKCE code verifier required. Works with our lightweight client.
    //
    // Required Supabase setup (one-time):
    //   1. Dashboard → Authentication → URL Configuration → Redirect URLs
    //      Add: http://localhost:3000
    //           https://your-production-domain.com
    //   2. Dashboard → Authentication → Providers → Google (or Apple/Facebook)
    //      Paste Client ID + Secret
    //      Google Console authorised redirect URI:
    //        https://luxtopkzdyflbejwgniq.supabase.co/auth/v1/callback
    signInWithOAuth({ provider }) {
      const redirectTo = window.location.origin + window.location.pathname;
      const params = new URLSearchParams({
        provider,
        redirect_to: redirectTo,
        flow_type: "implicit",   // ← forces hash-based token return, no PKCE
      });
      window.location.href = `${url}/auth/v1/authorize?${params}`;
    },

    // ── Restore / verify session ─────────────────────────────────────────────
    async getUser() {
      // Step 1: check for OAuth tokens captured at module load
      const captured = consumeCapturedTokens();

      if (captured?.type === "pkce" && captured.code) {
        // Exchange PKCE auth code for session
        try {
          const d = await api("/auth/v1/token?grant_type=pkce", {
            method: "POST",
            body: JSON.stringify({ auth_code: captured.code }),
          });
          saveSession(d);
          if (d?.user) return { data: { user: d.user }, error: null };
        } catch {}
        // PKCE exchange failed — fall through to stored token
      }

      // Step 2: try stored access token (covers implicit flow + returning users)
      const at = ls.get("mt_at");
      if (!at) return { data: { user: null }, error: null };
      tok = at;
      try {
        const u = await api("/auth/v1/user");
        return { data: { user: u }, error: null };
      } catch {
        // Step 3: access token expired — try refresh token
        const rt = ls.get("mt_rt");
        if (rt) {
          try {
            const d = await api("/auth/v1/token?grant_type=refresh_token", {
              method: "POST",
              body: JSON.stringify({ refresh_token: rt }),
            });
            saveSession(d);
            return { data: { user: d.user }, error: null };
          } catch {}
        }
        // All failed — clear session and require re-login
        clearSession();
        return { data: { user: null }, error: null };
      }
    },

    // ── Sign out ──────────────────────────────────────────────────────────────
    async signOut() {
      try { await api("/auth/v1/logout", { method: "POST" }); } catch {}
      clearSession();
    },
  };

  // ── Query builder ─────────────────────────────────────────────────────────
  function from(table) {
    const st = { sel: "*", filters: [], orders: [], lim: null };
    const q = {
      select(c = "*") { st.sel = c; return q; },
      eq(col, val) { st.filters.push(`${col}=eq.${encodeURIComponent(val)}`); return q; },
      order(col, { ascending = true } = {}) {
        st.orders.push(`${col}.${ascending ? "asc" : "desc"}`);
        return q;
      },
      limit(n) { st.lim = n; return q; },
      _qs() {
        let s = `select=${st.sel}`;
        st.filters.forEach(f => { s += `&${f}`; });
        if (st.orders.length) s += `&order=${st.orders.join(",")}`;
        if (st.lim) s += `&limit=${st.lim}`;
        return s;
      },
      then(res, rej) {
        api(`/rest/v1/${table}?${q._qs()}`, { headers: { Prefer: "return=representation" } })
          .then(d => res({ data: d ?? [], error: null }))
          .catch(e => {
            // rej() must receive an Error — plain objects become [object Object] in React error boundaries
            const err = e instanceof Error ? e : new Error(e?.message || String(e));
            res({ data: null, error: err }); // resolve with error shape instead of rejecting
          });
      },
      async insert(rows) {
        try {
          const d = await api(`/rest/v1/${table}`, {
            method: "POST",
            body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
            headers: { Prefer: "return=representation" },
          });
          return { data: d, error: null };
        } catch (e) {
          return { data: null, error: e instanceof Error ? e : new Error(e?.message || String(e)) };
        }
      },
      async upsert(rows) {
        try {
          const d = await api(`/rest/v1/${table}`, {
            method: "POST",
            body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
            headers: { Prefer: "return=representation,resolution=merge-duplicates" },
          });
          return { data: d, error: null };
        } catch (e) {
          return { data: null, error: e instanceof Error ? e : new Error(e?.message || String(e)) };
        }
      },
      async update(payload) {
        const fq = st.filters.join("&");
        try {
          const d = await api(`/rest/v1/${table}?${fq}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
            headers: { Prefer: "return=representation" },
          });
          return { data: d, error: null };
        } catch (e) {
          return { data: null, error: e instanceof Error ? e : new Error(e?.message || String(e)) };
        }
      },
      async delete() {
        const fq = st.filters.join("&");
        try {
          await api(`/rest/v1/${table}?${fq}`, { method: "DELETE" });
          return { error: null };
        } catch (e) {
          return { error: e instanceof Error ? e : new Error(e?.message || String(e)) };
        }
      },
    };
    return q;
  }

  return { auth, from };
}

const sb = mkClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Safe profile fetch — returns null on any failure (table may not exist yet)
async function fetchProfile(userId, userMeta) {
  try {
    const { data } = await sb.from("profiles").select("*").eq("id", userId);
    const existing = Array.isArray(data) ? (data[0] || null) : null;
    // If profile exists, return it; if not, seed with country from OAuth/signup metadata
    if (existing) return existing;
    if (userMeta?.country) {
      // Create a minimal profile with country from sign-up so pricing is correct immediately
      await sb.from("profiles").upsert([{
        id: userId,
        full_name: userMeta.full_name || "",
        country: userMeta.country,
        plan: "free",
        onboarded: false,
      }]);
      const { data: d2 } = await sb.from("profiles").select("*").eq("id", userId);
      return Array.isArray(d2) ? (d2[0] || null) : null;
    }
    return null;
  } catch { return null; }
}

// Normalise any caught value into a readable string
function errMsg(e) {
  if (!e) return "Something went wrong.";
  if (typeof e === "string") return e;
  return e?.message || e?.error_description || e?.msg || JSON.stringify(e);
}

// ─── Push notifications ───────────────────────────────────────────────────────
async function askNotifPerm() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}
function scheduleNotifs(meds, leadMin) {
  if (window._mt_timers) window._mt_timers.forEach(clearTimeout);
  window._mt_timers = [];
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  meds.forEach(med => {
    if (!med.active) return;
    const end = new Date(med.start_date); end.setDate(end.getDate() + med.course_duration_days);
    if (end < now) return;
    const tpd = med.times_per_day || 1;
    const ivMs = (24 / tpd) * 3600000;
    const base = new Date(`${todayStr}T${med.wake_time || "08:00"}:00`);
    for (let i = 0; i < tpd; i++) {
      const doseAt = new Date(base.getTime() + i * ivMs);
      const notifAt = new Date(doseAt.getTime() - leadMin * 60000);
      const delay = notifAt - now;
      if (delay < 0) continue;
      window._mt_timers.push(setTimeout(() => {
        new Notification("💊 MediTrack", {
          body: `${leadMin > 0 ? `In ${leadMin} min: ` : ""}Take ${med.dosage_amount} ${med.dosage_unit} of ${med.name}`,
          icon: "/favicon.ico", tag: `mt-${med.id}-${i}`,
        });
      }, delay));
    }
  });
}

// ─── Streak ───────────────────────────────────────────────────────────────────
function calcStreak(logs, meds) {
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

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#F2F2F7;
  --card:#FFFFFF;
  --teal:#0A84FF;
  --teal2:#34C759;
  --red:#FF3B30;
  --orange:#FF9500;
  --purple:#AF52DE;
  --sep:#C6C6C8;
  --t1:#000000;
  --t2:#3C3C43;
  --t3:#8E8E93;
  --t4:#AEAEB2;
  --safe-bottom:env(safe-area-inset-bottom,0px);
  --safe-top:env(safe-area-inset-top,0px);
  --rr:12px;--rl:16px;--rxl:20px;
}
html,body{height:100%;background:var(--bg)}
body{font-family:'Inter',-apple-system,'Helvetica Neue',sans-serif;color:var(--t1);-webkit-font-smoothing:antialiased;overscroll-behavior:none}

/* ── iOS-style bottom tab bar ── */
.tabbar{position:fixed;bottom:0;left:0;right:0;height:calc(49px + var(--safe-bottom));background:rgba(249,249,249,0.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:0.5px solid var(--sep);display:flex;align-items:flex-start;padding-top:6px;z-index:200}
.tbi{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;-webkit-tap-highlight-color:transparent;padding:0 4px}
.tbi svg{width:24px;height:24px}
.tbi span{font-size:10px;font-weight:500;color:var(--t3)}
.tbi.on svg path,.tbi.on svg circle,.tbi.on svg rect{fill:var(--teal)}
.tbi.on span{color:var(--teal)}

/* ── Nav bar (top) ── */
.navbar{position:sticky;top:0;z-index:100;background:rgba(249,249,249,0.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:0.5px solid var(--sep);padding:calc(var(--safe-top) + 8px) 16px 8px;display:flex;align-items:center;justify-content:space-between;min-height:44px}
.nav-title{font-size:17px;font-weight:600;color:var(--t1)}
.nav-large{font-size:34px;font-weight:700;letter-spacing:-.5px;padding:8px 16px 4px;color:var(--t1)}
.nav-action{background:none;border:none;color:var(--teal);font-size:16px;font-weight:500;cursor:pointer;font-family:inherit;padding:4px 0;-webkit-tap-highlight-color:transparent}

/* ── Scroll container ── */
.scroll{overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding-bottom:calc(70px + var(--safe-bottom));padding-top:0}

/* ── Lists (iOS grouped style) ── */
.section{padding:0 16px;margin-bottom:8px}
.section-header{font-size:13px;font-weight:500;color:var(--t3);text-transform:uppercase;letter-spacing:.4px;padding:16px 4px 6px}
.list{background:var(--card);border-radius:var(--rl);overflow:hidden}
.row{display:flex;align-items:center;padding:12px 16px;min-height:44px;gap:12px;border-bottom:0.5px solid var(--sep);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .1s}
.row:last-child{border-bottom:none}
.row:active{background:#E5E5EA}
.row-icon{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;flex-shrink:0;font-size:16px}
.row-body{flex:1;min-width:0}
.row-title{font-size:16px;color:var(--t1);font-weight:400}
.row-sub{font-size:13px;color:var(--t3);margin-top:1px}
.row-right{display:flex;align-items:center;gap:6px;flex-shrink:0}
.row-value{font-size:16px;color:var(--t3)}
.chevron{color:var(--t4);font-size:13px}
.row-check{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--sep);display:grid;place-items:center;flex-shrink:0}
.row-check.done{background:var(--teal2);border-color:var(--teal2)}

/* ── Cards ── */
.hero-card{margin:0 16px 16px;background:linear-gradient(135deg,#0A84FF 0%,#32ADE6 100%);border-radius:var(--rxl);padding:20px;color:white;position:relative;overflow:hidden}
.hero-card::after{content:'';position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:rgba(255,255,255,.1);border-radius:50%}
.hero-card::before{content:'';position:absolute;bottom:-20px;left:60px;width:80px;height:80px;background:rgba(255,255,255,.07);border-radius:50%}
.hero-label{font-size:13px;font-weight:500;opacity:.85;margin-bottom:4px}
.hero-big{font-size:48px;font-weight:700;line-height:1;letter-spacing:-1px}
.hero-sub{font-size:14px;opacity:.85;margin-top:6px}
.hero-row{display:flex;gap:16px;margin-top:16px}
.hero-stat{flex:1;background:rgba(255,255,255,.15);border-radius:10px;padding:10px 12px}
.hero-stat-val{font-size:22px;font-weight:700}
.hero-stat-lbl{font-size:11px;opacity:.8;margin-top:2px}

/* ── Stat chips ── */
.chips{display:flex;gap:10px;margin:0 16px 16px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{flex-shrink:0;background:var(--card);border-radius:var(--rl);padding:14px 16px;min-width:100px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.chip-val{font-size:24px;font-weight:700;color:var(--t1)}
.chip-lbl{font-size:12px;color:var(--t3);margin-top:2px}
.chip.green .chip-val{color:var(--teal2)}
.chip.blue .chip-val{color:var(--teal)}
.chip.orange .chip-val{color:var(--orange)}
.chip.purple .chip-val{color:var(--purple)}

/* ── Progress ring ── */
.ring-wrap{position:relative;width:80px;height:80px;flex-shrink:0}
.ring-wrap svg{transform:rotate(-90deg)}
.ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring-pct{font-size:18px;font-weight:700;color:var(--t1)}
.ring-of{font-size:10px;color:var(--t3)}

/* ── Pill badge ── */
.badge{display:inline-flex;align-items:center;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600}
.badge-green{background:#D1FAE5;color:#065F46}
.badge-gray{background:#E5E7EB;color:#374151}
.badge-blue{background:#DBEAFE;color:#1E40AF}

/* ── Buttons ── */
.btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:14px 20px;border-radius:var(--rl);font-size:16px;font-weight:600;cursor:pointer;border:none;font-family:inherit;-webkit-tap-highlight-color:transparent;transition:opacity .15s}
.btn:active{opacity:.7}
.btn-primary{background:var(--teal);color:white;width:100%}
.btn-green{background:var(--teal2);color:white}
.btn-ghost{background:var(--card);color:var(--teal);width:100%}
.btn-red{background:var(--red);color:white}
.btn-disabled{opacity:.45;pointer-events:none}
.btn-sm{padding:8px 16px;font-size:14px;border-radius:10px}

/* ── Auth ── */
.auth-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:linear-gradient(160deg,#f0f9ff 0%,#e0f2fe 50%,#f0fdf4 100%)}
.auth-card{background:white;border-radius:24px;padding:28px 24px;width:100%;max-width:390px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.auth-logo{display:flex;align-items:center;gap:10px;margin-bottom:24px}
.auth-mark{width:44px;height:44px;background:var(--teal);border-radius:12px;display:grid;place-items:center}
.auth-mark svg{fill:white;width:24px;height:24px}
.auth-app-name{font-size:20px;font-weight:700}
.auth-title{font-size:24px;font-weight:700;margin-bottom:6px}
.auth-sub{font-size:15px;color:var(--t3);margin-bottom:22px}
.oauth-stack{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
.oauth-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 20px;border:1.5px solid var(--sep);border-radius:var(--rl);background:white;cursor:pointer;font-size:15px;font-weight:500;color:var(--t1);font-family:inherit;transition:background .1s;-webkit-tap-highlight-color:transparent;width:100%}
.oauth-btn:active{background:#F2F2F7}
.oauth-btn svg{width:20px;height:20px;flex-shrink:0}
.divider{display:flex;align-items:center;gap:12px;margin-bottom:16px;color:var(--t3);font-size:14px}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--sep)}
.input-group{display:flex;flex-direction:column;gap:12px;margin-bottom:16px}
.input-field{padding:13px 14px;border:1.5px solid var(--sep);border-radius:var(--rl);font-size:16px;color:var(--t1);font-family:inherit;background:white;outline:none;transition:border-color .15s}
.input-field:focus{border-color:var(--teal)}
.auth-switch{text-align:center;margin-top:16px;font-size:15px;color:var(--t3)}
.auth-switch button{background:none;border:none;color:var(--teal);font-weight:600;cursor:pointer;font-size:15px;font-family:inherit}
.err-msg{background:#FEF2F2;border:1px solid #FECACA;color:#B91C1C;padding:10px 14px;border-radius:10px;font-size:14px;margin-bottom:14px}
.ok-msg{background:#F0FDF4;border:1px solid #BBF7D0;color:#166534;padding:14px;border-radius:12px;font-size:14px;margin-bottom:14px;line-height:1.5}
.ok-msg strong{display:block;font-size:15px;margin-bottom:3px}

/* ── Onboarding ── */
.onboard-screen{min-height:100vh;background:var(--bg);display:flex;flex-direction:column}
.ob-progress{display:flex;gap:6px;padding:16px 24px 0}
.ob-dot{flex:1;height:4px;border-radius:99px;background:var(--sep);transition:background .3s}
.ob-dot.done{background:var(--teal)}
.ob-body{flex:1;padding:24px;display:flex;flex-direction:column}
.ob-emoji{font-size:56px;margin-bottom:16px;line-height:1}
.ob-title{font-size:28px;font-weight:700;margin-bottom:8px;line-height:1.2}
.ob-sub{font-size:16px;color:var(--t3);margin-bottom:28px;line-height:1.5}
.ob-options{display:flex;flex-direction:column;gap:10px;margin-bottom:auto}
.ob-option{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--card);border-radius:var(--rl);cursor:pointer;border:2px solid transparent;transition:all .15s;-webkit-tap-highlight-color:transparent}
.ob-option.sel{border-color:var(--teal);background:#EFF6FF}
.ob-option-icon{font-size:24px;width:40px;text-align:center;flex-shrink:0}
.ob-option-text{flex:1}
.ob-option-title{font-size:16px;font-weight:500;color:var(--t1)}
.ob-option-sub{font-size:13px;color:var(--t3);margin-top:2px}
.ob-check{width:22px;height:22px;border-radius:50%;border:2px solid var(--sep);display:grid;place-items:center;flex-shrink:0;transition:all .15s}
.ob-check.on{background:var(--teal);border-color:var(--teal)}
.ob-footer{padding:16px 24px calc(16px + var(--safe-bottom))}
.ob-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ob-time-card{background:var(--card);border-radius:var(--rl);padding:14px 16px;cursor:pointer;border:2px solid transparent;transition:all .15s;text-align:center}
.ob-time-card.sel{border-color:var(--teal);background:#EFF6FF}
.ob-time-emoji{font-size:28px;margin-bottom:6px}
.ob-time-label{font-size:14px;font-weight:600;color:var(--t1)}
.ob-time-sub{font-size:12px;color:var(--t3);margin-top:2px}
.emoji-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.emoji-opt{font-size:28px;width:52px;height:52px;display:grid;place-items:center;border-radius:12px;cursor:pointer;border:2px solid transparent;transition:all .15s;background:var(--card)}
.emoji-opt.sel{border-color:var(--teal);background:#EFF6FF}

/* ── Modals / sheets ── */
.sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:300;display:flex;align-items:flex-end}
.sheet{background:var(--card);border-radius:20px 20px 0 0;padding:0 0 calc(16px + var(--safe-bottom));width:100%;max-height:92vh;overflow-y:auto;animation:slideUp .25s ease}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sheet-handle{width:36px;height:4px;background:var(--sep);border-radius:99px;margin:12px auto 16px}
.sheet-title{font-size:17px;font-weight:600;text-align:center;padding:0 16px 16px;border-bottom:.5px solid var(--sep);margin-bottom:8px}
.sheet-section{padding:8px 16px}
.sheet-label{font-size:13px;color:var(--t3);margin-bottom:6px;font-weight:500;text-transform:uppercase;letter-spacing:.3px;font-size:12px}
.sheet-input{width:100%;padding:13px 14px;border:1.5px solid var(--sep);border-radius:var(--rl);font-size:16px;color:var(--t1);font-family:inherit;background:white;outline:none;transition:border-color .15s}
.sheet-input:focus{border-color:var(--teal)}
.sheet-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sheet-actions{padding:12px 16px 0;display:flex;flex-direction:column;gap:10px}
.sheet-seg{display:flex;background:#E9E9EB;border-radius:9px;padding:2px;gap:2px}
.sheet-seg-btn{flex:1;padding:7px;border:none;background:none;border-radius:7px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;color:var(--t2);transition:all .15s}
.sheet-seg-btn.on{background:white;color:var(--t1);box-shadow:0 1px 3px rgba(0,0,0,.12)}

/* ── Notification banner ── */
.notif-banner{margin:0 16px 12px;background:linear-gradient(135deg,#FF9500,#FFCC00);border-radius:var(--rl);padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer}
.notif-banner-text{flex:1;font-size:14px;font-weight:500;color:white}
.notif-banner-btn{background:white;color:#92400E;border:none;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}

/* ── Progress bar ── */
.prog{height:5px;background:#E5E7EB;border-radius:99px;overflow:hidden;margin-top:8px}
.prog-fill{height:100%;border-radius:99px;transition:width .4s ease}

/* ── Misc ── */
.empty-state{text-align:center;padding:48px 24px;color:var(--t3)}
.empty-state-icon{font-size:48px;margin-bottom:12px}
.empty-state-title{font-size:17px;font-weight:600;color:var(--t2);margin-bottom:6px}
.empty-state-sub{font-size:15px;margin-bottom:20px}
.loading-screen{min-height:100vh;display:grid;place-items:center;font-size:32px}
.tag{display:inline-flex;align-items:center;gap:4px;background:#F2F2F7;border-radius:6px;padding:2px 8px;font-size:12px;color:var(--t2)}

/* ── Profile page ── */
.profile-header{padding:24px 16px 16px;display:flex;flex-direction:column;align-items:center;gap:8px}
.profile-avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#0A84FF,#32ADE6);display:grid;place-items:center;font-size:40px}
.profile-name{font-size:22px;font-weight:700}
.profile-plan{font-size:14px;color:var(--t3)}

/* ── Upgrade card ── */
.upgrade-card{margin:0 16px 16px;background:linear-gradient(135deg,#AF52DE,#FF2D55);border-radius:var(--rxl);padding:20px;color:white}
.upgrade-title{font-size:20px;font-weight:700;margin-bottom:6px}
.upgrade-sub{font-size:14px;opacity:.9;margin-bottom:16px;line-height:1.5}
.upgrade-features{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
.upgrade-feature{font-size:14px;opacity:.95}
.upgrade-btn{background:white;color:#AF52DE;border:none;border-radius:10px;padding:12px 20px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;width:100%}


/* ── Transition / loading screen ── */
.trans-screen{position:fixed;inset:0;background:linear-gradient(160deg,#0A84FF 0%,#32ADE6 60%,#34C759 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;transition:opacity .4s ease}
.trans-screen.fade-out{opacity:0;pointer-events:none}
.trans-logo{width:88px;height:88px;background:rgba(255,255,255,.2);border-radius:26px;display:grid;place-items:center;margin-bottom:20px;backdrop-filter:blur(10px);animation:logoPop .5s cubic-bezier(.175,.885,.32,1.275) both}
@keyframes logoPop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
.trans-logo svg{fill:white;width:48px;height:48px}
.trans-title{font-size:28px;font-weight:700;color:white;margin-bottom:8px;animation:fadeUp .5s .1s ease both}
.trans-msg{font-size:16px;color:rgba(255,255,255,.85);margin-bottom:40px;animation:fadeUp .5s .2s ease both;text-align:center;padding:0 24px}
@keyframes fadeUp{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
.trans-dots{display:flex;gap:8px;animation:fadeUp .5s .3s ease both}
.trans-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.5)}
.trans-dot:nth-child(1){animation:pulse 1.2s .0s infinite}
.trans-dot:nth-child(2){animation:pulse 1.2s .2s infinite}
.trans-dot:nth-child(3){animation:pulse 1.2s .4s infinite}
@keyframes pulse{0%,80%,100%{background:rgba(255,255,255,.35);transform:scale(.8)}40%{background:white;transform:scale(1.1)}}

/* ── Onboarding step slide animation ── */
.ob-step{animation:obSlide .3s ease both}
@keyframes obSlide{from{transform:translateX(32px);opacity:0}to{transform:translateX(0);opacity:1}}

/* ── Goal chips ── */
.goal-chip{display:flex;align-items:center;gap:10px;padding:13px 16px;background:var(--card);border-radius:var(--rl);cursor:pointer;border:2px solid transparent;transition:all .15s;-webkit-tap-highlight-color:transparent}
.goal-chip.sel{border-color:var(--teal);background:#EFF6FF}
.goal-chip-icon{font-size:22px;width:36px;text-align:center;flex-shrink:0}
.goal-chip-label{font-size:15px;font-weight:500;color:var(--t1)}
.goal-chip-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--sep);display:grid;place-items:center;flex-shrink:0;margin-left:auto;transition:all .15s}
.goal-chip-check.on{background:var(--teal);border-color:var(--teal)}

/* ── Color theme picker ── */
.theme-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.theme-swatch{width:100%;aspect-ratio:1;border-radius:14px;cursor:pointer;display:grid;place-items:center;border:3px solid transparent;transition:all .15s;position:relative}
.theme-swatch.sel{border-color:var(--t1);transform:scale(1.05)}
.theme-swatch-check{font-size:18px;color:white;text-shadow:0 1px 3px rgba(0,0,0,.3)}

@media(min-width:430px){
  .auth-screen{padding:40px 24px}
  .onboard-screen{max-width:430px;margin:0 auto}
}
@keyframes bgPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.7}}
@keyframes emojiPop{from{transform:scale(.3) rotate(-15deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
`;

// ─── Small helpers ────────────────────────────────────────────────────────────
const GIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const AIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.33.07 2.24.7 3.02.72.94-.17 1.84-.85 3.09-.91 1.58-.07 2.79.7 3.46 1.91-3.38 2.01-2.57 6.05.78 7.42-.47 1.17-.98 2.33-2.35 3.74zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>;
const FIcon = () => <svg viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
function Chevron() { return <span style={{color:"var(--t4)",fontSize:13}}>›</span>; }
function fmtTime(iso) { return new Date(iso).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); }
function fmtDate(iso) { return new Date(iso).toLocaleDateString([],{month:"short",day:"numeric"}); }
function fmtDateLong(iso) { return new Date(iso).toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"}); }

// ─── Auth ─────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [view, setView]     = useState("welcome"); // welcome | signin | signup
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [name, setName]     = useState("");
  const [country, setCountry] = useState("GH");
  const [busy, setBusy]     = useState(false);
  const [obl, setObl]       = useState("");
  const [err, setErr]       = useState("");
  const [sent, setSent]     = useState(false);

  function Logo() {
    return (
      <div className="auth-logo">
        <div className="auth-mark">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
        </div>
        <span className="auth-app-name">MediTrack</span>
      </div>
    );
  }

  async function oauth(provider) {
    setErr(""); setObl(provider);
    await new Promise(r => setTimeout(r, 80));
    sb.auth.signInWithOAuth({ provider });
  }

  async function handleSignIn(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) throw new Error(error?.message || "Login failed — please check your credentials.");
      if (!data?.user) throw new Error("Login failed — please check your credentials.");
      onAuth(data.user, false);
    } catch (e) {
      setErr(e?.message || "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  async function handleSignUp(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const { data, error } = await sb.auth.signUp({
        email, password: pw,
        options: { data: { full_name: name, country } },
      });
      if (error) throw new Error(error?.message || "Sign up failed — please try again.");
      if (data?.user?.identities?.length === 0) throw new Error("Email already registered — sign in instead.");
      if (data?.session?.access_token) onAuth(data.user, true);
      else setSent(true);
    } catch (e) {
      setErr(e?.message || "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  // ── Email confirmation sent screen ─────────────────────────────────────────
  if (sent) return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card">
        <Logo/>
        <div className="ok-msg">
          <strong>Check your inbox 📬</strong>
          We sent a confirmation link to <strong>{email}</strong>. Click it then come back to sign in.
        </div>
        <button className="btn btn-primary" onClick={() => { setSent(false); setView("signin"); }}>Back to sign in</button>
      </div>
    </div>
  );

  // ── Welcome / landing screen ────────────────────────────────────────────────
  if (view === "welcome") return (
    <div className="auth-screen" style={{background:"linear-gradient(160deg,#0A2463 0%,#0A84FF 60%,#32ADE6 100%)",justifyContent:"flex-end",paddingBottom:0}}>
      <style>{CSS}</style>
      {/* Hero illustration area */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px 24px",color:"white"}}>
        <div style={{fontSize:72,marginBottom:16,filter:"drop-shadow(0 8px 24px rgba(0,0,0,.3))"}}>💊</div>
        <div style={{fontSize:32,fontWeight:800,letterSpacing:"-1px",textAlign:"center",lineHeight:1.1,marginBottom:12}}>
          Never miss a<br/>dose again
        </div>
        <div style={{fontSize:16,opacity:.85,textAlign:"center",lineHeight:1.6,maxWidth:300}}>
          Track medications, get smart reminders, and stay on top of your health — all in one place.
        </div>
        {/* Feature pills */}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginTop:24}}>
          {["💊 Dose tracking","🔔 Smart reminders","🔥 Streak rewards","📊 Adherence reports"].map(f=>(
            <div key={f} style={{background:"rgba(255,255,255,.15)",backdropFilter:"blur(10px)",borderRadius:99,padding:"6px 14px",fontSize:13,fontWeight:500,color:"white"}}>{f}</div>
          ))}
        </div>
      </div>
      {/* Bottom sheet */}
      <div style={{background:"white",borderRadius:"24px 24px 0 0",padding:"28px 24px calc(28px + env(safe-area-inset-bottom,0px))",width:"100%"}}>
        <div style={{fontSize:22,fontWeight:700,marginBottom:6,color:"var(--t1)"}}>Get started</div>
        <div style={{fontSize:15,color:"var(--t3)",marginBottom:20}}>Join thousands managing their health with MediTrack</div>
        <div className="oauth-stack" style={{marginBottom:16}}>
          <button className="oauth-btn" onClick={()=>oauth("google")} disabled={!!obl} style={{background:"#fff"}}>
            {obl==="google"?"Redirecting…":<><GIcon/> Continue with Google</>}
          </button>
          <button className="oauth-btn" onClick={()=>oauth("apple")} disabled={!!obl}>
            {obl==="apple"?"Redirecting…":<><AIcon/> Continue with Apple</>}
          </button>
          <button className="oauth-btn" onClick={()=>oauth("facebook")} disabled={!!obl}>
            {obl==="facebook"?"Redirecting…":<><FIcon/> Continue with Facebook</>}
          </button>
        </div>
        <div className="divider">or</div>
        <button className="btn btn-primary" style={{marginBottom:12}} onClick={()=>setView("signup")}>Create free account</button>
        <button className="btn btn-ghost" onClick={()=>setView("signin")}>Sign in to existing account</button>
      </div>
    </div>
  );

  // ── Sign In screen ─────────────────────────────────────────────────────────
  if (view === "signin") return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card">
        <Logo/>
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Sign in to manage your medications</div>
        <div className="oauth-stack">
          <button className="oauth-btn" onClick={()=>oauth("google")} disabled={!!obl}>{obl==="google"?"Redirecting…":<><GIcon/> Continue with Google</>}</button>
          <button className="oauth-btn" onClick={()=>oauth("apple")} disabled={!!obl}>{obl==="apple"?"Redirecting…":<><AIcon/> Continue with Apple</>}</button>
          <button className="oauth-btn" onClick={()=>oauth("facebook")} disabled={!!obl}>{obl==="facebook"?"Redirecting…":<><FIcon/> Continue with Facebook</>}</button>
        </div>
        <div className="divider">or sign in with email</div>
        {err && <div className="err-msg">{err}</div>}
        <form onSubmit={handleSignIn}>
          <div className="input-group">
            <input className="input-field" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>
            <input className="input-field" type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} minLength={8} required autoComplete="current-password"/>
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy?"Signing in…":"Sign in"}</button>
        </form>
        <div className="auth-switch">
          New to MediTrack? <button onClick={()=>{setView("signup");setErr("");}}>Create account</button>
          <span style={{margin:"0 8px",color:"var(--sep)"}}>·</span>
          <button onClick={()=>setView("welcome")} style={{color:"var(--t3)"}}>Back</button>
        </div>
      </div>
    </div>
  );

  // ── Sign Up screen (with country picker) ──────────────────────────────────
  const selCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];
  const { pricing } = getPricing(country);

  return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card" style={{maxWidth:440}}>
        <Logo/>
        <div className="auth-title">Create your account</div>
        <div className="auth-sub">Free forever · Upgrade anytime</div>
        <div className="oauth-stack">
          <button className="oauth-btn" onClick={()=>oauth("google")} disabled={!!obl}>{obl==="google"?"Redirecting…":<><GIcon/> Continue with Google</>}</button>
          <button className="oauth-btn" onClick={()=>oauth("apple")} disabled={!!obl}>{obl==="apple"?"Redirecting…":<><AIcon/> Continue with Apple</>}</button>
        </div>
        <div className="divider">or sign up with email</div>
        {err && <div className="err-msg">{err}</div>}
        <form onSubmit={handleSignUp}>
          <div className="input-group">
            <input className="input-field" type="text" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required autoComplete="name"/>
            <input className="input-field" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>
            <input className="input-field" type="password" placeholder="Password (8+ characters)" value={pw} onChange={e=>setPw(e.target.value)} minLength={8} required autoComplete="new-password"/>

            {/* Country picker */}
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:20,pointerEvents:"none",zIndex:1}}>
                {selCountry.flag}
              </div>
              <select
                className="input-field"
                value={country}
                onChange={e=>setCountry(e.target.value)}
                style={{paddingLeft:46}}
              >
                {COUNTRIES.map(c=>(
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing preview based on country */}
          <div style={{background:"linear-gradient(135deg,#EFF6FF,#F0FDF4)",border:"1px solid #BFDBFE",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:12,color:"var(--t3)",fontWeight:600,textTransform:"uppercase",letterSpacing:".3px",marginBottom:8}}>
              {selCountry.name} pricing
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div style={{background:"white",borderRadius:8,padding:"8px 10px",border:"1px solid #E0F2FE"}}>
                <div style={{fontSize:11,color:"var(--t3)",marginBottom:2}}>Free plan</div>
                <div style={{fontSize:16,fontWeight:700,color:"var(--teal2)"}}>Free</div>
                <div style={{fontSize:11,color:"var(--t3)"}}>3 medications</div>
              </div>
              <div style={{background:"white",borderRadius:8,padding:"8px 10px",border:"1px solid #BFDBFE"}}>
                <div style={{fontSize:11,color:"var(--t3)",marginBottom:2}}>Pro plan</div>
                <div style={{fontSize:16,fontWeight:700,color:"var(--teal)"}}>{pricing.pro.label}<span style={{fontSize:11,fontWeight:400}}>/mo</span></div>
                <div style={{fontSize:11,color:"var(--t3)"}}>Unlimited + more</div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={busy}>{busy?"Creating account…":"Create free account"}</button>
        </form>

        <div style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginTop:12,lineHeight:1.5}}>
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </div>
        <div className="auth-switch">
          Already have an account? <button onClick={()=>{setView("signin");setErr("");}}>Sign in</button>
          <span style={{margin:"0 8px",color:"var(--sep)"}}>·</span>
          <button onClick={()=>setView("welcome")} style={{color:"var(--t3)"}}>Back</button>
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding (4 steps) ─────────────────────────────────────────────────────
const OB_STEPS = 5;
function Onboarding({ user, profile: initProfile, onDone }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    full_name: initProfile?.full_name || user?.user_metadata?.full_name || "",
    avatar_emoji: initProfile?.avatar_emoji || "😊",
    condition: initProfile?.condition || "",
    wake_time: initProfile?.wake_time || "07:00",
    sleep_time: initProfile?.sleep_time || "22:00",
    reminder_lead: initProfile?.reminder_lead ?? 30,
    plan: initProfile?.plan || "free",
    goals: [],
    theme: "blue",
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setData(p => ({ ...p, [k]: v })); }

  async function finish() {
    setSaving(true);
    await sb.from("profiles").upsert([{ id: user.id, ...data, onboarded: true }]);
    onDone(data);
  }

  const next = () => step < OB_STEPS - 1 ? setStep(s => s + 1) : finish();
  const back = () => setStep(s => s - 1);

  const conditions = [
    { icon: "💊", title: "Managing a prescription course", sub: "Antibiotics, steroids, short-term meds", value: "prescription" },
    { icon: "🫀", title: "Chronic condition", sub: "Diabetes, hypertension, asthma, HIV", value: "chronic" },
    { icon: "🌿", title: "Vitamins & supplements", sub: "Daily wellness, iron, omega-3", value: "supplements" },
    { icon: "👨‍👩‍👧", title: "Managing for family", sub: "Tracking meds for a child or parent", value: "family" },
    { icon: "🔬", title: "Clinical / research use", sub: "Trial, hospital, or clinical setting", value: "clinical" },
  ];
  const reminders = [
    { value: 0, label: "At dose time", sub: "Exact moment" },
    { value: 15, label: "15 min early", sub: "Quick heads up" },
    { value: 30, label: "30 min early", sub: "Most popular" },
    { value: 60, label: "1 hour early", sub: "Plan ahead" },
    { value: 120, label: "2 hours early", sub: "Never forget" },
  ];
  const emojis = ["😊","🧑","👩","👨","🧓","👴","👵","🧒","👦","👧","🙂","😄","💪","🌟","❤️","🌸","🐻","🦁","🐼","🌴"];

  const steps = [
    // Step 0 — name & avatar
    <div key="0" className="ob-body">
      <div className="ob-emoji">👋</div>
      <div className="ob-title">What should we call you?</div>
      <div className="ob-sub">Pick a name and avatar for your account.</div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:13,color:"var(--t3)",marginBottom:8,fontWeight:500}}>YOUR NAME</div>
        <input className="sheet-input" placeholder="Full name" value={data.full_name} onChange={e=>set("full_name",e.target.value)} style={{marginBottom:16}}/>
        <div style={{fontSize:13,color:"var(--t3)",marginBottom:10,fontWeight:500}}>CHOOSE AN AVATAR</div>
        <div className="emoji-grid">
          {emojis.map(em => (
            <div key={em} className={`emoji-opt${data.avatar_emoji===em?" sel":""}`} onClick={()=>set("avatar_emoji",em)}>{em}</div>
          ))}
        </div>
      </div>
    </div>,

    // Step 1 — why are you here
    <div key="1" className="ob-body">
      <div className="ob-emoji">🎯</div>
      <div className="ob-title">How are you using MediTrack?</div>
      <div className="ob-sub">We'll personalise your experience based on your needs.</div>
      <div className="ob-options">
        {conditions.map(c => (
          <div key={c.value} className={`ob-option${data.condition===c.value?" sel":""}`} onClick={()=>set("condition",c.value)}>
            <div className="ob-option-icon">{c.icon}</div>
            <div className="ob-option-text"><div className="ob-option-title">{c.title}</div><div className="ob-option-sub">{c.sub}</div></div>
            <div className={`ob-check${data.condition===c.value?" on":""}`}>{data.condition===c.value&&<span style={{color:"white",fontSize:13}}>✓</span>}</div>
          </div>
        ))}
      </div>
    </div>,

    // Step 2 — wake/sleep schedule
    <div key="2" className="ob-body">
      <div className="ob-emoji">🕗</div>
      <div className="ob-title">What's your daily schedule?</div>
      <div className="ob-sub">We'll time your dose reminders around your sleep and wake times.</div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
        {[{label:"⏰ Wake up time",key:"wake_time"},{label:"🌙 Bedtime",key:"sleep_time"}].map(({label,key})=>(
          <div key={key} style={{background:"var(--card)",borderRadius:"var(--rl)",padding:"14px 16px"}}>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:8,fontWeight:500}}>{label}</div>
            <input type="time" value={data[key]} onChange={e=>set(key,e.target.value)} style={{fontSize:18,fontWeight:600,border:"none",background:"none",color:"var(--t1)",fontFamily:"inherit",width:"100%",outline:"none"}}/>
          </div>
        ))}
      </div>
      <div style={{fontSize:13,color:"var(--t3)",marginBottom:10,fontWeight:500,textTransform:"uppercase",letterSpacing:".3px"}}>DEFAULT REMINDER TIMING</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {reminders.map(r=>(
          <div key={r.value} className={`ob-option${data.reminder_lead===r.value?" sel":""}`} style={{padding:"12px 16px"}} onClick={()=>set("reminder_lead",r.value)}>
            <div className="ob-option-text"><div className="ob-option-title">{r.label}</div><div className="ob-option-sub">{r.sub}</div></div>
            <div className={`ob-check${data.reminder_lead===r.value?" on":""}`}>{data.reminder_lead===r.value&&<span style={{color:"white",fontSize:13}}>✓</span>}</div>
          </div>
        ))}
      </div>
    </div>,

    // Step 3 — plan
    <div key="3" className="ob-body">
      <div className="ob-emoji">✨</div>
      <div className="ob-title">Choose your plan</div>
      <div className="ob-sub">Start free. Upgrade anytime when you need more.</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[
          { value:"free", icon:"🆓", title:"Free", sub:"Up to 3 medications, basic reminders", features:["3 medications","Daily reminders","7-day history"] },
          { value:"pro", icon:"⭐", title:"Pro — $3.99/mo", sub:"Everything you need for full adherence", features:["Unlimited medications","Full history & analytics","Caregiver sharing","Refill reminders","Adherence PDF reports"] },
          { value:"family", icon:"👨‍👩‍👧", title:"Family — $7.99/mo", sub:"One account for the whole household", features:["5 family profiles","All Pro features","Shared family dashboard","Doctor-friendly summaries"] },
        ].map(p=>(
          <div key={p.value} className={`ob-option${data.plan===p.value?" sel":""}`} style={{alignItems:"flex-start",padding:"16px"}} onClick={()=>set("plan",p.value)}>
            <div className="ob-option-icon" style={{marginTop:2}}>{p.icon}</div>
            <div className="ob-option-text">
              <div className="ob-option-title">{p.title}</div>
              <div className="ob-option-sub" style={{marginBottom:8}}>{p.sub}</div>
              {p.features.map(f=><div key={f} style={{fontSize:12,color:"var(--t3)",marginTop:3}}>✓ {f}</div>)}
            </div>
            <div className={`ob-check${data.plan===p.value?" on":""}`} style={{marginTop:2}}>{data.plan===p.value&&<span style={{color:"white",fontSize:13}}>✓</span>}</div>
          </div>
        ))}
      </div>
    </div>,

    // Step 4 — health goals + colour theme
    <div key="4" className="ob-body">
      <div className="ob-emoji">🎨</div>
      <div className="ob-title">Final touches</div>
      <div className="ob-sub">Set your health goals and pick an app theme colour.</div>

      <div style={{fontSize:13,color:"var(--t3)",fontWeight:500,textTransform:"uppercase",letterSpacing:".3px",marginBottom:10}}>HEALTH GOALS (pick any)</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
        {[
          {icon:"💊",label:"Never miss a dose"},
          {icon:"📊",label:"Track adherence over time"},
          {icon:"👨‍⚕️",label:"Share reports with my doctor"},
          {icon:"👨‍👩‍👧",label:"Manage family medications"},
          {icon:"🔔",label:"Build a medication habit"},
          {icon:"💊",label:"Complete my full course"},
        ].map(g => {
          const sel = data.goals.includes(g.label);
          return (
            <div key={g.label} className={`goal-chip${sel?" sel":""}`}
              onClick={()=>set("goals", sel ? data.goals.filter(x=>x!==g.label) : [...data.goals,g.label])}>
              <div className="goal-chip-icon">{g.icon}</div>
              <div className="goal-chip-label">{g.label}</div>
              <div className={`goal-chip-check${sel?" on":""}`}>{sel&&<span style={{color:"white",fontSize:11}}>✓</span>}</div>
            </div>
          );
        })}
      </div>

      <div style={{fontSize:13,color:"var(--t3)",fontWeight:500,textTransform:"uppercase",letterSpacing:".3px",marginBottom:12}}>APP THEME</div>
      <div className="theme-grid">
        {[
          {id:"blue",  colors:["#0A84FF","#32ADE6"],label:"Ocean"},
          {id:"green", colors:["#34C759","#30D158"],label:"Forest"},
          {id:"purple",colors:["#AF52DE","#BF5AF2"],label:"Lavender"},
          {id:"orange",colors:["#FF9500","#FF6000"],label:"Sunset"},
          {id:"red",   colors:["#FF3B30","#FF453A"],label:"Cherry"},
          {id:"teal",  colors:["#5AC8FA","#0A84FF"],label:"Sky"},
          {id:"pink",  colors:["#FF2D55","#FF375F"],label:"Rose"},
          {id:"dark",  colors:["#1C1C1E","#2C2C2E"],label:"Midnight"},
        ].map(th=>(
          <div key={th.id} className={`theme-swatch${data.theme===th.id?" sel":""}`}
            style={{background:`linear-gradient(135deg,${th.colors[0]},${th.colors[1]})`}}
            onClick={()=>set("theme",th.id)}>
            {data.theme===th.id && <div className="theme-swatch-check">✓</div>}
          </div>
        ))}
      </div>
      <div style={{textAlign:"center",fontSize:12,color:"var(--t3)",marginTop:8}}>Theme changes apply after setup</div>
    </div>,
  ];

  return (
    <div className="onboard-screen"><style>{CSS}</style>
      <div style={{padding:"calc(var(--safe-top) + 12px) 24px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button style={{background:"none",border:"none",color:"var(--teal)",fontSize:16,fontWeight:500,cursor:"pointer",fontFamily:"inherit",visibility:step>0?"visible":"hidden"}} onClick={back}>‹ Back</button>
        <span style={{fontSize:14,color:"var(--t3)",fontWeight:500}}>{step+1} of {OB_STEPS}</span>
        <button style={{background:"none",border:"none",color:"var(--t3)",fontSize:14,cursor:"pointer",fontFamily:"inherit"}} onClick={finish}>Skip</button>
      </div>
      <div className="ob-progress" style={{padding:"12px 24px 0"}}>
        {Array.from({length:OB_STEPS}).map((_,i)=><div key={i} className={`ob-dot${i<=step?" done":""}`}/>)}
      </div>
      <div style={{flex:1,overflow:"auto"}} key={step}><div className="ob-step">{steps[step]}</div></div>
      <div className="ob-footer">
        <button className="btn btn-primary" onClick={next} disabled={saving}>
          {saving?"Setting up…":step===OB_STEPS-1?"Get started →":"Continue →"}
        </button>
      </div>
    </div>
  );
}

// ─── Add Medication Sheet ─────────────────────────────────────────────────────
function MedSheet({ med, userId, reminderLead, plan, medCount, onSave, onClose }) {
  const blank = { name:"", dosage_amount:"", dosage_unit:"tablet(s)", times_per_day:"1", dose_interval_hours:"8", course_duration_days:"", start_date:new Date().toISOString().split("T")[0], reminder_minutes:String(reminderLead||30), notes:"" };
  const [f, setF] = useState(med ? { name:med.name, dosage_amount:String(med.dosage_amount), dosage_unit:med.dosage_unit, times_per_day:String(med.times_per_day||1), dose_interval_hours:String(med.dose_interval_hours), course_duration_days:String(med.course_duration_days), start_date:med.start_date, reminder_minutes:String(med.reminder_minutes||30), notes:med.notes||"" } : blank);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  function set(k, v) {
    setF(p => {
      const n = { ...p, [k]: v };
      if (k==="times_per_day" && Number(v)>0) n.dose_interval_hours = (24/Number(v)).toFixed(1);
      if (k==="dose_interval_hours" && Number(v)>0) n.times_per_day = String(Math.round(24/Number(v)));
      return n;
    });
  }

  async function save() {
    if (!med && !canAddMed(plan || "free", medCount || 0)) {
      setErr("Free plan allows up to 3 medications. Upgrade to Pro for unlimited medications.");
      return;
    }
    if (!f.name.trim()||!f.dosage_amount||!f.course_duration_days) { setErr("Please fill in name, dosage, and duration."); return; }
    setBusy(true); setErr("");
    const payload = { user_id:userId, name:f.name.trim(), dosage_amount:parseFloat(f.dosage_amount), dosage_unit:f.dosage_unit, times_per_day:parseInt(f.times_per_day)||1, dose_interval_hours:parseFloat(f.dose_interval_hours), course_duration_days:parseInt(f.course_duration_days), start_date:f.start_date, reminder_minutes:parseInt(f.reminder_minutes), notes:f.notes, active:true };
    const result = med?.id ? await sb.from("medications").eq("id",med.id).update(payload) : await sb.from("medications").insert([payload]);
    if (result.error) {
      const msg = result.error?.message || result.error?.error_description || JSON.stringify(result.error);
      setErr(msg); setBusy(false); return;
    }
    onSave();
  }

  const units = ["tablet(s)","capsule(s)","ml","mg","mcg","IU","drop(s)","puff(s)","patch(es)","injection(s)"];

  return (
    <div className="sheet-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div className="sheet-title">{med?"Edit Medication":"New Medication"}</div>
        {err && <div style={{margin:"0 16px 8px"}} className="err-msg">{err}</div>}

        <div className="sheet-section">
          <div className="sheet-label">Medication name</div>
          <input className="sheet-input" placeholder="e.g. Amoxicillin 500mg" value={f.name} onChange={e=>set("name",e.target.value)}/>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">Dosage</div>
          <div className="sheet-row">
            <input className="sheet-input" type="number" min="0.1" step="0.1" placeholder="Amount (e.g. 2)" value={f.dosage_amount} onChange={e=>set("dosage_amount",e.target.value)}/>
            <select className="sheet-input" value={f.dosage_unit} onChange={e=>set("dosage_unit",e.target.value)}>
              {units.map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">Schedule</div>
          <div className="sheet-row" style={{marginBottom:10}}>
            <div>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:5}}>Times per day</div>
              <input className="sheet-input" type="number" min="1" max="24" step="1" placeholder="e.g. 3" value={f.times_per_day} onChange={e=>set("times_per_day",e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:5}}>Hours between doses</div>
              <input className="sheet-input" type="number" min="0.5" step="0.5" value={f.dose_interval_hours} onChange={e=>set("dose_interval_hours",e.target.value)}/>
            </div>
          </div>
          <div className="sheet-row">
            <div>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:5}}>Duration (days)</div>
              <input className="sheet-input" type="number" min="1" step="1" placeholder="e.g. 7" value={f.course_duration_days} onChange={e=>set("course_duration_days",e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:5}}>Start date</div>
              <input className="sheet-input" type="date" value={f.start_date} onChange={e=>set("start_date",e.target.value)}/>
            </div>
          </div>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">Remind me</div>
          <select className="sheet-input" value={f.reminder_minutes} onChange={e=>set("reminder_minutes",e.target.value)}>
            <option value="0">At dose time</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="120">2 hours before</option>
          </select>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">Notes (optional)</div>
          <textarea className="sheet-input" rows={2} placeholder="e.g. Take with food" value={f.notes} onChange={e=>set("notes",e.target.value)} style={{resize:"vertical"}}/>
        </div>

        <div className="sheet-actions">
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy?"Saving…":med?"Save changes":"Add medication"}</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Ring ─────────────────────────────────────────────────────────────────────
function Ring({ pct, size = 80, stroke = 7, color = "#0A84FF" }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const p = Math.min(Math.max(pct, 0), 1);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={p===1?"#34C759":color} strokeWidth={stroke}
          strokeDasharray={`${p*c} ${c}`} strokeLinecap="round" style={{transition:"stroke-dasharray .5s ease,stroke .3s"}}/>
      </svg>
      <div className="ring-center">
        <div className="ring-pct">{Math.round(p*100)}%</div>
        <div className="ring-of">done</div>
      </div>
    </div>
  );
}

// ─── TODAY TAB ────────────────────────────────────────────────────────────────
function TodayTab({ user, profile, meds, logs, onLog, onAdd, notifPerm, onEnableNotif }) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const todayLogs = logs.filter(l => l.taken_at?.startsWith(todayStr));
  const activeMeds = meds.filter(m => { if (!m.active) return false; const e=new Date(m.start_date); e.setDate(e.getDate()+m.course_duration_days); return e>=today; });
  function exp(med) { return med.times_per_day||Math.max(1,Math.floor(24/med.dose_interval_hours)); }
  const total = activeMeds.reduce((s,m)=>s+exp(m),0);
  const taken = todayLogs.length;
  const pct = total > 0 ? taken/total : 0;
  const streak = calcStreak(logs, meds);
  const hour = today.getHours();
  const greeting = hour<12?"Good morning":"hour<17"?"Good afternoon":"Good evening";

  return (
    <div className="scroll" style={{paddingTop:0}}>
      {/* Hero */}
      <div className="hero-card" style={{margin:"16px 16px 12px"}}>
        <div className="hero-label">{today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div className="hero-big">{taken}<span style={{fontSize:28,fontWeight:500,opacity:.7}}>/{total}</span></div>
            <div className="hero-sub">doses taken today</div>
          </div>
          <Ring pct={pct} size={84} color="rgba(255,255,255,.9)" stroke={7}/>
        </div>
        <div className="hero-row">
          <div className="hero-stat"><div className="hero-stat-val">{activeMeds.length}</div><div className="hero-stat-lbl">Active meds</div></div>
          <div className="hero-stat"><div className="hero-stat-val">🔥 {streak}</div><div className="hero-stat-lbl">{streak===1?"day":"days"} streak</div></div>
          <div className="hero-stat"><div className="hero-stat-val">{Math.max(0,total-taken)}</div><div className="hero-stat-lbl">remaining</div></div>
        </div>
      </div>

      {/* Notif banner */}
      {notifPerm==="default" && (
        <div className="notif-banner" onClick={onEnableNotif}>
          <div className="notif-banner-text">🔔 Enable reminders so you never miss a dose</div>
          <button className="notif-banner-btn">Enable</button>
        </div>
      )}

      {/* Dose list */}
      <div className="section">
        <div className="section-header">Today's medications</div>
        {activeMeds.length===0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💊</div>
            <div className="empty-state-title">No medications yet</div>
            <div className="empty-state-sub">Add your first medication to start tracking</div>
            <button className="btn btn-primary" style={{width:"auto",padding:"12px 24px"}} onClick={onAdd}>+ Add medication</button>
          </div>
        ) : (
          <div className="list">
            {activeMeds.map((med,i) => {
              const t = todayLogs.filter(l=>l.medication_id===med.id).length;
              const e = exp(med);
              const done = t>=e;
              return (
                <div key={med.id} className="row" style={{cursor:"default"}}>
                  <div className="row-icon" style={{background:done?"#D1FAE5":"#EFF6FF",fontSize:20}}>
                    {done?"✅":"💊"}
                  </div>
                  <div className="row-body">
                    <div className="row-title" style={{fontWeight:500}}>{med.name}</div>
                    <div className="row-sub">{med.dosage_amount} {med.dosage_unit} · {e}× daily</div>
                    <div className="prog"><div className="prog-fill" style={{width:`${Math.min(t/e,1)*100}%`,background:done?"var(--teal2)":"var(--teal)"}}/></div>
                    <div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>{t} of {e} doses taken</div>
                  </div>
                  <button className={`btn btn-green btn-sm${done?" btn-disabled":""}`} style={{flexShrink:0}} onClick={()=>onLog(med)} disabled={done}>
                    {done?"Done ✓":"Log"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent logs */}
      {todayLogs.length>0 && (
        <div className="section">
          <div className="section-header">Logged today</div>
          <div className="list">
            {todayLogs.slice(0,5).map(log=>(
              <div key={log.id} className="row" style={{cursor:"default"}}>
                <div className="row-icon" style={{background:"#D1FAE5"}}>✅</div>
                <div className="row-body"><div className="row-title">{log.medications?.name||"Med"}</div></div>
                <div className="row-value">{fmtTime(log.taken_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MEDICATIONS TAB ──────────────────────────────────────────────────────────
function MedsTab({ meds, logs, onAdd, onEdit, onDelete, reminderLead, plan }) {
  const today = new Date();
  const active = meds.filter(m=>{const e=new Date(m.start_date);e.setDate(e.getDate()+m.course_duration_days);return e>=today&&m.active;});
  const ended = meds.filter(m=>{const e=new Date(m.start_date);e.setDate(e.getDate()+m.course_duration_days);return e<today||!m.active;});

  function progress(med) { return Math.min(Math.max(0,Math.floor((today-new Date(med.start_date))/86400000)),med.course_duration_days); }

  function MedCard({ med }) {
    const endDate = new Date(med.start_date); endDate.setDate(endDate.getDate()+med.course_duration_days);
    const isActive = endDate>=today&&med.active;
    const prog = progress(med);
    const pct = prog/med.course_duration_days;
    const todayStr = today.toISOString().split("T")[0];
    const takenToday = logs.filter(l=>l.medication_id===med.id&&l.taken_at?.startsWith(todayStr)).length;
    const exp = med.times_per_day||1;
    return (
      <div style={{background:"var(--card)",borderRadius:"var(--rl)",padding:"16px",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{fontSize:17,fontWeight:600,marginBottom:3}}>{med.name}</div>
            <div style={{fontSize:14,color:"var(--t3)"}}>{med.dosage_amount} {med.dosage_unit} · {exp}× daily</div>
          </div>
          <span className={`badge ${isActive?"badge-green":"badge-gray"}`}>{isActive?"Active":"Ended"}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[["Course",`${med.course_duration_days}d`],["Taken today",`${takenToday}/${exp}`],["Ends",fmtDate(endDate.toISOString())]].map(([l,v])=>(
            <div key={l} style={{background:"var(--bg)",borderRadius:10,padding:"8px 10px"}}>
              <div style={{fontSize:11,color:"var(--t3)",fontWeight:500,marginBottom:2}}>{l}</div>
              <div style={{fontSize:14,fontWeight:600}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:12,color:"var(--t3)",marginBottom:4}}>Day {prog} of {med.course_duration_days}</div>
        <div className="prog"><div className="prog-fill" style={{width:`${pct*100}%`,background:isActive?"var(--teal)":"var(--t4)"}}/></div>
        {med.notes&&<div style={{fontSize:13,color:"var(--t3)",marginTop:8}}>📝 {med.notes}</div>}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={()=>onEdit(med)}>Edit</button>
          <button className="btn btn-sm" style={{flex:1,background:"#FEE2E2",color:"var(--red)",border:"none"}} onClick={()=>onDelete(med.id)}>Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px 0"}}>
        <div className="nav-large" style={{padding:0,paddingTop:8}}>Medications</div>
        <button className="nav-action" onClick={onAdd} style={{fontSize:28,lineHeight:1}}>＋</button>
      </div>

      <div className="chips" style={{marginTop:12}}>
        <div className="chip blue"><div className="chip-val">{meds.length}</div><div className="chip-lbl">Total</div></div>
        <div className="chip green"><div className="chip-val">{active.length}</div><div className="chip-lbl">Active</div></div>
        <div className="chip"><div className="chip-val">{ended.length}</div><div className="chip-lbl">Completed</div></div>
      </div>

      {active.length>0&&<div className="section"><div className="section-header">Active</div>{active.map(m=><MedCard key={m.id} med={m}/>)}</div>}
      {ended.length>0&&<div className="section"><div className="section-header">Completed</div>{ended.map(m=><MedCard key={m.id} med={m}/>)}</div>}
      {meds.length===0&&(
        <div className="empty-state" style={{paddingTop:60}}>
          <div className="empty-state-icon">💊</div>
          <div className="empty-state-title">No medications yet</div>
          <div className="empty-state-sub">Tap + to add your first medication</div>
        </div>
      )}
    </div>
  );
}

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────
function HistoryTab({ logs, meds }) {
  const streak = calcStreak(logs, meds);
  const grouped = {};
  logs.forEach(l => {
    const d = l.taken_at?.split("T")[0];
    if (d) { if (!grouped[d]) grouped[d]=[]; grouped[d].push(l); }
  });
  const days = Object.keys(grouped).sort().reverse().slice(0,30);

  return (
    <div className="scroll">
      <div className="nav-large">History</div>

      <div className="chips">
        <div className="chip orange"><div className="chip-val">🔥{streak}</div><div className="chip-lbl">Day streak</div></div>
        <div className="chip blue"><div className="chip-val">{logs.length}</div><div className="chip-lbl">Total doses</div></div>
        <div className="chip green"><div className="chip-val">{days.length}</div><div className="chip-lbl">Days tracked</div></div>
      </div>

      {days.length===0?(
        <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No history yet</div><div className="empty-state-sub">Your dose logs will appear here</div></div>
      ):days.map(d=>(
        <div key={d} className="section">
          <div className="section-header">{fmtDateLong(d+"T12:00:00")}</div>
          <div className="list">
            {grouped[d].map(log=>(
              <div key={log.id} className="row" style={{cursor:"default"}}>
                <div style={{fontSize:20}}>💊</div>
                <div className="row-body"><div className="row-title">{log.medications?.name||"Medication"}</div></div>
                <div className="row-value" style={{fontSize:14}}>{fmtTime(log.taken_at)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────
function UpgradeModal({ country, currentPlan, onClose, onUpgrade }) {
  const [selected, setSelected] = useState("pro");
  const { pricing } = getPricing(country || "GH");
  const selCountry = COUNTRIES.find(c => c.code === (country || "GH")) || COUNTRIES[0];

  const plans = [
    {
      id: "pro",
      name: "Pro",
      icon: "⭐",
      color: "#0A84FF",
      price: pricing.pro.label,
      period: "/month",
      tagline: "Everything you need for full adherence",
      features: [
        "✓ Unlimited medications",
        "✓ Full history & analytics",
        "✓ Caregiver sharing",
        "✓ Refill reminders",
        "✓ Drug interaction checker",
        "✓ PDF adherence reports",
        "✓ Priority support",
      ],
    },
    {
      id: "family",
      name: "Family",
      icon: "👨‍👩‍👧",
      color: "#AF52DE",
      price: pricing.family.label,
      period: "/month",
      tagline: "One account for the whole household",
      features: [
        "✓ Everything in Pro",
        "✓ Up to 5 family profiles",
        "✓ Shared family dashboard",
        "✓ Per-member medication tracking",
        "✓ Doctor-friendly PDF summaries",
        "✓ Caregiver mode with alerts",
      ],
    },
  ];

  const plan = plans.find(p => p.id === selected);

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{maxHeight:"95vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 8px",textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:4}}>✨</div>
          <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Upgrade MediTrack</div>
          <div style={{fontSize:14,color:"var(--t3)"}}>
            {selCountry.flag} {selCountry.name} pricing · {pricing.pro.note || "Local rates"}
          </div>
        </div>

        {/* Plan selector */}
        <div style={{display:"flex",gap:10,padding:"12px 16px"}}>
          {plans.map(p => (
            <div
              key={p.id}
              onClick={() => setSelected(p.id)}
              style={{
                flex:1, borderRadius:14, padding:"14px 12px", cursor:"pointer", textAlign:"center",
                border:`2px solid ${selected===p.id ? p.color : "var(--sep)"}`,
                background: selected===p.id ? `${p.color}10` : "white",
                transition:"all .15s",
              }}
            >
              <div style={{fontSize:24,marginBottom:4}}>{p.icon}</div>
              <div style={{fontWeight:700,fontSize:15,color:selected===p.id?p.color:"var(--t1)"}}>{p.name}</div>
              <div style={{fontSize:17,fontWeight:800,color:selected===p.id?p.color:"var(--t2)",marginTop:4}}>
                {p.price}
              </div>
              <div style={{fontSize:11,color:"var(--t3)"}}>{p.period}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{padding:"8px 20px 16px"}}>
          <div style={{fontSize:14,color:"var(--t3)",marginBottom:10}}>{plan.tagline}</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {plan.features.map(f => (
              <div key={f} style={{fontSize:15,color:"var(--t1)",display:"flex",alignItems:"center",gap:8}}>
                <span style={{color:"var(--teal2)",fontWeight:700,flexShrink:0}}>✓</span>
                <span>{f.replace("✓ ","")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{padding:"8px 16px",borderTop:"1px solid var(--sep)"}}>
          <button
            className="btn"
            style={{
              width:"100%", marginBottom:10,
              background: plan.color, color:"white",
              fontSize:16, fontWeight:700,
            }}
            onClick={() => onUpgrade(selected)}
          >
            Get {plan.name} · {plan.price}/month
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Maybe later</button>
          <div style={{fontSize:11,color:"var(--t3)",textAlign:"center",marginTop:10,lineHeight:1.5}}>
            Cancel anytime. Secure payment. Prices shown in local currency.
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user, profile, onSignOut, onSaveProfile }) {
  const [notifPerm, setNotifPerm] = useState("default");
  const [reminderLead, setReminderLead] = useState(profile?.reminder_lead || 30);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => { if ("Notification" in window) setNotifPerm(Notification.permission); }, []);

  async function enableNotifs() {
    const p = await askNotifPerm();
    setNotifPerm(p);
  }

  function handleUpgrade(plan) {
    // In production: open payment gateway (Paystack for Africa, Stripe elsewhere)
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

  return (
    <div className="scroll">
      <style>{CSS}</style>

      {/* Profile header */}
      <div className="profile-header">
        <div className="profile-avatar">{profile?.avatar_emoji || "😊"}</div>
        <div className="profile-name">{profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0]}</div>
        <div style={{fontSize:14,color:planColor,fontWeight:600,marginTop:2}}>{planLabel}</div>
        <div style={{fontSize:13,color:"var(--t3)",marginTop:2}}>{selCountry.flag} {selCountry.name}</div>
      </div>

      {/* Upgrade card (free users only) */}
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

      {/* Pro / Family features list */}
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
                <div className="row-icon" style={{background:"#EFF6FF",fontSize:18}}>{icon}</div>
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

      {/* Notifications */}
      <div className="section">
        <div className="section-header">Notifications</div>
        <div className="list">
          <div className="row" style={{cursor:"default"}}>
            <div className="row-icon" style={{background:"#FEF3C7",fontSize:18}}>🔔</div>
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
              <div className="row-icon" style={{background:"#EFF6FF",fontSize:18}}>⏱</div>
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

      {/* Account */}
      <div className="section">
        <div className="section-header">Account</div>
        <div className="list">
          <div className="row" style={{cursor:"default"}}>
            <div className="row-icon" style={{background:"#EFF6FF",fontSize:18}}>📧</div>
            <div className="row-body"><div className="row-title">Email</div><div className="row-sub">{user?.email}</div></div>
          </div>
          <div className="row" style={{cursor:"default"}}>
            <div className="row-icon" style={{background:"#F3E8FF",fontSize:18}}>🌍</div>
            <div className="row-body"><div className="row-title">Country</div><div className="row-sub">{selCountry.flag} {selCountry.name}</div></div>
          </div>
          <div className="row" style={{cursor:"default"}}>
            <div className="row-icon" style={{background:"#F0FDF4",fontSize:18}}>📋</div>
            <div className="row-body"><div className="row-title">Health condition</div><div className="row-sub">{profile?.condition || "Not set"}</div></div>
          </div>
          <div className="row" onClick={onSignOut} style={{cursor:"pointer"}}>
            <div className="row-icon" style={{background:"#FEE2E2",fontSize:18}}>🚪</div>
            <div className="row-body"><div className="row-title" style={{color:"var(--red)"}}>Sign out</div></div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="section">
        <div className="section-header">About</div>
        <div className="list">
          <div className="row" style={{cursor:"default"}}><div className="row-body"><div className="row-title">MediTrack</div><div className="row-sub">Version 1.0.0</div></div></div>
          <div className="row"><div className="row-body"><div className="row-title">Privacy Policy</div></div><Chevron/></div>
          <div className="row"><div className="row-body"><div className="row-title">Terms of Service</div></div><Chevron/></div>
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          country={country}
          currentPlan={plan}
          onClose={() => setShowUpgrade(false)}
          onUpgrade={handleUpgrade}
        />
      )}
    </div>
  );
}


// ─── Main App ─────────────────────────────────────────────────────────────────
function MainApp({ user, profile: initProfile, onSignOut }) {
  const [tab, setTab] = useState("today");
  const [meds, setMeds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [profile, setProfile] = useState(initProfile);
  const [notifPerm, setNotifPerm] = useState("default");

  useEffect(() => { if ("Notification" in window) setNotifPerm(Notification.permission); }, []);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [mr, lr] = await Promise.all([
        sb.from("medications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        sb.from("dose_logs").select("*, medications(name)").eq("user_id", user.id).order("taken_at", { ascending: false }).limit(300),
      ]);
      if (Array.isArray(mr.data)) setMeds(mr.data);
      if (Array.isArray(lr.data)) setLogs(lr.data);
    } catch (e) {
      console.error("load() error:", e?.message || e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (meds.length) scheduleNotifs(meds, profile?.reminder_lead||30); }, [meds, profile?.reminder_lead]);

  async function logDose(med) {
    if (!user?.id) return;
    try {
      const { error } = await sb.from("dose_logs").insert([{
        user_id: user.id,
        medication_id: med.id,
        taken_at: new Date().toISOString(),
      }]);
      if (error) {
        console.error("Log dose error:", error?.message || error);
        return;
      }
      load();
    } catch (e) {
      console.error("Log dose exception:", e?.message || e);
    }
  }

  async function deleteMed(id) {
    if (!user?.id) return;
    if (!confirm("Delete this medication and all its history?")) return;
    try {
      await sb.from("dose_logs").eq("medication_id", id).delete();
      await sb.from("medications").eq("id", id).delete();
      load();
    } catch (e) {
      console.error("deleteMed error:", e?.message || e);
    }
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
    const p = await askNotifPerm();
    setNotifPerm(p);
    if (p==="granted") scheduleNotifs(meds, profile?.reminder_lead||30);
  }

  const tabs = [
    { id:"today", label:"Today", icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:24,height:24}}><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg> },
    { id:"medications", label:"Meds", icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:24,height:24}}><path d="M6.5 10h-2v5h2v-5zm4 0h-2v5h2v-5zm8.5 7H4v2h15v-2zm-4.5-7h-2v5h2v-5zM11.5 1L2 6v2h19V6l-9.5-5z"/></svg> },
    { id:"history", label:"History", icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:24,height:24}}><path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8H12z"/></svg> },
    { id:"profile", label:"Profile", icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:24,height:24}}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> },
  ];

  if (loading) return <div className="loading-screen"><style>{CSS}</style>💊</div>;

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      <style>{CSS}</style>

      <div style={{paddingBottom:"calc(49px + env(safe-area-inset-bottom,0px))"}}>
        {tab==="today" && <TodayTab user={user} profile={profile} meds={meds} logs={logs} onLog={logDose} onAdd={()=>setShowAdd(true)} notifPerm={notifPerm} onEnableNotif={enableNotif}/>}
        {tab==="medications" && <MedsTab meds={meds} logs={logs} onAdd={()=>setShowAdd(true)} onEdit={setEditMed} onDelete={deleteMed} reminderLead={profile?.reminder_lead||30} plan={profile?.plan||"free"}/>}
        {tab==="history" && <HistoryTab logs={logs} meds={meds}/>}
        {tab==="profile" && <ProfileTab user={user} profile={profile} onSignOut={onSignOut} onSaveProfile={saveProfile}/>}
      </div>

      <div className="tabbar">
        {tabs.map(t=>(
          <div key={t.id} className={`tbi${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
            {t.icon}<span>{t.label}</span>
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
          onSave={()=>{setShowAdd(false);setEditMed(null);load();}}
          onClose={()=>{setShowAdd(false);setEditMed(null);}}
        />
      )}
    </div>
  );
}

// ─── Transition Screen ───────────────────────────────────────────────────────
// ─── Transition / Splash Screen ───────────────────────────────────────────────
function TransitionScreen({ emoji, message, sub }) {
  return (
    <div className="trans-screen">
      <style>{CSS}</style>
      <div style={{position:"absolute",top:-80,right:-80,width:280,height:280,background:"rgba(255,255,255,.07)",borderRadius:"50%"}}/>
      <div style={{position:"absolute",bottom:-60,left:-60,width:200,height:200,background:"rgba(255,255,255,.05)",borderRadius:"50%"}}/>
      <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div className="trans-logo">
          <svg viewBox="0 0 24 24" fill="white" width={48} height={48}>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-4H6v-2h4V7h2v4h4v2h-4v4z"/>
          </svg>
        </div>
        <div className="trans-title">MediTrack</div>
        <div style={{marginTop:32,marginBottom:8,fontSize:44}}>{emoji || "💊"}</div>
        <div className="trans-msg" style={{fontSize:22,fontWeight:700,marginBottom:6}}>{message || "Loading…"}</div>
        {sub && <div style={{fontSize:15,color:"rgba(255,255,255,.75)",textAlign:"center",padding:"0 40px",lineHeight:1.5}}>{sub}</div>}
        <div className="trans-dots" style={{marginTop:40}}>
          <div className="trans-dot"/><div className="trans-dot"/><div className="trans-dot"/>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  // screen: "splash" | "auth" | "onboarding" | "app"
  const [screen, setScreen]   = useState("splash");
  const [user,   setUser]     = useState(null);
  const [profile,setProfile]  = useState(null);
  const [splash, setSplash]   = useState({ emoji:"💊", message:"MediTrack", sub:"Loading…" });

  // ── Helpers ────────────────────────────────────────────────────────────────
  async function resolveUser() {
    const { data } = await sb.auth.getUser();
    return data?.user ?? null;
  }

  async function go(u) {
    if (!u) { setScreen("auth"); return; }
    setUser(u);
    const displayName = u.user_metadata?.full_name?.split(" ")[0] || u.email?.split("@")[0] || "";
    setSplash({ emoji:"👋", message: displayName ? `Hey, ${displayName}!` : "Welcome back!", sub:"Loading your medications…" });
    const prof = await fetchProfile(u.id, u.user_metadata);
    setProfile(prof);
    // Brief pause so the splash message is readable
    await new Promise(r => setTimeout(r, 900));
    setScreen(prof?.onboarded ? "app" : "onboarding");
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Hard timeout — NEVER stay on splash longer than 5s no matter what
    const escape = setTimeout(() => setScreen("auth"), 5000);

    resolveUser()
      .then(u => go(u))
      .catch(() => setScreen("auth"))
      .finally(() => clearTimeout(escape));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth callback ──────────────────────────────────────────────────────────
  async function handleAuth(u, isNew = false) {
    setUser(u);
    setSplash({
      emoji: isNew ? "🎉" : "👋",
      message: isNew ? "Account created!" : "Welcome back!",
      sub: isNew ? "Setting up your experience…" : "Loading your medications…",
    });
    setScreen("splash");
    try {
      const prof = await fetchProfile(u.id);
      setProfile(prof);
      await new Promise(r => setTimeout(r, 900));
      setScreen(isNew || !prof?.onboarded ? "onboarding" : "app");
    } catch {
      await new Promise(r => setTimeout(r, 900));
      setScreen(isNew ? "onboarding" : "app");
    }
  }

  // ── Onboarding done ────────────────────────────────────────────────────────
  async function handleOnboardDone(prefs) {
    setProfile(p => ({ ...p, ...prefs, onboarded: true }));
    setSplash({ emoji:"🌟", message:"You're all set!", sub:"Your MediTrack is ready" });
    setScreen("splash");
    await new Promise(r => setTimeout(r, 1200));
    setScreen("app");
  }

  // ── Sign out ───────────────────────────────────────────────────────────────
  async function handleSignOut() {
    await sb.auth.signOut();
    setUser(null); setProfile(null); setScreen("auth");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (screen === "splash")     return <TransitionScreen {...splash} />;
  if (screen === "auth")       return <AuthScreen onAuth={handleAuth} />;
  if (screen === "onboarding") return <Onboarding user={user} profile={profile} onDone={handleOnboardDone} />;
  if (!user)                   return <TransitionScreen emoji="💊" message="MediTrack" sub="Loading…" />;
  return <MainApp user={user} profile={profile} onSignOut={handleSignOut} />;
}