"use client";

import { CSS } from "@/lib/constants";
import { calcStreak } from "@/lib/data";

export default function ReportsTab({ logs, meds }) {
  const today = new Date();
  const streak = calcStreak(logs, meds);
  const grouped = {};
  logs.forEach(l => { const d = l.taken_at?.split("T")[0]; if (d) { if (!grouped[d]) grouped[d]=[]; grouped[d].push(l); } });
  const daysTracked = Object.keys(grouped).length;
  const totalDoses = logs.length;
  const adherence = daysTracked > 0 ? Math.round((totalDoses / (daysTracked * meds.reduce((s,m) => s + (m.times_per_day || 1), 0))) * 100) : 0;

  function perMedAdherence() {
    return meds.map(med => {
      const medLogs = logs.filter(l => l.medication_id === med.id);
      const expected = med.course_duration_days * (med.times_per_day || 1);
      const pct = expected > 0 ? Math.round((medLogs.length / expected) * 100) : 0;
      return { ...med, taken: medLogs.length, expected, pct: Math.min(pct, 100) };
    });
  }

  function generateReportText() {
    const lines = ["MediTrack Adherence Report", `Generated: ${today.toLocaleDateString()}`,
      `Streak: ${streak} days`, `Days tracked: ${daysTracked}`, `Total doses: ${totalDoses}`,
      `Overall adherence: ${adherence}%`, "", "--- Per Medication ---", ""];
    perMedAdherence().forEach(m => {
      lines.push(`${m.name}: ${m.taken}/${m.expected} doses (${m.pct}%)`);
      if (m.notes) lines.push(`  Notes: ${m.notes}`);
    });
    return lines.join("\n");
  }

  function downloadReport() {
    const blob = new Blob([generateReportText()], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `meditrack-report-${today.toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="scroll">
      <div className="nav-large">Reports</div>

      <div className="chips">
        <div className="chip blue"><div className="chip-val">{daysTracked}</div><div className="chip-lbl">Days tracked</div></div>
        <div className="chip green"><div className="chip-val">{adherence}%</div><div className="chip-lbl">Adherence</div></div>
        <div className="chip purple"><div className="chip-val">🔥{streak}</div><div className="chip-lbl">Best streak</div></div>
      </div>

      <div className="section">
        <div className="section-header">Per-medication adherence</div>
        {meds.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-title">No data yet</div><div className="empty-state-sub">Add medications and log doses to see reports</div></div>
        ) : (
          <div className="list">
            {perMedAdherence().map(m => (
              <div key={m.id} className="row" style={{cursor:"default"}}>
                <div className="row-icon" style={{background:"var(--ib1)",fontSize:18}}>💊</div>
                <div className="row-body">
                  <div className="row-title">{m.name}</div>
                  <div className="row-sub">{m.taken}/{m.expected} doses ({m.pct}%)</div>
                  <div className="prog"><div className="prog-fill" style={{width:`${m.pct}%`,background:m.pct>=80?"var(--teal2)":m.pct>=50?"var(--orange)":"var(--red)"}}/></div>
                </div>
                <div className="row-value" style={{fontWeight:700,color:m.pct>=80?"var(--teal2)":m.pct>=50?"var(--orange)":"var(--red)"}}>{m.pct}%</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{padding:"0 16px 16px"}}>
        <button className="btn btn-primary" onClick={downloadReport} disabled={meds.length === 0}>
          📄 Download adherence report
        </button>
      </div>
    </div>
  );
}
