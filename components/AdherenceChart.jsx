"use client";

import { useState } from "react";
import { Target, Zap, Sparkles } from "lucide-react";

function BarChart({ data, height = 120, barColor = "var(--teal)" }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.max(12, Math.min(28, Math.floor(280 / data.length) - 4));

  return (
    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:Math.max(2, 8 - data.length),height,padding:"0 4px"}}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / max) * (height - 20));
        const isToday = d.isToday;
        return (
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{fontSize:10,fontWeight:600,color:isToday?"var(--teal)":"var(--t3)"}}>
              {d.value > 0 ? `${d.value}%` : ""}
            </div>
            <div style={{
              width:barWidth, height:h, borderRadius:6,
              background: isToday ? barColor : `${barColor}30`,
              transition:"height .3s ease",
            }}/>
            <div style={{fontSize:9,color:isToday?"var(--teal)":"var(--t3)",fontWeight:isToday?600:400,whiteSpace:"nowrap"}}>
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ pct, size = 100, stroke = 10, color = "var(--teal)" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--sep)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{transition:"stroke-dashoffset .5s ease"}}/>
    </svg>
  );
}

export default function AdherenceChart({ logs, meds }) {
  const [view, setView] = useState("week");
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const activeMeds = meds.filter(m => {
    if (!m.active) return false;
    const e = new Date(m.start_date); e.setDate(e.getDate() + m.course_duration_days);
    return e >= today;
  });

  function expectedForDay(dateStr) {
    return activeMeds.reduce((sum, m) => {
      const start = new Date(m.start_date);
      const end = new Date(m.start_date); end.setDate(end.getDate() + m.course_duration_days);
      const d = new Date(dateStr);
      if (d >= start && d <= end) return sum + (m.times_per_day || 1);
      return sum;
    }, 0);
  }

  function takenForDay(dateStr) {
    return logs.filter(l => l.taken_at?.startsWith(dateStr)).length;
  }

  function adherenceForDay(dateStr) {
    const exp = expectedForDay(dateStr);
    const taken = takenForDay(dateStr);
    return exp > 0 ? Math.min(Math.round((taken / exp) * 100), 100) : 0;
  }

  const days = view === "week" ? 7 : 30;
  const dayData = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const label = view === "week"
      ? d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)
      : d.getDate().toString();
    dayData.push({
      label,
      value: adherenceForDay(ds),
      isToday: ds === todayStr,
    });
  }

  const avgAdherence = dayData.length > 0
    ? Math.round(dayData.reduce((s, d) => s + d.value, 0) / dayData.length)
    : 0;

  const bestDay = dayData.reduce((best, d) => d.value > best.value ? d : best, dayData[0]);
  const worstDay = dayData.reduce((worst, d) => d.value < worst.value ? d : worst, dayData[0]);

  const daysWithPerfect = dayData.filter(d => d.value === 100).length;

  return (
    <div style={{background:"var(--card)",borderRadius:18,padding:20,boxShadow:"var(--card-shadow)",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div style={{fontSize:16,fontWeight:700,color:"var(--t1)"}}>Adherence Overview</div>
        <div style={{display:"flex",background:"var(--hover)",borderRadius:10,padding:3}}>
          {[["week","7 days"],["month","30 days"]].map(([id,label]) => (
            <div key={id} onClick={() => setView(id)} style={{
              padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",
              background: view === id ? "var(--card)" : "transparent",
              color: view === id ? "var(--teal)" : "var(--t3)",
              boxShadow: view === id ? "0 1px 4px rgba(0,0,0,.06)" : "none",
              transition:"all .15s",
            }}>{label}</div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
        <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
          <DonutChart pct={avgAdherence} size={72} stroke={8}/>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:18,fontWeight:700,color:"var(--t1)"}}>{avgAdherence}%</div>
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,color:"var(--t3)",marginBottom:2}}>Average adherence</div>
          <div style={{fontSize:13,color:"var(--t2)",marginBottom:2}}><span style={{display:"inline-flex",alignItems:"center",gap:4}}><Target size={13} style={{color:"var(--t3)"}}/> Best: {bestDay?.label} ({bestDay?.value}%)</span></div>
          <div style={{fontSize:13,color:"var(--t2)",marginBottom:2}}><span style={{display:"inline-flex",alignItems:"center",gap:4}}><Zap size={13} style={{color:"var(--t3)"}}/> Worst: {worstDay?.label} ({worstDay?.value}%)</span></div>
          <div style={{fontSize:13,color:"var(--teal)",fontWeight:600}}><span style={{display:"inline-flex",alignItems:"center",gap:4}}><Sparkles size={13}/> {daysWithPerfect}/{days} perfect days</span></div>
        </div>
      </div>

      <BarChart data={dayData} barColor="var(--teal)"/>

      {activeMeds.length > 0 && (
        <div style={{marginTop:16}}>
          <div style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:8}}>Per-medication</div>
          {activeMeds.map(med => {
            const medLogs = logs.filter(l => l.medication_id === med.id);
            const totalExpected = dayData.reduce((sum, d, i) => {
              const dateObj = new Date(today); dateObj.setDate(dateObj.getDate() - (days - 1 - i));
              const ds = dateObj.toISOString().split("T")[0];
              const start = new Date(med.start_date);
              const end = new Date(med.start_date); end.setDate(end.getDate() + med.course_duration_days);
              if (dateObj >= start && dateObj <= end) return sum + (med.times_per_day || 1);
              return sum;
            }, 0);
            const taken = medLogs.filter(l => {
              const d = new Date(l.taken_at);
              const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - days);
              return d >= cutoff;
            }).length;
            const pct = totalExpected > 0 ? Math.min(Math.round((taken / totalExpected) * 100), 100) : 0;
            return (
              <div key={med.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:"var(--t1)"}}>{med.name}</div>
                  <div style={{height:6,background:"var(--sep)",borderRadius:3,marginTop:4,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",borderRadius:3,background:pct>=80?"var(--teal)":pct>=50?"var(--orange)":"var(--red)",transition:"width .3s"}}/>
                  </div>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:pct>=80?"var(--teal)":pct>=50?"var(--orange)":"var(--red)",flexShrink:0,width:42,textAlign:"right"}}>
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
