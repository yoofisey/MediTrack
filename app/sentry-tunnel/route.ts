import { NextRequest, NextResponse } from "next/server";

const SENTRY_HOST_RE = /^[a-z0-9.-]+\.ingest(?:\.[a-z0-9.-]+)?\.sentry\.io$/i;

function getAllowedSentryTargets() {
  const dsns = [process.env.SENTRY_DSN, process.env.NEXT_PUBLIC_SENTRY_DSN].filter(Boolean) as string[];
  const targets = new Set<string>();
  for (const dsn of dsns) {
    try {
      const u = new URL(dsn);
      const projectId = u.pathname.replace(/^\//, "").split("/")[0];
      if (!projectId || !SENTRY_HOST_RE.test(u.hostname)) continue;
      targets.add(`${u.protocol}//${u.hostname}/api/${projectId}/envelope/`);
    } catch {}
  }
  return targets;
}

export async function POST(req: NextRequest) {
  try {
    const allowed = getAllowedSentryTargets();
    if (allowed.size === 0) {
      return NextResponse.json({ ok: false, error: "Sentry not configured" }, { status: 503 });
    }

    const envelope = await req.text();
    const [headerLine] = envelope.split("\n");
    let dsn = "";
    try {
      const header = JSON.parse(headerLine || "{}");
      dsn = typeof header?.dsn === "string" ? header.dsn : "";
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid envelope" }, { status: 400 });
    }

    let target = "";
    try {
      const u = new URL(dsn);
      const projectId = u.pathname.replace(/^\//, "").split("/")[0];
      if (!projectId || !SENTRY_HOST_RE.test(u.hostname)) {
        return NextResponse.json({ ok: false, error: "Invalid Sentry target" }, { status: 400 });
      }
      target = `${u.protocol}//${u.hostname}/api/${projectId}/envelope/`;
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid Sentry target" }, { status: 400 });
    }

    if (!allowed.has(target)) {
      return NextResponse.json({ ok: false, error: "Forbidden Sentry target" }, { status: 403 });
    }

    const upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body: envelope,
      cache: "no-store",
    });

    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") || "application/json" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Tunnel failed" }, { status: 500 });
  }
}
