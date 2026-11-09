"use client";

import { useState } from "react";
import { Pill, BarChart3, FileText, Users, ShieldCheck, HeartPulse } from "lucide-react";

export default function LandingPage({ onGetStarted }) {
  const [fading, setFading] = useState(false);

  function handleClick() {
    setFading(true);
    setTimeout(() => onGetStarted(), 500);
  }

  const font = "var(--app-font-sans, 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif)";

  return (
    <div style={{
      minHeight:"100dvh",
      background:"radial-gradient(ellipse 120% 70% at 50% 0%, rgba(0,122,255,.10) 0%, transparent 55%), radial-gradient(ellipse 90% 55% at 85% 100%, rgba(88,86,214,.08) 0%, transparent 50%), linear-gradient(180deg,#F8FAFF 0%,#F6F7FB 45%,#F2F2F7 100%)",
      fontFamily:font,
      color:"#1C1C1E",
      overflowX:"hidden",
      opacity: fading ? 0 : 1,
      transform: fading ? "translateY(-10px)" : "none",
      transition: "opacity .55s cubic-bezier(.4,0,.2,1), transform .55s cubic-bezier(.4,0,.2,1)"
    }}>

      <div style={{maxWidth:480,margin:"0 auto",padding:"76px 24px 48px",textAlign:"center"}}>
        <div style={{width:84,height:84,borderRadius:24,overflow:"hidden",margin:"0 auto 18px",boxShadow:"0 16px 48px rgba(0,122,255,.28),0 4px 14px rgba(30,60,120,.08),inset 0 1px 0 rgba(255,255,255,.35)",animation:"fadeUp .65s cubic-bezier(.16,1,.3,1) both"}}>
          <img src="/icon-512.png?v=3" alt="Adherly" width="84" height="84" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
        </div>
        <div style={{fontSize:22,fontWeight:800,color:"#1C1C1E",marginBottom:28,letterSpacing:"-.4px",animation:"fadeUp .65s .08s cubic-bezier(.16,1,.3,1) both"}}>Adherly</div>

        <h1 style={{fontSize:38,fontWeight:800,letterSpacing:"-.8px",marginBottom:12,lineHeight:1.06,animation:"fadeUp .7s .16s cubic-bezier(.16,1,.3,1) both"}}>
          Your Personal<br/>Treatment Companion
        </h1>
        <p style={{fontSize:17,color:"#3A3A3C",lineHeight:1.65,marginBottom:34,maxWidth:360,marginLeft:"auto",marginRight:"auto",animation:"fadeUp .7s .24s cubic-bezier(.16,1,.3,1) both",fontFamily:font,fontWeight:500}}>
          Track medications, never miss a dose, and stay on top of your treatment plan — all in one place.
        </p>

        <button onClick={handleClick} style={{width:"100%",maxWidth:340,padding:"17px 32px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#007AFF 0%,#5856D6 100%)",color:"white",fontSize:17,fontWeight:800,cursor:"pointer",boxShadow:"0 10px 28px rgba(0,122,255,.30),inset 0 1px 0 rgba(255,255,255,.18)",marginBottom:14,marginLeft:"auto",marginRight:"auto",display:"block",fontFamily:font,letterSpacing:"-.1px",animation:"fadeUp .7s .32s cubic-bezier(.16,1,.3,1) both"}}>
          Get started — it&apos;s free
        </button>

        <div style={{fontSize:13,color:"#8E8E93",marginBottom:14,animation:"fadeUp .7s .4s cubic-bezier(.16,1,.3,1) both",fontWeight:500}}>
          No credit card required · Works on iPhone &amp; Android
        </div>
        <a href="/pricing" style={{fontSize:14,fontWeight:700,color:"#007AFF",textDecoration:"none",fontFamily:font,animation:"fadeUp .7s .46s cubic-bezier(.16,1,.3,1) both"}}>
          Compare plans and pricing →
        </a>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"0 24px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:48}}>
          {[
            { icon:<Pill size={20} color="#007AFF"/>, title:"Medication reminders", desc:"Smart alerts that adapt to your schedule so you never miss a dose.", tile:"rgba(0,122,255,.10)" },
            { icon:<BarChart3 size={20} color="#5856D6"/>, title:"Adherence tracking", desc:"See your consistency at a glance with daily streaks and progress charts.", tile:"rgba(88,86,214,.10)" },
            { icon:<FileText size={20} color="#AF52DE"/>, title:"Doctor reports", desc:"Generate clinical summaries to share with your healthcare provider.", tile:"rgba(175,82,222,.10)" },
            { icon:<ShieldCheck size={20} color="#34C759"/>, title:"Interaction checker", desc:"Flag risky drug combinations before a dose so your whole household stays safer.", tile:"rgba(52,199,89,.10)" },
            { icon:<Users size={20} color="#FF9500"/>, title:"Family sharing", desc:"Manage medications for your whole household from one account.", tile:"rgba(255,149,0,.10)" },
            { icon:<HeartPulse size={20} color="#FF3B30"/>, title:"Treatment insights", desc:"Spot patterns in vitals and symptoms to spot what's working - and what isn't.", tile:"rgba(255,59,48,.10)" },
          ].map((f, i) => (
            <div key={f.title} style={{display:"flex",gap:14,alignItems:"flex-start",background:"linear-gradient(180deg,rgba(255,255,255,1) 0%,rgba(252,253,255,1) 100%)",borderRadius:22,padding:"18px 18px",boxShadow:"0 0 0 0.5px rgba(0,0,0,.02),0 4px 14px rgba(15,30,60,.04),0 12px 28px rgba(15,30,60,.04)",border:"0.5px solid rgba(0,0,0,.035)",animation:`fadeUp .65s ${.5 + i * .07}s cubic-bezier(.16,1,.3,1) both`}}>
              <div style={{width:44,height:44,borderRadius:14,background:f.tile,display:"grid",placeItems:"center",flexShrink:0,border:"0.5px solid rgba(0,0,0,.03)"}}>{f.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:16,fontWeight:700,marginBottom:3,letterSpacing:"-.25px",color:"#1C1C1E"}}>{f.title}</div>
                <div style={{fontSize:14,color:"#6E6E73",lineHeight:1.55,fontWeight:500}}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:"linear-gradient(180deg,rgba(255,255,255,1) 0%,rgba(252,253,255,1) 100%)",borderRadius:22,padding:22,boxShadow:"0 0 0 0.5px rgba(0,0,0,.02),0 4px 14px rgba(15,30,60,.04),0 12px 28px rgba(15,30,60,.04)",border:"0.5px solid rgba(0,0,0,.035)",marginBottom:48,animation:"fadeUp .65s .85s cubic-bezier(.16,1,.3,1) both"}}>
          <h2 style={{fontSize:19,fontWeight:800,marginBottom:10,letterSpacing:"-.4px",color:"#1C1C1E"}}>About Adherly</h2>
          <p style={{fontSize:14,color:"#3A3A3C",lineHeight:1.75,margin:0,fontWeight:500}}>
            Adherly is a personal medication management app designed to help you stay on track with your treatment plan.
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
            <span style={{color:"#3A3A3C",fontWeight:600}}>Adherly</span> · support@useadhera.com
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