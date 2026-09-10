"use client";

import { useEffect, useState } from "react";
import { Lock, ShieldCheck, CreditCard, Check, CheckCircle2 } from "lucide-react";

const LOADER_STEPS = [
  "Initializing secure checkout",
  "Contacting payment provider",
  "Authorizing your payment",
  "Completing your upgrade",
];

export function CheckoutSheet({
  plan,
  billing,
  countryName,
  email,
  gatewayLabel,
  busy,
  err,
  canPay,
  ctaLabel,
  onPay,
  onClose,
}) {
  const rows = [
    { label: `${plan.name} subscription`, value: billing.amountLabel },
    { label: "Billing period", value: "Every month, cancel anytime" },
  ];

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{ maxHeight: "92dvh" }} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />

        {/* Brand header */}
        <div style={{ padding: "4px 20px 0", textAlign: "center" }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 16, margin: "0 auto 10px",
              background: "linear-gradient(135deg, var(--teal), var(--teal2))",
              display: "grid", placeItems: "center",
              boxShadow: "0 8px 28px color-mix(in srgb, var(--teal) 40%, transparent)",
              animation: "logoPop .5s cubic-bezier(.34,1.56,.64,1) both",
            }}
          >
            <svg viewBox="0 0 100 100" width={34} height={34} fill="white">
              <text x="50%" y="68%" textAnchor="middle" dominantBaseline="central" fontFamily="system-ui,sans-serif" fontSize="52" fontWeight="700" fill="white">A</text>
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.4px", marginBottom: 2, animation: "fadeUpCard .5s .05s ease both" }}>
            {plan.name}
          </div>
          <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 14, animation: "fadeUpCard .5s .1s ease both" }}>
            {plan.tagline}
          </div>
        </div>

        {/* Order summary */}
        <div style={{ margin: "0 20px", borderRadius: 16, background: "var(--input)", overflow: "hidden", animation: "fadeUpCard .5s .15s ease both" }}>
          {rows.map((r, i) => (
            <div
              key={r.label}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "13px 16px", fontSize: 14,
                borderTop: i === 0 ? "none" : "0.5px solid var(--sep)",
              }}
            >
              <span style={{ color: "var(--t2)" }}>{r.label}</span>
              <span style={{ fontWeight: 600, color: "var(--t1)", textAlign: "right" }}>
                {r.value}
              </span>
            </div>
          ))}
          <div
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "15px 16px", borderTop: "0.5px solid var(--sep)",
              background: "var(--card)",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>
              Total per month
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.3px", color: "var(--teal)", display: "flex", alignItems: "baseline", gap: 6 }}>
              {billing.amountLabel}
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--t3)" }}>/month</span>
            </span>
          </div>
        </div>

        {/* Payment method */}
        <div style={{ margin: "12px 20px 0", borderRadius: 16, background: "var(--input)", overflow: "hidden", animation: "fadeUpCard .5s .2s ease both" }}>
          <div style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--t1)", fontWeight: 500 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--card)", display: "grid", placeItems: "center" }}>
                <CreditCard size={15} strokeWidth={2.2} color="var(--teal)" />
              </span>
              {gatewayLabel}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--green)" }}>
              <ShieldCheck size={13} /> Secure
            </span>
          </div>
        </div>

        {/* Country + billing email */}
        <div style={{ margin: "12px 20px 0", display: "flex", gap: 10, animation: "fadeUpCard .5s .25s ease both" }}>
          <div style={{ flex: 1, borderRadius: 14, background: "var(--input)", padding: "11px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px", color: "var(--t3)", marginBottom: 3 }}>Billing in</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>{countryName}</div>
          </div>
          <div style={{ flex: 1.4, borderRadius: 14, background: "var(--input)", padding: "11px 14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px", color: "var(--t3)", marginBottom: 3 }}>Receipt to</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
          </div>
        </div>

        {err && (
          <div style={{ margin: "14px 20px 0", animation: "fadeUpCard .3s ease both" }}>
            <div style={{ background: "color-mix(in srgb, var(--red) 12%, var(--card))", color: "var(--red)", borderRadius: 12, padding: "11px 14px", fontSize: 13, lineHeight: 1.4, fontWeight: 500 }}>{err}</div>
          </div>
        )}

        <div style={{ padding: "16px 20px 0" }}>
          <button
            className="btn btn-primary"
            disabled={busy || !canPay}
            style={{ width: "100%", opacity: busy || !canPay ? 0.55 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={onPay}
          >
            <Lock size={16} strokeWidth={2.4} />
            {busy ? "Processing…" : ctaLabel}
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 14, fontSize: 11, color: "var(--t3)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ShieldCheck size={12} /> TLS-encrypted
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 size={12} /> Cancel anytime
            </span>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--t3)", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy</a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--t3)", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutLoading({ plan, color, onCancel, steps = LOADER_STEPS }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const id = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 900);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2147483000,
      background: "var(--bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "fadeIn .25s ease both",
      padding: "0 32px",
    }}>
      {/* soft brand glow */}
      <div style={{
        position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%)",
        width: 280, height: 280, borderRadius: "50%", pointerEvents: "none",
        background: `radial-gradient(circle, ${color}22 0%, transparent 60%)`,
        animation: "bgPulse 4s ease-in-out infinite",
      }} />

      <div style={{ position: "relative", marginBottom: 34 }}>
        <div style={{
          position: "absolute", inset: -14, borderRadius: "50%",
          border: "1.5px solid transparent", borderTopColor: color,
          animation: "spin 1.6s linear infinite", opacity: .7,
        }} />
        <div style={{
          position: "absolute", inset: -26, borderRadius: "50%",
          border: "1px solid transparent", borderBottomColor: `${color}88`,
          animation: "spin 2.6s linear infinite reverse", opacity: .5,
        }} />
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: "linear-gradient(135deg, var(--teal), var(--teal2))",
          display: "grid", placeItems: "center",
          boxShadow: `0 10px 32px ${color}33, 0 0 0 1px var(--glass-border) inset`,
          animation: "logoBreathe 2.2s ease-in-out infinite",
        }}>
          <svg viewBox="0 0 100 100" width={38} height={38} fill="white">
            <text x="50%" y="68%" textAnchor="middle" dominantBaseline="central" fontFamily="system-ui,sans-serif" fontSize="52" fontWeight="700" fill="white">A</text>
          </svg>
        </div>
      </div>

      <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-.3px", color: "var(--t1)", marginBottom: 6, textAlign: "center" }}>
        {plan?.name || "Secure checkout"}
      </div>

      <div style={{ minHeight: 22, fontSize: 14, color: "var(--t3)", marginBottom: 28, textAlign: "center", animation: "fadeIn .2s ease both" }}>
        {steps[step]}
      </div>

      {/* staged progress dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 30 }}>
        {steps.map((_, i) => (
          <span key={i} style={{
            width: i <= step ? 18 : 6, height: 6, borderRadius: 99,
            background: i <= step ? color : "var(--t4)",
            opacity: i <= step ? 1 : .4,
            transition: "all .4s cubic-bezier(.34,1.56,.64,1)",
          }} />
        ))}
      </div>

      <button onClick={onCancel} style={{
        marginTop: 8, padding: "10px 20px", border: "none", borderRadius: 12,
        background: "var(--card)", color: "var(--t3)", fontSize: 14, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
        boxShadow: "0 2px 10px rgba(0,0,0,.06)",
      }}>
        Cancel
      </button>
    </div>
  );
}

export function CheckoutFrame({ url, visible = true, tone = "#2563eb", onLoaded, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2147483000,
      background: "#fff",
      display: "flex", flexDirection: "column",
      opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none",
      transition: "opacity .25s ease",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px",
        background: "rgba(255,255,255,.96)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        borderBottom: "0.5px solid rgba(0,0,0,.08)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: `linear-gradient(135deg, ${tone}, #5856D6)`,
            display: "grid", placeItems: "center",
          }}>
            <svg viewBox="0 0 48 48" width={13} height={13} fill="white">
              <rect x="17" y="4" width="14" height="40" rx="5" fill="white" />
              <rect x="4" y="17" width="40" height="14" rx="5" fill="white" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", letterSpacing: "-.2px" }}>Secure checkout</span>
        </div>
        <button onClick={onClose} style={{
          border: "none", background: "transparent", cursor: "pointer", padding: "6px 8px",
          fontSize: 13, fontWeight: 600, color: "#2563eb", fontFamily: "inherit",
        }}>
          Cancel
        </button>
      </div>
      <iframe
        key={url}
        src={url}
        onLoad={onLoaded}
        title="Adhera secure payment"
        referrerPolicy="no-referrer-when-downgrade"
        style={{ flex: 1, width: "100%", border: "none", background: "#fff" }}
      />
    </div>
  );
}

export function CheckoutSuccess({ plan, color, onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 1400);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "var(--bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "fadeIn .25s ease both", padding: "0 32px", textAlign: "center",
    }}>
      <div style={{
        width: 84, height: 84, borderRadius: "50%",
        background: "linear-gradient(135deg, var(--green), #30C976)",
        display: "grid", placeItems: "center", marginBottom: 20,
        boxShadow: "0 12px 36px color-mix(in srgb, var(--green) 40%, transparent)",
        animation: "logoPop .5s cubic-bezier(.34,1.56,.64,1) both",
      }}>
        <Check size={40} strokeWidth={3} color="white" style={{ animation: "fadeIn .4s .25s ease both" }} />
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.3px", color: "var(--t1)", marginBottom: 8 }}>
        Welcome to {plan?.name || "Adhera"}!
      </div>
      <div style={{ fontSize: 14, color: "var(--t3)", maxWidth: 260, lineHeight: 1.5 }}>
        Your subscription is active. Enjoy full access right away.
      </div>
    </div>
  );
}