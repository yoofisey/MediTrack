import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL || "https://luxtopkzdyflbejwgniq.supabase.co";
const SUPABASE_ANON_KEY = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1eHRvcGt6ZHlmbGJlandnbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY5NzAsImV4cCI6MjA5NzkxMjk3MH0.zcvzd5vOBxw6xE00EIrt7NBcEnFa95FxODsD2h1M-OU";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'mt_sb_session',
    flowType: 'implicit',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function fetchProfile(userId, userMeta) {
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
