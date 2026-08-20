import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const FROM_EMAIL = "noreply@useadhera.com";

let resend: Resend | null = null;
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function POST(req: Request) {
  let body: { to?: string; senderName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const to = (body.to || "").toLowerCase().trim();
  const senderName = (body.senderName || "Adhera Team").trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const senderNameRaw = (body.senderName || "Adhera Team").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  // Family invitations are a Family-tier feature — require an authenticated
  // sender whose profile is on the family plan.
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!token || !supabaseAnonKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const sb = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authErr } = await sb.auth.getUser(token);
  const userId = authData?.user?.id;
  if (authErr || !userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await sb.from("profiles").select("plan").eq("id", userId).maybeSingle();
  if (profile?.plan !== "family") {
    return NextResponse.json({ ok: false, error: "Family plan required to send invites" }, { status: 403 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const acceptUrl = `${origin}/?invite=1`;

  try {
    const { error } = await getResend().emails.send({
      from: `${senderNameRaw} <${FROM_EMAIL}>`,
      to: [to],
      subject: `You've been invited to join ${senderNameRaw}'s family group on Adhera`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">You've been invited to join a family group</h2>
          <p>Hi,</p>
          <p><strong>${senderName}</strong> has invited you to join their family medication tracking group on Adhera.</p>
          <p>With Adhera, you can:</p>
          <ul>
            <li>Track medications for yourself and your family</li>
            <li>Set up dose reminders</li>
            <li>Receive alerts when doses are missed</li>
            <li>Access adherence reports and share them with healthcare providers</li>
          </ul>
          <p>To accept the invitation, sign in or create an account with the email address this invite was sent to:</p>
          <p>
            <a href="${acceptUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </p>
          <p>Once you sign in, your family group invite will appear automatically.</p>
          <p>This invitation will expire in 7 days.</p>
          <p>If you have any questions, please contact support.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 12px; color: #6b7280;">You're receiving this email because you were invited to join a family group on Adhera.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend email error:", error);
      return NextResponse.json({ ok: false, error: "Failed to send invite email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Resend exception:", e);
    return NextResponse.json({ ok: false, error: "Failed to send invite email" }, { status: 500 });
  }
}
