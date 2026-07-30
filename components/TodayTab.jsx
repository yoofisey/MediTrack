"use client";

import { CSS, fmtTime } from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { calcStreak, getStockStatus, getUpcomingVisits } from "@/lib/data";
import { isVitalDue } from "@/lib/notifications";
import Ring from "@/components/Ring";
import { Pill, CheckCircle2, Lock, Bell, Package, AlertTriangle, TrendingDown, Activity, Droplet, HeartPulse, Thermometer, Wind, BarChart3, Building2, Flame, CalendarClock } from "lucide-react";

function Ico({ children, size = 18, ...props }) {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }} {...props}>{children}</span>;
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180];
const STREAK_EMOJIS = { 3:"🥉", 7:"🥈", 14:"🥇", 30:"🔥", 60:"💪", 90:"🏆", 180:"👑" };
const STREAK_LABELS = { 3:"3-Day Streak!", 7:"One Week!", 14:"Two Weeks!", 30:"30-Day Club!", 60:"60 Days Strong!", 90:"90-Day Warrior!", 180:"Half Year Legend!" };

function milestone(streak) {
  return STREAK_MILESTONES.filter(m => streak >= m).pop() || null;
}

export default function TodayTab({ meds, logs, onLog, onAdd, notifPerm, onEnableNotif, onViewVisits, onViewVisitList, vitals, vitalReminders, onNavigateVitals }) {
  const { t, lang } = useLang();
  const today = new Date();

  const todayStr = today.toISOString().split("T")[0];
  const todayLogs = logs.filter(l => l.taken_at?.startsWith(todayStr));
  const activeMeds = meds.filter(m => { if (!m.active) return false; const e=new Date(m.start_date); e.setDate(e.getDate()+m.course_duration_days); return e>=today; });
  function exp(med) { return med.times_per_day||Math.max(1,Math.floor(24/med.dose_interval_hours)); }
  const total = activeMeds.reduce((s,m)=>s+exp(m),0);
  const taken = todayLogs.length;
  const pct = total > 0 ? taken/total : 0;
  const streak = calcStreak(logs, meds);
  const ms = milestone(streak);

  const lowStockMeds = activeMeds.filter(m => {
    const s = getStockStatus(m, logs);
    return s && (s.status === "low" || s.status === "empty");
  });

  const upcomingVisits = getUpcomingVisits(14);

  return (
    <div className="scroll" style={{paddingTop:0}}>
      <div className="hero-card" style={{margin:"16px 20px 14px"}}>
        <div style={{position:"relative",zIndex:1}}>
          <div className="hero-label">{today.toLocaleDateString(lang==="fr"?"fr-FR":lang==="sw"?"sw-KE":"en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div className="hero-big">{taken}<span style={{fontSize:28,fontWeight:500,opacity:.7}}>/{total}</span></div>
              <div className="hero-sub">{t("today.dosesTaken")}</div>
            </div>
            <Ring pct={pct} size={84} color="rgba(255,255,255,.9)" stroke={7}/>
          </div>
          <div className="hero-row">
            <div className="hero-stat"><div className="hero-stat-val">{activeMeds.length}</div><div className="hero-stat-lbl">{t("today.activeMeds")}</div></div>
            <div className="hero-stat"><div className="hero-stat-val">🔥 {streak}</div><div className="hero-stat-lbl">{streak===1?t("day"):t("days")} {t("today.streak")}</div></div>
            <div className="hero-stat"><div className="hero-stat-val">{Math.max(0,total-taken)}</div><div className="hero-stat-lbl">{t("today.remaining")}</div></div>
          </div>
        </div>
      </div>

      {ms && (
        <div style={{margin:"0 20px 14px",display:"flex",alignItems:"center",gap:12,background:"var(--card)",borderRadius:"var(--rl)",padding:"16px 18px",boxShadow:"var(--card-shadow)",border:"var(--card-border)"}}>
          <span style={{fontSize:28}}>{STREAK_EMOJIS[ms]}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:"var(--t1)"}}>{t(`streak.${ms}`)}</div>
            <div style={{fontSize:12,color:"var(--t3)",marginTop:2}}>{t("today.keepGoing")}</div>
          </div>
        </div>
      )}

      {notifPerm==="default" && (
        <div className="notif-banner" onClick={onEnableNotif}>
          <div className="notif-banner-text" style={{display:"flex",alignItems:"center",gap:6}}>
            <Ico><Bell size={16} color="white" strokeWidth={2.2}/></Ico>
            {t("today.enableReminders")}
          </div>
          <button className="notif-banner-btn">{t("today.enable")}</button>
        </div>
      )}

      {lowStockMeds.length > 0 && (
        <div style={{margin:"0 20px 14px",background:"linear-gradient(135deg,#FF3B30,#FF6B3A)",borderRadius:16,padding:"16px 18px",color:"white"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <Ico><Package size={17} color="white" strokeWidth={2.2}/></Ico>
            <span style={{fontSize:14,fontWeight:600}}>{t("today.lowStock")}</span>
          </div>
          {lowStockMeds.map(m => {
            const s = getStockStatus(m, logs);
            return (
              <div key={m.id} style={{fontSize:13,opacity:.95,marginBottom:2}}>
                <Ico><span style={{display:"inline-flex",marginRight:4}}>{s.status==="empty" ? <AlertTriangle size={13} strokeWidth={2.2}/> : <TrendingDown size={13} strokeWidth={2.2}/>}</span></Ico>{m.name} — {s.remaining} {m.dosage_unit} left
              </div>
            );
          })}
          <div style={{fontSize:11,opacity:.7,marginTop:4}}>{t("today.refillSoon")}</div>
        </div>
      )}

      {(() => {
        const dueVitals = [];
        if (vitals && vitalReminders) {
          Object.entries(vitalReminders).forEach(([vitalId, config]) => {
            if (config?.intervalId && config.intervalId !== "off" && isVitalDue(vitalId, vitals, config.intervalId)) {
              const labels = { blood_pressure:"Blood Pressure", glucose:"Blood Sugar", weight:"Weight", heart_rate:"Heart Rate", temperature:"Temperature", spo2:"Oxygen Level" };
              const icons = { blood_pressure: <Activity size={15} strokeWidth={2.2}/>, glucose: <Droplet size={15} strokeWidth={2.2}/>, weight: <BarChart3 size={15} strokeWidth={2.2}/>, heart_rate: <HeartPulse size={15} strokeWidth={2.2}/>, temperature: <Thermometer size={15} strokeWidth={2.2}/>, spo2: <Wind size={15} strokeWidth={2.2}/> };
              dueVitals.push({ id:vitalId, label:labels[vitalId]||vitalId, icon:icons[vitalId]||"📊" });
            }
          });
        }
        if (!dueVitals.length) return null;
        return (
          <div style={{margin:"0 20px 14px",background:"linear-gradient(135deg,#FF9500,#FF6B00)",borderRadius:16,padding:"16px 18px",color:"white",cursor:"pointer"}} onClick={onNavigateVitals}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <Ico><BarChart3 size={17} color="white" strokeWidth={2.2}/></Ico>
            <span style={{fontSize:14,fontWeight:600}}>{t("today.vitalCheck")}</span>
          </div>
            {dueVitals.map(v => (
              <div key={v.id} style={{fontSize:13,opacity:.95,marginBottom:2,display:"flex",alignItems:"center",gap:6}}>
                <Ico>{v.icon}</Ico> Time to check your {v.label}
              </div>
            ))}
            <div style={{fontSize:11,opacity:.7,marginTop:4}}>{t("today.tapToLog")}</div>
          </div>
        );
      })()}

      {upcomingVisits.length > 0 && (
        <div style={{margin:"0 20px 14px",background:"var(--card)",borderRadius:"var(--rl)",padding:"16px 18px",boxShadow:"var(--card-shadow)",cursor:"pointer"}} onClick={onViewVisitList}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <Ico><Building2 size={17} strokeWidth={2.2} color="var(--t1)"/></Ico>
            <span style={{fontSize:14,fontWeight:600,color:"var(--t1)",flex:1}}>{t("today.upcomingVisits")}</span>
            <span style={{fontSize:12,color:"var(--teal)",fontWeight:500}}>{t("today.seeAll")}</span>
          </div>
          {upcomingVisits.slice(0, 3).map(v => {
            const d = new Date(v.date + "T" + (v.time || "09:00"));
            const daysUntil = Math.ceil((d - today) / 86400000);
            const label = daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`;
            return (
              <div key={v.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderTop:"0.5px solid var(--sep)"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:"var(--t1)"}}>{v.reason || "Hospital visit"}</div>
                  <div style={{fontSize:12,color:"var(--t3)"}}>{v.facility || v.doctor || ""} · {v.time}</div>
                </div>
                <span style={{fontSize:12,fontWeight:600,color:daysUntil <= 1 ? "var(--orange)" : "var(--teal)"}}>{label}</span>
              </div>
            );
          })}
          {upcomingVisits.length > 3 && <div style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginTop:4}}>+{upcomingVisits.length - 3} more</div>}
        </div>
      )}

      <div style={{padding:"0 20px",marginBottom:14}}>
        <button className="btn" style={{width:"100%",background:"var(--ib5)",color:"var(--t1)",fontWeight:500,fontSize:13,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"center",gap:6}} onClick={onViewVisits}>
          <Ico><Building2 size={16} strokeWidth={2.2}/></Ico> {t("today.scheduleVisit")}
        </button>
      </div>

      <div className="section">
        <div className="section-header">{t("today.medsTitle")}</div>
        {activeMeds.length===0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Ico size={52}><Pill size={52} strokeWidth={1.5} color="var(--t2)"/></Ico></div>
            <div className="empty-state-title">{t("today.noMeds")}</div>
            <div className="empty-state-sub">{t("today.noMedsSub")}</div>
            <button className="btn btn-primary" style={{width:"auto",padding:"12px 24px"}} onClick={onAdd}>{t("today.addMed")}</button>
          </div>
        ) : (
          <div className="list">
            {activeMeds.map(med => {
              const taken = todayLogs.filter(l=>l.medication_id===med.id).length;
              const e = exp(med);
              const done = taken>=e;
              const lastLog = logs.filter(l=>l.medication_id===med.id).sort((a,b)=>b.taken_at.localeCompare(a.taken_at))[0];
              const interval = med.dose_interval_hours || 24/med.times_per_day;
              let locked = false;
              let lockMsg = "";
              if (lastLog && !done) {
                const elapsed = (today - new Date(lastLog.taken_at)) / 3600000;
                if (elapsed < interval) {
                  locked = true;
                  const remaining = interval - elapsed;
                  if (remaining < 1) lockMsg = `in ${Math.round(remaining*60)}m`;
                  else lockMsg = `in ${remaining.toFixed(1)}h`;
                }
              }
              return (
                <div key={med.id} className="row" style={{cursor:"default"}}>
                  <div className="row-icon" style={{background:done?"var(--ib2)":locked?"var(--ib6)":"var(--ib1)"}}>
                    <Ico>{done ? <CheckCircle2 size={20} strokeWidth={2} color="var(--teal)"/> : locked ? <Lock size={20} strokeWidth={2} color="var(--t2)"/> : <Pill size={20} strokeWidth={2} color="var(--t1)"/>}</Ico>
                  </div>
                  <div className="row-body">
                    <div className="row-title" style={{fontWeight:500}}>{med.name}</div>
                    <div className="row-sub">{med.dosage_amount} {med.dosage_unit} · {e}× {t("meds.daily")}</div>
                    <div className="prog"><div className="prog-fill" style={{width:`${Math.min(taken/e,1)*100}%`,background:done?"var(--teal2)":"var(--teal)"}}/></div>
                    <div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>{taken} {t("today.of")} {e} {t("today.dosesTaken2")}</div>
                  </div>
                  <button className={`btn btn-green btn-sm${done?" btn-disabled":""}`} style={{flexShrink:0,opacity:locked?0.6:1}} onClick={()=>onLog(med)} disabled={done||locked}>
                    {done?t("btn.done_"):locked?<span style={{display:"flex",alignItems:"center",gap:4}}><Lock size={12} strokeWidth={2.2}/> {lockMsg}</span>:t("btn.log")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {todayLogs.length>0 && (
        <div className="section">
          <div className="section-header">{t("today.loggedToday")}</div>
          <div className="list">
            {todayLogs.slice(0,5).map(log=>(
              <div key={log.id} className="row" style={{cursor:"default"}}>
                <div className="row-icon" style={{background:"var(--ib2)"}}><Ico><CheckCircle2 size={18} strokeWidth={2} color="var(--teal)"/></Ico></div>
                <div className="row-body"><div className="row-title">{log.medications?.name||"Med"}</div></div>
                <div className="row-value">{fmtTime(log.taken_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
