"use client";

import { useState } from "react";
import { sb } from "@/lib/supabase";
import { CSS } from "@/lib/constants";
import { COUNTRIES, getPricing } from "@/lib/data";

const OB_STEPS = 5;

export default function Onboarding({ user, profile: initProfile, onDone }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    full_name: initProfile?.full_name || user?.user_metadata?.full_name || "",
    avatar_emoji: initProfile?.avatar_emoji || "😊",
    condition: initProfile?.condition || "",
    wake_time: initProfile?.wake_time || "07:00",
    sleep_time: initProfile?.sleep_time || "22:00",
    reminder_lead: initProfile?.reminder_lead ?? 30,
    plan: initProfile?.plan || "free",
    goals: [],
    theme: initProfile?.theme || (() => { try { return sessionStorage.getItem("mt_sys_theme") === "dark" ? "dark" : "blue"; } catch { return "blue"; } })(),
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setData(p => ({ ...p, [k]: v })); }

  async function finish() {
    setSaving(true);
    let tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
    await sb.from("profiles").upsert([{ id: user.id, ...data, timezone: tz, onboarded: true }]);
    onDone(data);
  }

  const next = () => step < OB_STEPS - 1 ? setStep(s => s + 1) : finish();
  const back = () => setStep(s => s - 1);

  const conditions = [
    { icon: "💊", title: "Managing a prescription course", sub: "Antibiotics, steroids, short-term meds", value: "prescription" },
    { icon: "🫀", title: "Chronic condition", sub: "Diabetes, hypertension, asthma, HIV", value: "chronic" },
    { icon: "🌿", title: "Vitamins & supplements", sub: "Daily wellness, iron, omega-3", value: "supplements" },
    { icon: "👨‍👩‍👧", title: "Managing for family", sub: "Tracking meds for a child or parent", value: "family" },
    { icon: "🔬", title: "Clinical / research use", sub: "Trial, hospital, or clinical setting", value: "clinical" },
  ];
  const reminders = [
    { value: 0, label: "At dose time", sub: "Exact moment" },
    { value: 15, label: "15 min early", sub: "Quick heads up" },
    { value: 30, label: "30 min early", sub: "Most popular" },
    { value: 60, label: "1 hour early", sub: "Plan ahead" },
    { value: 120, label: "2 hours early", sub: "Never forget" },
  ];
  const emojis = ["😊","🧑","👩","👨","🧓","👴","👵","🧒","👦","👧","🙂","😄","💪","🌟","❤️","🌸","🐻","🦁","🐼","🌴"];

  const steps = [
    <div key="0" className="ob-body">
      <div className="ob-emoji">👋</div>
      <div className="ob-title">What should we call you?</div>
      <div className="ob-sub">Pick a name and avatar for your account.</div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:13,color:"var(--t3)",marginBottom:8,fontWeight:500}}>YOUR NAME</div>
        <input className="sheet-input" placeholder="Full name" value={data.full_name} onChange={e=>set("full_name",e.target.value)} style={{marginBottom:16}}/>
        <div style={{fontSize:13,color:"var(--t3)",marginBottom:10,fontWeight:500}}>CHOOSE AN AVATAR</div>
        <div className="emoji-grid">
          {emojis.map(em => (
            <div key={em} className={`emoji-opt${data.avatar_emoji===em?" sel":""}`} onClick={()=>set("avatar_emoji",em)}>{em}</div>
          ))}
        </div>
      </div>
    </div>,

    <div key="1" className="ob-body">
      <div className="ob-emoji">🎯</div>
      <div className="ob-title">How are you using Adhera?</div>
      <div className="ob-sub">We&apos;ll personalise your experience based on your needs.</div>
      <div className="ob-options">
        {conditions.map(c => (
          <div key={c.value} className={`ob-option${data.condition===c.value?" sel":""}`} onClick={()=>set("condition",c.value)}>
            <div className="ob-option-icon">{c.icon}</div>
            <div className="ob-option-text"><div className="ob-option-title">{c.title}</div><div className="ob-option-sub">{c.sub}</div></div>
            <div className={`ob-check${data.condition===c.value?" on":""}`}>{data.condition===c.value&&<span style={{color:"white",fontSize:13}}>✓</span>}</div>
          </div>
        ))}
      </div>
    </div>,

    <div key="2" className="ob-body">
      <div className="ob-emoji">🕗</div>
      <div className="ob-title">What&apos;s your daily schedule?</div>
      <div className="ob-sub">We&apos;ll time your dose reminders around your sleep and wake times.</div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
        {[{label:"⏰ Wake up time",key:"wake_time"},{label:"🌙 Bedtime",key:"sleep_time"}].map(({label,key})=>(
          <div key={key} style={{background:"var(--card)",borderRadius:"var(--rl)",padding:"14px 16px"}}>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:8,fontWeight:500}}>{label}</div>
            <input type="time" value={data[key]} onChange={e=>set(key,e.target.value)} style={{fontSize:18,fontWeight:600,border:"none",background:"none",color:"var(--t1)",fontFamily:"inherit",width:"100%",outline:"none"}}/>
          </div>
        ))}
      </div>
      <div style={{fontSize:13,color:"var(--t3)",marginBottom:10,fontWeight:500,textTransform:"uppercase",letterSpacing:".3px"}}>DEFAULT REMINDER TIMING</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {reminders.map(r=>(
          <div key={r.value} className={`ob-option${data.reminder_lead===r.value?" sel":""}`} style={{padding:"12px 16px"}} onClick={()=>set("reminder_lead",r.value)}>
            <div className="ob-option-text"><div className="ob-option-title">{r.label}</div><div className="ob-option-sub">{r.sub}</div></div>
            <div className={`ob-check${data.reminder_lead===r.value?" on":""}`}>{data.reminder_lead===r.value&&<span style={{color:"white",fontSize:13}}>✓</span>}</div>
          </div>
        ))}
      </div>
    </div>,

    (() => {
      const userCountry = data.country || user?.user_metadata?.country || "GH";
      const { pricing: obPricing } = getPricing(userCountry);
      const selC = COUNTRIES.find(c => c.code === userCountry) || COUNTRIES[0];
      return (
    <div key="3" className="ob-body">
      <div className="ob-emoji">✨</div>
      <div className="ob-title">Choose your plan</div>
      <div className="ob-sub">
        Start free. Upgrade anytime.{" "}
        <span style={{fontSize:13,color:"var(--teal)"}}>
          {selC.flag} {selC.name} pricing
        </span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[
          { value:"free", icon:"🆓", title:"Free", sub:"Up to 2 medications, basic reminders", price:"Free forever", features:["2 medications","Daily reminders","7-day history"] },
          { value:"pro", icon:"⭐", title:"Pro", sub:"Everything you need for full adherence", price:`${obPricing.pro.label}/mo`, features:["Unlimited medications","Full history & analytics","Caregiver sharing","Refill reminders","Adherence PDF reports"] },
          { value:"family", icon:"👨‍👩‍👧", title:"Family", sub:"One account for the whole household", price:`${obPricing.family.label}/mo`, features:["5 family profiles","All Pro features","Shared family dashboard","Doctor-friendly summaries"] },
        ].map(p=>(
          <div key={p.value} className={`ob-option${data.plan===p.value?" sel":""}`} style={{alignItems:"flex-start",padding:"16px"}} onClick={()=>set("plan",p.value)}>
            <div className="ob-option-icon" style={{marginTop:2}}>{p.icon}</div>
            <div className="ob-option-text">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div className="ob-option-title">{p.title}</div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--teal)"}}>{p.price}</div>
              </div>
              <div className="ob-option-sub" style={{marginBottom:8}}>{p.sub}</div>
              {p.features.map(f=><div key={f} style={{fontSize:12,color:"var(--t3)",marginTop:3}}>— {f}</div>)}
            </div>
            <div className={`ob-check${data.plan===p.value?" on":""}`} style={{marginTop:2}}>{data.plan===p.value&&<span style={{color:"white",fontSize:13}}>✓</span>}</div>
          </div>
        ))}
      </div>
    </div>
      );
    })(),

    <div key="4" className="ob-body">
      <div className="ob-emoji">🎨</div>
      <div className="ob-title">Final touches</div>
      <div className="ob-sub">Set your health goals and pick an app theme colour.</div>
      <div style={{fontSize:13,color:"var(--t3)",fontWeight:500,textTransform:"uppercase",letterSpacing:".3px",marginBottom:10}}>HEALTH GOALS (pick any)</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
        {[
          {icon:"💊",label:"Never miss a dose"},
          {icon:"📊",label:"Track adherence over time"},
          {icon:"👨‍⚕️",label:"Share reports with my doctor"},
          {icon:"👨‍👩‍👧",label:"Manage family medications"},
          {icon:"🔔",label:"Build a medication habit"},
          {icon:"💊",label:"Complete my full course"},
        ].map(g => {
          const sel = data.goals.includes(g.label);
          return (
            <div key={g.label} className={`goal-chip${sel?" sel":""}`}
              onClick={()=>set("goals", sel ? data.goals.filter(x=>x!==g.label) : [...data.goals,g.label])}>
              <div className="goal-chip-icon">{g.icon}</div>
              <div className="goal-chip-label">{g.label}</div>
              <div className={`goal-chip-check${sel?" on":""}`}>{sel&&<span style={{color:"white",fontSize:11}}>✓</span>}</div>
            </div>
          );
        })}
      </div>
      <div style={{fontSize:13,color:"var(--t3)",fontWeight:500,textTransform:"uppercase",letterSpacing:".3px",marginBottom:12}}>APP THEME</div>
      <div className="theme-grid">
          {[
            {id:"blue",  colors:["#007AFF","#0055CC"],label:"Medical"},
            {id:"green", colors:["#34C759","#2DB84E"],label:"Clinical"},
            {id:"purple",colors:["#AF52DE","#983CC9"],label:"Lavender"},
            {id:"orange",colors:["#FF9500","#E68A00"],label:"Sunset"},
            {id:"red",   colors:["#FF3B30","#D6342A"],label:"Cherry"},
            {id:"teal",  colors:["#5AC8FA","#42B0E0"],label:"Lagoon"},
            {id:"pink",  colors:["#FF2D55","#D92548"],label:"Rose"},
            {id:"dark",  colors:["#0A84FF","#409CFF"],label:"Midnight"},
          ].map(th=>(
          <div key={th.id} className={`theme-swatch${data.theme===th.id?" sel":""}`}
            style={{background:`linear-gradient(135deg,${th.colors[0]},${th.colors[1]})`}}
            onClick={()=>set("theme",th.id)}>
            {data.theme===th.id && <div className="theme-swatch-check">✓</div>}
          </div>
        ))}
      </div>
      <div style={{textAlign:"center",fontSize:12,color:"var(--t3)",marginTop:8}}>Theme changes apply after setup</div>
    </div>,
  ];

  return (
    <div className="onboard-screen"><style>{CSS}</style>
      <div style={{padding:"calc(var(--safe-top) + 12px) 24px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button style={{background:"none",border:"none",color:"var(--teal)",fontSize:16,fontWeight:500,cursor:"pointer",fontFamily:"inherit",visibility:step>0?"visible":"hidden"}} onClick={back}>‹ Back</button>
        <span style={{fontSize:14,color:"var(--t3)",fontWeight:500}}>{step+1} of {OB_STEPS}</span>
        <button style={{background:"none",border:"none",color:"var(--t3)",fontSize:14,cursor:"pointer",fontFamily:"inherit"}} onClick={finish}>Skip</button>
      </div>
      <div className="ob-progress" style={{padding:"12px 24px 0"}}>
        {Array.from({length:OB_STEPS}).map((_,i)=><div key={i} className={`ob-dot${i<=step?" done":""}`}/>)}
      </div>
      <div style={{flex:1,overflow:"auto"}} key={step}><div className="ob-step">{steps[step]}</div></div>
      <div className="ob-footer">
        <button className="btn btn-primary" onClick={next} disabled={saving}>
          {saving?"Setting up…":step===OB_STEPS-1?"Get started →":"Continue →"}
        </button>
      </div>
    </div>
  );
}
