import { NextResponse } from "next/server";
import { logStart, logFinish, verifyCronAuth } from "@/lib/cron";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/send-reminders`;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const runId = await logStart("send-reminders");
  let lastError = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(EDGE_FN_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ attempt }),
        cache: "no-store",
      });
      const text = await res.text();

      if (res.ok) {
        let details: Record<string, unknown> = {};
        try { details = JSON.parse(text); } catch { details = { raw: text.slice(0, 500) }; }
        await logFinish(runId, "success", { status: res.status, ...details });
        return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
      }

      lastError = `HTTP ${res.status}: ${text.slice(0, 300)}`;
      console.error(`cron:send-reminders attempt ${attempt + 1} failed:`, lastError);
    } catch (e) {
      lastError = String(e);
      console.error(`cron:send-reminders attempt ${attempt + 1} error:`, lastError);
    }

    if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * (attempt + 1));
  }

  await logFinish(runId, "failed", { retries: MAX_RETRIES }, lastError);
  return NextResponse.json({ ok: false, error: "Failed after retries", lastError }, { status: 500 });
}
