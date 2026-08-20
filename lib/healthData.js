import { sb } from "./supabase";

function stripNulls(obj) {
  if (Array.isArray(obj)) return obj.map(stripNulls);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== null && v !== undefined) out[k] = typeof v === "object" ? stripNulls(v) : v;
    }
    return out;
  }
  return obj;
}

// ── Journal ──────────────────────────────────────────────────────────────
const JOURNAL_KEY = "mt_journal";

export async function fetchJournal() {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return JSON.parse(localStorage.getItem(JOURNAL_KEY) || "[]");
    const { data, error } = await sb.from("journal_entries")
      .select("*").eq("user_id", user.id).order("entry_date", { ascending: false });
    if (error) throw error;
    const rows = (data || []).map(r => ({
      id: r.id, date: r.entry_date, createdAt: r.created_at, updatedAt: r.updated_at,
      mood: r.mood, sleep: r.sleep, symptoms: r.symptoms || [], notes: r.notes,
    }));
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(rows));
    return rows;
  } catch {
    return JSON.parse(localStorage.getItem(JOURNAL_KEY) || "[]");
  }
}

export async function saveJournalEntry(entry) {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error("no user");
    const row = {
      user_id: user.id, entry_date: entry.date, mood: entry.mood,
      sleep: entry.sleep, symptoms: entry.symptoms || [], notes: entry.notes,
      updated_at: new Date().toISOString(),
    };
    if (entry.id && !entry.id.startsWith("j_")) {
      const { data, error } = await sb.from("journal_entries")
        .update(stripNulls(row)).eq("id", entry.id).select().single();
      if (error) throw error;
      return { id: data.id, ...entry, updatedAt: data.updated_at };
    }
    const { data, error } = await sb.from("journal_entries")
      .insert(stripNulls(row)).select().single();
    if (error) throw error;
    return { id: data.id, ...entry, createdAt: data.created_at };
  } catch {
    const local = JSON.parse(localStorage.getItem(JOURNAL_KEY) || "[]");
    const id = entry.id || `j_${Date.now()}`;
    const updated = entry.date ? entry.date : new Date().toISOString().slice(0, 10);
    const saved = { ...entry, id, date: updated, createdAt: entry.createdAt || new Date().toISOString() };
    const idx = local.findIndex(e => e.id === id);
    if (idx >= 0) local[idx] = saved; else local.unshift(saved);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(local));
    return saved;
  }
}

// ── Medical Profile ──────────────────────────────────────────────────────
const MEDICAL_KEY = "mt_medical_id";

export async function fetchMedicalProfile() {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return JSON.parse(localStorage.getItem(MEDICAL_KEY) || "null");
    const { data, error } = await sb.from("medical_profiles")
      .select("*").eq("user_id", user.id).single();
    if (error || !data) return JSON.parse(localStorage.getItem(MEDICAL_KEY) || "null");
    const profile = {
      bloodType: data.blood_type, allergies: data.allergies || [],
      conditions: data.conditions || [], emergencyName: data.emergency_name,
      emergencyRelation: data.emergency_relation, emergencyPhone: data.emergency_phone,
    };
    localStorage.setItem(MEDICAL_KEY, JSON.stringify(profile));
    return profile;
  } catch {
    return JSON.parse(localStorage.getItem(MEDICAL_KEY) || "null");
  }
}

export async function saveMedicalProfile(profile) {
  const row = {
    blood_type: profile.bloodType, allergies: profile.allergies || [],
    conditions: profile.conditions || [], emergency_name: profile.emergencyName,
    emergency_relation: profile.emergencyRelation, emergency_phone: profile.emergencyPhone,
    updated_at: new Date().toISOString(),
  };
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error("no user");
    const { error } = await sb.from("medical_profiles")
      .upsert({ user_id: user.id, ...stripNulls(row) }, { onConflict: "user_id" });
    if (error) throw error;
  } catch {
    localStorage.setItem(MEDICAL_KEY, JSON.stringify(profile));
  }
}

// ── Personal Details ─────────────────────────────────────────────────────
const PERSONAL_KEY = "adhera_personal";

