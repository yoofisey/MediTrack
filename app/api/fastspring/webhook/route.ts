import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getFastSpringConfig, planForFastSpringProduct, verifyFastSpringSignature } from "@/lib/payments-server";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const PROCESSED_EVENTS = ["order.completed", "subscription.activated", "subscription.payment.completed"];

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function extractPlan(data: unknown): string {
  const d = asRecord(data);
  const tags = d.tags;
  if (Array.isArray(tags)) {
    for (const t of tags) {
      const tag = asRecord(t);
      if (tag.name === "plan" && Array.isArray(tag.values) && ["pro", "family"].includes(tag.values[0])) {
        return tag.values[0];
      }
    }
  }
  const order = asRecord(d.order);
  const sub = asRecord(d.subscription);
  const subOrder = asRecord(sub.order);
  const products = (
    (Array.isArray(d.products) && d.products) ||
    (Array.isArray(order.products) && order.products) ||
    (Array.isArray(subOrder.products) && subOrder.products) ||
    []
  ) as Array<Record<string, unknown>>;
  for (const p of products) {
    const prod = asRecord(p);
    const plan = planForFastSpringProduct(str(prod.product || prod.path));
    if (plan) return plan;
  }
  const subProduct = str(sub.product || (sub.basedOn ? asRecord(sub.basedOn).product : ""));
  if (subProduct) {
    const plan = planForFastSpringProduct(subProduct);
    if (plan) return plan;
  }
  return "";
}

function extractEmail(data: unknown): string {
  const d = asRecord(data);
  return (
    str(d.email) ||
    str(asRecord(d.customer).email) ||
    str(asRecord(d.account).email) ||
    str(asRecord(asRecord(d.subscription).account).email)
  );
}

function extractReference(data: unknown, eventId: string): string {
  const d = asRecord(data);
  const order = asRecord(d.order);
  const sub = asRecord(d.subscription);
  return (
    str(d.reference) ||
    str(order.reference) ||
    str(order.subscriptionId) ||
    str(sub.reference) ||
    str(asRecord(sub.order).reference) ||
    str(sub.subscriptionId) ||
    eventId
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