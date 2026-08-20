import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function admin(): SupabaseClient | null {
  if (!sbUrl || !serviceKey) return null;
  return createClient(sbUrl, serviceKey);
}

async function deleteTable(sb: SupabaseClient, table: string, userIdCol: string, userId: string) {
  const { error } = await sb.from(table).delete().eq(userIdCol, userId);
  if (error) console.error(`delete ${table}:`, error.message);
}

export async function POST(req: Request) {
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

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  if (user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteTable(sb, "community_comments", "user_id", userId);
  await deleteTable(sb, "community_posts", "user_id", userId);
  await deleteTable(sb, "user_badges", "user_id", userId);
  await deleteTable(sb, "user_points", "user_id", userId);
  await deleteTable(sb, "user_challenges", "user_id", userId);
  await deleteTable(sb, "dose_logs", "user_id", userId);
  await deleteTable(sb, "medications", "user_id", userId);
  await deleteTable(sb, "vitals", "user_id", userId);
  await deleteTable(sb, "visits", "user_id", userId);
  await deleteTable(sb, "family_members", "user_id", userId);
  await deleteTable(sb, "push_subscriptions", "user_id", userId);
  await deleteTable(sb, "vital_reminders", "user_id", userId);
  await deleteTable(sb, "profiles", "id", userId);

  const { error: delErr } = await sb.auth.admin.deleteUser(userId);
  if (delErr) console.error("delete auth user:", delErr.message);

  return NextResponse.json({ ok: true });
}
