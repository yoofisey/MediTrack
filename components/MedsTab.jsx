"use client";

import { CSS, fmtDate } from "@/lib/constants";

export default function MedsTab({ meds, logs, onAdd, onEdit, onDelete }) {
  const today = new Date();
  const active = meds.filter(m=>{const e=new Date(m.start_date);e.setDate(e.getDate()+m.course_duration_days);return e>=today&&m.active;});
  const ended = meds.filter(m=>{const e=new Date(m.start_date);e.setDate(e.getDate()+m.course_duration_days);return e<today||!m.active;});

  function progress(med) { return Math.min(Math.max(0,Math.floor((today-new Date(med.start_date))/86400000)),med.course_duration_days); }

  function MedCard({ med }) {
    const endDate = new Date(med.start_date); endDate.setDate(endDate.getDate()+med.course_duration_days);
    const isActive = endDate>=today&&med.active;
    const prog = progress(med);
    const pct = prog/med.course_duration_days;
    const todayStr = today.toISOString().split("T")[0];
    const takenToday = logs.filter(l=>l.medication_id===med.id&&l.taken_at?.startsWith(todayStr)).length;
    const exp = med.times_per_day||1;
    return (
      <div style={{background:"var(--card)",borderRadius:"var(--rl)",padding:"16px",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{fontSize:17,fontWeight:600,marginBottom:3}}>{med.name}</div>
            <div style={{fontSize:14,color:"var(--t3)"}}>{med.dosage_amount} {med.dosage_unit} · {exp}× daily</div>
          </div>
          <span className={`badge ${isActive?"badge-green":"badge-gray"}`}>{isActive?"Active":"Ended"}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[["Course",`${med.course_duration_days}d`],["Taken today",`${takenToday}/${exp}`],["Ends",fmtDate(endDate.toISOString())]].map(([l,v])=>(
            <div key={l} style={{background:"var(--bg)",borderRadius:10,padding:"8px 10px"}}>
              <div style={{fontSize:11,color:"var(--t3)",fontWeight:500,marginBottom:2}}>{l}</div>
              <div style={{fontSize:14,fontWeight:600}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:12,color:"var(--t3)",marginBottom:4}}>Day {prog} of {med.course_duration_days}</div>
        <div className="prog"><div className="prog-fill" style={{width:`${pct*100}%`,background:isActive?"var(--teal)":"var(--t4)"}}/></div>
        {med.notes&&<div style={{fontSize:13,color:"var(--t3)",marginTop:8}}>📝 {med.notes}</div>}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={()=>onEdit(med)}>Edit</button>
          <button className="btn btn-sm" style={{flex:1,background:"var(--ib6)",color:"var(--red)",border:"none"}} onClick={()=>onDelete(med.id)}>Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px 0"}}>
        <div className="nav-large" style={{padding:0,paddingTop:8}}>Medications</div>
        <button className="nav-action" onClick={onAdd} style={{fontSize:28,lineHeight:1}}>＋</button>
      </div>

      <div className="chips" style={{marginTop:12}}>
        <div className="chip blue"><div className="chip-val">{meds.length}</div><div className="chip-lbl">Total</div></div>
        <div className="chip green"><div className="chip-val">{active.length}</div><div className="chip-lbl">Active</div></div>
        <div className="chip"><div className="chip-val">{ended.length}</div><div className="chip-lbl">Completed</div></div>
      </div>

      {active.length>0&&<div className="section"><div className="section-header">Active</div>{active.map(m=><MedCard key={m.id} med={m}/>)}</div>}
      {ended.length>0&&<div className="section"><div className="section-header">Completed</div>{ended.map(m=><MedCard key={m.id} med={m}/>)}</div>}
      {meds.length===0&&(
        <div className="empty-state" style={{paddingTop:60}}>
          <div className="empty-state-icon">💊</div>
          <div className="empty-state-title">No medications yet</div>
          <div className="empty-state-sub">Tap + to add your first medication</div>
        </div>
      )}
    </div>
  );
}
