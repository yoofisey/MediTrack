"use client";

import { useState } from "react";
import { COUNTRIES, getPricing } from "@/lib/data";
import { Check } from "lucide-react";

const FEATURES = {
  free: [
    { label: "2 medications", ok: true },
    { label: "7-day history", ok: true },
    { label: "Dose reminders", ok: true },
    { label: "Adherence streaks", ok: true },
    { label: "Adherence reports", ok: false },
    { label: "Family profiles", ok: false },
  ],
  pro: [
    { label: "Unlimited medications", ok: true },
    { label: "Full history", ok: true },
    { label: "Adherence reports", ok: true },
    { label: "Doctor report sharing", ok: true },
    { label: "Refill reminders", ok: true },
    { label: "Interaction checker", ok: true },
    { label: "Caregiver alerts", ok: true },
  ],
  family: [
    { label: "Everything in Pro", ok: true },
    { label: "Up to 5 profiles", ok: true },
    { label: "Family dashboard", ok: true },
    { label: "Caregiver alerts", ok: true },
  ],
};

const CARD = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#f0f7ff 0%,#ffffff 40%)",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif",
  color: "#0f172a",
};

const HEADER = { maxWidth: 680, margin: "0 auto", padding: "56px 24px 24px", textAlign: "center" };
const GRID = {
  maxWidth: 880,
  margin: "0 auto",
  padding: "0 24px 48px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 16,
};

export default function PricingPage() {
  const [country, setCountry] = useState("GH");
  const { pricing } = getPricing(country);
  const selCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

  const plans = [
    { id: "free", name: "Free", price: "Free", per: "forever", desc: "Getting started with your own meds.", highlight: false, cta: "Start free", solid: false, features: FEATURES.free },
    { id: "pro", name: "Pro", price: pricing.pro.label, per: "/mo", desc: "Full tracking, reports, and reminders.", highlight: true, cta: "Start free", solid: true, features: FEATURES.pro },
    { id: "family", name: "Family", price: pricing.family.label, per: "/mo", desc: "Manage medications for up to 5 people.", highlight: false, cta: "Choose Family", solid: true, features: FEATURES.family },
  ];

  return (
    <div style={CARD}>
      <div style={HEADER}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#2563eb", marginBottom: 12 }}>Pricing</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.6px", margin: 0, marginBottom: 10, lineHeight: 1.15 }}>Simple, honest pricing</h1>
        <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.6, maxWidth: 420, margin: "0 auto 24px" }}>
          Start free forever. Upgrade when you want reports, reminders, and tools for the whole family.
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "8px 14px", marginBottom: 32 }}>
          <span style={{ fontSize: 14, color: "#475569", fontWeight: 600 }}>Country</span>
          <select value={country} onChange={e => setCountry(e.target.value)}
            style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", border: "none", background: "transparent", outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {COUNTRIES.filter(c => c.code !== "OTHER").map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 28 }}>{selCountry.flag} {selCountry.name} · {pricing.note}</div>
      </div>

      <div style={GRID}>
        {plans.map(p => (
          <div key={p.id} style={{
            background: "white", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column",
            border: p.highlight ? "2px solid #2563eb" : "1px solid #e2e8f0",
            boxShadow: p.highlight ? "0 8px 40px rgba(37,99,235,.15)" : "0 1px 8px rgba(0,0,0,.04)",
            position: "relative",
          }}>
            {p.highlight && (
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#2563eb,#5856d6)", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99 }}>Most popular</div>
            )}
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14, lineHeight: 1.4 }}>{p.desc}</div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.5px" }}>{p.price}</span>
              <span style={{ fontSize: 13, color: "#94a3b8" }}> {p.per}</span>
            </div>
            <a href="/" style={{
              display: "block", textAlign: "center", padding: "12px 16px", borderRadius: 12, fontSize: 15, fontWeight: 700,
              textDecoration: "none", marginBottom: 18, fontFamily: "inherit",
              ...(p.solid
                ? { background: "linear-gradient(135deg,#2563eb,#5856d6)", color: "white", boxShadow: "0 4px 16px rgba(37,99,235,.3)" }
                : { background: "#f1f5f9", color: "#0f172a" }),
            }}>{p.cta}</a>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {p.features.map(f => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: f.ok ? "#334155" : "#cbd5e1" }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: f.ok ? "#dcfce7" : "#f1f5f9", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Check size={11} strokeWidth={3} color={f.ok ? "#16a34a" : "#cbd5e1"} />
                  </span>
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <PricingFooter enterprise={pricing.enterprise} />
    </div>
  );
}

function PricingFooter({ enterprise }) {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 48px" }}>
      <div style={{ background: "white", borderRadius: 20, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,.04)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Clinic, hospital, or NGO?</div>
          <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>
            {enterprise.label}/month for teams — API access, white-label branding, and HIPAA/GDPR compliance.
          </div>
        </div>
        <a href="/" style={{ background: "#0f172a", color: "white", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "12px 20px", borderRadius: 12, fontFamily: "inherit" }}>Contact sales</a>
      </div>
    </div>
  );
}
