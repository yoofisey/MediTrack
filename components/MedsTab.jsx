"use client";

import { CSS, fmtDate } from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { useTier } from "@/components/TierContext";
import { Pill, FileText, Package, Plus, CheckCircle2, Clock } from "lucide-react";

function Ico({ children, ...props }) {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }} {...props}>{children}</span>;
}

function rem(med, logs) {
  if (!med.pills_per_package) return null;
  const lastRefill = med.last_refill_date ? new Date(med.last_refill_date) : new Date(med.start_date);
  const sinceRefill = logs.filter(l => l.medication_id === med.id && new Date(l.taken_at) >= lastRefill).length;
  return Math.max(0, (med.pills_per_package || 0) - sinceRefill);
}

export default function MedsTab({ meds, logs, onAdd, onEdit, onDelete, onRefill, plan }) {
  const { t } = useLang();
  const { tier, config: limits } = useTier();
  const medCount = meds.length;
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
      <div style={{background:"var(--card)",borderRadius:"var(--rl)",padding:"18px",marginBottom:12,boxShadow:"var(--card-shadow)"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:12,flex:1}}>
            {med.image_url && <img src={med.image_url} alt="" style={{width:40,height:40,borderRadius:10,objectFit:"cover",flexShrink:0}}/>}
            <div>
              <div style={{fontSize:17,fontWeight:600,marginBottom:4}}>{med.name}</div>
              <div style={{fontSize:14,color:"var(--t3)"}}>{med.dosage_amount} {med.dosage_unit} · {exp}× daily</div>
            </div>
          </div>
          <span className={`badge ${isActive?"badge-green":"badge-gray"}`}>{isActive?t("meds.active"):t("meds.completed")}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[
            [t("meds.course"),`${med.course_duration_days}d`],
            [t("meds.takenToday"),`${takenToday}/${exp}`],
            [t("meds.ends"),fmtDate(endDate.toISOString())]
          ].map(([l,v])=>(
            <div key={l} style={{background:"var(--bg)",borderRadius:10,padding:"8px 10px"}}>
              <div style={{fontSize:11,color:"var(--t3)",fontWeight:500,marginBottom:2}}>{l}</div>
              <div style={{fontSize:14,fontWeight:600}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:12,color:"var(--t3)",marginBottom:4}}>{t("meds.day")} {prog} {t("meds.of")} {med.course_duration_days}</div>
        <div className="prog"><div className="prog-fill" style={{width:`${pct*100}%`,background:isActive?"var(--teal)":"var(--t4)"}}/></div>
        {med.reminder_times&&<div style={{fontSize:12,color:"var(--t3)",marginTop:6,display:"flex",alignItems:"center",gap:5}}><Ico><Clock size={13} strokeWidth={2.2}/></Ico> {med.reminder_times.split(",").join(" · ")}</div>}
        {med.notes&&<div style={{fontSize:13,color:"var(--t3)",marginTop:8,display:"flex",alignItems:"center",gap:5}}><Ico><FileText size={14} strokeWidth={2.2}/></Ico> {med.notes}</div>}
        {remaining !== null && (
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,fontSize:13}}>
            <span style={{color:lowStock?"var(--red)":"var(--teal2)",fontWeight:600,display:"flex",alignItems:"center",gap:4}}><Ico><Package size={14} strokeWidth={2.2}/></Ico> {remaining} {t("meds.remaining")}</span>
            {lowStock && <span style={{color:"var(--red)",fontWeight:500}}>· {t("meds.refillSoon")}</span>}
            <button className="btn btn-sm" style={{marginLeft:"auto",background:"var(--ib1)",border:"none",fontSize:11,display:"flex",alignItems:"center",gap:4}} onClick={()=>onRefill(med)}><Ico><Plus size={13} strokeWidth={2.5}/></Ico> {t("meds.refill")}</button>
          </div>
        )}
        {(med.doctor_name||med.pharmacy_name)&&<div style={{marginTop:10,paddingTop:10,borderTop:"0.5px solid var(--sep)",display:"flex",gap:12,fontSize:12,color:"var(--t3)"}}>
          {med.doctor_name&&<div><span style={{fontWeight:500,color:"var(--t2)"}}>Dr:</span> {med.doctor_name}{med.doctor_phone?` · ${med.doctor_phone}`:""}</div>}
          {med.pharmacy_name&&<div><span style={{fontWeight:500,color:"var(--t2)"}}>Rx:</span> {med.pharmacy_name}{med.pharmacy_phone?` · ${med.pharmacy_phone}`:""}</div>}
          {med.next_refill_date&&<div><span style={{fontWeight:500,color:"var(--t2)"}}>Refill:</span> {fmtDate(med.next_refill_date)}</div>}
        </div>}
        {<div style={{display:"flex",gap:8,marginTop:12}}>
          <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={()=>onEdit(med)}>{t("meds.edit")}</button>
          <button className="btn btn-sm" style={{flex:1,background:"var(--ib6)",color:"var(--red)",border:"none"}} onClick={()=>onDelete(med.id)}>{t("meds.delete")}</button>
        </div>}
      </div>
    );
  }

  return (
    <div className="scroll">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingRight:4}}>
        <div className="nav-large" style={{paddingBottom:4}}>{t("meds.title")}</div>
        <button className="nav-action" onClick={onAdd} style={{fontSize:28,lineHeight:1}}>＋</button>
      </div>

      <div className="chips">
        <div className="chip blue"><div className="chip-val">{meds.length}</div><div className="chip-lbl">{t("meds.total")}</div></div>
        <div className="chip green"><div className="chip-val">{active.length}</div><div className="chip-lbl">{t("meds.active")}</div></div>
        <div className="chip"><div className="chip-val">{ended.length}</div><div className="chip-lbl">{t("meds.completed")}</div></div>
      </div>

      {tier === "free" ? (
        <div style={{margin:"0 20px 14px",background:"var(--card)",borderRadius:"var(--rl)",padding:"14px 18px",boxShadow:"var(--card-shadow)",border:"var(--card-border)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:13,fontWeight:600,color:"var(--t2)"}}>{t("meds.medLimit")}</span>
            <span style={{fontSize:13,fontWeight:600,color:medCount>=limits.maxMeds?"var(--red)":"var(--teal)"}}>{medCount}/{limits.maxMeds} {t("meds.used")}</span>
          </div>
          <div className="prog"><div className="prog-fill" style={{width:`${Math.min(medCount/limits.maxMeds,1)*100}%`,background:medCount>=limits.maxMeds?"var(--red)":"var(--teal)"}}/></div>
          {medCount>=limits.maxMeds && <div style={{fontSize:12,color:"var(--t3)",marginTop:6}}>{t("meds.upgradeForUnlimited")}</div>}
        </div>
      ) : (
        <div style={{margin:"0 20px 14px",background:"var(--card)",borderRadius:"var(--rl)",padding:"14px 18px",boxShadow:"var(--card-shadow)",border:"var(--card-border)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Ico><CheckCircle2 size={16} color="var(--teal2)"/></Ico>
            <span style={{fontSize:13,fontWeight:600,color:"var(--t2)"}}>No limits — track as many medications as you need</span>
          </div>
        </div>
      )}

      {active.length>0&&<div className="section"><div className="section-header">{t("meds.activeSection")}</div>{active.map(m=><MedCard key={m.id} med={m}/>)}</div>}
      {ended.length>0&&<div className="section"><div className="section-header">{t("meds.completedSection")}</div>{ended.map(m=><MedCard key={m.id} med={m}/>)}</div>}
      {meds.length===0&&(
        <div className="empty-state" style={{paddingTop:60}}>
          <div className="empty-state-icon"><Ico><Pill size={52} strokeWidth={1.5} color="var(--t2)"/></Ico></div>
          <div className="empty-state-title">{t("meds.noMeds")}</div>
          <div className="empty-state-sub">{t("meds.noMedsSub")}</div>
        </div>
      )}
    </div>
  );
}
