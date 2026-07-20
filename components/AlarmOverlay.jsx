"use client";

import { useEffect } from "react";

export default function AlarmOverlay({ alarm, onDismiss }) {
  useEffect(() => {
    if (!alarm) return;
    const handler = e => { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") onDismiss(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [alarm, onDismiss]);

  if (!alarm) return null;

  const { med, day, streak, isReminder } = alarm;

  return (
    <div onClick={onDismiss}
      style={{
        position:"fixed",inset:0,zIndex:9999,
        background:"rgba(0,0,0,.85)",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding:32,
        animation:"alarmFadeIn .3s ease-out",
      }}
    >
      <style>{`@keyframes alarmFadeIn{from{opacity:0}to{opacity:1}}@keyframes alarmPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}@keyframes alarmShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}`}</style>

      <div style={{animation:"alarmPulse 1.2s ease-in-out infinite",marginBottom:8}}>
        <svg viewBox="0 0 100 100" width={56} height={56}>
          <circle cx="50" cy="50" r="48" fill="none" stroke="#ff3b30" strokeWidth="4"/>
          <text x="50" y="62" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="52" fontWeight="700" fill="#ff3b30">!</text>
        </svg>
      </div>

      <div style={{fontSize:14,fontWeight:600,color:"#ff3b30",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>
        {isReminder ? "Upcoming Reminder" : "Dose Due"}
      </div>

      <div style={{fontSize:28,fontWeight:700,color:"white",textAlign:"center",marginBottom:4}}>
        {med.name}
      </div>

      <div style={{fontSize:20,fontWeight:600,color:"rgba(255,255,255,.7)",textAlign:"center",marginBottom:20}}>
        {med.dosage_amount} {med.dosage_unit}
      </div>

      {med.notes && (
        <div style={{fontSize:14,color:"rgba(255,255,255,.5)",textAlign:"center",marginBottom:20,maxWidth:320,lineHeight:1.4}}>
          {med.notes}
        </div>
      )}

      <div style={{fontSize:13,color:"rgba(255,255,255,.35)",marginBottom:32}}>
        {day}{streak > 0 ? `  ·  🔥 ${streak} day streak` : ""}
      </div>

      <button onClick={e => { e.stopPropagation(); onDismiss(); }}
        style={{
          padding:"14px 48px",borderRadius:14,border:"none",
          background:"#ff3b30",color:"white",
          fontSize:17,fontWeight:700,cursor:"pointer",
          boxShadow:"0 8px 32px rgba(255,59,48,.4)",
          transition:"transform .15s, box-shadow .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(255,59,48,.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(255,59,48,.4)"; }}
      >
        Dismiss
      </button>

      <div style={{fontSize:12,color:"rgba(255,255,255,.25)",marginTop:20}}>
        Tap anywhere or press Escape
      </div>
    </div>
  );
}
