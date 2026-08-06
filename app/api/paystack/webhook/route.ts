import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPaystackSecret } from "@/lib/payments";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";
  const secret = getPaystackSecret();

  if (!secret) {
    return NextResponse.json({ ok: false, error: "Paystack secret not configured" }, { status: 500 });
  }

  const expected = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (signature !== expected) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const metadata = event.data?.metadata || {};
  const plan = metadata.plan;
  const email = event.data?.customer?.email || "";
  const reference = event.data?.reference || "";

  if (!plan || !["pro", "family"].includes(plan)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (!email) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const { data: profile, error: profileErr } = await sb
      .from("profiles")
      .select("id, plan")
      .eq("email", email)
      .single();

    if (profileErr || !profile) {
      console.error("Paystack webhook: profile not found for", email);
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (profile.plan === plan) {
      return NextResponse.json({ ok: true, already_active: true });
    }

    const { error: updateErr } = await sb
      .from("profiles")
      .update({ plan })
      .eq("id", profile.id);

    if (updateErr) {
      console.error("Paystack webhook: update failed", updateErr);
      return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
    }

    console.log(`Paystack webhook: tier upgraded to ${plan} for ${email} (ref: ${reference})`);
  } catch (e) {
    console.error("Paystack webhook error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  return NextResponse.json({ ok: true, message: "Paystack webhook endpoint" });
}