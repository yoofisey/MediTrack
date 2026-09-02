import { NextResponse } from "next/server";
import { logStart, logFinish, alreadyRan, verifyCronAuth, getSb } from "@/lib/cron";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;
const DEDUP_WINDOW_MS = 23 * 60 * 60 * 1000; // 23 hours — prevents double-run within same day

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSb();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
  }

  // Dedup: skip if this job already succeeded within the window
  if (await alreadyRan("downgrade-expired", DEDUP_WINDOW_MS)) {
    return NextResponse.json({ ok: true, skipped: true, reason: "already ran recently" });
  }

  const runId = await logStart("downgrade-expired");
  let lastError = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Use the PostgreSQL function for atomicity
      const { error: fnErr } = await sb.rpc("downgrade_expired_subscriptions");
      if (fnErr) throw new Error(`rpc: ${fnErr.message}`);

      // Count what was downgraded (for logging)
      const { data: profiles } = await sb
        .from("profiles")
        .select("id, email, plan")
        .eq("plan", "free")
        .is("paid_at", null);

      // We can't distinguish "just downgraded" from "always free", so log the RPC success
      await logFinish(runId, "success", { method: "rpc", retried: attempt > 0 });
      console.log(`cron:downgrade-expired completed (attempt ${attempt + 1})`);
      return NextResponse.json({ ok: true, method: "rpc" });
    } catch (e) {
      lastError = String(e);
      console.error(`cron:downgrade-expired attempt ${attempt + 1} failed:`, lastError);
    }

    if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * (attempt + 1));
  }

  await logFinish(runId, "failed", { retries: MAX_RETRIES }, lastError);
  return NextResponse.json({ ok: false, error: "Failed after retries", lastError }, { status: 500 });
}
