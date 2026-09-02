import { NextResponse } from "next/server";
import { getRecentRuns, getSb, verifyCronAuth } from "@/lib/cron";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tbl(sb: any, table: string): any {
  return sb.from(table);
}

/**
 * GET /api/cron/manage — returns recent run history for all jobs.
 * POST /api/cron/manage — manually trigger a job (body: { job: "send-reminders" | "downgrade-expired" }).
 *
 * Requires CRON_SECRET as Bearer token.
 */
export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const job = url.searchParams.get("job");
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);

  if (job) {
    const runs = await getRecentRuns(job, limit);
    return NextResponse.json({ ok: true, job, runs });
  }

  // Return summary for all known jobs
  const jobs = ["send-reminders", "downgrade-expired"];
  const summaries: Record<string, { lastRun: unknown; totalRuns: number; failures: number }> = {};

  const sb = getSb();
  for (const j of jobs) {
    if (!sb) { summaries[j] = { lastRun: null, totalRuns: 0, failures: 0 }; continue; }
    const { data: runs } = await tbl(sb, "cron_runs")
      .select("id, status, started_at, finished_at, details, error")
      .eq("job_name", j)
      .order("started_at", { ascending: false })
      .limit(20);
    const all = (runs || []) as Array<{ id: string; status: string; started_at: string; finished_at: string | null; details: unknown; error: string | null }>;
    summaries[j] = {
      lastRun: all[0] || null,
      totalRuns: all.length,
      failures: all.filter(r => r.status === "failed").length,
    };
  }

  return NextResponse.json({ ok: true, summaries });
}

export async function POST(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { job?: string } = {};
  try { body = await req.json(); } catch {}
  const job = body.job;

  if (!job || !["send-reminders", "downgrade-expired"].includes(job)) {
    return NextResponse.json({ ok: false, error: "Invalid job. Use 'send-reminders' or 'downgrade-expired'." }, { status: 400 });
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(".supabase.co", ".vercel.app") || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/cron/${job}`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET || ""}` },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json({ ok: true, triggered: job, result: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
