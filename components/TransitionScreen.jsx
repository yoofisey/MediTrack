"use client";

import { useState, useEffect, useRef } from "react";
import { CSS } from "@/lib/constants";

export default function TransitionScreen({ emoji, message, sub, showMessages = false, fadeOut = false }) {
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);
  const prevStep = useRef(0);
  const showDefault = !message && !sub;
  const key = showDefault ? "default" : `${emoji}-${message}-${sub}`;

  const msgs = ["Verifying your session", "Syncing your data", "Almost ready"];

  useEffect(() => {
    if (!showDefault || !showMessages) return;
    const timers = msgs.map((_, i) =>
      setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          prevStep.current = i;
          setStep(i);
          setFading(false);
        }, 200);
      }, (i + 1) * 1400)
    );
    return () => timers.forEach(clearTimeout);
  }, [showDefault, showMessages]);

  return (
    <div className={`trans-screen${fadeOut ? " fade-out" : ""}`}>
      <style>{CSS}</style>
      <div
        className="trans-bg-orb"
        style={{
          top: "-25%", right: "-18%", width: "75%", height: "75%",
          background: "radial-gradient(circle, rgba(80,160,255,.28) 0%, transparent 65%)",
          animation: "orbFloat 9s ease-in-out infinite alternate",
        }}
      />
      <div
        className="trans-bg-orb"
        style={{
          bottom: "-25%", left: "-18%", width: "65%", height: "65%",
          background: "radial-gradient(circle, rgba(60,130,255,.18) 0%, transparent 65%)",
          animation: "orbFloat2 11s ease-in-out infinite alternate",
        }}
      />
      <div
        className="trans-bg-orb"
        style={{
          top: "40%", left: "50%", width: "50%", height: "50%",
          background: "radial-gradient(circle, rgba(120,180,255,.1) 0%, transparent 60%)",
          animation: "orbFloat3 13s ease-in-out infinite alternate",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div key={key} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 32px" }}>
        <div className="trans-logo-wrap">
          <div className="trans-logo-ring" />
          <div className="trans-logo">
            <svg viewBox="0 0 100 100" width={48} height={48} fill="white">
              <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="2.5" strokeOpacity=".2" />
              <circle cx="50" cy="14" r="5.5" fill="white" />
              <circle cx="50" cy="86" r="5.5" fill="white" />
              <text x="24" y="58" fontFamily="system-ui,sans-serif" fontSize="34" fontWeight="700" fill="white">A</text>
              <rect x="56" y="38" width="4" height="18" rx="2" fill="white" transform="translate(58,47)" />
              <rect x="52" y="43" width="16" height="4" rx="2" fill="white" transform="translate(60,45)" />
            </svg>
          </div>
        </div>

        <div className="trans-content" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {showDefault ? (
            <>
              <div className="trans-title">Adhera</div>
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
