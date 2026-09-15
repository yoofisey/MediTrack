"use client";

import { useState } from "react";
import { Pill, BarChart3, FileText, Users } from "lucide-react";

export default function LandingPage({ onGetStarted }) {
  const [fading, setFading] = useState(false);

  function handleClick() {
    setFading(true);
    setTimeout(() => onGetStarted(), 500);
  }

  const font = "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',Roboto,system-ui,sans-serif";

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(180deg,#EDF4FF 0%,#F7F8FC 42%,#F2F2F7 100%)",
      fontFamily:font,
      color:"#1C1C1E",
      overflow:"hidden",
      opacity: fading ? 0 : 1,
      transform: fading ? "translateY(-8px)" : "none",
      transition: "opacity .5s ease, transform .5s ease"
    }}>

      <div style={{maxWidth:480,margin:"0 auto",padding:"72px 24px 44px",textAlign:"center"}}>
        <div style={{width:72,height:72,borderRadius:20,overflow:"hidden",margin:"0 auto 16px",boxShadow:"0 10px 36px rgba(0,122,255,.26),0 2px 8px rgba(0,0,0,.05)",animation:"fadeUp .6s ease both"}}>
          <img src="/icon-512.png" alt="Adhera" width="72" height="72" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
        </div>
        <div style={{fontSize:21,fontWeight:700,color:"#1C1C1E",marginBottom:26,letterSpacing:"-.3px",animation:"fadeUp .6s .1s ease both"}}>Adhera</div>

        <h1 style={{fontSize:34,fontWeight:800,letterSpacing:"-.6px",marginBottom:8,lineHeight:1.1,animation:"fadeUp .6s .2s ease both"}}>
          Your Personal<br/>Treatment Companion
        </h1>
        <p style={{fontSize:16,color:"#3A3A3C",lineHeight:1.6,marginBottom:32,maxWidth:360,marginLeft:"auto",marginRight:"auto",animation:"fadeUp .6s .3s ease both",fontFamily:font}}>
          Track medications, never miss a dose, and stay on top of your treatment plan — all in one place.
        </p>

        <button onClick={handleClick} style={{width:"100%",maxWidth:320,padding:"16px 32px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#007AFF,#5856D6)",color:"white",fontSize:17,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 22px rgba(0,122,255,.30),inset 0 1px 0 rgba(255,255,255,.16)",marginBottom:12,marginLeft:"auto",marginRight:"auto",display:"block",fontFamily:font,animation:"fadeUp .6s .4s ease both"}}>
          Get started — it&apos;s free
        </button>

        <div style={{fontSize:13,color:"#8E8E93",marginBottom:12,animation:"fadeUp .6s .5s ease both"}}>
          No credit card required · Works on iPhone &amp; Android
        </div>
        <a href="/pricing" style={{fontSize:14,fontWeight:600,color:"#007AFF",textDecoration:"none",fontFamily:font,animation:"fadeUp .6s .55s ease both"}}>
          Compare plans and pricing →
        </a>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"0 24px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:44}}>
          {[
            { icon:<Pill size={20} color="#007AFF"/>, title:"Medication reminders", desc:"Smart alerts that adapt to your schedule so you never miss a dose.", tile:"rgba(0,122,255,.08)" },
            { icon:<BarChart3 size={20} color="#5856D6"/>, title:"Adherence tracking", desc:"See your consistency at a glance with daily streaks and progress charts.", tile:"rgba(88,86,214,.08)" },
            { icon:<FileText size={20} color="#AF52DE"/>, title:"Doctor reports", desc:"Generate clinical summaries to share with your healthcare provider.", tile:"rgba(175,82,222,.08)" },
            { icon:<Users size={20} color="#FF9500"/>, title:"Family sharing", desc:"Manage medications for your whole household from one account.", tile:"rgba(255,149,0,.08)" },
          ].map((f, i) => (
            <div key={f.title} style={{display:"flex",gap:14,alignItems:"flex-start",background:"#FFFFFF",borderRadius:20,padding:18,boxShadow:"0 0 0 0.5px rgba(0,0,0,.02),0 1px 2px rgba(0,0,0,.02),0 4px 8px rgba(0,0,0,.03),0 12px 24px rgba(0,0,0,.04)",border:"0.5px solid rgba(0,0,0,.04)",animation:`fadeUp .6s ${.5 + i * .08}s ease both`}}>
              <div style={{width:42,height:42,borderRadius:13,background:f.tile,display:"grid",placeItems:"center",flexShrink:0}}>{f.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700,marginBottom:2,letterSpacing:"-.2px"}}>{f.title}</div>
                <div style={{fontSize:13,color:"#8E8E93",lineHeight:1.5}}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:"#FFFFFF",borderRadius:20,padding:22,boxShadow:"0 0 0 0.5px rgba(0,0,0,.02),0 1px 2px rgba(0,0,0,.02),0 4px 8px rgba(0,0,0,.03),0 12px 24px rgba(0,0,0,.04)",border:"0.5px solid rgba(0,0,0,.04)",marginBottom:44,animation:"fadeUp .6s .8s ease both"}}>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:8,letterSpacing:"-.3px"}}>About Adhera</h2>
          <p style={{fontSize:14,color:"#3A3A3C",lineHeight:1.7,margin:0}}>
            Adhera is a personal medication management app designed to help you stay on track with your treatment plan.
            Create your medication schedule, log each dose as you take it, and view your adherence over time.
            Get smart reminders, generate reports for your doctor, and manage medications for your whole family — all from one secure account.
          </p>
        </div>
      </div>

      <div style={{background:"#F7F8FC",borderTop:"0.5px solid rgba(60,60,67,.12)",padding:"24px"}}>
        <div style={{maxWidth:480,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:13,color:"#8E8E93",lineHeight:2,display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <a href="/privacy" style={{color:"#8E8E93",textDecoration:"underline"}}>Privacy Policy</a>
            <a href="/terms" style={{color:"#8E8E93",textDecoration:"underline"}}>Terms of Service</a>
            <a href="/refund-policy" style={{color:"#8E8E93",textDecoration:"underline"}}>Refund Policy</a>
            <a href="/pricing" style={{color:"#8E8E93",textDecoration:"underline"}}>Pricing</a>
          </div>
          <div style={{fontSize:13,color:"#8E8E93",lineHeight:1.6}}>
            <span style={{color:"#3A3A3C",fontWeight:600}}>Adhera</span> · support@useadhera.com
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