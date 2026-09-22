import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same rule the waitlist table enforces: any ISO country code. The waitlist
// exists for markets we don't serve yet — restricting it to the Paystack-ready
// list would defeat the whole point — so we keep the gate as permissive as the
// DB policy (`country ~ '^[A-Z]{2}$'`).
const COUNTRY_RE = /^[A-Z]{2}$/;
const VALID_PLANS = ["free", "pro", "family"];

export async function POST(req: Request) {
  // Tight window: an anon visitor can join the waitlist at most a handful of
  // times per minute, so bots can't flood the table with junk.
  const rl = rateLimit(req, 15, 60000);
  if (rl) return rl;

  if (!sbUrl || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
  }

  let body: { email?: string; country?: string; plan?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const country = String(body.country || "GH").toUpperCase();
  const plan = String(body.plan || "free").toLowerCase();

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!COUNTRY_RE.test(country)) {
    return NextResponse.json({ ok: false, error: "Invalid country code." }, { status: 400 });
  }
  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json({ ok: false, error: "Invalid plan." }, { status: 400 });
  }

  try {
    const sb = createClient(sbUrl, serviceKey);
    // The unique (lower(email), country) index swallows duplicates — a repeat
    // join becomes a no-op returning the existing row's id, not an error.
    const { data, error } = await sb
      .from("waitlist")
      .upsert(
        [{ email, country, plan }],
        { onConflict: "lower(email),country", ignoreDuplicates: true }
      )
      .select("id");

    if (error) throw error;
    if (!data || data.length === 0) {
      // Duplicate hit the ignoreDuplicates path — still a successful join.
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ ok: true, id: data[0].id });
  } catch (e) {
    console.error("Waitlist join failed:", e);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
