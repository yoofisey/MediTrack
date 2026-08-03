"use client";

import { useState } from "react";
import { Pill, BarChart3, FileText, Users } from "lucide-react";

export default function LandingPage({ onGetStarted }) {
  const [fading, setFading] = useState(false);

  function handleClick() {
    setFading(true);
    setTimeout(() => onGetStarted(), 500);
  }

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(180deg,#f0f7ff 0%,#ffffff 40%)",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif",
      color:"#0f172a",
      overflow:"hidden",
      opacity: fading ? 0 : 1,
      transform: fading ? "translateY(-8px)" : "none",
      transition: "opacity .5s ease, transform .5s ease"
    }}>

      <div style={{maxWidth:480,margin:"0 auto",padding:"60px 24px 40px",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#2563eb,#5856d6)",display:"grid",placeItems:"center",margin:"0 auto 12px",boxShadow:"0 8px 32px rgba(37,99,235,.25)",animation:"fadeUp .6s ease both"}}>
          <svg viewBox="0 0 100 100" width={36} height={36} fill="white">
            <text x="24" y="65" fontFamily="system-ui,sans-serif" fontSize="48" fontWeight="700" fill="white">A</text>
          </svg>
        </div>
        <div style={{fontSize:20,fontWeight:700,color:"#0f172a",marginBottom:24,animation:"fadeUp .6s .1s ease both"}}>Adhera</div>

        <h1 style={{fontSize:34,fontWeight:800,letterSpacing:"-.6px",marginBottom:8,lineHeight:1.1,animation:"fadeUp .6s .2s ease both"}}>
          Your Personal<br/>Treatment Companion
        </h1>
        <p style={{fontSize:16,color:"#64748b",lineHeight:1.6,marginBottom:32,maxWidth:360,marginLeft:"auto",marginRight:"auto",animation:"fadeUp .6s .3s ease both"}}>
          Track medications, never miss a dose, and stay on top of your treatment plan — all in one place.
        </p>

        <button onClick={handleClick} style={{width:"100%",maxWidth:320,padding:"16px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#2563eb,#5856d6)",color:"white",fontSize:17,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(37,99,235,.3)",marginBottom:12,fontFamily:"inherit",animation:"fadeUp .6s .4s ease both"}}>
          Get started — it&apos;s free
        </button>

        <div style={{fontSize:13,color:"#94a3b8",marginBottom:12,animation:"fadeUp .6s .5s ease both"}}>
          No credit card required · Works on iPhone &amp; Android
        </div>
        <a href="/pricing" style={{fontSize:14,fontWeight:600,color:"#2563eb",textDecoration:"none",fontFamily:"inherit",animation:"fadeUp .6s .55s ease both"}}>
          Compare plans and pricing →
        </a>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"0 24px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:48}}>
          {[
            { icon:<Pill size={22} color="#2563eb"/>, title:"Medication reminders", desc:"Smart alerts that adapt to your schedule so you never miss a dose." },
            { icon:<BarChart3 size={22} color="#2563eb"/>, title:"Adherence tracking", desc:"See your consistency at a glance with daily streaks and progress charts." },
            { icon:<FileText size={22} color="#2563eb"/>, title:"Doctor reports", desc:"Generate clinical summaries to share with your healthcare provider." },
            { icon:<Users size={22} color="#2563eb"/>, title:"Family sharing", desc:"Manage medications for your whole household from one account." },
          ].map((f, i) => (
            <div key={f.title} style={{display:"flex",gap:16,alignItems:"flex-start",background:"white",borderRadius:16,padding:20,boxShadow:"0 1px 8px rgba(0,0,0,.04)",border:"1px solid #f1f5f9",animation:`fadeUp .6s ${.5 + i * .08}s ease both`}}>
              <div style={{width:44,height:44,borderRadius:12,background:"#f0f7ff",display:"grid",placeItems:"center",flexShrink:0}}>{f.icon}</div>
              <div>
                <div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{f.title}</div>
                <div style={{fontSize:13,color:"#64748b",lineHeight:1.5}}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:"white",borderRadius:16,padding:24,boxShadow:"0 1px 8px rgba(0,0,0,.04)",border:"1px solid #f1f5f9",marginBottom:48,animation:"fadeUp .6s .8s ease both"}}>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:8}}>About Adhera</h2>
          <p style={{fontSize:14,color:"#475569",lineHeight:1.7,margin:0}}>
            Adhera is a personal medication management app designed to help you stay on track with your treatment plan.
            Create your medication schedule, log each dose as you take it, and view your adherence over time.
            Get smart reminders, generate reports for your doctor, and manage medications for your whole family — all from one secure account.
          </p>
        </div>
      </div>

      <div style={{background:"#f8fafc",borderTop:"1px solid #e2e8f0",padding:"24px"}}>
        <div style={{maxWidth:480,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.6}}>
            <a href="/privacy" style={{color:"#64748b",textDecoration:"underline"}}>Privacy Policy</a>
            {" · "}
            <span style={{color:"#64748b",fontWeight:600}}>Adhera</span>
            {" · "}
            © 2026
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
