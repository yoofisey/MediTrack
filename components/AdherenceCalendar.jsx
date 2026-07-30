"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AdherenceCalendar({ logs, meds }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const totalCells = startPad + daysInMonth;
    const rows = Math.ceil(totalCells / 7);

    const logMap = {};
    logs.forEach(l => {
      const d = l.taken_at?.split("T")[0];
      if (d) logMap[d] = (logMap[d] || 0) + 1;
    });

    const medMap = {};
    meds.forEach(m => { medMap[m.id] = m.times_per_day || 1; });

    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 7; c++) {
        const cellIdx = r * 7 + c;
        const dayNum = cellIdx - startPad + 1;
        if (dayNum < 1 || dayNum > daysInMonth) { cells.push(null); continue; }
        const date = new Date(year, month, dayNum);
        const dateStr = date.toISOString().split("T")[0];
        const takenCount = logMap[dateStr] || 0;
        const expectedCount = Object.values(medMap).reduce((s, v) => s + v, 0);
        const isToday = dateStr === today.toISOString().split("T")[0];
        const pct = expectedCount > 0 ? takenCount / expectedCount : 0;

        let color = "var(--sep)";
        if (takenCount > 0 && pct >= 0.9) color = "#34D399";
        else if (takenCount > 0 && pct >= 0.5) color = "#FBBF24";
        else if (takenCount > 0) color = "#F87171";
        else if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) color = "var(--t4)";

        cells.push({ dayNum, dateStr, takenCount, color, isToday, date });
      }
    }
    return { cells, rows };
  }, [viewDate, logs, meds, today]);

  const monthLabel = viewDate.toLocaleDateString("en", { month: "long", year: "numeric" });
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function prevMonth() { setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }
  function nextMonth() { setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }

  return (
    <div style={{background:"var(--card)",borderRadius:"var(--rxl)",padding:"18px",boxShadow:"var(--card-shadow)",border:"var(--card-border)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <button onClick={prevMonth} style={{background:"none",border:"none",cursor:"pointer",color:"var(--teal)",padding:4,display:"grid",placeItems:"center"}}><ChevronLeft size={18} strokeWidth={2.5}/></button>
        <div style={{fontSize:15,fontWeight:600,color:"var(--t1)"}}>{monthLabel}</div>
        <button onClick={nextMonth} style={{background:"none",border:"none",cursor:"pointer",color:"var(--teal)",padding:4,display:"grid",placeItems:"center"}}><ChevronRight size={18} strokeWidth={2.5}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,textAlign:"center",marginBottom:8}}>
        {dayLabels.map(d => <div key={d} style={{fontSize:10,color:"var(--t4)",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {monthData.cells.map((cell, i) => (
          <div key={i} style={{position:"relative",paddingTop:"100%"}}>
            {cell && (
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:cell.color,borderRadius:8}}>
                <span style={{fontSize:11,fontWeight:cell.isToday?700:500,color:cell.color=== "var(--sep)" || cell.color==="var(--t4)" ? "var(--t3)" : "white",lineHeight:1}}>{cell.dayNum}</span>
                {cell.takenCount > 0 && <span style={{fontSize:8,color:"rgba(255,255,255,.7)",marginTop:1}}>{cell.takenCount}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
