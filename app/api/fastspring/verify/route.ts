import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";
import {
  getFastSpringAuthHeader,
  getFastSpringConfig,
  planForFastSpringProduct,
  fastspringCountryStatus,
} from "@/lib/payments-server";

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function extractPlan(data: any): string {
  const tags = data.tags;
  if (Array.isArray(tags)) {
    for (const t of tags) {
      if (t && t.name === "plan" && Array.isArray(t.values) && ["pro", "family"].includes(t.values[0])) {
        return t.values[0];
      }
    }
  }
  const products = data.products;
  if (Array.isArray(products)) {
    for (const p of products) {
      const plan = planForFastSpringProduct(p?.product || p?.path || "");
      if (plan) return plan;
    }
  }
  return "";
}

function getAdminClient() {
  if (!sbUrl || !serviceKey) return null;
  return createClient(sbUrl, serviceKey);
}

export async function POST(req: Request) {
  const rl = rateLimit(req, 10, 60000);
  if (rl) return rl;

  const sb = getAdminClient();
  if (!sb) return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
  if (!anonKey) return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token || token === anonKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { reference?: string; country?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { reference, country } = body;
  if (!reference || !/^[A-Za-z0-9_-]+$/.test(reference)) {
    return NextResponse.json({ ok: false, error: "Invalid reference" }, { status: 400 });
  }

  const countryCode = (country || "").toUpperCase();
  if (countryCode && fastspringCountryStatus(countryCode) === "paystack") {
    return NextResponse.json({ ok: false, error: "Paystack handles this country" }, { status: 400 });
  }

  const fs = getFastSpringConfig();
  if (!fs.username || !fs.password) {
    return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
  }

  const { data: existingRef } = await sb
    .from("payment_references").select("id").eq("user_id", user.id).eq("reference", reference).maybeSingle();
  if (existingRef) {
    return NextResponse.json({ ok: true, already_active: true });
  }

  try {
    const orderRes = await fetch(`https://api.fastspring.com/orders/${reference}`, {
      headers: { Authorization: getFastSpringAuthHeader(fs), "Content-Type": "application/json" },
    });

    if (!orderRes.ok) {
      return NextResponse.json({ ok: false, error: "FastSpring verification failed" }, { status: 500 });
    }

    const order = await orderRes.json();
    const completed = order.completed === true || order.state === "complete";
    if (!completed) {
      return NextResponse.json({ ok: false, error: "Payment not verified" }, { status: 400 });
    }

    if (Array.isArray(order.refunds) && order.refunds.length) {
      return NextResponse.json({ ok: false, error: "Payment was refunded" }, { status: 400 });
    }

    const plan = extractPlan(order);
    if (!plan) {
      return NextResponse.json({ ok: false, error: "Invalid payment" }, { status: 400 });
    }

    const orderEmail = order.email || "";
    if (!orderEmail || orderEmail !== user.email) {
      return NextResponse.json({ ok: false, error: "Email mismatch" }, { status: 400 });
    }

    if (typeof order.total !== "number" || order.total <= 0) {
      return NextResponse.json({ ok: false, error: "Payment not verified" }, { status: 400 });
    }

    const { error: refErr } = await sb
      .from("payment_references").insert({ user_id: user.id, reference, plan, paid_at: new Date().toISOString() });
    if (refErr) {
      if (refErr.code === "23505") {
        return NextResponse.json({ ok: true, already_active: true });
      }
      console.error("payment_references insert failed:", refErr.message);
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
      .from("profiles").update({ plan, paid_at: new Date().toISOString() }).eq("id", user.id);

    if (updateErr) return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("FastSpring verify error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}