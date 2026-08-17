import { NextResponse } from "next/server";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_PLANS: Record<string, { pro: string; family: string }> = {
  GH: { pro: "PLN_w5rq3bkd5uh5mqj", family: "PLN_h9mlqfmujuh74c9" },
};
const PLAN_AMOUNTS: Record<string, Record<string, number>> = {
  GH: { pro: 1500, family: 3500 },
};

export async function POST(req: Request) {
  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "Paystack not configured" }, { status: 500 });
  }

  let body: { plan?: string; email?: string; country?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { plan, email, country } = body;
  if (!plan || !["pro", "family"].includes(plan) || !email) {
    return NextResponse.json({ ok: false, error: "Invalid parameters" }, { status: 400 });
  }

  const countryCode = (country || "GH").toUpperCase();
  const planKey = plan as "pro" | "family";
  const planCode = PAYSTACK_PLANS[countryCode]?.[planKey];
  const amount = PLAN_AMOUNTS[countryCode]?.[planKey];
  if (!planCode || !amount) {
    return NextResponse.json({ ok: false, error: "Plan not available in your country" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        plan: planCode,
        currency: countryCode === "GH" ? "GHS" : countryCode === "NG" ? "NGN" : countryCode === "ZA" ? "ZAR" : "KES",
        metadata: { plan, country: countryCode },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
      console.error("Paystack init error:", data);
      return NextResponse.json({ ok: false, error: data.message || "Failed to initialize payment" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, access_code: data.data.access_code });
  } catch (e) {
    console.error("Paystack init failed:", e);
    return NextResponse.json({ ok: false, error: "Payment initialization failed" }, { status: 500 });
  }
}
