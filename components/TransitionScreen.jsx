"use client";

import { useState, useEffect, useMemo } from "react";
import { CSS } from "@/lib/constants";

export default function TransitionScreen({ emoji, message, sub, showMessages = false, fadeOut = false }) {
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const showDefault = !message && !sub;
  const key = showDefault ? "default" : `${emoji}-${message}-${sub}`;

  const msgs = ["Verifying your session", "Syncing your data", "Almost ready"];

  const particles = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => ({
      id: i,
      size: 1.5 + Math.random() * 2.5,
      left: 8 + Math.random() * 84,
      bottom: -5 - Math.random() * 15,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 6,
      opacity: 0.15 + Math.random() * 0.25,
    })), []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!showDefault || !showMessages) return;
    const timers = msgs.map((_, i) =>
      setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          setStep(i);
          setFading(false);
        }, 250);
      }, (i + 1) * 1600)
    );
    return () => timers.forEach(clearTimeout);
  }, [showDefault, showMessages]);

  const titleLetters = "Adhera".split("");

  return (
    <div className={`trans-screen${fadeOut ? " fade-out" : ""}`}>
      <style>{CSS}</style>

      <div className="trans-aurora" style={{
        top: "-30%", right: "-20%", width: "80%", height: "80%",
        background: "radial-gradient(circle, rgba(0,100,255,.18) 0%, transparent 60%)",
        animation: "aurora1 12s ease-in-out infinite",
      }} />
      <div className="trans-aurora" style={{
        bottom: "-30%", left: "-20%", width: "70%", height: "70%",
        background: "radial-gradient(circle, rgba(0,180,255,.1) 0%, transparent 55%)",
        animation: "aurora2 14s ease-in-out infinite",
      }} />
      <div className="trans-aurora" style={{
        top: "30%", left: "30%", width: "55%", height: "55%",
        background: "radial-gradient(circle, rgba(80,140,255,.07) 0%, transparent 50%)",
        animation: "aurora3 16s ease-in-out infinite",
      }} />

      {mounted && particles.map(p => (
        <div key={p.id} className="trans-particle" style={{
          width: p.size, height: p.size,
          left: `${p.left}%`, bottom: `${p.bottom}%`,
          opacity: p.opacity,
          animation: `particleRise ${p.duration}s ${p.delay}s linear infinite`,
        }} />
      ))}

      <div className="trans-beam" style={{ left: "50%", transform: "translateX(-50%)" }} />

      <div key={key} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 32px" }}>
        <div className="trans-logo-wrap">
          <div className="trans-logo-glow" />
          <div className="trans-ring trans-ring-outer" />
          <div className="trans-ring trans-ring-inner" />
          <div className="trans-logo">
            <svg viewBox="0 0 48 48" width="52" height="52" fill="white">
              <rect x="17" y="4" width="14" height="40" rx="5" fill="white" />
              <rect x="4" y="17" width="40" height="14" rx="5" fill="white" />
            </svg>
          </div>
        </div>

        <div className="trans-content" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {showDefault ? (
            <>
              <div className="trans-title">
                {titleLetters.map((letter, i) => (
                  <span key={i} className="trans-title-letter">{letter}</span>
                ))}
              </div>
              <div className="trans-msg">Your Personal Treatment Companion</div>
              <div className="trans-bar-wrap">
                <div className="trans-bar-fill" />
              </div>
              {showMessages && (
                <div className="trans-status">
                  <div className={`trans-status-inner${fading ? " out" : ""}`}>
                    {msgs[Math.min(step, 2)]}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {emoji && emoji !== "💊" && (
                <div style={{ marginTop: 24, marginBottom: 4, fontSize: 52, lineHeight: 1, animation: "fadeUp .5s cubic-bezier(.175,.885,.32,1.275) both" }}>{emoji}</div>
              )}
              <div style={{ marginTop: emoji && emoji !== "💊" ? 4 : 0, marginBottom: 4, fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,.95)", textAlign: "center", letterSpacing: "-.3px" }}>{message || "Loading…"}</div>
              {sub && <div style={{ fontSize: 15, color: "rgba(255,255,255,.65)", textAlign: "center", padding: "0 20px", lineHeight: 1.5, marginTop: 6, fontWeight: 400 }}>{sub}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
