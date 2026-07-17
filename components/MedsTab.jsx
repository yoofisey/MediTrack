"use client";

import { CSS, fmtDate } from "@/lib/constants";
import { TIER_LIMITS } from "@/lib/data";

function rem(med, logs) {
  if (!med.pills_per_package) return null;
  const lastRefill = med.last_refill_date ? new Date(med.last_refill_date) : new Date(med.start_date);
  const sinceRefill = logs.filter(l => l.medication_id === med.id && new Date(l.taken_at) >= lastRefill).length;
  return Math.max(0, (med.pills_per_package || 0) - sinceRefill);
}

export default function MedsTab({ meds, logs, onAdd, onEdit, onDelete, onRefill, plan, medCount }) {
  const limits = TIER_LIMITS[plan] || TIER_LIMITS.free;
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
    const remaining = rem(med, logs);
    const lowStock = remaining !== null && remaining <= (med.refill_reminder_at || 5);
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
        {remaining !== null && (
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,fontSize:13}}>
            <span style={{color:lowStock?"var(--red)":"var(--teal2)",fontWeight:600}}>📦 {remaining} remaining</span>
            {lowStock && <span style={{color:"var(--red)",fontWeight:500}}>· Refill soon!</span>}
            <button className="btn btn-sm" style={{marginLeft:"auto",background:"var(--ib1)",border:"none",fontSize:11}} onClick={()=>onRefill(med.id)}>➕ Refill</button>
          </div>
        )}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={()=>onEdit(med)}>Edit</button>
          <button className="btn btn-sm" style={{flex:1,background:"var(--ib6)",color:"var(--red)",border:"none"}} onClick={()=>onDelete(med.id)}>Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingRight:4}}>
        <div className="nav-large" style={{paddingBottom:4}}>Medications</div>
        <button className="nav-action" onClick={onAdd} style={{fontSize:28,lineHeight:1}}>＋</button>
      </div>

      <div className="chips">
        <div className="chip blue"><div className="chip-val">{meds.length}</div><div className="chip-lbl">Total</div></div>
        <div className="chip green"><div className="chip-val">{active.length}</div><div className="chip-lbl">Active</div></div>
        <div className="chip"><div className="chip-val">{ended.length}</div><div className="chip-lbl">Completed</div></div>
      </div>

      {plan==="free" && (
        <div style={{margin:"0 16px 12px",background:"var(--card)",borderRadius:"var(--rl)",padding:"12px 16px",boxShadow:"var(--card-shadow)",border:"var(--card-border)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:13,fontWeight:600,color:"var(--t2)"}}>Medication limit</span>
            <span style={{fontSize:13,fontWeight:600,color:medCount>=limits.maxMeds?"var(--red)":"var(--teal)"}}>{medCount}/{limits.maxMeds} used</span>
          </div>
          <div className="prog"><div className="prog-fill" style={{width:`${Math.min(medCount/limits.maxMeds,1)*100}%`,background:medCount>=limits.maxMeds?"var(--red)":"var(--teal)"}}/></div>
          {medCount>=limits.maxMeds && <div style={{fontSize:12,color:"var(--t3)",marginTop:6}}>Upgrade to Pro for unlimited medications.</div>}
        </div>
      )}

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
