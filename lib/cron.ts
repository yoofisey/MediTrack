import { createClient, SupabaseClient } from "@supabase/supabase-js";

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let _sb: SupabaseClient | null = null;

export function getSb() {
  if (!_sb && sbUrl && serviceKey) _sb = createClient(sbUrl, serviceKey);
  return _sb;
}

// Use untyped `.from()` calls since cron_runs table isn't in generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tbl(sb: SupabaseClient, table: string): any {
  return sb.from(table);
}

/** Log the start of a cron run. Returns the run id. */
export async function logStart(jobName: string): Promise<string | null> {
  const sb = getSb();
  if (!sb) return null;
  const { data, error } = await tbl(sb, "cron_runs")
    .insert({ job_name: jobName })
    .select("id")
    .single();
  if (error) {
    console.error(`cron:${jobName}: failed to log start`, error.message);
    return null;
  }
  return data?.id || null;
}

/** Mark a cron run as finished. */
export async function logFinish(
  runId: string | null,
  status: "success" | "failed",
  details?: Record<string, unknown>,
  error?: string
) {
  const sb = getSb();
  if (!sb || !runId) return;
  await tbl(sb, "cron_runs")
    .update({ status, finished_at: new Date().toISOString(), details: details || null, error: error || null })
    .eq("id", runId);
}

/** Check if this job already ran successfully in the given window. */
export async function alreadyRan(jobName: string, withinMs: number): Promise<boolean> {
  const sb = getSb();
  if (!sb) return false;
  const since = new Date(Date.now() - withinMs).toISOString();
  const { data } = await tbl(sb, "cron_runs")
    .select("id")
    .eq("job_name", jobName)
    .eq("status", "success")
    .gte("started_at", since)
    .limit(1);
  return !!(data && data.length > 0);
}

/** Read recent runs for a job. */
export async function getRecentRuns(jobName: string, limit = 20) {
  const sb = getSb();
  if (!sb) return [];
  const { data } = await tbl(sb, "cron_runs")
    .select("*")
    .eq("job_name", jobName)
    .order("started_at", { ascending: false })
    .limit(limit);
  return data || [];
}

/** Auth check for Vercel cron invocations. */
export function verifyCronAuth(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // fail-open if no secret set (dev)
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}
