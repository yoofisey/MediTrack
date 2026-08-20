import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

function getAdminClient() {
  if (!sbUrl || !serviceKey) return null;
  return createClient(sbUrl, serviceKey);
}

export async function POST(req: Request) {
  const sb = getAdminClient();
  if (!sb) return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
  if (!anonKey || !PAYSTACK_SECRET_KEY) return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token || token === anonKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { reference?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { reference } = body;
  if (!reference || !/^[a-zA-Z0-9_-]+$/.test(reference)) {
    return NextResponse.json({ ok: false, error: "Invalid reference" }, { status: 400 });
  }

  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    });

    if (!verifyRes.ok) {
      return NextResponse.json({ ok: false, error: "Paystack verification failed" }, { status: 500 });
    }

    const verifyData = await verifyRes.json();
    if (verifyData.status !== true || verifyData.data?.status !== "success") {
      return NextResponse.json({ ok: false, error: "Payment not verified" }, { status: 400 });
    }

    const paystackEmail = verifyData.data?.customer?.email || "";
    if (paystackEmail && paystackEmail !== user.email) {
      return NextResponse.json({ ok: false, error: "Email mismatch" }, { status: 400 });
    }

    const paidAmount = verifyData.data?.amount || 0;
    const metadata = verifyData.data?.metadata || {};
    const planFromMeta = metadata.plan || metadata.custom_fields?.plan;

    let plan: string;
    if (planFromMeta && ["pro", "family"].includes(planFromMeta)) {
      plan = planFromMeta;
    } else if (paidAmount >= 3500) {
      plan = "family";
    } else if (paidAmount >= 1500) {
      plan = "pro";
    } else {
      return NextResponse.json({ ok: false, error: "Insufficient payment amount" }, { status: 400 });
    }

    const { data: profile, error: profileErr } = await sb
      .from("profiles").select("id, plan").eq("id", user.id).single();

    if (profileErr || !profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    if (profile.plan === plan) {
      return NextResponse.json({ ok: true, already_active: true });
    }

    const { error: updateErr } = await sb
      .from("profiles").update({ plan }).eq("id", user.id);

    if (updateErr) return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Paystack verify error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
