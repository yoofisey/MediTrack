import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/reset-password";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://luxtopkzdyflbejwgniq.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1eHRvcGt6ZHlmbGJlandnbmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY5NzAsImV4cCI6MjA5NzkxMjk3MH0.zcvzd5vOBxw6xE00EIrt7NBcEnFa95FxODsD2h1M-OU"
  );

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = next;
      return NextResponse.redirect(redirectUrl);
    }
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/reset-password";
  return NextResponse.redirect(redirectUrl);
}
