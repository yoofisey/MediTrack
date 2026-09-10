import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";
import { getPaystackPlans, getPaystackSecret, PAYSTACK_CURRENCIES, PLAN_MIN_AMOUNTS } from "@/lib/payments-server";
import type { PaystackCountry, PaystackPlanKey } from "@/lib/payments-server";

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const VALID_COUNTRIES = ["GH", "NG", "ZA", "KE"];

export async function POST(req: Request) {
  const rl = rateLimit(req, 10, 60000);
  if (rl) return rl;

  if (!sbUrl || !serviceKey || !anonKey) {
    return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token || token === anonKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const sb = createClient(sbUrl, serviceKey);
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { plan?: string; country?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { plan, country } = body;
  if (!plan || !["pro", "family"].includes(plan)) {
    return NextResponse.json({ ok: false, error: "Invalid plan" }, { status: 400 });
  }

  const countryCode = (country || "GH").toUpperCase();
  if (!VALID_COUNTRIES.includes(countryCode)) {
    return NextResponse.json({ ok: false, error: "Invalid country" }, { status: 400 });
  }

  const planKey = plan as PaystackPlanKey;
  const plans = getPaystackPlans(countryCode);
  const planCode = plans?.[planKey];
  const currency = PAYSTACK_CURRENCIES[countryCode as PaystackCountry];
  const amount = PLAN_MIN_AMOUNTS[currency]?.[planKey];
  const secret = getPaystackSecret(countryCode);
  if (!planCode || !amount || !secret) {
    return NextResponse.json({ ok: false, error: "Plan not available in your country" }, { status: 400 });
  }

  const email = user.email;
  if (!email) {
    return NextResponse.json({ ok: false, error: "No email on account" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || "https://www.useadhera.com";

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        plan: planCode,
        currency,
        callback_url: `${origin}/`,
        metadata: { plan, country: countryCode, user_id: user.id },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
      console.error("Paystack init error:", data);
      return NextResponse.json({ ok: false, error: data.message || "Failed to initialize payment" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, access_code: data.data.access_code, reference: data.data.reference, authorization_url: data.data.authorization_url });
  } catch (e) {
    console.error("Paystack init failed:", e);
    return NextResponse.json({ ok: false, error: "Payment initialization failed" }, { status: 500 });
  }
}