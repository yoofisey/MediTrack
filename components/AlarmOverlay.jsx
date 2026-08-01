"use client";

import { useEffect, useState } from "react";
import { Flame, Check } from "lucide-react";

export default function AlarmOverlay({ alarm, onDismiss, onLogDose }) {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!alarm) return;
    setShake(true);
    const t = setTimeout(() => setShake(false), 600);
    return () => clearTimeout(t);
  }, [alarm]);

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
        background:"linear-gradient(180deg,#1a1a2e 0%,#0f0f1a 100%)",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding:32,
        animation:"alarmFadeIn .4s ease-out",
      }}
    >
      <style>{`
        @keyframes alarmFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes alarmPulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,59,48,.4)}50%{transform:scale(1.05);box-shadow:0 0 0 20px rgba(255,59,48,0)}}
        @keyframes alarmShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-8px)}30%{transform:translateX(8px)}45%{transform:translateX(-6px)}60%{transform:translateX(6px)}75%{transform:translateX(-3px)}90%{transform:translateX(3px)}}
        @keyframes alarmGlow{0%,100%{box-shadow:0 0 20px rgba(255,59,48,.3)}50%{box-shadow:0 0 40px rgba(255,59,48,.6)}}
      `}</style>

      <div style={{
        width:96,height:96,borderRadius:"50%",
        background:"linear-gradient(135deg,#ff3b30,#ff6b3d)",
        display:"grid",placeItems:"center",
        marginBottom:24,
        animation: shake ? "alarmShake .5s ease" : "alarmPulse 1.5s ease-in-out infinite",
      }}>
        <svg viewBox="0 0 100 100" width={48} height={48}>
          <text x="50" y="62" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="52" fontWeight="700" fill="white">!</text>
        </svg>
      </div>

      <div style={{
        fontSize:13,fontWeight:700,color:"#ff3b30",
        letterSpacing:2,textTransform:"uppercase",marginBottom:8,
        textShadow:"0 0 20px rgba(255,59,48,.5)",
      }}>
        {isReminder ? "Upcoming Reminder" : "Dose Due Now"}
      </div>

      <div style={{fontSize:30,fontWeight:800,color:"white",textAlign:"center",marginBottom:6}}>
        {med.name}
      </div>

      <div style={{fontSize:20,fontWeight:600,color:"rgba(255,255,255,.6)",textAlign:"center",marginBottom:20}}>
        {med.dosage_amount} {med.dosage_unit}
      </div>

      {med.notes && (
        <div style={{fontSize:14,color:"rgba(255,255,255,.4)",textAlign:"center",marginBottom:20,maxWidth:300,lineHeight:1.5}}>
          {med.notes}
        </div>
      )}

      <div style={{fontSize:13,color:"rgba(255,255,255,.3)",marginBottom:36}}>
        {day}{streak > 0 ? <span style={{display:"inline-flex",alignItems:"center",gap:4}}>  ·  <Flame size={13}/> {streak} day streak</span> : ""}
      </div>

      {onLogDose && (
        <button onClick={e => { e.stopPropagation(); onLogDose(med); }}
          style={{
            padding:"16px 56px",borderRadius:16,border:"none",
            background:"linear-gradient(135deg,#34c759,#30b350)",color:"white",
            fontSize:18,fontWeight:700,cursor:"pointer",
            boxShadow:"0 8px 32px rgba(52,199,89,.4)",
            marginBottom:12,fontFamily:"inherit",
            transition:"transform .15s, box-shadow .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span style={{display:"inline-flex",alignItems:"center",gap:8}}><Check size={18} strokeWidth={3}/> Log Dose</span>
        </button>
      )}

      <button onClick={e => { e.stopPropagation(); onDismiss(); }}
        style={{
          padding:"12px 40px",borderRadius:14,border:"1px solid rgba(255,255,255,.15)",
          background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.6)",
          fontSize:15,fontWeight:600,cursor:"pointer",
          fontFamily:"inherit",
          transition:"background .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
      >
        Dismiss
      </button>

      <div style={{fontSize:12,color:"rgba(255,255,255,.2)",marginTop:24}}>
        Tap anywhere or press Escape
      </div>
    </div>
  );
}
