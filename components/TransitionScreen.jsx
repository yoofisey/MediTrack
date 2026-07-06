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
          <svg viewBox="0 0 24 24" fill="white" width={48} height={48}>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-4H6v-2h4V7h2v4h4v2h-4v4z"/>
          </svg>
        </div>
        <div className="trans-title">MediTrack</div>
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
