import { sb } from "./supabase";

const CACHE_KEYS = {
  meds: "mt_cache_meds",
  logs: "mt_cache_logs",
  vitals: "mt_cache_vitals",
  profile: "mt_cache_profile",
  queue: "mt_offline_queue",
};

function ls() { try { return localStorage; } catch { return null; } }

export function getCached(key) {
  const s = ls();
  try {
    const raw = s?.getItem(CACHE_KEYS[key]);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setCache(key, data) {
  const s = ls();
  try { s?.setItem(CACHE_KEYS[key], JSON.stringify(data)); } catch {}
}

export function clearCache(key) {
  const s = ls();
  try { if (key) s?.removeItem(CACHE_KEYS[key]); else Object.values(CACHE_KEYS).forEach(k => s?.removeItem(k)); } catch {}
}

export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export async function queueDoseLog(entry) {
  const s = ls();
  try {
    const raw = s?.getItem(CACHE_KEYS.queue);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ ...entry, _queuedAt: Date.now() });
    s?.setItem(CACHE_KEYS.queue, JSON.stringify(queue));
  } catch {}
}

export async function flushQueue() {
  const s = ls();
  if (!isOnline()) return 0;
  let raw;
  try { raw = s?.getItem(CACHE_KEYS.queue); } catch { return 0; }
  if (!raw) return 0;
  const queue = JSON.parse(raw);
  if (!queue.length) return 0;

  let flushed = 0;
  const remaining = [];

  for (const entry of queue) {
    try {
      const { error } = await sb.from("dose_logs").insert([{
        user_id: entry.userId,
        medication_id: entry.medId,
        taken_at: entry.takenAt,
        notes: entry.notes || "",
      }]);
      if (!error) { flushed++; continue; }
    } catch {}
    remaining.push(entry);
  }

  try { s?.setItem(CACHE_KEYS.queue, JSON.stringify(remaining)); } catch {}
  return flushed;
}

export function getQueueLength() {
  const s = ls();
  try {
    const raw = s?.getItem(CACHE_KEYS.queue);
    return raw ? JSON.parse(raw).length : 0;
  } catch { return 0; }
}

if (typeof window !== 'undefined') {
  window.addEventListener("online", () => { flushQueue(); });
}