export async function fetchPersonalDetails() {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return JSON.parse(localStorage.getItem(PERSONAL_KEY) || "null");
    const { data, error } = await sb.from("personal_details")
      .select("*").eq("user_id", user.id).single();
    if (error || !data) return JSON.parse(localStorage.getItem(PERSONAL_KEY) || "null");
    const details = { dob: data.dob, age: data.age, gender: data.gender, height: data.height, weight: data.weight };
    localStorage.setItem(PERSONAL_KEY, JSON.stringify(details));
    return details;
  } catch {
    return JSON.parse(localStorage.getItem(PERSONAL_KEY) || "null");
  }
}

export async function savePersonalDetails(details) {
  const row = { dob: details.dob, age: details.age, gender: details.gender, height: details.height, weight: details.weight, updated_at: new Date().toISOString() };
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error("no user");
    const { error } = await sb.from("personal_details")
      .upsert({ user_id: user.id, ...stripNulls(row) }, { onConflict: "user_id" });
    if (error) throw error;
  } catch {
    localStorage.setItem(PERSONAL_KEY, JSON.stringify(details));
  }
}

// ── Side Effects ─────────────────────────────────────────────────────────
const SIDE_EFFECTS_KEY = "mt_side_effects";

export async function fetchSideEffects() {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return JSON.parse(localStorage.getItem(SIDE_EFFECTS_KEY) || "[]");
    const { data, error } = await sb.from("side_effects")
      .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data || []).map(r => ({
      id: r.id, createdAt: r.created_at, medId: r.med_id, medName: r.med_name,
      type: r.effect_type, severity: r.severity, notes: r.notes,
    }));
    localStorage.setItem(SIDE_EFFECTS_KEY, JSON.stringify(rows));
    return rows;
  } catch {
    return JSON.parse(localStorage.getItem(SIDE_EFFECTS_KEY) || "[]");
  }
}

export async function saveSideEffect(effect) {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error("no user");
    const row = {
      user_id: user.id, med_id: effect.medId, med_name: effect.medName,
      effect_type: effect.type, severity: effect.severity, notes: effect.notes,
    };
    const { data, error } = await sb.from("side_effects")
      .insert(stripNulls(row)).select().single();
    if (error) throw error;
    return { id: data.id, ...effect, createdAt: data.created_at };
  } catch {
    const local = JSON.parse(localStorage.getItem(SIDE_EFFECTS_KEY) || "[]");
    const id = effect.id || `se_${Date.now()}`;
    const saved = { ...effect, id, createdAt: effect.createdAt || new Date().toISOString() };
    local.unshift(saved);
    localStorage.setItem(SIDE_EFFECTS_KEY, JSON.stringify(local));
    return saved;
  }
}

// ── Stock ────────────────────────────────────────────────────────────────
const STOCK_KEY = "mt_stock";

export async function fetchStock() {
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return JSON.parse(localStorage.getItem(STOCK_KEY) || "{}");
    const { data, error } = await sb.from("medication_stock")
      .select("medication_id, remaining, updated_at").eq("user_id", user.id);
    if (error) throw error;
    const map = {};
    (data || []).forEach(r => { map[r.medication_id] = { remaining: r.remaining, updatedAt: new Date(r.updated_at).getTime() }; });
    localStorage.setItem(STOCK_KEY, JSON.stringify(map));
    return map;
  } catch {
    return JSON.parse(localStorage.getItem(STOCK_KEY) || "{}");
  }
}

export async function saveStock(medId, remaining) {
  const now = new Date().toISOString();
  const local = JSON.parse(localStorage.getItem(STOCK_KEY) || "{}");
  local[medId] = { remaining, updatedAt: Date.now() };
  localStorage.setItem(STOCK_KEY, JSON.stringify(local));
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { error } = await sb.from("medication_stock")
      .upsert({ user_id: user.id, medication_id: medId, remaining, updated_at: now }, { onConflict: "user_id,medication_id" });
    if (error) throw error;
  } catch {}
}
