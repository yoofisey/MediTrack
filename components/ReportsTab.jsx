"use client";

import { CSS } from "@/lib/constants";
import { calcStreak, TIER_LIMITS } from "@/lib/data";

export default function ReportsTab({ logs, meds, plan }) {
  const limits = TIER_LIMITS[plan] || TIER_LIMITS.free;
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

  function drawBarChart(canvas, data, label, color) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const pad = { t: 30, r: 20, b: 40, l: 50 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#1E293B";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, w/2, 20);

    const maxVal = Math.max(...data.map(d => d.val), 10);
    const gap = cw / (data.length + 1);
    const barW = Math.min(gap * 0.5, 36);

    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + ch);
    ctx.lineTo(pad.l + cw, pad.t + ch);
    ctx.stroke();

    data.forEach((d, i) => {
      const x = pad.l + gap * (i + 1) - barW/2;
      const bh = (d.val / maxVal) * ch;
      const y = pad.t + ch - bh;

      ctx.fillStyle = d.val >= 80 ? "#059669" : d.val >= 50 ? "#D97706" : "#DC2626";
      ctx.beginPath();
      ctx.roundRect(x, y, barW, bh, [4,4,0,0]);
      ctx.fill();

      ctx.fillStyle = "#475569";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(d.label, x + barW/2, pad.t + ch + 18);

      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.fillText(d.val + "%", x + barW/2, y - 6);
    });
  }

  async function generatePdfReport() {
    const pm = perMedAdherence();

    const weekDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const dayLogs = logs.filter(l => l.taken_at?.startsWith(ds));
      const dailyExp = meds.reduce((s,m) => s + (m.times_per_day || 1), 0);
      const pct = dailyExp > 0 ? Math.round((dayLogs.length / dailyExp) * 100) : 0;
      weekDays.push({ label: d.toLocaleDateString("en",{weekday:"short"}), val: Math.min(pct,100) });
    }

    const chartCanvas1 = document.createElement("canvas");
    chartCanvas1.width = 600;
    chartCanvas1.height = 300;
    drawBarChart(chartCanvas1, pm.map(m => ({ label: m.name.length > 10 ? m.name.slice(0,10)+"…" : m.name, val: m.pct })), "Adherence by Medication", "#2563EB");

    const chartCanvas2 = document.createElement("canvas");
    chartCanvas2.width = 600;
    chartCanvas2.height = 250;
    drawBarChart(chartCanvas2, weekDays, "Daily Adherence (Last 7 Days)", "#059669");

    const chart1 = chartCanvas1.toDataURL("image/png");
    const chart2 = chartCanvas2.toDataURL("image/png");

    function medStatus(pct) {
      return pct >= 80 ? "Good" : pct >= 50 ? "Fair" : "Poor";
    }

    function timeOfDayAnalysis() {
      const slots = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
      logs.forEach(l => {
        const h = new Date(l.taken_at).getHours();
        if (h < 6) slots.Night++;
        else if (h < 12) slots.Morning++;
        else if (h < 18) slots.Afternoon++;
        else slots.Evening++;
      });
      const best = Object.entries(slots).sort((a,b) => b[1] - a[1])[0];
      return { slots, best: best ? best[0] : "—", bestCount: best ? best[1] : 0 };
    }

    const timeAnalysis = timeOfDayAnalysis();

    const activeMeds = meds.filter(m => m.active);
    const completedPct = activeMeds.length
      ? Math.round(activeMeds.reduce((s,m) => s + Math.min(Math.ceil((Date.now()-new Date(m.start_date).getTime())/86400000), m.course_duration_days) / m.course_duration_days, 0) / activeMeds.length * 100)
      : 0;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Adhera Medical Report</title>
