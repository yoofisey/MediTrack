"use client";

import { CSS } from "@/lib/constants";

export default function TransitionScreen({ emoji, message, sub }) {
  return (
    <div className="trans-screen">
      <style>{CSS}</style>
      <div style={{position:"absolute",top:-80,right:-80,width:280,height:280,background:"rgba(255,255,255,.07)",borderRadius:"50%"}}/>
      <div style={{position:"absolute",bottom:-60,left:-60,width:200,height:200,background:"rgba(255,255,255,.05)",borderRadius:"50%"}}/>
      <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div className="trans-logo">
          <svg viewBox="0 0 100 100" width={48} height={48} fill="white">
            <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="3" strokeOpacity=".3"/>
            <circle cx="50" cy="14" r="6" fill="white"/>
            <circle cx="50" cy="86" r="6" fill="white"/>
            <text x="24" y="58" fontFamily="system-ui,sans-serif" fontSize="34" fontWeight="700" fill="white">A</text>
            <rect x="56" y="38" width="4" height="18" rx="2" fill="white" transform="translate(58,47)"/>
            <rect x="52" y="43" width="16" height="4" rx="2" fill="white" transform="translate(60,45)"/>
          </svg>
        </div>
        <div className="trans-title">Adhera</div>
        <div style={{marginTop:32,marginBottom:8,fontSize:44}}>{emoji || "💊"}</div>
        <div className="trans-msg" style={{fontSize:22,fontWeight:700,marginBottom:6}}>{message || "Loading…"}</div>
        {sub && <div style={{fontSize:15,color:"rgba(255,255,255,.75)",textAlign:"center",padding:"0 40px",lineHeight:1.5}}>{sub}</div>}
        <div className="trans-dots" style={{marginTop:40}}>
          <div className="trans-dot"/><div className="trans-dot"/><div className="trans-dot"/>
        </div>
      </div>
    </div>
  );
}
