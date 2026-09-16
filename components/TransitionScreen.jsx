"use client";

import { useState, useEffect } from "react";
import { CSS } from "@/lib/constants";

export default function TransitionScreen({ icon, message, sub, showMessages = false, fadeOut = false }) {
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);
  const showDefault = !message && !sub;
  const key = showDefault ? "default" : `${message}-${sub}`;

  const msgs = ["Verifying your session", "Syncing your data", "Almost ready"];

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
        top: "-28%", left: "50%", width: "70%", height: "70%", transform: "translateX(-50%)",
        background: "radial-gradient(circle, rgba(0,122,255,.10) 0%, transparent 60%)",
        animation: "aurora1 11s ease-in-out infinite",
      }} />
      <div className="trans-aurora" style={{
        bottom: "-30%", right: "-18%", width: "64%", height: "60%",
        background: "radial-gradient(circle, rgba(88,86,214,.08) 0%, transparent 55%)",
        animation: "aurora2 13s ease-in-out infinite",
      }} />

      <div key={key} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 32px", zIndex: 1 }}>
        <div className="trans-logo-wrap">
          <div className="trans-logo-glow" />
          <div className="trans-orbit">
            <span className="trans-orbit-dot" />
            <span className="trans-orbit-dot alt" />
          </div>
          <div className="trans-logo">
            <img src="/icon-512.png?v=3" alt="Adhera" />
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
              <div className="trans-underline" />
              <div className="trans-msg">Your Personal Treatment Companion</div>
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
              {icon && (
                <div style={{ marginTop: 24, marginBottom: 4, lineHeight: 1, animation: "fadeUp .5s cubic-bezier(.175,.885,.32,1.275) both", display:"inline-flex", justifyContent:"center" }}>{icon}</div>
              )}
              <div style={{ marginTop: icon ? 4 : 0, marginBottom: 6, fontSize: 20, fontWeight: 700, color: "var(--t1)", textAlign: "center", letterSpacing: "-.3px" }}>{message || "Loading…"}</div>
              {sub && <div style={{ fontSize: 15, color: "var(--t3)", textAlign: "center", padding: "0 20px", lineHeight: 1.5, marginTop: 6, fontWeight: 500 }}>{sub}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