<style>
  @page{size:A4;margin:18mm 16mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,-apple-system,system-ui,sans-serif;color:#0F172A;line-height:1.5;padding:0}
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #2563EB}
  .header h1{font-size:22px;font-weight:800;color:#2563EB;letter-spacing:-.3px}
  .header .sub{font-size:11px;color:#64748B}
  .patient-info{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#F8FAFC;border-radius:10px;padding:14px 16px;margin-bottom:20px;font-size:13px}
  .patient-info .lbl{color:#64748B;font-weight:500}
  .patient-info .val{font-weight:600;color:#0F172A}
  .summary-cards{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:24px}
  .scard{background:#F8FAFC;border-radius:10px;padding:12px;text-align:center}
  .scard .num{font-size:22px;font-weight:800;color:#2563EB}
  .scard .lbl{font-size:11px;color:#64748B;margin-top:2px}
  .scard.green .num{color:#059669}
  .scard.orange .num{color:#D97706}
  .scard.purple .num{color:#7C3AED}
  .section-title{font-size:15px;font-weight:700;color:#0F172A;margin-bottom:12px;margin-top:20px;padding-bottom:6px;border-bottom:2px solid #E2E8F0}
  .chart{margin:12px 0 20px;text-align:center}
  .chart img{max-width:100%;border-radius:8px;border:1px solid #E2E8F0}
  .med-table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
  .med-table th{background:#F1F5F9;padding:8px 10px;text-align:left;font-weight:600;font-size:12px;color:#475569;border-bottom:2px solid #E2E8F0}
  .med-table td{padding:8px 10px;border-bottom:1px solid #F1F5F9}
  .med-table .status{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600}
  .status-good{background:#DCFCE7;color:#059669}
  .status-fair{background:#FEF3C7;color:#D97706}
  .status-poor{background:#FEE2E2;color:#DC2626}
  .insights-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
  .insight{background:#F8FAFC;border-radius:10px;padding:14px}
  .insight .ilbl{font-size:11px;color:#64748B;font-weight:500}
  .insight .ival{font-size:16px;font-weight:700;color:#0F172A;margin-top:2px}
  .footer{margin-top:28px;padding-top:12px;border-top:1px solid #E2E8F0;font-size:10px;color:#94A3B8;text-align:center}
  .doctor-notes{background:#FFF7ED;border-radius:10px;padding:14px 16px;margin-top:16px;font-size:12px;color:#334155;border-left:4px solid #2563EB}
  .doctor-notes .title{font-weight:700;font-size:13px;margin-bottom:4px}
</style></head><body>
<div class="header">
  <div>
    <h1>ADHERA</h1>
    <div class="sub">Medication Adherence Report</div>
  </div>
  <div style="text-align:right">
    <div style="font-weight:700;font-size:14px">${today.toLocaleDateString("en",{year:"numeric",month:"long",day:"numeric"})}</div>
    <div class="sub">Report period: all-time</div>
  </div>
</div>

<div class="patient-info">
  <div><span class="lbl">Plan: </span><span class="val">${plan.charAt(0).toUpperCase()+plan.slice(1)}</span></div>
  <div><span class="lbl">Active medications: </span><span class="val">${activeMeds.length}</span></div>
  <div><span class="lbl">Current streak: </span><span class="val">${streak} days</span></div>
  <div><span class="lbl">Adherence rate: </span><span class="val">${adherence}%</span></div>
</div>

<div class="section-title">Executive Summary</div>
<div class="summary-cards">
  <div class="scard green"><div class="num">${adherence}%</div><div class="lbl">Overall<br/>Adherence</div></div>
  <div class="scard"><div class="num">${streak}</div><div class="lbl">Best<br/>Streak</div></div>
  <div class="scard orange"><div class="num">${daysTracked}</div><div class="lbl">Days<br/>Tracked</div></div>
  <div class="scard purple"><div class="num">${totalDoses}</div><div class="lbl">Total<br/>Doses</div></div>
</div>

<div class="section-title">Adherence by Medication</div>
<div class="chart"><img src="${chart1}" alt="Adherence by medication"/></div>

<table class="med-table">
  <thead><tr><th>Medication</th><th>Dosage</th><th>Doses Taken</th><th>Expected</th><th>Adherence</th><th>Status</th></tr></thead>
  <tbody>
    ${pm.map(m => `<tr>
      <td style="font-weight:600">${m.name}</td>
      <td>${m.dosage_amount} ${m.dosage_unit}</td>
      <td>${m.taken}</td>
      <td>${m.expected}</td>
      <td>${m.pct}%</td>
      <td><span class="status status-${medStatus(m.pct).toLowerCase()}">${medStatus(m.pct)}</span></td>
    </tr>`).join("")}
  </tbody>
</table>

<div class="section-title">Weekly Trend</div>
<div class="chart"><img src="${chart2}" alt="Weekly adherence trend"/></div>

${limits.reports ? `
<div class="section-title">Clinical Insights</div>
<div class="insights-grid">
  <div class="insight"><div class="ilbl">Best Adherence Time</div><div class="ival">${timeAnalysis.best}</div><div style="font-size:12px;color:#64748B;margin-top:2px">${timeAnalysis.bestCount} doses logged</div></div>
  <div class="insight"><div class="ilbl">Course Completion</div><div class="ival">${completedPct}%</div><div style="font-size:12px;color:#64748B;margin-top:2px">across ${activeMeds.length} active course${activeMeds.length!==1?"s":""}</div></div>
  <div class="insight"><div class="ilbl">Dose Consistency</div><div class="ival">${adherence >= 80 ? "Good" : adherence >= 50 ? "Moderate" : "Needs Attention"}</div><div style="font-size:12px;color:#64748B;margin-top:2px">${adherence >= 80 ? "On track with treatment plan" : adherence >= 50 ? "Room for improvement" : "Significant doses missed"}</div></div>
  <div class="insight"><div class="ilbl">Total Data Points</div><div class="ival">${logs.length}</div><div style="font-size:12px;color:#64748B;margin-top:2px">dose logs recorded</div></div>
</div>

<div class="doctor-notes">
  <div class="title">👨‍⚕️ For the Medical Professional</div>
  <p>This report summarizes the patient's self-reported medication adherence data tracked through Adhera. The patient has ${meds.length} medication${meds.length!==1?"s":""} on record with an overall adherence rate of ${adherence}% across ${daysTracked} tracked days. ${pm.filter(m => m.pct < 80).length > 0 ? `Medications requiring attention: ${pm.filter(m => m.pct < 80).map(m => m.name).join(", ")}.` : "All medications are at or above the 80% adherence threshold."} The most consistent dosing occurs during the ${timeAnalysis.best} period. Data is self-reported and may not reflect actual consumption. This report is intended to support clinical discussions and should not replace professional medical judgment.</p>
</div>
` : ""}

<div class="footer">
  Adhera · Medication Adherence Report · Generated ${today.toISOString().split("T")[0]} · Confidential
</div>
</body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); }, 800);
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

      {limits.reports && (
        <div className="section">
          <div className="section-header">Detailed treatment analytics</div>
          <div className="list">
            {meds.map(med => {
              const medLogs = logs.filter(l => l.medication_id === med.id);
              const firstLog = medLogs[medLogs.length-1];
              const lastLog = medLogs[0];
              const daysSinceStart = firstLog ? Math.ceil((Date.now()-new Date(firstLog.taken_at).getTime())/86400000) : 0;
              const expectedDaily = med.times_per_day || 1;
              const expectedTotal = daysSinceStart * expectedDaily;
              const pct = expectedTotal > 0 ? Math.round((medLogs.length/expectedTotal)*100) : 0;
              const skipRate = medLogs.length > 0 ? Math.round((1 - medLogs.length/Math.max(expectedTotal,medLogs.length))*100) : 0;
              const trend = medLogs.length >= 14
                ? medLogs.slice(0,7).length >= medLogs.slice(-7).length ? "improving" : "declining"
                : "insufficient data";
              return (
                <div key={med.id} className="row" style={{cursor:"default",flexWrap:"wrap"}}>
                  <div className="row-icon" style={{background:"var(--ib4)",fontSize:18}}>📈</div>
                  <div className="row-body" style={{flex:"1 1 auto"}}>
                    <div className="row-title">{med.name}</div>
                    <div className="row-sub">{medLogs.length} total doses · {pct}% adherence</div>
                    <div style={{display:"flex",gap:12,marginTop:6,fontSize:12}}>
                      <span style={{color:"var(--t3)"}}>Trend: <span style={{fontWeight:600,color:trend==="improving"?"var(--teal)":trend==="declining"?"var(--red)":"var(--t3)"}}>{trend}</span></span>
                      <span style={{color:"var(--t3)"}}>Skip rate: <span style={{fontWeight:600}}>{skipRate}%</span></span>
                    </div>
                    <div className="prog" style={{marginTop:6}}><div className="prog-fill" style={{width:`${pct}%`,background:pct>=80?"var(--teal2)":pct>=50?"var(--orange)":"var(--red)"}}/></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {limits.reports && (
        <div className="section">
          <div className="section-header">Treatment insights</div>
          <div className="list">
            <div className="row" style={{cursor:"default"}}>
              <div className="row-icon" style={{background:"var(--ib2)",fontSize:18}}>⏱</div>
              <div className="row-body">
                <div className="row-title">Best time adherence</div>
                <div className="row-sub">
                  {logs.length > 0
                    ? (() => {
                        const hours = {};
                        logs.forEach(l => {
                          const h = new Date(l.taken_at).getHours();
                          const slot = h < 6 ? "Night" : h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
                          hours[slot] = (hours[slot]||0)+1;
                        });
                        const bestSlot = Object.entries(hours).sort((a,b)=>b[1]-a[1])[0];
                        return `You take doses most consistently in the ${bestSlot?.[0]||"day"} (${bestSlot?.[1]||0} doses)`;
                      })()
                    : "Log doses to see insights"}
                </div>
              </div>
            </div>
            <div className="row" style={{cursor:"default"}}>
              <div className="row-icon" style={{background:"var(--ib3)",fontSize:18}}>📋</div>
              <div className="row-body">
                <div className="row-title">Course completion forecast</div>
                <div className="row-sub">
                  {(() => {
                    const active = meds.filter(m=>m.active);
                    if (!active.length) return "No active courses";
                    const avg = active.reduce((s,m)=>{
                      const spent = Math.min(Math.ceil((Date.now()-new Date(m.start_date).getTime())/86400000), m.course_duration_days);
                      return s + (spent/m.course_duration_days);
                    },0)/active.length;
                    const pct = Math.round(avg*100);
                    return `${pct}% complete across ${active.length} active course${active.length>1?"s":""}`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(plan==="family"||plan==="enterprise") && (
        <div className="section">
          <div className="section-header">Caregiver dashboard</div>
          <div className="list">
            <div className="row" style={{cursor:"default"}}>
              <div className="row-icon" style={{background:"var(--ib4)",fontSize:18}}>👨‍👩‍👧</div>
              <div className="row-body">
                <div className="row-title">Family members</div>
                <div className="row-sub">Manage up to {limits.profiles} profiles</div>
              </div>
            </div>
            <div className="row" style={{cursor:"default"}}>
              <div className="row-icon" style={{background:"var(--ib2)",fontSize:18}}>📊</div>
              <div className="row-body">
                <div className="row-title">Shared reports</div>
                <div className="row-sub">View combined adherence across family members</div>
              </div>
            </div>
            <div className="row" style={{cursor:"default"}}>
              <div className="row-icon" style={{background:"var(--ib3)",fontSize:18}}>🔔</div>
              <div className="row-body">
                <div className="row-title">Caregiver alerts</div>
                <div className="row-sub">Get notified when a loved one misses a dose</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {plan==="enterprise" && (
        <div className="section">
          <div className="section-header">Enterprise dashboard</div>
          <div className="list">
            <div className="row" style={{cursor:"default"}}>
              <div className="row-icon" style={{background:"var(--ib4)",fontSize:18}}>🏥</div>
              <div className="row-body">
                <div className="row-title">Bulk patient overview</div>
                <div className="row-sub">Aggregate adherence across all patients under management</div>
              </div>
            </div>
            <div className="row" style={{cursor:"default"}}>
              <div className="row-icon" style={{background:"var(--ib1)",fontSize:18}}>🔌</div>
              <div className="row-body">
                <div className="row-title">API access</div>
                <div className="row-sub">Connect via REST API for EMR/HIS integration</div>
              </div>
            </div>
            <div className="row" style={{cursor:"default"}}>
              <div className="row-icon" style={{background:"var(--ib5)",fontSize:18}}>🎨</div>
              <div className="row-body">
                <div className="row-title">Custom branding</div>
                <div className="row-sub">White-label reports with your organization&apos;s identity</div>
              </div>
            </div>
            <div className="row" style={{cursor:"default"}}>
              <div className="row-icon" style={{background:"var(--ib3)",fontSize:18}}>🛡️</div>
              <div className="row-body">
                <div className="row-title">Compliance & audit</div>
                <div className="row-sub">HIPAA-compliant with full audit trail</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!limits.reports && (
        <div style={{margin:"0 16px 16px",background:"linear-gradient(135deg,#2563EB,#1D4ED8)",borderRadius:"var(--rxl)",padding:20,color:"white"}}>
          <div style={{fontSize:17,fontWeight:700,marginBottom:4}}>Upgrade for advanced reports</div>
          <div style={{fontSize:13,opacity:.9,lineHeight:1.5,marginBottom:12}}>
            Get detailed per-medication analytics, treatment insights, skip-rate tracking and trend analysis with Pro.
          </div>
          <button style={{background:"white",color:"#2563EB",border:"none",borderRadius:10,padding:"12px 20px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%"}}
            onClick={() => window.location.hash="#profile"}>
            Go to Profile →
          </button>
        </div>
      )}

      <div style={{padding:"0 16px 16px"}}>
        <button className="btn btn-primary" onClick={generatePdfReport} disabled={meds.length === 0}>
          📄 Generate PDF report
        </button>
      </div>
    </div>
  );
}
