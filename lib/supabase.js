import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = typeof process !== "undefined" ? (process.env?.NEXT_PUBLIC_SUPABASE_URL || "") : "";
const SUPABASE_ANON_KEY = typeof process !== "undefined" ? (process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || "") : "";

function missingConfigError() {
  return new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/** @type {import('@supabase/supabase-js').SupabaseClient} */
const sb = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storageKey: 'mt_sb_session',
        flowType: 'implicit',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : /** @type {any} */ (new Proxy({}, {
      get() { throw missingConfigError(); },
      apply() { throw missingConfigError(); },
    }));

export async function fetchProfile(userId, userMeta) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    let email = "";
    try {
      const me = await sb.auth.getUser();
      email = me?.data?.user?.email || userMeta?.email || "";
    } catch {}
    const { data } = await sb.from("profiles").select("*").eq("id", userId);
    const existing = Array.isArray(data) ? (data[0] || null) : null;
    if (existing) {
      if (!existing.timezone) {
        let tz = "";
        try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
        if (tz) { await sb.from("profiles").update({ timezone: tz }).eq("id", userId); existing.timezone = tz; }
      }
      if (!existing.email && email) {
        await sb.from("profiles").update({ email }).eq("id", userId);
        existing.email = email;
      }
      return existing;
    }
    let tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
    await sb.from("profiles").upsert({
      id: userId,
      full_name: userMeta?.full_name || "",
      country: userMeta?.country || "GH",
      timezone: tz,
      email,
      plan: userMeta?.plan || "free",
      onboarded: false,
    });
    const { data: d2 } = await sb.from("profiles").select("*").eq("id", userId);
    return Array.isArray(d2) ? (d2[0] || null) : null;
  } catch { return null; }
}

export { sb };
