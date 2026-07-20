"use client";

import { CSS } from "@/lib/constants";

export default function TransitionScreen({ emoji, message, sub }) {
  const showDefault = !message && !sub;
  const key = showDefault ? "default" : `${emoji}-${message}-${sub}`;
  return (
    <div className="trans-screen">
      <style>{CSS}</style>
      <div className="trans-bg-orb" style={{top:"-30%",right:"-20%",width:"80%",height:"80%",background:"radial-gradient(circle,rgba(0,122,255,.3) 0%,transparent 70%)",animation:"orbFloat 8s ease-in-out infinite alternate"}}/>
      <div className="trans-bg-orb" style={{bottom:"-30%",left:"-20%",width:"70%",height:"70%",background:"radial-gradient(circle,rgba(0,122,255,.15) 0%,transparent 70%)",animation:"orbFloat 10s ease-in-out 1s infinite alternate"}}/>
      <div key={key} style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",padding:"0 32px"}}>
        <div className="trans-logo">
          <svg viewBox="0 0 100 100" width={44} height={44} fill="white">
            <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="3" strokeOpacity=".3"/>
            <circle cx="50" cy="14" r="6" fill="white"/>
            <circle cx="50" cy="86" r="6" fill="white"/>
            <text x="24" y="58" fontFamily="system-ui,sans-serif" fontSize="34" fontWeight="700" fill="white">A</text>
            <rect x="56" y="38" width="4" height="18" rx="2" fill="white" transform="translate(58,47)"/>
            <rect x="52" y="43" width="16" height="4" rx="2" fill="white" transform="translate(60,45)"/>
          </svg>
        </div>
        <div className="trans-content" style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
          {showDefault ? (
            <>
              <div className="trans-title">Adhera</div>
              <div className="trans-msg">Your Personal Treatment Companion</div>
            </>
          ) : (
            <>
              {emoji && emoji !== "💊" && (
                <div style={{marginTop:24,marginBottom:4,fontSize:52,lineHeight:1,animation:"emojiPop .5s cubic-bezier(.175,.885,.32,1.275) both"}}>{emoji}</div>
              )}
              <div style={{marginTop:emoji && emoji !== "💊" ? 4 : 0,marginBottom:4,fontSize:20,fontWeight:600,color:"rgba(255,255,255,.95)",textAlign:"center",letterSpacing:"-.3px"}}>{message || "Loading…"}</div>
              {sub && <div style={{fontSize:15,color:"rgba(255,255,255,.65)",textAlign:"center",padding:"0 20px",lineHeight:1.5,marginTop:6,fontWeight:400}}>{sub}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
