import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getFastSpringConfig, planForFastSpringProduct, verifyFastSpringSignature } from "@/lib/payments-server";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const PROCESSED_EVENTS = ["order.completed", "subscription.activated", "subscription.payment.completed"];

function extractPlan(data: any): string {
  const tags = data.tags;
  if (Array.isArray(tags)) {
    for (const t of tags) {
      if (t && t.name === "plan" && Array.isArray(t.values) && ["pro", "family"].includes(t.values[0])) {
        return t.values[0];
      }
    }
  }
  const products = data.products || data.order?.products || data.subscription?.order?.products;
  if (Array.isArray(products)) {
    for (const p of products) {
      const plan = planForFastSpringProduct(p?.product || p?.path || "");
      if (plan) return plan;
    }
  }
  const subProduct = data.subscription?.product || data.subscription?.basedOn?.product;
  if (subProduct) {
    const plan = planForFastSpringProduct(subProduct);
    if (plan) return plan;
  }
  return "";
}

function extractEmail(data: any): string {
  return data.email || data.customer?.email || data.account?.email || data.subscription?.account?.email || "";
}

function extractReference(data: any, eventId: string): string {
  return (
    data.reference ||
    data.order?.reference ||
    data.subscription?.order?.reference ||
    data.subscription?.subscriptionId ||
    eventId ||
    ""
  );
}

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

  const rawBody = await req.text();

  const fs = getFastSpringConfig();
  const signature = req.headers.get("x-fastspring-signature") || "";
  if (!verifyFastSpringSignature(rawBody, signature, fs.webhookSecret)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const type = event.type || "";
  if (!PROCESSED_EVENTS.includes(type)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const data = event.data || {};
  const plan = extractPlan(data);
  const email = extractEmail(data);
  const reference = extractReference(data, event.id);

  if (!plan || !["pro", "family"].includes(plan) || !email || !reference) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const { data: profile, error: profileErr } = await sb
      .from("profiles")
      .select("id, plan")
      .eq("email", email)
      .single();

    if (profileErr || !profile) {
      console.error("FastSpring webhook: profile not found for", email);
      return NextResponse.json({ ok: true, skipped: true });
    }

    try {
      const { data: existingRef } = await sb
        .from("payment_references")
        .select("id")
        .eq("user_id", profile.id)
        .eq("reference", reference)
        .maybeSingle();
      if (!existingRef) {
        await sb
          .from("payment_references")
          .insert({ user_id: profile.id, reference, plan, paid_at: new Date().toISOString() });
      }
    } catch (refErr) {
      console.error("FastSpring webhook: reference record not written", refErr);
    }

    if (profile.plan === plan) {
      return NextResponse.json({ ok: true, already_active: true });
    }

    const { error: updateErr } = await sb
      .from("profiles")
      .update({ plan, paid_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (updateErr) {
      console.error("FastSpring webhook: update failed", updateErr);
      return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
    }

    console.log(`FastSpring webhook: tier upgraded to ${plan} for ${email} (ref: ${reference})`);
  } catch (e) {
    console.error("FastSpring webhook error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "FastSpring webhook endpoint" });
}