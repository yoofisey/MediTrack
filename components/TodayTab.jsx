"use client";

import { CSS, fmtTime } from "@/lib/constants";
import { calcStreak } from "@/lib/data";
import Ring from "@/components/Ring";

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180];
const STREAK_EMOJIS = { 3:"🥉", 7:"🥈", 14:"🥇", 30:"🔥", 60:"💪", 90:"🏆", 180:"👑" };
const STREAK_LABELS = { 3:"3-Day Streak!", 7:"One Week!", 14:"Two Weeks!", 30:"30-Day Club!", 60:"60 Days Strong!", 90:"90-Day Warrior!", 180:"Half Year Legend!" };

function milestone(streak) {
  return STREAK_MILESTONES.filter(m => streak >= m).pop() || null;
}

export default function TodayTab({ meds, logs, onLog, onAdd, notifPerm, onEnableNotif }) {
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

  return (
    <div className="scroll" style={{paddingTop:0}}>
      <div className="hero-card" style={{margin:"16px 16px 12px"}}>
        <div style={{position:"relative",zIndex:1}}>
          <div className="hero-label">{today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div className="hero-big">{taken}<span style={{fontSize:28,fontWeight:500,opacity:.7}}>/{total}</span></div>
              <div className="hero-sub">doses taken today</div>
            </div>
            <Ring pct={pct} size={84} color="rgba(255,255,255,.9)" stroke={7}/>
          </div>
          <div className="hero-row">
            <div className="hero-stat"><div className="hero-stat-val">{activeMeds.length}</div><div className="hero-stat-lbl">Active meds</div></div>
            <div className="hero-stat"><div className="hero-stat-val">🔥 {streak}</div><div className="hero-stat-lbl">{streak===1?"day":"days"} streak</div></div>
            <div className="hero-stat"><div className="hero-stat-val">{Math.max(0,total-taken)}</div><div className="hero-stat-lbl">remaining</div></div>
          </div>
        </div>
      </div>

      {ms && (
        <div style={{margin:"0 16px 12px",display:"flex",alignItems:"center",gap:10,background:"var(--card)",borderRadius:"var(--rl)",padding:"14px 16px",boxShadow:"var(--card-shadow)",border:"var(--card-border)"}}>
          <span style={{fontSize:28}}>{STREAK_EMOJIS[ms]}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:"var(--t1)"}}>{STREAK_LABELS[ms]}</div>
            <div style={{fontSize:12,color:"var(--t3)",marginTop:2}}>Keep going! You&apos;re building a healthy habit.</div>
          </div>
        </div>
      )}

      {notifPerm==="default" && (
        <div className="notif-banner" onClick={onEnableNotif}>
          <div className="notif-banner-text">🔔 Enable reminders so you never miss a dose</div>
          <button className="notif-banner-btn">Enable</button>
        </div>
      )}

      <div className="section">
        <div className="section-header">Today&apos;s medications</div>
        {activeMeds.length===0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💊</div>
            <div className="empty-state-title">No medications yet</div>
            <div className="empty-state-sub">Add your first medication to start tracking</div>
            <button className="btn btn-primary" style={{width:"auto",padding:"12px 24px"}} onClick={onAdd}>+ Add medication</button>
          </div>
        ) : (
          <div className="list">
            {activeMeds.map(med => {
              const t = todayLogs.filter(l=>l.medication_id===med.id).length;
              const e = exp(med);
              const done = t>=e;
              const lastLog = logs.filter(l=>l.medication_id===med.id).sort((a,b)=>b.taken_at.localeCompare(a.taken_at))[0];
              const interval = med.dose_interval_hours || 24/med.times_per_day;
              let locked = false;
              let lockMsg = "";
              if (lastLog && !done) {
                const elapsed = (Date.now() - new Date(lastLog.taken_at).getTime()) / 3600000;
                if (elapsed < interval) {
                  locked = true;
                  const remaining = interval - elapsed;
                  if (remaining < 1) lockMsg = `in ${Math.round(remaining*60)}m`;
                  else lockMsg = `in ${remaining.toFixed(1)}h`;
                }
              }
              return (
                <div key={med.id} className="row" style={{cursor:"default"}}>
                  <div className="row-icon" style={{background:done?"var(--ib2)":locked?"var(--ib6)":"var(--ib1)",fontSize:20}}>
                    {done?"✅":locked?"🔒":"💊"}
                  </div>
                  <div className="row-body">
                    <div className="row-title" style={{fontWeight:500}}>{med.name}</div>
                    <div className="row-sub">{med.dosage_amount} {med.dosage_unit} · {e}× daily</div>
                    <div className="prog"><div className="prog-fill" style={{width:`${Math.min(t/e,1)*100}%`,background:done?"var(--teal2)":"var(--teal)"}}/></div>
                    <div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>{t} of {e} doses taken</div>
                  </div>
                  <button className={`btn btn-green btn-sm${done?" btn-disabled":""}`} style={{flexShrink:0,opacity:locked?0.6:1}} onClick={()=>onLog(med)} disabled={done||locked}>
                    {done?"Done ✓":locked?`🔒 ${lockMsg}`:"Log"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {todayLogs.length>0 && (
        <div className="section">
          <div className="section-header">Logged today</div>
          <div className="list">
            {todayLogs.slice(0,5).map(log=>(
              <div key={log.id} className="row" style={{cursor:"default"}}>
                <div className="row-icon" style={{background:"var(--ib2)"}}>✅</div>
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
