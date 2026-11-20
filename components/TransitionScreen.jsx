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
    const timers = [];
    msgs.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setFading(true);
        timers.push(setTimeout(() => {
          setStep(i);
          setFading(false);
        }, 250));
      }, (i + 1) * 1600));
    });
    return () => timers.forEach(clearTimeout);
  }, [showDefault, showMessages]);

  const titleLetters = "Adherly".split("");

  return (
    <div className={`trans-screen${fadeOut ? " fade-out" : ""}`} role="status" aria-live="polite" aria-label="Loading Adherly">
      <style>{CSS}</style>

      <div key={key} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 32px", zIndex: 1 }}>
        <div className="trans-logo-wrap">
          <div className="trans-logo-glow" />
          <div className="trans-logo">
            <img src="/icon-512.png?v=3" alt="Adherly" />
          </div>
        </div>

        <div className="trans-content" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {showDefault ? (
            <>
              <div className="trans-title" aria-label="Adherly">{titleLetters.join("")}</div>
              <div className="trans-msg">Your Personal Treatment Companion</div>
              {showMessages ? (
                <div className="trans-status">
                  <div className={`trans-status-inner${fading ? " out" : ""}`}>
                    {msgs[Math.min(step, 2)]}
                  </div>
                </div>
              ) : (
                <div className="trans-loader" aria-hidden="true">
                  <div className="trans-loader-bar" />
                </div>
              )}
            </>
          ) : (
            <>
              {icon && (
                <div style={{ marginTop: 24, marginBottom: 4, lineHeight: 1, animation: "fadeUp .5s cubic-bezier(.175,.885,.32,1.275) both", display:"inline-flex", justifyContent:"center" }}>{icon}</div>
              )}
              <div style={{ marginTop: icon ? 4 : 0, marginBottom: 6, fontSize: 20, fontWeight: 800, color: "var(--t1)", textAlign: "center", letterSpacing: "-.4px" }}>{message || "Loading…"}</div>
              {sub && <div style={{ fontSize: 15, color: "var(--t2)", textAlign: "center", padding: "0 20px", lineHeight: 1.55, marginTop: 8, fontWeight: 500 }}>{sub}</div>}
              <div className="trans-loader" aria-hidden="true" style={{ marginTop: 20 }}>
                <div className="trans-loader-bar" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
