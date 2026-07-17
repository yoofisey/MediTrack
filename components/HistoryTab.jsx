"use client";

import { useState } from "react";
import { CSS, fmtTime, fmtDateLong } from "@/lib/constants";

export default function HistoryTab({ logs, meds, plan }) {
  const [expanded, setExpanded] = useState(null);
  const limits = { free: { history: 7 }, pro: { history: 999 }, family: { history: 999 } };
  const maxDays = (limits[plan] || limits.free).history;
  const grouped = {};
  logs.forEach(l => {
    const d = l.taken_at?.split("T")[0];
    if (d) { if (!grouped[d]) grouped[d]=[]; grouped[d].push(l); }
  });
  const days = Object.keys(grouped).sort().reverse().slice(0, maxDays);
  const journalCount = logs.filter(l=>l.journal).length;

  return (
    <div className="scroll">
      <div className="nav-large">History</div>

      <div className="chips">
        <div className="chip blue"><div className="chip-val">{logs.length}</div><div className="chip-lbl">Total doses</div></div>
        <div className="chip green"><div className="chip-val">{days.length}</div><div className="chip-lbl">Days tracked</div></div>
        <div className="chip purple"><div className="chip-val">{journalCount}</div><div className="chip-lbl">Journal entries</div></div>
      </div>

      {days.length===0?(
        <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No history yet</div><div className="empty-state-sub">Your dose logs will appear here</div></div>
      ):days.map(d=>{
        const dayLogs = grouped[d];
        const totalExpected = meds.reduce((s,m)=>s+(m.times_per_day||1),0);
        const dayPct = Math.min(Math.round(dayLogs.length/totalExpected*100),100);
        return (
        <div key={d} style={{padding:"0 16px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,paddingLeft:4}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"var(--teal)",flexShrink:0}}/>
            <div style={{fontSize:15,fontWeight:600,color:"var(--t1)",letterSpacing:"-.2px"}}>{fmtDateLong(d+"T12:00:00")}</div>
            <div style={{marginLeft:"auto",fontSize:12,color:"var(--t3)",background:"var(--bg)",padding:"2px 10px",borderRadius:99}}>{dayLogs.length} dose{dayLogs.length!==1?"s":""}</div>
          </div>
          <div style={{background:"var(--card)",borderRadius:"var(--rxl)",overflow:"hidden",boxShadow:"var(--card-shadow)"}}>
            {dayLogs.map((log,i)=>{
              const hasJournal = !!log.journal;
              const isExpanded = expanded===log.id;
              return (
                <div key={log.id}>
                  <div className="row" style={{cursor:hasJournal?"pointer":"default",borderTop:i>0?"0.5px solid var(--sep)":"none"}}
                    onClick={() => hasJournal ? setExpanded(isExpanded ? null : log.id) : null}>
                    <div style={{width:32,height:32,borderRadius:8,background:"var(--ib1)",display:"grid",placeItems:"center",fontSize:16,flexShrink:0}}>💊</div>
                    <div className="row-body">
                      <div className="row-title" style={{fontSize:15}}>{log.medications?.name||"Medication"}</div>
                      {hasJournal && <div className="row-sub" style={{fontSize:12}}>📝 Has journal note</div>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:13,fontWeight:500,color:"var(--t2)",background:"var(--bg)",padding:"3px 10px",borderRadius:99}}>{fmtTime(log.taken_at)}</span>
                      {hasJournal && <span style={{fontSize:12,color:"var(--t3)",transition:"transform .2s",transform:isExpanded?"rotate(180deg)":"rotate(0deg)"}}>▼</span>}
                    </div>
                  </div>
                  {hasJournal && isExpanded && (
                    <div style={{margin:"0 16px 12px 60px",padding:"12px 14px",background:"var(--bg)",borderRadius:10,fontSize:13,color:"var(--t2)",lineHeight:1.6,whiteSpace:"pre-wrap",border:"0.5px solid var(--sep)"}}>
                      <span style={{fontWeight:500}}>📝</span> {log.journal}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{marginTop:8,padding:"0 4px",display:"flex",alignItems:"center",gap:8}}>
            <div style={{flex:1,height:4,borderRadius:2,background:"var(--sep)",overflow:"hidden"}}>
              <div style={{width:`${dayPct}%`,height:"100%",borderRadius:2,background:dayPct>=80?"var(--teal2)":dayPct>=50?"var(--orange)":"var(--red)",transition:"width .4s"}}/>
            </div>
            <span style={{fontSize:11,fontWeight:600,color:dayPct>=80?"var(--teal2)":dayPct>=50?"var(--orange)":"var(--red)"}}>{dayPct}%</span>
          </div>
        </div>
      );})}
    </div>
  );
}
