import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";
import {
  getFastSpringAuthHeader,
  getFastSpringConfig,
  getFastSpringProduct,
  fastspringCountryStatus,
} from "@/lib/payments-server";
import type { PaystackPlanKey } from "@/lib/payments-server";

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(req: Request) {
  const rl = rateLimit(req, 10, 60000);
  if (rl) return rl;

  const fs = getFastSpringConfig();
  if (!sbUrl || !serviceKey || !anonKey || !fs.username || !fs.password) {
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

  const countryCode = (country || "").toUpperCase();
  if (!countryCode) {
    return NextResponse.json({ ok: false, error: "Invalid country" }, { status: 400 });
  }

  const status = fastspringCountryStatus(countryCode);
  if (status === "paystack") {
    return NextResponse.json({ ok: false, error: "Paystack handles this country" }, { status: 400 });
  }
  if (status === "blocked") {
    return NextResponse.json({ ok: false, error: "Payments not available in your country" }, { status: 400 });
  }

  const product = getFastSpringProduct(plan as PaystackPlanKey);
  const email = user.email;
  if (!product || !email) {
    return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
  }

  const origin = req.headers.get("origin") || "https://www.useadhera.com";

  try {
    const res = await fetch("https://api.fastspring.com/orders", {
      method: "POST",
      headers: {
        Authorization: getFastSpringAuthHeader(fs),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currency: fs.currency,
        customer: { email },
        products: [{ path: product, quantity: 1 }],
        completionUrl: `${origin}/`,
        cancelUrl: `${origin}/`,
        tags: [
          { name: "plan", values: [plan] },
          { name: "user_id", values: [user.id] },
          { name: "country", values: [countryCode] },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.order?.reference || !data.order?.url) {
      console.error("FastSpring init error:", data);
      const msg = data.message || data.errors?.[0]?.message || "Failed to initialize payment";
      return NextResponse.json({ ok: false, error: msg }, { status: 502 });
    }

    return NextResponse.json({ ok: true, url: data.order.url, reference: data.order.reference });
  } catch (e) {
    console.error("FastSpring init failed:", e);
    return NextResponse.json({ ok: false, error: "Payment initialization failed" }, { status: 500 });
  }
}