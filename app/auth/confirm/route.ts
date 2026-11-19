import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const fallback = type === "email" ? "/" : "/reset-password";
  const next = searchParams.get("next") ?? fallback;

  const safeNext = next.startsWith("/") && !next.includes("://") ? next : fallback;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type === "email" ? "email" : "magiclink",
    });
    if (!error) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = safeNext;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = fallback;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}
