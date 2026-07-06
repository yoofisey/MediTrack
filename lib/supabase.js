export const SUPABASE_URL = "https://luxtopkzdyflbejwgniq.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1eHRvcGt6ZHlmbGJlandnbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY5NzAsImV4cCI6MjA5NzkxMjk3MH0.zcvzd5vOBxw6xE00EIrt7NBcEnFa95FxODsD2h1M-OU";

function mkClient(url, key) {
  let tok = key;

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

  const ls = {
    get: k   => { try { return localStorage.getItem(k); }    catch { return null; } },
    set: (k,v)=>{ try { localStorage.setItem(k, v); }        catch {} },
    del: k   => { try { localStorage.removeItem(k); }        catch {} },
  };

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

  function consumeCapturedTokens() {
    const at = ls.get("mt_at");
    const rt = ls.get("mt_rt");
    const code = (() => { try { return sessionStorage.getItem("mt_code"); } catch { return null; } })();
    if (code) {
      try { sessionStorage.removeItem("mt_code"); } catch {}
      return { type: "pkce", code };
    }
    if (at) return { type: "token", access_token: at, refresh_token: rt };
    return null;
  }

  const auth = {
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

    signInWithOAuth({ provider }) {
      const redirectTo = window.location.origin + window.location.pathname;
      const params = new URLSearchParams({
        provider,
        redirect_to: redirectTo,
        flow_type: "implicit",
      });
      window.location.href = `${url}/auth/v1/authorize?${params}`;
    },

    async getUser() {
      const captured = consumeCapturedTokens();

      if (captured?.type === "pkce" && captured.code) {
        try {
          const d = await api("/auth/v1/token?grant_type=pkce", {
            method: "POST",
            body: JSON.stringify({ auth_code: captured.code }),
          });
          saveSession(d);
          if (d?.user) return { data: { user: d.user }, error: null };
        } catch {}
      }

      const at = ls.get("mt_at");
      if (!at) return { data: { user: null }, error: null };
      tok = at;
      try {
        const u = await api("/auth/v1/user");
        return { data: { user: u }, error: null };
      } catch {
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
        clearSession();
        return { data: { user: null }, error: null };
      }
    },

    async signOut() {
      try { await api("/auth/v1/logout", { method: "POST" }); } catch {}
      clearSession();
    },
  };

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
      then(res) {
        api(`/rest/v1/${table}?${q._qs()}`, { headers: { Prefer: "return=representation" } })
          .then(d => res({ data: d ?? [], error: null }))
          .catch(e => {
            const err = e instanceof Error ? e : new Error(e?.message || String(e));
            res({ data: null, error: err });
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

export const sb = mkClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchProfile(userId, userMeta) {
  try {
    const { data } = await sb.from("profiles").select("*").eq("id", userId);
    const existing = Array.isArray(data) ? (data[0] || null) : null;
    if (existing) return existing;
    if (userMeta?.country) {
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
