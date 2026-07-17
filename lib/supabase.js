const SUPABASE_URL = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL || "https://luxtopkzdyflbejwgniq.supabase.co";
const SUPABASE_ANON_KEY = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1eHRvcGt6ZHlmbGJlandnbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY5NzAsImV4cCI6MjA5NzkxMjk3MH0.zcvzd5vOBxw6xE00EIrt7NBcEnFa95FxODsD2h1M-OU";

function mkClient(url, key) {
  let tok = key;

  async function safeJson(r) {
    const t = await r.text().catch(() => "");
    if (!t?.trim()) return null;
    try { return JSON.parse(t); } catch { return null; }
  }

  async function api(path, opts = {}, retried = false) {
    let r;
    try {
      r = await fetch(url + path, {
        ...opts,
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${tok}`,
          ...(opts.headers || {}),
        },
      });
    } catch (e) {
      if (e instanceof TypeError && e.message === "Failed to fetch") {
        throw new Error("Network error — check your internet connection and try again.");
      }
      throw new Error(e?.message || "Network request failed. Please try again.");
    }
    if (!r.ok) {
      const e = await safeJson(r) || {};
      if (r.status === 401 && !retried) {
        const rt = ls.get("mt_rt");
        if (rt) {
          try {
            const refreshRes = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: key },
              body: JSON.stringify({ refresh_token: rt }),
            });
            if (refreshRes.ok) {
              const d = await safeJson(refreshRes);
              if (d?.access_token) {
                saveSession(d);
                return api(path, opts, true);
              }
            }
          } catch {}
        }
      }
      throw new Error(e.msg || e.message || e.error_description || ({
        502:"Email service unavailable — configure SMTP in Supabase dashboard.",
        503:"Email service unavailable — configure SMTP in Supabase dashboard.",
        504:"Email service timeout — configure SMTP in Supabase dashboard → Authentication → Settings.",
        429:"Email rate limit exceeded — configure SMTP or wait and try again.",
      }[r.status] || `HTTP ${r.status}`));
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

    async signUpOtp({ email, options }) {
      try {
        await api("/auth/v1/otp", {
          method: "POST",
          body: JSON.stringify({ email, create_user: true, data: options?.data }),
        });
        return { error: null };
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(e?.message || String(e)) };
      }
    },

    async verifyOtp({ email, token }) {
      try {
        const d = await api("/auth/v1/verify", {
          method: "POST",
          body: JSON.stringify({ type: "email", email, token }),
        });
        const u = saveSession(d);
        return { data: { user: u, session: d }, error: null };
      } catch (e) {
        return { data: null, error: e instanceof Error ? e : new Error(e?.message || String(e)) };
      }
    },

    async updateUser(updates) {
      try {
        const d = await api("/auth/v1/user", {
          method: "PUT",
          body: JSON.stringify(updates),
        });
        return { data: d, error: null };
      } catch (e) {
        return { data: null, error: e instanceof Error ? e : new Error(e?.message || String(e)) };
      }
    },

    signInWithOAuth({ provider }) {
      const siteUrl = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SITE_URL) || window.location.origin;
      const redirectTo = siteUrl + window.location.pathname;
      const params = new URLSearchParams({
        provider,
        redirect_to: redirectTo,
      });
      window.location.href = `${url}/auth/v1/authorize?${params}`;
    },

    async getUser() {
      const captured = consumeCapturedTokens();

      if (captured?.type === "pkce" && captured.code) {
        let d;
        try {
          d = await api("/auth/v1/token?grant_type=pkce", {
            method: "POST",
            body: JSON.stringify({ auth_code: captured.code }),
          });
        } catch {}
        if (!d?.user) {
          try {
            d = await api("/auth/v1/token?grant_type=authorization_code", {
              method: "POST",
              body: JSON.stringify({ code: captured.code }),
            });
          } catch {}
        }
        if (d?.user) { saveSession(d); return { data: { user: d.user }, error: null }; }
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

  const storage = {
    from(bucket) {
      return {
        async upload(path, file, opts = {}) {
            const qs = opts.upsert ? "?upsert=true" : "";
            const extraHeaders = opts.upsert ? { "x-upsert": "true" } : {};
            try {
              const r = await fetch(`${url}/storage/v1/object/${bucket}/${path}${qs}`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${tok}`,
                  "Content-Type": file?.type || "application/octet-stream",
                  ...extraHeaders,
                  ...(opts.headers || {}),
                },
                body: file,
            });
            if (!r.ok) {
              const e = await safeJson(r) || {};
              return { data: null, error: new Error(e.msg || e.message || `Upload failed (${r.status})`) };
            }
            const d = await safeJson(r);
            return { data: d, error: null };
          } catch (e) {
            return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
          }
        },
        getPublicUrl(path) {
          return { data: { publicUrl: `${url}/storage/v1/object/public/${bucket}/${path}` } };
        },
      };
    },
  };

  return { auth, from, storage };
}

export const sb = mkClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchProfile(userId, userMeta) {
  try {
    const { data } = await sb.from("profiles").select("*").eq("id", userId);
    const existing = Array.isArray(data) ? (data[0] || null) : null;
    if (existing) return existing;
    await sb.from("profiles").upsert([{
      id: userId,
      full_name: userMeta?.full_name || "",
      country: userMeta?.country || "GH",
      plan: userMeta?.plan || "free",
      onboarded: false,
    }]);
    const { data: d2 } = await sb.from("profiles").select("*").eq("id", userId);
    return Array.isArray(d2) ? (d2[0] || null) : null;
  } catch { return null; }
}
