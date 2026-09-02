import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function admin(): SupabaseClient | null {
  if (!sbUrl || !serviceKey) return null;
  return createClient(sbUrl, serviceKey);
}

async function deleteTable(sb: SupabaseClient, table: string, userIdCol: string, userId: string): Promise<string | null> {
  const { error } = await sb.from(table).delete().eq(userIdCol, userId);
  if (error) {
    console.error(`delete ${table}:`, error.message);
    return `${table}: ${error.message}`;
  }
  return null;
}

export async function POST(req: Request) {
  const rl = rateLimit(req, 5, 60000);
  if (rl) return rl;

  const sb = admin();
  if (!sb) return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  if (!anonKey) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token || token === anonKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body.userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  if (user.id !== body.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const errors: string[] = [];
  const userId = body.userId;

  for (const [table, col] of [
    ["community_comments", "user_id"], ["community_posts", "user_id"],
    ["user_badges", "user_id"], ["user_points", "user_id"], ["user_challenges", "user_id"],
    ["dose_logs", "user_id"], ["medications", "user_id"], ["vitals", "user_id"],
    ["visits", "user_id"], ["family_members", "user_id"], ["push_subscriptions", "user_id"],
    ["vital_reminders", "user_id"], ["payment_references", "user_id"],
    ["profiles", "id"],
  ]) {
    const err = await deleteTable(sb, table, col, userId);
    if (err) errors.push(err);
  }

  const { error: delErr } = await sb.auth.admin.deleteUser(userId);
  if (delErr) {
    console.error("delete auth user:", delErr.message);
    errors.push(`auth_user: ${delErr.message}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, error: "Partial deletion failure", details: errors }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
