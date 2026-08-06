import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

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

  let body: { reference?: string; plan?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { reference, plan, email } = body;

  if (!reference || !["pro", "family"].includes(plan || "")) {
    return NextResponse.json({ ok: false, error: "Invalid parameters" }, { status: 400 });
  }

  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "Paystack secret not configured" }, { status: 500 });
  }

  try {
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json({ ok: false, error: "Paystack verification failed" }, { status: 500 });
    }

    const verifyData = await verifyRes.json();

    if (verifyData.status !== true || verifyData.data?.status !== "success") {
      return NextResponse.json({ ok: false, error: "Payment not verified" }, { status: 400 });
    }

    const paystackEmail = verifyData.data?.customer?.email || "";
    if (email && paystackEmail && email !== paystackEmail) {
      return NextResponse.json({ ok: false, error: "Email mismatch" }, { status: 400 });
    }

    const matchEmail = email || paystackEmail;
    if (!matchEmail) {
      return NextResponse.json({ ok: false, error: "No email to match" }, { status: 400 });
    }

    const { data: profile, error: profileErr } = await sb
      .from("profiles")
      .select("id, plan")
      .eq("email", matchEmail)
      .single();

    if (profileErr || !profile) {
      console.error("Verify: profile not found for", matchEmail);
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    if (profile.plan === plan) {
      return NextResponse.json({ ok: true, already_active: true });
    }

    const { error: updateErr } = await sb
      .from("profiles")
      .update({ plan })
      .eq("id", profile.id);

    if (updateErr) {
      console.error("Verify: update failed", updateErr);
      return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
    }

    console.log(`Paystack verify: tier upgraded to ${plan} for ${matchEmail} (ref: ${reference})`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Paystack verify error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}