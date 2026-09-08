import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPaddleWebhookSecret, verifyPaddleSignature, planForPaddlePriceId } from "@/lib/payments-server";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://luxtopkzdyflbejwgniq.supabase.co";
  const key = SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
  const sb = getAdminClient();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  const secret = getPaddleWebhookSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Paddle webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") || "";
  if (!verifyPaddleSignature(rawBody, signature, secret)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event_type || "";
  const data = event.data || {};

  const handledTypes = new Set([
    "subscription.created",
    "subscription.activated",
    "subscription.updated",
    "subscription.cancelled",
    "subscription.past_due",
    "transaction.completed",
  ]);
  if (!handledTypes.has(eventType)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const userId = data.custom_data?.user_id || "";
  const plan = data.custom_data?.plan || planForPaddlePriceId(data.items?.[0]?.price?.id || "");
  if (!userId || !plan || !["pro", "family"].includes(plan)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const status = data.status || "";

  try {
    if (eventType === "subscription.cancelled" || eventType === "subscription.past_due" || status === "paused" || status === "canceled") {
      await sb.from("profiles").update({ plan: "free", paid_at: null }).eq("id", userId);
      console.log(`Paddle webhook: tier downgraded to free for ${userId} (${eventType}, status=${status})`);
      return NextResponse.json({ ok: true, downgraded: true });
    }

    if (!["active", "trialing"].includes(status) && eventType !== "transaction.completed") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const reference = data.id || data.transaction_id || "";
    try {
      const { data: existingRef } = await sb
        .from("payment_references")
        .select("id")
        .eq("user_id", userId)
        .eq("reference", reference)
        .maybeSingle();
      if (!existingRef && reference) {
        await sb
          .from("payment_references")
          .insert({ user_id: userId, reference, plan, paid_at: new Date().toISOString() });
      }
    } catch (refErr) {
      console.error("Paddle webhook: reference record not written", refErr);
    }

    const { data: profile, error: profileErr } = await sb
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();
    if (profileErr || !profile) {
      console.error("Paddle webhook: profile not found for", userId);
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (profile.plan === plan) {
      return NextResponse.json({ ok: true, already_active: true });
    }

    const { error: updateErr } = await sb
      .from("profiles")
      .update({ plan, paid_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateErr) {
      console.error("Paddle webhook: update failed", updateErr);
      return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
    }

    console.log(`Paddle webhook: tier upgraded to ${plan} for ${userId} (${eventType}, status=${status})`);
  } catch (e) {
    console.error("Paddle webhook error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  return NextResponse.json({ ok: true, message: "Paddle webhook endpoint" });
}