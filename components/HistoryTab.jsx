"use client";

import { CSS, fmtTime, fmtDateLong } from "@/lib/constants";
import { calcStreak } from "@/lib/data";

export default function HistoryTab({ logs, meds, plan }) {
  const limits = { free: { history: 7 }, pro: { history: 999 }, family: { history: 999 } };
  const maxDays = (limits[plan] || limits.free).history;
  const streak = calcStreak(logs, meds);
  const grouped = {};
  logs.forEach(l => {
    const d = l.taken_at?.split("T")[0];
    if (d) { if (!grouped[d]) grouped[d]=[]; grouped[d].push(l); }
  });
  const days = Object.keys(grouped).sort().reverse().slice(0, maxDays);

  return (
    <div className="scroll">
      <div className="nav-large">History</div>

      <div className="chips">
        <div className="chip orange"><div className="chip-val">🔥{streak}</div><div className="chip-lbl">Day streak</div></div>
        <div className="chip blue"><div className="chip-val">{logs.length}</div><div className="chip-lbl">Total doses</div></div>
        <div className="chip green"><div className="chip-val">{days.length}</div><div className="chip-lbl">Days tracked</div></div>
      </div>

      {days.length===0?(
        <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No history yet</div><div className="empty-state-sub">Your dose logs will appear here</div></div>
      ):days.map(d=>(
        <div key={d} className="section">
          <div className="section-header">{fmtDateLong(d+"T12:00:00")}</div>
          <div className="list">
            {grouped[d].map(log=>(
              <div key={log.id} className="row" style={{cursor:"default"}}>
                <div style={{fontSize:20}}>💊</div>
                <div className="row-body"><div className="row-title">{log.medications?.name||"Medication"}</div></div>
                <div className="row-value" style={{fontSize:14}}>{fmtTime(log.taken_at)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
