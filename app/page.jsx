"use client";
import { useState, useEffect, useCallback, useRef } from "react";

// ─── Supabase Configuration ───────────────────────────────────────────────────
const SUPABASE_URL = "https://luxtopkzdyflbejwgniq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1eHRvcGt6ZHlmbGJlandnbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY5NzAsImV4cCI6MjA5NzkxMjk3MH0.zcvzd5vOBxw6xE00EIrt7NBcEnFa95FxODsD2h1M-OU";

// ─── SQL MIGRATION (run this in Supabase SQL Editor if upgrading) ─────────────
/*
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS times_per_day integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS reminder_minutes integer NOT NULL DEFAULT 30;
*/

// ─── Supabase Client ──────────────────────────────────────────────────────────
function createClient(url, key) {
  let token = key;
  const subs = [];

  const hdr = (extra = {}) => ({
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${token}`,
    ...extra,
  });

  async function safeJson(r) {
    const text = await r.text().catch(() => "");
    if (!text || !text.trim()) return null;
    try { return JSON.parse(text); } catch { return null; }
  }

  async function api(path, opts = {}) {
    const r = await fetch(url + path, { ...opts, headers: { ...hdr(), ...(opts.headers || {}) } });
    if (!r.ok) {
      const e = await safeJson(r) || {};
      throw new Error(e.message || e.error_description || e.msg || r.statusText || `HTTP ${r.status}`);
    }
    if (r.status === 204) return null;
    return safeJson(r);
  }

  function persist(d) {
    if (d?.access_token) {
      token = d.access_token;
      try {
        localStorage.setItem("mt_at", d.access_token);
        if (d.refresh_token) localStorage.setItem("mt_rt", d.refresh_token);
      } catch {}
    }
    return d?.user ?? null;
  }

  function fire(u) { subs.forEach(fn => fn(u)); }

  // Parse OAuth tokens from URL hash (implicit flow)
  function consumeHash() {
    if (typeof window === "undefined") return null;
    const h = window.location.hash.slice(1);
    if (!h) return null;
    const p = new URLSearchParams(h);
    const at = p.get("access_token");
    if (!at) return null;
    token = at;
    try {
      localStorage.setItem("mt_at", at);
      const rt = p.get("refresh_token");
      if (rt) localStorage.setItem("mt_rt", rt);
    } catch {}
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return at;
  }

  const auth = {
    async signUp({ email, password, options }) {
      try {
        const d = await api("/auth/v1/signup", {
          method: "POST",
          body: JSON.stringify({ email, password, data: options?.data }),
        });
        const u = persist(d) ?? d?.user ?? null;
        fire(u);
        return { data: { user: u, session: d }, error: null };
      } catch (e) { return { data: null, error: e }; }
    },

    async signInWithPassword({ email, password }) {
      try {
        const d = await api("/auth/v1/token?grant_type=password", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const u = persist(d);
        fire(u);
        return { data: { user: u, session: d }, error: null };
      } catch (e) { return { data: null, error: e }; }
    },

    signInWithOAuth({ provider }) {
      const redirectTo = window.location.origin + window.location.pathname;
      window.location.href =
        `${url}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
    },

    async getUser() {
      consumeHash(); // absorb OAuth redirect tokens first
      const saved = (() => { try { return localStorage.getItem("mt_at"); } catch { return null; } })();
      if (!saved) return { data: { user: null }, error: null };
      token = saved;
      try {
        const u = await api("/auth/v1/user");
        return { data: { user: u }, error: null };
      } catch {
        // try refresh
        const rt = (() => { try { return localStorage.getItem("mt_rt"); } catch { return null; } })();
        if (rt) {
          try {
            const d = await api("/auth/v1/token?grant_type=refresh_token", {
              method: "POST", body: JSON.stringify({ refresh_token: rt }),
            });
            persist(d);
            return { data: { user: d.user }, error: null };
          } catch {}
        }
        try { localStorage.removeItem("mt_at"); localStorage.removeItem("mt_rt"); } catch {}
        token = key;
        return { data: { user: null }, error: null };
      }
    },

    async signOut() {
      try { await api("/auth/v1/logout", { method: "POST" }); } catch {}
      token = key;
      try { localStorage.removeItem("mt_at"); localStorage.removeItem("mt_rt"); } catch {}
      fire(null);
    },

    onAuthStateChange(fn) {
      subs.push(fn);
      return { data: { subscription: { unsubscribe() { const i = subs.indexOf(fn); if (i > -1) subs.splice(i, 1); } } } };
    },
  };

  // ── Query builder — new instance per chain, no shared mutable state ──
  function from(table) {
    const state = { sel: "*", filters: [], orders: [], lim: null };

    const q = {
      select(c = "*") { state.sel = c; return q; },
      eq(col, val)    { state.filters.push(`${col}=eq.${encodeURIComponent(val)}`); return q; },
      order(col, { ascending = true } = {}) { state.orders.push(`${col}.${ascending ? "asc" : "desc"}`); return q; },
      limit(n)        { state.lim = n; return q; },

      _qs() {
        let s = `select=${state.sel}`;
        state.filters.forEach(f => { s += `&${f}`; });
        if (state.orders.length) s += `&order=${state.orders.join(",")}`;
        if (state.lim) s += `&limit=${state.lim}`;
        return s;
      },

      then(res, rej) {
        api(`/rest/v1/${table}?${q._qs()}`, { headers: { Prefer: "return=representation" } })
          .then(d => res({ data: d, error: null }))
          .catch(e => rej({ data: null, error: e }));
      },

      async insert(rows) {
        try {
          const d = await api(`/rest/v1/${table}`, {
            method: "POST",
            body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
            headers: { Prefer: "return=representation" },
          });
          return { data: d, error: null };
        } catch (e) { return { data: null, error: e }; }
      },

      async update(payload) {
        const fq = state.filters.join("&");
        try {
          const d = await api(`/rest/v1/${table}?${fq}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
            headers: { Prefer: "return=representation" },
          });
          return { data: d, error: null };
        } catch (e) { return { data: null, error: e }; }
      },

      async delete() {
        const fq = state.filters.join("&");
        try {
          await api(`/rest/v1/${table}?${fq}`, { method: "DELETE" });
          return { error: null };
        } catch (e) { return { error: e }; }
      },
    };
    return q;
  }

  return { auth, from };
}

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Push Notifications ───────────────────────────────────────────────────────
async function requestNotifPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const p = await Notification.requestPermission();
  return p;
}

function scheduleNotifications(meds, reminderMinutes) {
  // Cancel previous timers stored on window
  if (window._mtTimers) window._mtTimers.forEach(clearTimeout);
  window._mtTimers = [];
  if (Notification.permission !== "granted") return;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  meds.forEach(med => {
    if (!med.active) return;
    const end = new Date(med.start_date);
    end.setDate(end.getDate() + med.course_duration_days);
    if (end < now) return;

    const timesPerDay = med.times_per_day || Math.max(1, Math.floor(24 / med.dose_interval_hours));
    const intervalMs = (24 / timesPerDay) * 3600 * 1000;
    const startOfDay = new Date(todayStr + "T08:00:00"); // first dose at 8am

    for (let i = 0; i < timesPerDay; i++) {
      const doseTime = new Date(startOfDay.getTime() + i * intervalMs);
      const notifTime = new Date(doseTime.getTime() - reminderMinutes * 60 * 1000);
      const delay = notifTime - now;
      if (delay < 0) continue; // already past

      const t = setTimeout(() => {
        new Notification("💊 MediTrack Reminder", {
          body: `Time to take ${med.dosage_amount} ${med.dosage_unit} of ${med.name} in ${reminderMinutes} minute${reminderMinutes > 1 ? "s" : ""}.`,
          icon: "/favicon.ico",
          tag: `med-${med.id}-${i}`,
        });
      }, delay);
      window._mtTimers.push(t);
    }
  });
}

// ─── Streak Calculator ────────────────────────────────────────────────────────
function calcStreak(logs, meds) {
  if (!logs.length || !meds.length) return 0;
  let streak = 0;
  const today = new Date();

  for (let d = 0; d <= 365; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const ds = date.toISOString().split("T")[0];

    // Which meds were active that day?
    const activeThatDay = meds.filter(m => {
      const start = new Date(m.start_date);
      const end = new Date(m.start_date);
      end.setDate(end.getDate() + m.course_duration_days);
      return start <= date && end >= date && m.active;
    });

    if (activeThatDay.length === 0) { if (d === 0) continue; break; }

    // Did the user log at least one dose per med that day?
    const allTaken = activeThatDay.every(med => {
      const expected = med.times_per_day || Math.max(1, Math.floor(24 / med.dose_interval_hours));
      const taken = logs.filter(l => l.medication_id === med.id && l.taken_at?.startsWith(ds)).length;
      return taken >= expected;
    });

    if (allTaken) streak++;
    else if (d > 0) break; // gap — streak broken
  }
  return streak;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --t50:#E1F5EE;--t100:#9FE1CB;--t200:#5DCAA5;--t600:#0F6E56;--t700:#0c5c48;--t800:#085041;
  --s50:#F8FAFB;--s100:#EEF2F5;--s200:#DDE3EA;--s400:#94A3B8;--s600:#475569;--s700:#334155;--s900:#0F172A;
  --r50:#FEF2F2;--r600:#DC2626;--r800:#991B1B;
  --a50:#FFFBEB;--a600:#D97706;
  --g50:#F0FDF4;--g800:#166534;
  --rr:8px;--rm:12px;--rl:16px;--rxl:20px;
}
body{font-family:'Inter',-apple-system,sans-serif;background:var(--s50);color:var(--s900)}

/* ── Auth ── */
.aw{min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,var(--t50) 0%,white 60%);padding:1rem}
.ac{background:white;border-radius:var(--rxl);border:1px solid var(--s200);padding:2.5rem;width:100%;max-width:420px}
.alo{display:flex;align-items:center;gap:10px;margin-bottom:2rem}
.alm{width:40px;height:40px;background:var(--t600);border-radius:10px;display:grid;place-items:center}
.alm svg{fill:white;width:22px;height:22px}
.alt{font-size:1.25rem;font-weight:600}
.atitle{font-size:1.5rem;font-weight:700;margin-bottom:.25rem}
.asub{font-size:.875rem;color:var(--s600);margin-bottom:1.75rem}
.og{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.5rem}
.ob{display:flex;align-items:center;justify-content:center;gap:8px;padding:.625rem 1rem;border:1px solid var(--s200);border-radius:var(--rr);background:white;cursor:pointer;font-size:.875rem;font-weight:500;color:var(--s700);transition:all .15s;width:100%;font-family:inherit}
.ob:hover{background:var(--s50);border-color:var(--s400)}
.ob:disabled{opacity:.5;cursor:not-allowed}
.ob svg{width:18px;height:18px;flex-shrink:0}
.ob-full{grid-column:1/-1}
.dv{display:flex;align-items:center;gap:12px;margin-bottom:1.25rem;color:var(--s400);font-size:.8125rem}
.dv::before,.dv::after{content:'';flex:1;height:1px;background:var(--s200)}
.f{margin-bottom:1rem}
.f label{display:block;font-size:.8125rem;font-weight:500;color:var(--s700);margin-bottom:.375rem}
.f input,.f select,.f textarea{width:100%;padding:.625rem .875rem;border:1px solid var(--s200);border-radius:var(--rr);font-size:.9375rem;color:var(--s900);background:white;transition:border-color .15s;font-family:inherit}
.f input:focus,.f select:focus,.f textarea:focus{outline:none;border-color:var(--t600);box-shadow:0 0 0 3px rgba(15,110,86,.12)}
.bp{width:100%;padding:.75rem;background:var(--t600);color:white;border:none;border-radius:var(--rr);font-size:.9375rem;font-weight:500;cursor:pointer;transition:background .15s;font-family:inherit}
.bp:hover{background:var(--t700)}
.bp:disabled{opacity:.6;cursor:not-allowed}
.aswitch{text-align:center;margin-top:1.25rem;font-size:.875rem;color:var(--s600)}
.aswitch button{background:none;border:none;color:var(--t600);font-weight:500;cursor:pointer;font-size:.875rem}
.err{background:var(--r50);border:1px solid #FCA5A5;color:var(--r800);padding:.75rem 1rem;border-radius:var(--rr);font-size:.875rem;margin-bottom:1rem}
.ok{background:var(--g50);border:1px solid #86EFAC;color:var(--g800);padding:1rem;border-radius:var(--rr);font-size:.875rem;margin-bottom:1rem;line-height:1.5}
.ok strong{display:block;margin-bottom:.25rem;font-size:.9375rem}

/* ── Shell ── */
.tb{background:white;border-bottom:1px solid var(--s200);padding:0 1.5rem;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
.tbr{display:flex;align-items:center;gap:12px}
.tbb{display:flex;align-items:center;gap:8px;font-weight:600;font-size:1.0625rem}
.bd{width:28px;height:28px;background:var(--t600);border-radius:7px;display:grid;place-items:center}
.bd svg{fill:white;width:16px;height:16px}
.av{width:34px;height:34px;border-radius:50%;background:var(--t50);border:1.5px solid var(--t200);display:grid;place-items:center;font-size:.8125rem;font-weight:600;color:var(--t800)}
.sob{font-size:.8125rem;color:var(--s600);background:none;border:1px solid var(--s200);border-radius:6px;padding:.375rem .75rem;cursor:pointer}
.sob:hover{background:var(--s50)}
.main{max-width:800px;margin:0 auto;padding:1.75rem 1rem 4rem;width:100%}

/* ── Stats ── */
.sh{margin-bottom:1.5rem}
.sd{font-size:.8125rem;color:var(--s600);margin-bottom:.25rem}
.stitle{font-size:1.5rem;font-weight:700}
.sr{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:1.75rem}
.sc{background:white;border:1px solid var(--s200);border-radius:var(--rm);padding:1rem 1.25rem}
.sl{font-size:.75rem;color:var(--s600);margin-bottom:.375rem;text-transform:uppercase;letter-spacing:.05em;font-weight:500}
.sv{font-size:1.625rem;font-weight:700;color:var(--s900)}
.sv.teal{color:var(--t600)}
.sv.gold{color:var(--a600)}

/* ── Ring ── */
.rc{background:white;border:1px solid var(--s200);border-radius:var(--rl);padding:1.5rem;margin-bottom:1.75rem;display:flex;align-items:center;gap:1.5rem}
.rw{flex-shrink:0;position:relative;width:90px;height:90px}
.rw svg{transform:rotate(-90deg)}
.rt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.rn{font-size:1.25rem;font-weight:700;color:var(--t600)}
.ro{font-size:.6875rem;color:var(--s400)}
.rit{font-size:1rem;font-weight:600;margin-bottom:.25rem}
.ris{font-size:.875rem;color:var(--s600)}

/* ── Notif banner ── */
.nb{background:var(--a50);border:1px solid #FDE68A;border-radius:var(--rm);padding:1rem 1.25rem;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.nb-txt{font-size:.875rem;color:#92400E}
.nb-btn{background:var(--a600);color:white;border:none;border-radius:6px;padding:.4rem .875rem;font-size:.8125rem;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit}

/* ── Tabs ── */
.nt{display:flex;gap:4px;background:var(--s100);border-radius:var(--rr);padding:4px;margin-bottom:1.75rem}
.ntb{flex:1;padding:.5rem;border:none;background:none;border-radius:6px;font-size:.875rem;font-weight:500;color:var(--s600);cursor:pointer;transition:all .15s;font-family:inherit}
.ntb.on{background:white;color:var(--s900);box-shadow:0 1px 3px rgba(0,0,0,.1)}

/* ── Meds ── */
.sh2{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
.st2{font-size:1.0625rem;font-weight:600}
.ab{display:flex;align-items:center;gap:6px;background:var(--t600);color:white;border:none;border-radius:var(--rr);padding:.5rem 1rem;font-size:.875rem;font-weight:500;cursor:pointer;font-family:inherit}
.ab:hover{background:var(--t700)}
.mc{background:white;border:1px solid var(--s200);border-radius:var(--rm);padding:1.25rem;margin-bottom:12px;transition:box-shadow .15s}
.mc:hover{box-shadow:0 2px 12px rgba(0,0,0,.06)}
.mh{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:.875rem}
.mn{font-size:1rem;font-weight:600;margin-bottom:2px}
.md{font-size:.8125rem;color:var(--s600)}
.mb{font-size:.6875rem;font-weight:600;padding:3px 9px;border-radius:99px}
.mba{background:var(--t50);color:var(--t800);border:1px solid var(--t100)}
.mbe{background:var(--s100);color:var(--s600);border:1px solid var(--s200)}
.mm{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1rem}
.mi{background:var(--s50);border-radius:var(--rr);padding:.5rem .75rem}
.mil{font-size:.6875rem;color:var(--s400);font-weight:500;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px}
.miv{font-size:.875rem;font-weight:600;color:var(--s700)}
.ma{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.bl{background:var(--t600);color:white;border:none;border-radius:6px;padding:.5rem 1rem;font-size:.8125rem;font-weight:500;cursor:pointer;font-family:inherit}
.bl:hover{background:var(--t700)}
.bl:disabled{opacity:.4;cursor:not-allowed}
.bg{background:none;color:var(--s600);border:1px solid var(--s200);border-radius:6px;padding:.5rem .875rem;font-size:.8125rem;cursor:pointer;font-family:inherit}
.bg:hover{background:var(--s50)}
.bd2{background:none;color:var(--r600);border:1px solid #FCA5A5;border-radius:6px;padding:.5rem .875rem;font-size:.8125rem;cursor:pointer;font-family:inherit}
.bd2:hover{background:var(--r50)}
.pb{height:6px;background:var(--s100);border-radius:99px;overflow:hidden;margin-top:10px}
.pf{height:100%;border-radius:99px;transition:width .4s ease}
.pl{display:flex;justify-content:space-between;margin-bottom:4px}
.pt{font-size:.75rem;color:var(--s600)}

/* ── Modal ── */
.mo{position:fixed;inset:0;background:rgba(15,23,42,.45);display:grid;place-items:center;z-index:100;padding:1rem}
.md2{background:white;border-radius:var(--rxl);padding:2rem;width:100%;max-width:500px;max-height:90vh;overflow-y:auto}
.mdt{font-size:1.125rem;font-weight:600;margin-bottom:1.5rem}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.mda{display:flex;justify-content:flex-end;gap:10px;margin-top:1.5rem}

/* ── Notif Settings Modal ── */
.ns-row{display:flex;align-items:center;justify-content:space-between;padding:.75rem 0;border-bottom:1px solid var(--s100)}
.ns-label{font-size:.9375rem;color:var(--s900)}
.ns-sub{font-size:.8125rem;color:var(--s600);margin-top:2px}
.ns-select{padding:.4rem .75rem;border:1px solid var(--s200);border-radius:6px;font-size:.875rem;background:white;font-family:inherit}

/* ── History ── */
.li{display:flex;align-items:center;gap:12px;padding:.75rem 0;border-bottom:1px solid var(--s100)}
.ld{width:8px;height:8px;background:var(--t200);border-radius:50%;flex-shrink:0}
.ln{font-size:.9375rem;font-weight:500;flex:1}
.lt{font-size:.8125rem;color:var(--s400)}
.empty{text-align:center;padding:3rem 1rem;color:var(--s400)}
.empty p{margin-top:.5rem;font-size:.9375rem}
.ld2{display:flex;justify-content:center;padding:3rem;color:var(--s400)}

@media(max-width:600px){
  .sr{grid-template-columns:1fr 1fr}
  .sc:nth-child(3),.sc:nth-child(4){grid-column:auto}
  .mm{grid-template-columns:1fr 1fr}
  .fr{grid-template-columns:1fr}
  .og{grid-template-columns:1fr}
}
`;

// ─── Icons ────────────────────────────────────────────────────────────────────
const GIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const AIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.33.07 2.24.7 3.02.72.94-.17 1.84-.85 3.09-.91 1.58-.07 2.79.7 3.46 1.91-3.38 2.01-2.57 6.05.78 7.42-.47 1.17-.98 2.33-2.35 3.74zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);
const FIcon = () => (
  <svg viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [obl, setObl] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  async function oauth(provider) {
    setErr(""); setObl(provider);
    await new Promise(r => setTimeout(r, 80));
    sb.auth.signInWithOAuth({ provider });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      if (mode === "login") {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        if (!data?.user) throw new Error("Login failed — please check your credentials.");
        onAuth(data.user);
      } else {
        const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { full_name: name } } });
        if (error) throw error;
        if (data?.user?.identities?.length === 0) throw new Error("Email already registered — sign in instead.");
        if (data?.session?.access_token) onAuth(data.user);
        else setSent(true);
      }
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally { setBusy(false); }
  }

  if (sent) return (
    <div className="aw">
      <style>{CSS}</style>
      <div className="ac">
        <div className="alo"><div className="alm"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg></div><span className="alt">MediTrack</span></div>
        <div className="ok"><strong>Check your inbox 📬</strong>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.</div>
        <button className="bp" onClick={() => { setSent(false); setMode("login"); }}>Back to sign in</button>
      </div>
    </div>
  );

  return (
    <div className="aw">
      <style>{CSS}</style>
      <div className="ac">
        <div className="alo">
          <div className="alm"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg></div>
          <span className="alt">MediTrack</span>
        </div>
        <h1 className="atitle">{mode === "login" ? "Welcome back" : "Create account"}</h1>
        <p className="asub">{mode === "login" ? "Sign in to manage your medications" : "Start tracking your medications securely"}</p>

        <div className="og">
          <button className="ob" onClick={() => oauth("google")} disabled={!!obl}>{obl === "google" ? "Redirecting…" : <><GIcon /> Google</>}</button>
          <button className="ob" onClick={() => oauth("apple")} disabled={!!obl}>{obl === "apple" ? "Redirecting…" : <><AIcon /> Apple</>}</button>
          <button className="ob ob-full" onClick={() => oauth("facebook")} disabled={!!obl}>{obl === "facebook" ? "Redirecting…" : <><FIcon /> Continue with Facebook</>}</button>
        </div>

        <div className="dv">or continue with email</div>
        {err && <div className="err">{err}</div>}

        <form onSubmit={submit}>
          {mode === "signup" && <div className="f"><label>Full name</label><input type="text" placeholder="Jane Mensah" value={name} onChange={e => setName(e.target.value)} required /></div>}
          <div className="f"><label>Email address</label><input type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="f"><label>Password</label><input type="password" placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"} value={pw} onChange={e => setPw(e.target.value)} minLength={8} required /></div>
          <button className="bp" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>

        <div className="aswitch">
          {mode === "login"
            ? <>No account? <button onClick={() => { setMode("signup"); setErr(""); }}>Sign up free</button></>
            : <>Have an account? <button onClick={() => { setMode("login"); setErr(""); }}>Sign in</button></>}
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit Medication Modal ──────────────────────────────────────────────
function MedModal({ med, userId, onSave, onClose }) {
  const blank = {
    name: "", dosage_amount: "", dosage_unit: "tablet(s)",
    times_per_day: "1", dose_interval_hours: "8",
    course_duration_days: "", start_date: new Date().toISOString().split("T")[0],
    reminder_minutes: "30", notes: "",
  };
  const [f, setF] = useState(med ? {
    name: med.name, dosage_amount: String(med.dosage_amount),
    dosage_unit: med.dosage_unit, times_per_day: String(med.times_per_day || 1),
    dose_interval_hours: String(med.dose_interval_hours),
    course_duration_days: String(med.course_duration_days),
    start_date: med.start_date, reminder_minutes: String(med.reminder_minutes || 30),
    notes: med.notes || "",
  } : blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function set(k, v) {
    setF(p => {
      const n = { ...p, [k]: v };
      // Keep interval and times_per_day in sync
      if (k === "times_per_day" && v > 0) n.dose_interval_hours = String((24 / Number(v)).toFixed(1));
      if (k === "dose_interval_hours" && v > 0) n.times_per_day = String(Math.round(24 / Number(v)));
      return n;
    });
  }

  async function save() {
    if (!f.name.trim() || !f.dosage_amount || !f.course_duration_days) {
      setErr("Please fill in all required fields."); return;
    }
    setBusy(true); setErr("");
    const payload = {
      user_id: userId,
      name: f.name.trim(),
      dosage_amount: parseFloat(f.dosage_amount),
      dosage_unit: f.dosage_unit,
      times_per_day: parseInt(f.times_per_day) || 1,
      dose_interval_hours: parseFloat(f.dose_interval_hours),
      course_duration_days: parseInt(f.course_duration_days),
      start_date: f.start_date,
      reminder_minutes: parseInt(f.reminder_minutes),
      notes: f.notes,
      active: true,
    };

    let result;
    if (med?.id) {
      result = await sb.from("medications").eq("id", med.id).update(payload);
    } else {
      result = await sb.from("medications").insert([payload]);
    }

    if (result.error) { setErr(result.error.message); setBusy(false); return; }
    onSave();
  }

  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="md2">
        <div className="mdt">{med ? "Edit medication" : "Add new medication"}</div>
        {err && <div className="err">{err}</div>}

        <div className="f"><label>Medication name *</label>
          <input placeholder="e.g. Amoxicillin" value={f.name} onChange={e => set("name", e.target.value)} />
        </div>

        <div className="fr">
          <div className="f"><label>Dosage amount *</label>
            <input type="number" min="0.1" step="0.1" placeholder="e.g. 2" value={f.dosage_amount} onChange={e => set("dosage_amount", e.target.value)} />
          </div>
          <div className="f"><label>Unit</label>
            <select value={f.dosage_unit} onChange={e => set("dosage_unit", e.target.value)}>
              {["tablet(s)","capsule(s)","ml","mg","mcg","IU","drop(s)","puff(s)","patch(es)","injection(s)"].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="fr">
          <div className="f"><label>Times per day *</label>
            <input type="number" min="1" max="24" step="1" placeholder="e.g. 3" value={f.times_per_day} onChange={e => set("times_per_day", e.target.value)} />
          </div>
          <div className="f"><label>Hours between doses</label>
            <input type="number" min="0.5" step="0.5" placeholder="auto" value={f.dose_interval_hours} onChange={e => set("dose_interval_hours", e.target.value)} />
          </div>
        </div>

        <div className="fr">
          <div className="f"><label>Course duration (days) *</label>
            <input type="number" min="1" step="1" placeholder="e.g. 7" value={f.course_duration_days} onChange={e => set("course_duration_days", e.target.value)} />
          </div>
          <div className="f"><label>Start date</label>
            <input type="date" value={f.start_date} onChange={e => set("start_date", e.target.value)} />
          </div>
        </div>

        <div className="f"><label>Reminder — notify me before each dose</label>
          <select value={f.reminder_minutes} onChange={e => set("reminder_minutes", e.target.value)}>
            <option value="0">At dose time</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="120">2 hours before</option>
          </select>
        </div>

        <div className="f"><label>Notes (optional)</label>
          <textarea rows={2} placeholder="e.g. Take with food" value={f.notes} onChange={e => set("notes", e.target.value)} style={{ resize: "vertical" }} />
        </div>

        <div className="mda">
          <button className="bg" onClick={onClose}>Cancel</button>
          <button className="bl" onClick={save} disabled={busy}>{busy ? "Saving…" : med ? "Save changes" : "Add medication"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dose Ring ────────────────────────────────────────────────────────────────
function Ring({ taken, total }) {
  const r = 38, c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(taken / total, 1) : 0;
  return (
    <div className="rw">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--s100)" strokeWidth="8" />
        <circle cx="45" cy="45" r={r} fill="none"
          stroke={pct === 1 ? "var(--t600)" : "var(--t200)"} strokeWidth="8"
          strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray .5s ease, stroke .3s" }} />
      </svg>
      <div className="rt"><div className="rn">{taken}</div><div className="ro">of {total}</div></div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function MainApp({ user, onSignOut }) {
  const [tab, setTab] = useState("today");
  const [meds, setMeds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [notifPerm, setNotifPerm] = useState("default");
  const [globalReminder, setGlobalReminder] = useState(30);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) setNotifPerm(Notification.permission);
  }, []);

  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const fetch = useCallback(async () => {
    setLoading(true);
    const [mr, lr] = await Promise.all([
      sb.from("medications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      sb.from("dose_logs").select("*, medications(name)").eq("user_id", user.id).order("taken_at", { ascending: false }).limit(200),
    ]);
    if (mr.data) setMeds(mr.data);
    if (lr.data) setLogs(lr.data);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetch(); }, [fetch]);

  // Reschedule notifications whenever meds change
  useEffect(() => {
    if (meds.length) scheduleNotifications(meds, globalReminder);
  }, [meds, globalReminder]);

  async function enableNotifs() {
    const p = await requestNotifPermission();
    setNotifPerm(p);
    if (p === "granted") scheduleNotifications(meds, globalReminder);
  }

  const activeMeds = meds.filter(m => {
    if (!m.active) return false;
    const e = new Date(m.start_date); e.setDate(e.getDate() + m.course_duration_days);
    return e >= today;
  });

  const todayLogs = logs.filter(l => l.taken_at?.startsWith(todayStr));

  function expectedToday(med) {
    return med.times_per_day || Math.max(1, Math.floor(24 / med.dose_interval_hours));
  }

  const totalToday = activeMeds.reduce((s, m) => s + expectedToday(m), 0);
  const takenToday = todayLogs.length;
  const streak = calcStreak(logs, meds);

  async function logDose(med) {
    const { error } = await sb.from("dose_logs").insert([{
      user_id: user.id, medication_id: med.id,
      taken_at: new Date().toISOString(), scheduled_at: new Date().toISOString(),
    }]);
    if (!error) fetch();
  }

  async function delMed(id) {
    if (!confirm("Delete this medication and all its history?")) return;
    await sb.from("dose_logs").eq("medication_id", id).delete();
    await sb.from("medications").eq("id", id).delete();
    fetch();
  }

  function progress(med) {
    const days = Math.floor((today - new Date(med.start_date)) / 86400000);
    return Math.min(Math.max(0, days), med.course_duration_days);
  }

  function takenMed(medId) { return todayLogs.filter(l => l.medication_id === medId).length; }
  function fmtTime(iso) { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  function fmtDate(iso) { return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" }); }

  return (
    <>
      <div className="tb">
        <div className="tbb">
          <div className="bd"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-4H6v-2h4V7h2v4h4v2h-4v4z"/></svg></div>
          MediTrack
        </div>
        <div className="tbr">
          <div className="av" title={user?.email}>{initials}</div>
          <button className="sob" onClick={onSignOut}>Sign out</button>
        </div>
      </div>

      <div className="main">
        <div className="sh">
          <div className="sd">{today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          <div className="stitle">Good {today.getHours() < 12 ? "morning" : today.getHours() < 17 ? "afternoon" : "evening"} 👋</div>
        </div>

        {/* Notification permission banner */}
        {notifPerm === "default" && (
          <div className="nb">
            <div className="nb-txt">🔔 Enable push notifications to get reminded before each dose</div>
            <button className="nb-btn" onClick={enableNotifs}>Enable reminders</button>
          </div>
        )}

        <div className="sr">
          <div className="sc"><div className="sl">Active meds</div><div className="sv teal">{activeMeds.length}</div></div>
          <div className="sc"><div className="sl">Taken today</div><div className="sv teal">{takenToday}</div></div>
          <div className="sc"><div className="sl">Remaining</div><div className="sv">{Math.max(0, totalToday - takenToday)}</div></div>
          <div className="sc"><div className="sl">🔥 Streak</div><div className="sv gold">{streak} day{streak !== 1 ? "s" : ""}</div></div>
        </div>

        <div className="rc">
          <Ring taken={takenToday} total={totalToday} />
          <div>
            <div className="rit">
              {takenToday === totalToday && totalToday > 0
                ? "All doses taken today! 🎉"
                : totalToday === 0 ? "No doses scheduled"
                : `${takenToday} of ${totalToday} doses taken`}
            </div>
            <div className="ris">
              {totalToday - takenToday > 0
                ? `${totalToday - takenToday} dose${totalToday - takenToday > 1 ? "s" : ""} remaining today`
                : activeMeds.length === 0 ? "Add a medication to get started"
                : streak > 0 ? `${streak}-day streak — keep it up!` : "Great job staying on track!"}
            </div>
            {notifPerm === "granted" && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: ".8125rem", color: "var(--s600)" }}>Global reminder:</span>
                <select
                  className="ns-select"
                  value={globalReminder}
                  onChange={e => setGlobalReminder(Number(e.target.value))}
                >
                  <option value={0}>At dose time</option>
                  <option value={15}>15 min before</option>
                  <option value={30}>30 min before</option>
                  <option value={60}>1 hr before</option>
                  <option value={120}>2 hrs before</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="nt">
          {["today", "medications", "history"].map(t => (
            <button key={t} className={`ntb${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>
              {t === "today" ? "Today" : t === "medications" ? "All Medications" : "History"}
            </button>
          ))}
        </div>

        {loading ? <div className="ld2">Loading…</div> : (
          <>
            {/* ── TODAY ── */}
            {tab === "today" && (
              <div>
                {activeMeds.length === 0 ? (
                  <div className="empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--s200)" strokeWidth="1.5"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
                    <p>No active medications.</p>
                    <button className="ab" style={{ margin: "1rem auto 0", display: "inline-flex" }} onClick={() => setShowAdd(true)}>+ Add medication</button>
                  </div>
                ) : activeMeds.map(med => {
                  const taken = takenMed(med.id);
                  const expected = expectedToday(med);
                  const pct = Math.min((taken / expected) * 100, 100);
                  return (
                    <div className="mc" key={med.id}>
                      <div className="mh">
                        <div><div className="mn">{med.name}</div><div className="md">{med.dosage_amount} {med.dosage_unit} · {expected}× daily</div></div>
                        <span className="mb mba">Active</span>
                      </div>
                      <div className="pl"><span className="pt">Today: {taken}/{expected} doses</span><span className="pt">{Math.round(pct)}%</span></div>
                      <div className="pb"><div className="pf" style={{ width: `${pct}%`, background: pct === 100 ? "var(--t600)" : "var(--t200)" }} /></div>
                      <div className="ma">
                        <button className="bl" onClick={() => logDose(med)} disabled={taken >= expected}>
                          {taken >= expected ? "All dosed ✓" : "Log dose"}
                        </button>
                        {med.notes && <span style={{ fontSize: ".8125rem", color: "var(--s400)", alignSelf: "center" }}>{med.notes}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── ALL MEDICATIONS ── */}
            {tab === "medications" && (
              <div>
                <div className="sh2">
                  <div className="st2">All medications ({meds.length})</div>
                  <button className="ab" onClick={() => setShowAdd(true)}>+ Add medication</button>
                </div>
                {meds.length === 0 ? <div className="empty"><p>No medications added yet.</p></div>
                : meds.map(med => {
                  const endDate = new Date(med.start_date);
                  endDate.setDate(endDate.getDate() + med.course_duration_days);
                  const isActive = endDate >= today && med.active;
                  const prog = progress(med);
                  const expected = expectedToday(med);
                  return (
                    <div className="mc" key={med.id}>
                      <div className="mh">
                        <div>
                          <div className="mn">{med.name}</div>
                          <div className="md">{med.dosage_amount} {med.dosage_unit} · {expected}× daily · started {fmtDate(med.start_date)}</div>
                        </div>
                        <span className={`mb ${isActive ? "mba" : "mbe"}`}>{isActive ? "Active" : "Ended"}</span>
                      </div>
                      <div className="mm">
                        <div className="mi"><div className="mil">Dosage</div><div className="miv">{med.dosage_amount} {med.dosage_unit}</div></div>
                        <div className="mi"><div className="mil">Frequency</div><div className="miv">{expected}× / day</div></div>
                        <div className="mi"><div className="mil">Duration</div><div className="miv">{med.course_duration_days} days</div></div>
                      </div>
                      <div className="pl">
                        <span className="pt">Course: day {prog} of {med.course_duration_days}</span>
                        <span className="pt">ends {fmtDate(endDate.toISOString())}</span>
                      </div>
                      <div className="pb"><div className="pf" style={{ width: `${(prog / med.course_duration_days) * 100}%`, background: "var(--t200)" }} /></div>
                      {med.notes && <div style={{ fontSize: ".8125rem", color: "var(--s400)", marginTop: 8 }}>📝 {med.notes}</div>}
                      <div className="ma">
                        <button className="bl" onClick={() => logDose(med)}>Log dose</button>
                        <button className="bg" onClick={() => setEditMed(med)}>Edit</button>
                        <button className="bd2" onClick={() => delMed(med.id)}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── HISTORY ── */}
            {tab === "history" && (
              <div>
                <div className="st2" style={{ marginBottom: "1rem" }}>Dose history ({logs.length} logged)</div>
                {logs.length === 0
                  ? <div className="empty"><p>No doses logged yet.</p></div>
                  : <div style={{ background: "white", border: "1px solid var(--s200)", borderRadius: "var(--rm)", padding: "0 1.25rem" }}>
                      {logs.map(log => (
                        <div className="li" key={log.id}>
                          <div className="ld" />
                          <div className="ln">{log.medications?.name || "Unknown"}</div>
                          <div className="lt">{fmtDate(log.taken_at)} at {fmtTime(log.taken_at)}</div>
                        </div>
                      ))}
                    </div>}
              </div>
            )}
          </>
        )}
      </div>

      {(showAdd || editMed) && (
        <MedModal
          med={editMed}
          userId={user.id}
          onSave={() => { setShowAdd(false); setEditMed(null); fetch(); }}
          onClose={() => { setShowAdd(false); setEditMed(null); }}
        />
      )}
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setBooting(false);
    });
  }, []);

  if (booting) return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#94A3B8", fontFamily: "Inter,sans-serif" }}>
      <style>{CSS}</style>
      Loading…
    </div>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      <style>{CSS}</style>
      {user
        ? <MainApp user={user} onSignOut={async () => { await sb.auth.signOut(); setUser(null); }} />
        : <AuthScreen onAuth={setUser} />}
    </div>
  );
}