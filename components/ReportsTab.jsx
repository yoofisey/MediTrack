"use client";

import { useState, useEffect, useRef } from "react";
import { CSS, fmtTime, fmtDateLong, currencySymbol, escapeHtml } from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { calcStreak, getVisits, getVisitTime, localDayKey } from "@/lib/data";
import { useTier } from "@/components/TierContext";
import AdherenceChart from "@/components/AdherenceChart";
import AdherenceCalendar from "@/components/AdherenceCalendar";
import { Card, Segmented, InsightCard } from "@/components/ui";
import { SideEffectSummary } from "@/components/SideEffectTracker";
import { JournalMiniCalendar, JournalEntrySheet, JournalTimeline, getJournalEntry } from "@/components/HealthJournal";
import { Pill, BarChart3, TrendingUp, TrendingDown, Lightbulb, ClipboardList, DollarSign, FileText, Stethoscope, BookOpen, CalendarDays, Download, Scale, Heart, ChevronRight } from "lucide-react";
import { VisitRow, VisitDetailCard, visitStatusOf, visitStatusLabel, visitTimeLabel } from "@/components/VisitHistoryList";

function Ico({ children, ...props }) {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }} {...props}>{children}</span>;
}

export default function ReportsTab({ logs, meds, vitals, plan, onNavigate, onBack, memberName, tz }) {
  const { t } = useLang();
  const [showHistory, setShowHistory] = useState(false);
  const [journalDate, setJournalDate] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [pdfHtml, setPdfHtml] = useState(null);
  const [range, setRange] = useState("all");
  const [expandedVisit, setExpandedVisit] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mt_dismissed_insights") || "[]"); } catch { return []; }
  });
  const { config: limits, has } = useTier();
  const today = new Date();

  const allVisits = getVisits().slice().sort((a, b) => ((b.date || "") + (b.time || "")).localeCompare((a.date || "") + (a.time || "")));
  const now = new Date();
  const visitStats = {
    total: allVisits.length,
    upcoming: allVisits.filter(v => v.status !== "attended" && v.status !== "missed" && getVisitTime(v) >= now).length,
    attended: allVisits.filter(v => v.status === "attended").length,
    missed: allVisits.filter(v => v.status === "missed").length,
  };

  useEffect(() => {
    try { setJournalEntries(JSON.parse(localStorage.getItem("mt_journal") || "[]")); } catch { setJournalEntries([]); }
  }, [showHistory]);

  const cutoff = range === "7d" ? new Date(Date.now() - 6 * 86400000) : range === "30d" ? new Date(Date.now() - 29 * 86400000) : null;
  const rangedLogs = cutoff ? logs.filter(l => new Date(l.taken_at) >= cutoff) : logs;
  const streak = calcStreak(logs, meds, tz);
  const grouped = {};
  rangedLogs.forEach(l => { const d = localDayKey(new Date(l.taken_at), tz); if (d) { if (!grouped[d]) grouped[d]=[]; grouped[d].push(l); } });
  const daysTracked = Object.keys(grouped).length;
  const totalDoses = rangedLogs.length;

  function isMedActiveOnDate(med, date) {
    const s = new Date(med.start_date);
    const e = new Date(med.start_date); e.setDate(e.getDate() + (med.course_duration_days || 30));
    return med.active && date >= s && date <= e;
  }

  const activeMedsInRange = meds.filter(m => {
    if (!m.active) return false;
    if (!cutoff) return true;
    return isMedActiveOnDate(m, cutoff) || isMedActiveOnDate(m, today);
  });

  const adherence = daysTracked > 0 && activeMedsInRange.length > 0
    ? Math.round((totalDoses / (daysTracked * activeMedsInRange.reduce((s,m) => s + (m.times_per_day || 1), 0))) * 100) : 0;

  function perMedAdherence() {
    return meds.filter(m => m.active).map(med => {
      const medLogs = rangedLogs.filter(l => l.medication_id === med.id);
      let expected = 0;
      const rangeStart = cutoff || new Date(med.start_date);
      const rangeEnd = today;
      const medStart = new Date(med.start_date);
      const medEnd = new Date(med.start_date); medEnd.setDate(medEnd.getDate() + (med.course_duration_days || 30));
      const effStart = rangeStart > medStart ? rangeStart : medStart;
      const effEnd = rangeEnd < medEnd ? rangeEnd : medEnd;
      if (effEnd >= effStart) {
        const daysActive = Math.floor((effEnd - effStart) / 86400000) + 1;
        expected = daysActive * (med.times_per_day || 1);
      }
      const pct = expected > 0 ? Math.round((medLogs.length / expected) * 100) : 0;
      return { ...med, taken: medLogs.length, expected, pct: Math.min(pct, 100) };
    });
  }

  function generateDoctorSummary() {
    const pm = perMedAdherence();
    const dateStr = today.toLocaleDateString("en", { year:"numeric", month:"long", day:"numeric" });
    let txt = `ADHERA — Medication Adherence Report\n`;
    txt += `Date: ${dateStr}\n`;
    txt += `Plan: ${plan.charAt(0).toUpperCase()+plan.slice(1)}\n`;
    txt += `─────────────────────\n\n`;
    txt += `Overall Adherence: ${adherence}%\n`;
    txt += `Current Streak: ${streak} day${streak!==1?"s":""}\n`;
    txt += `Days Tracked: ${daysTracked}\n`;
    txt += `Total Doses Logged: ${totalDoses}\n\n`;
    txt += `PER-MEDICATION BREAKDOWN:\n`;
    pm.forEach(m => {
      const status = m.pct >= 80 ? "Good" : m.pct >= 50 ? "Fair" : "Poor";
      txt += `• ${m.name} (${m.dosage_amount} ${m.dosage_unit}) — ${m.pct}% [${status}]\n`;
      txt += `  Taken ${m.taken}/${m.expected} expected doses\n`;
    });
    if (allVisits.length > 0) {
      txt += `\nVISIT HISTORY:\n`;
      allVisits.forEach(v => {
        txt += `• ${v.date} ${v.time} — ${v.reason || "Hospital visit"} [${visitStatusLabel(v)}]${v.doctor ? ` · Dr. ${v.doctor}` : ""}${v.facility ? ` · ${v.facility}` : ""}\n`;
      });
    }
    txt += `\n─────────────────────\n`;
    txt += `Generated by Adhera · adhera.app`;
    return txt;
  }

  async function shareWithDoctor() {
    const text = generateDoctorSummary();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Adhera Medical Report", text });
      } catch (e) { if (e.name !== "AbortError") fallbackCopy(text); }
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    navigator.clipboard?.writeText(text).then(() => {
      alert("Report copied to clipboard! Paste it into WhatsApp or email to send to your doctor.");
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("Report copied to clipboard!");
    });
  }

  function drawBarChart(canvas, data, label, color) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const count = data.length;
    const hasLabel = label && label.trim().length > 0;
    const pad = { t: hasLabel ? 40 : 16, r: 24, b: count > 6 ? 80 : 56, l: 56 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#FAFBFC");
    bgGrad.addColorStop(1, "#F0F2F5");
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 12);
    ctx.fill();

    if (hasLabel) {
      ctx.fillStyle = "#0F172A";
      ctx.font = "600 15px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, w/2, 24);
    }

    const maxVal = Math.max(...data.map(d => d.val), 10);
    const gap = cw / (count + 1);
    const barW = Math.min(gap * 0.55, 44);
    const labelFontSize = count > 6 ? 9 : count > 4 ? 10 : 11;

    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + ch);
    ctx.lineTo(pad.l + cw, pad.t + ch);
    ctx.stroke();

    const gridSteps = [0, 25, 50, 75, 100];
    gridSteps.forEach(pct => {
      if (pct > maxVal) return;
      const gy = pad.t + ch - (pct / maxVal) * ch;
      if (pct > 0) {
        ctx.strokeStyle = "#F1F5F9";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.l, gy);
        ctx.lineTo(pad.l + cw, gy);
        ctx.stroke();
      }
      ctx.fillStyle = "#94A3B8";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(pct + "%", pad.l - 8, gy + 3.5);
    });

    data.forEach((d, i) => {
      const x = pad.l + gap * (i + 1) - barW/2;
      const bh = Math.max((d.val / maxVal) * ch, 2);
      const y = pad.t + ch - bh;

      const barGrad = ctx.createLinearGradient(x, y, x + barW, pad.t + ch);
      if (d.val >= 80) { barGrad.addColorStop(0, "#34D399"); barGrad.addColorStop(1, "#059669"); }
      else if (d.val >= 50) { barGrad.addColorStop(0, "#FBBF24"); barGrad.addColorStop(1, "#D97706"); }
      else { barGrad.addColorStop(0, "#F87171"); barGrad.addColorStop(1, "#DC2626"); }
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, bh, [4,4,0,0]);
      ctx.fill();

      const pctText = d.val + "%";
      ctx.font = "700 11px Inter, system-ui, sans-serif";
      const tw = ctx.measureText(pctText).width + 14;
      const th = 20;
      const tx = x + barW/2;
      const ty = y - 6;

      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.beginPath();
      ctx.roundRect(tx - tw/2, ty - th + 5, tw, th, [6,6,6,6]);
      ctx.fill();
      ctx.fillStyle = "#0F172A";
      ctx.textAlign = "center";
      ctx.fillText(pctText, tx, ty + 5);

      ctx.fillStyle = "#475569";
      ctx.font = `${labelFontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.save();
      if (count > 6) {
        ctx.translate(x + barW/2, pad.t + ch + 14);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(d.label, 0, 0);
      } else {
        ctx.fillText(d.label, x + barW/2, pad.t + ch + 18);
      }
      ctx.restore();
    });
  }

  function drawLineChart(canvas, series, label, colors) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const hasLabel = label && label.trim().length > 0;
    const pad = { t: hasLabel ? 40 : 16, r: 24, b: 60, l: 56 };
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#FAFBFC");
    bgGrad.addColorStop(1, "#F0F2F5");
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 12);
    ctx.fill();

    if (hasLabel) {
      ctx.fillStyle = "#0F172A";
      ctx.font = "600 15px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, w/2, 24);
    }

    const allVals = series.flatMap(s => s.data.map(d => d.val));
    const maxVal = Math.max(...allVals, 10);
    const minVal = Math.min(...allVals, 0);
    const range = maxVal - minVal || 1;
    const count = series[0]?.data.length || 0;
    const gap = count > 1 ? cw / (count - 1) : cw;

    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + ch);
    ctx.lineTo(pad.l + cw, pad.t + ch);
    ctx.stroke();

    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const val = minVal + (range * i / gridSteps);
      const gy = pad.t + ch - ((val - minVal) / range) * ch;
      if (i > 0) {
        ctx.strokeStyle = "#F1F5F9";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.l, gy);
        ctx.lineTo(pad.l + cw, gy);
        ctx.stroke();
      }
      ctx.fillStyle = "#94A3B8";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(Math.round(val).toString(), pad.l - 8, gy + 3.5);
    }

    series.forEach((s, si) => {
      const color = colors[si] || "#2563EB";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      s.data.forEach((d, i) => {
        const x = pad.l + (count > 1 ? gap * i : cw / 2);
        const y = pad.t + ch - ((d.val - minVal) / range) * ch;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      s.data.forEach((d, i) => {
        const x = pad.l + (count > 1 ? gap * i : cw / 2);
        const y = pad.t + ch - ((d.val - minVal) / range) * ch;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      if (s.label) {
        const last = s.data[s.data.length - 1];
        const lx = pad.l + (count > 1 ? gap * (s.data.length - 1) : cw / 2);
        const ly = pad.t + ch - ((last.val - minVal) / range) * ch;
        ctx.fillStyle = color;
        ctx.font = "600 10px Inter, system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`${s.label}: ${last.val}`, lx + 6, ly + 4);
      }
    });

    if (count > 1) {
      const step = Math.max(1, Math.floor(count / 8));
      ctx.fillStyle = "#475569";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      series[0].data.forEach((d, i) => {
        if (i % step === 0 || i === count - 1) {
          const x = pad.l + (count > 1 ? gap * i : cw / 2);
          ctx.fillText(d.label, x, pad.t + ch + 16);
        }
      });
    }
  }

  async function generatePdfReport() {
    const pm = perMedAdherence();

    const weekDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = localDayKey(d, tz);
      const dayLogs = logs.filter(l => localDayKey(new Date(l.taken_at), tz) === ds);
      const dailyExp = activeMedsInRange.reduce((s,m) => {
        if (!isMedActiveOnDate(m, d)) return s;
        return s + (m.times_per_day || 1);
      }, 0);
      const pct = dailyExp > 0 ? Math.round((dayLogs.length / dailyExp) * 100) : 0;
      weekDays.push({ label: d.toLocaleDateString("en",{weekday:"short"}), val: Math.min(pct,100) });
    }

    const chartCanvas1 = document.createElement("canvas");
    chartCanvas1.width = 720;
    chartCanvas1.height = 340;
    drawBarChart(chartCanvas1, pm.map(m => ({ label: m.name.length > 12 ? m.name.slice(0,12)+"…" : m.name, val: m.pct })), "", "#2563EB");

    const chartCanvas2 = document.createElement("canvas");
    chartCanvas2.width = 720;
    chartCanvas2.height = 300;
    drawBarChart(chartCanvas2, weekDays, "", "#059669");

    const chart1 = chartCanvas1.toDataURL("image/png");
    const chart2 = chartCanvas2.toDataURL("image/png");

    const bpLogs = (vitals || []).filter(v => v.type === "blood_pressure").sort((a, b) => a.created_at.localeCompare(b.created_at));
    const weightLogs = (vitals || []).filter(v => v.type === "weight").sort((a, b) => a.created_at.localeCompare(b.created_at));

    let chart3 = null, chart4 = null;
    if (bpLogs.length > 1) {
      const bpCanvas = document.createElement("canvas");
      bpCanvas.width = 720;
      bpCanvas.height = 300;
      drawLineChart(bpCanvas, [
        { label: "Systolic", data: bpLogs.map(v => ({ label: new Date(v.created_at).toLocaleDateString("en",{month:"short",day:"numeric"}), val: v.value })) },
        { label: "Diastolic", data: bpLogs.map(v => ({ label: new Date(v.created_at).toLocaleDateString("en",{month:"short",day:"numeric"}), val: v.value_secondary || 0 })) },
      ], "", ["#FF3B30", "#FF9500"]);
      chart3 = bpCanvas.toDataURL("image/png");
    }
    if (weightLogs.length > 1) {
      const wtCanvas = document.createElement("canvas");
      wtCanvas.width = 720;
      wtCanvas.height = 300;
      drawLineChart(wtCanvas, [
        { label: "Weight", data: weightLogs.map(v => ({ label: new Date(v.created_at).toLocaleDateString("en",{month:"short",day:"numeric"}), val: v.value })) },
      ], "", ["#007AFF"]);
      chart4 = wtCanvas.toDataURL("image/png");
    }

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
      ? Math.round(activeMeds.reduce((s,m) => s + Math.min(Math.ceil((today-new Date(m.start_date).getTime())/86400000), m.course_duration_days) / m.course_duration_days, 0) / activeMeds.length * 100)
      : 0;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Adhera Medical Report</title>
<style>
  @page{size:A4;margin:18mm 16mm}
  *,:after,:before{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,system-ui,sans-serif;color:#0f172a;line-height:1.5;padding:0;max-width:100vw;overflow-x:hidden;background:#f1f5f9;-webkit-font-smoothing:antialiased}
  img{max-width:100%;height:auto;display:block}

  .report-wrap{max-width:820px;margin:0 auto;background:#fff;min-height:100vh;padding:24px 32px 48px;overflow-x:hidden}
  @media(max-width:640px){.report-wrap{padding:16px 18px 32px}}

  .top-bar{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;margin-bottom:20px;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;gap:8px}
  .top-bar-left{display:flex;align-items:center;gap:12px}
  .brand-mark{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#5856d6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;flex-shrink:0}
  .brand-text{font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-.3px}
  .top-bar-actions{display:flex;gap:8px}
  .btn-back,.btn-print{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;transition:all .15s;font-family:inherit;line-height:1}
  .btn-back{background:linear-gradient(135deg,#2563eb,#5856d6);color:#fff;border:none;box-shadow:0 2px 10px rgba(37,99,235,.2)}
  .btn-back:hover{transform:translateY(-1px);box-shadow:0 4px 18px rgba(37,99,235,.3)}
  .btn-print{background:#fff;color:#475569;border:1.5px solid #e2e8f0}
  .btn-print:hover{background:#f8fafc;border-color:#cbd5e1}
  @media print{.top-bar{display:none!important}}

  .report-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #f1f5f9}
  .report-header-left h1{font-size:20px;font-weight:800;color:#2563eb;letter-spacing:-.4px;margin-bottom:2px}
  .report-header-left .tagline{font-size:12px;color:#64748b}
  .report-header-right{text-align:right}
  .report-header-right .date{font-size:14px;font-weight:700;color:#0f172a}
  .report-header-right .period{font-size:12px;color:#94a3b8;margin-top:2px}

  .patient-badge{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin-bottom:24px}
  .patient-badge-item{display:flex;flex-direction:column;gap:2px}
  .patient-badge-label{font-size:11px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px}
  .patient-badge-value{font-size:15px;font-weight:700;color:#0f172a}

  .metric-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:28px}
  @media(max-width:480px){.metric-row{grid-template-columns:1fr 1fr;gap:8px}}
  .metric-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 12px;text-align:center}
  .metric-card-value{font-size:26px;font-weight:800;line-height:1.1}
  .metric-card-value.blue{color:#2563eb}
  .metric-card-value.green{color:#059669}
  .metric-card-value.orange{color:#d97706}
  .metric-card-value.purple{color:#7c3aed}
  .metric-card-label{font-size:11px;color:#64748b;margin-top:4px;line-height:1.3}

  .section-title{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:14px;margin-top:28px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;display:flex;align-items:center;gap:8px}
  .section-title+.chart-wrap,.section-title+.data-table{margin-top:6px}
  .chart-wrap{margin:0 0 20px;text-align:center;padding:10px;background:#fafbfc;border:1px solid #e2e8f0;border-radius:12px}
  .chart-wrap img{max-width:100%;height:auto;border-radius:8px}
  @media print{.chart-wrap,.data-table,.clinical-note,.insight-grid{page-break-inside:avoid}}

  .data-table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}
  .data-table thead th{padding:10px 10px;text-align:left;font-weight:600;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.3px;border-bottom:2px solid #e2e8f0;background:#f8fafc}
  .data-table tbody td{padding:10px;border-bottom:1px solid #f1f5f9;color:#334155}
  .data-table tbody tr:last-child td{border-bottom:none}
  .data-table .badge{margin-left:6px}
  .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600}
  .badge-good{background:#dcfce7;color:#059669}
  .badge-fair{background:#fef3c7;color:#d97706}
  .badge-poor{background:#fee2e2;color:#dc2626}

  .insight-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
  @media(max-width:480px){.insight-grid{grid-template-columns:1fr}}
  .insight-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px}
  .insight-card-label{font-size:11px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
  .insight-card-value{font-size:18px;font-weight:700;color:#0f172a}
  .insight-card-sub{font-size:12px;color:#64748b;margin-top:3px}

  .clinical-note{background:#f0f7ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px 20px;margin-top:8px;margin-bottom:24px}
  .clinical-note-title{font-size:13px;font-weight:700;color:#1d4ed8;margin-bottom:6px}
  .clinical-note p{font-size:12px;color:#334155;line-height:1.6}

  .report-footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
  .report-footer-text{font-size:10px;color:#94a3b8}
  .report-footer-logo{font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:1px}
</style>
</head>
<body>

<div class="report-wrap">

<div class="report-header">
  <div class="report-header-left">
    <h1>Medication Adherence Report</h1>
    <div class="tagline">Comprehensive treatment summary generated by Adhera</div>
  </div>
  <div class="report-header-right">
    <div class="date">${today.toLocaleDateString("en",{year:"numeric",month:"long",day:"numeric"})}</div>
    <div class="period">All-time report</div>
  </div>
</div>

<div class="patient-badge">
  <div class="patient-badge-item">
    <span class="patient-badge-label">Plan</span>
     <span class="patient-badge-value">${escapeHtml(plan.charAt(0).toUpperCase()+plan.slice(1))}</span>
  </div>
  <div class="patient-badge-item">
    <span class="patient-badge-label">Active Medications</span>
    <span class="patient-badge-value">${activeMeds.length}</span>
  </div>
  <div class="patient-badge-item">
    <span class="patient-badge-label">Current Streak</span>
    <span class="patient-badge-value">${streak} days</span>
  </div>
  <div class="patient-badge-item">
    <span class="patient-badge-label">Adherence Rate</span>
    <span class="patient-badge-value">${adherence}%</span>
  </div>
</div>

<div class="metric-row">
  <div class="metric-card">
    <div class="metric-card-value green">${adherence}%</div>
    <div class="metric-card-label">Overall<br>Adherence</div>
  </div>
  <div class="metric-card">
    <div class="metric-card-value blue">${streak}</div>
    <div class="metric-card-label">Best<br>Streak</div>
  </div>
  <div class="metric-card">
    <div class="metric-card-value orange">${daysTracked}</div>
    <div class="metric-card-label">Days<br>Tracked</div>
  </div>
  <div class="metric-card">
    <div class="metric-card-value purple">${totalDoses}</div>
    <div class="metric-card-label">Total<br>Doses</div>
  </div>
</div>

<div class="section-title">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>
  Adherence by Medication
</div>
<div class="chart-wrap"><img src="${chart1}" alt="Adherence by medication chart"/></div>

<table class="data-table">
  <thead>
    <tr><th>Medication</th><th>Dosage</th><th>Doses</th><th>Adherence</th></tr>
  </thead>
  <tbody>
     ${pm.map(m => `<tr>
       <td style="font-weight:600">${escapeHtml(m.name)}</td>
       <td>${escapeHtml(m.dosage_amount)} ${escapeHtml(m.dosage_unit)}</td>
       <td>${m.taken}/${m.expected}</td>
       <td>${m.pct}% <span class="badge badge-${medStatus(m.pct).toLowerCase()}">${medStatus(m.pct)}</span></td>
     </tr>`).join("")}
  </tbody>
</table>

<div class="section-title">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  Weekly Trend
</div>
<div class="chart-wrap"><img src="${chart2}" alt="Weekly adherence trend chart"/></div>

${(chart3 || chart4) ? `
<div class="section-title">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12H18L15 21 9 3 6 12H2"/></svg>
  Vitals Trends
</div>
${chart3 ? `<div class="chart-wrap"><img src="${chart3}" alt="Blood pressure trend chart"/></div>` : ""}
${chart4 ? `<div class="chart-wrap"><img src="${chart4}" alt="Weight trend chart"/></div>` : ""}
` : ""}

${allVisits.length > 0 ? `
<div class="section-title">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  Visit History
</div>
<div class="metric-row">
  <div class="metric-card"><div class="metric-card-value blue">${visitStats.upcoming}</div><div class="metric-card-label">Upcoming<br>Visits</div></div>
  <div class="metric-card"><div class="metric-card-value green">${visitStats.attended}</div><div class="metric-card-label">Attended<br>Visits</div></div>
  <div class="metric-card"><div class="metric-card-value red">${visitStats.missed}</div><div class="metric-card-label">Missed<br>Visits</div></div>
  <div class="metric-card"><div class="metric-card-value purple">${visitStats.total}</div><div class="metric-card-label">Total<br>Visits</div></div>
</div>
<table class="data-table">
  <thead>
    <tr><th>Date</th><th>Time</th><th>Doctor</th><th>Facility</th><th>Purpose</th><th>Status</th></tr>
  </thead>
  <tbody>
     ${allVisits.map(v => `<tr>
       <td style="font-weight:600">${v.date}</td>
       <td>${visitTimeLabel(v)}</td>
       <td>${escapeHtml(v.doctor ? "Dr. " + v.doctor : "—")}</td>
       <td>${escapeHtml(v.facility || "—")}</td>
       <td>${escapeHtml(v.reason || "Hospital visit")}</td>
       <td><span class="badge badge-${visitStatusOf(v) === "attended" ? "good" : visitStatusOf(v) === "missed" ? "poor" : "fair"}">${visitStatusLabel(v)}</span></td>
     </tr>`).join("")}
  </tbody>
</table>
` : ""}

${has("reports") ? `
<div class="section-title">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
  Clinical Insights
</div>
<div class="insight-grid">
  <div class="insight-card">
    <div class="insight-card-label">Best Adherence Time</div>
    <div class="insight-card-value">${timeAnalysis.best}</div>
    <div class="insight-card-sub">${timeAnalysis.bestCount} doses logged in this period</div>
  </div>
  <div class="insight-card">
    <div class="insight-card-label">Course Completion</div>
    <div class="insight-card-value">${completedPct}%</div>
    <div class="insight-card-sub">across ${activeMeds.length} active course${activeMeds.length!==1?"s":""}</div>
  </div>
  <div class="insight-card">
    <div class="insight-card-label">Dose Consistency</div>
    <div class="insight-card-value">${adherence >= 80 ? "Good" : adherence >= 50 ? "Moderate" : "Needs Attention"}</div>
    <div class="insight-card-sub">${adherence >= 80 ? "On track with treatment plan" : adherence >= 50 ? "Room for improvement" : "Significant doses missed"}</div>
  </div>
  <div class="insight-card">
    <div class="insight-card-label">Data Points</div>
    <div class="insight-card-value">${logs.length}</div>
    <div class="insight-card-sub">total dose logs recorded</div>
  </div>
</div>

<div class="clinical-note">
  <div class="clinical-note-title">For the Medical Professional</div>
  <p>This report summarizes the patient's self-reported medication adherence data tracked through Adhera. The patient has ${meds.length} medication${meds.length!==1?"s":""} on record with an overall adherence rate of <strong>${adherence}%</strong> across ${daysTracked} tracked days. ${pm.filter(m => m.pct < 80).length > 0 ? `Medications requiring attention: ${pm.filter(m => m.pct < 80).map(m => escapeHtml(m.name)).join(", ")}.` : "All medications are at or above the 80% adherence threshold."} The most consistent dosing occurs during the <strong>${timeAnalysis.best}</strong> period. Data is self-reported and may not reflect actual consumption. This report is intended to support clinical discussions and should not replace professional medical judgment.</p>
</div>
` : ""}

<div class="report-footer">
  <div class="report-footer-logo">ADHERA</div>
  <div class="report-footer-text">Medication Adherence Report · Generated ${today.toISOString().split("T")[0]} · Confidential</div>
</div>

</div>
</body></html>`;

    setPdfHtml(html);
  }

  function printPdfReport() {
    if (!pdfHtml) return;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:100%;height:100%;border:0;opacity:0;pointer-events:none;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(pdfHtml);
    doc.close();
    setTimeout(() => {
      try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch {}
      setTimeout(() => { document.body.removeChild(iframe); }, 3000);
    }, 500);
  }

  async function exportHealthSummary() {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = 210, pageH = 297, ml = 20, mr = 20, cw = pageW - ml - mr;
      let y = 20;

      function addSection(title, cb) {
        if (y > pageH - 60) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(14);
        doc.setTextColor(0, 122, 255);
        doc.text(title, ml, y); y += 8;
        doc.setDrawColor(0, 122, 255); doc.setLineWidth(0.5);
        doc.line(ml, y, pageW - mr, y); y += 8;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        cb();
      }

      function text(t, size = 10, bold = false) {
        if (y > pageH - 30) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.text(String(t), ml, y); y += size * 0.45;
      }

      doc.setFont("helvetica", "bold"); doc.setFontSize(24);
      doc.setTextColor(0, 122, 255);
      doc.text("Adhera", ml, y); y += 4;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      doc.setTextColor(140, 140, 140);
      doc.text("Health Summary Report", ml, y); y += 3;
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, ml, y);
      y += 16;

      addSection("Medication Plan", () => {
        const active = meds.filter(m => {
          if (!m.active) return false;
          const e = new Date(m.start_date); e.setDate(e.getDate() + m.course_duration_days);
          return e >= new Date();
        });
        if (!active.length) { text("No active medications."); y += 4; return; }
        active.forEach(med => {
          if (y > pageH - 40) { doc.addPage(); y = 20; }
          doc.setFont("helvetica", "bold"); doc.setFontSize(11);
          doc.setTextColor(30, 30, 30);
          doc.text(`\u2022 ${med.name}`, ml, y); y += 5;
          doc.setFont("helvetica", "normal"); doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`  ${med.dosage_amount} ${med.dosage_unit} · ${med.times_per_day}x daily`, ml + 4, y); y += 4;
          if (med.doctor_name) { doc.text(`  Dr: ${med.doctor_name}`, ml + 4, y); y += 4; }
          if (med.pharmacy_name) { doc.text(`  Pharmacy: ${med.pharmacy_name}`, ml + 4, y); y += 4; }
          y += 3;
        });
      });

      addSection("Adherence Summary", () => {
        text(`Overall adherence: ${adherence}%`, 12, true); y += 2;
        text(`Current streak: ${streak} day${streak !== 1 ? "s" : ""}`); y += 2;
        text(`Days tracked: ${daysTracked}`); y += 2;
        text(`Total doses logged: ${totalDoses}`); y += 6;
        const pm = perMedAdherence();
        pm.forEach(m => {
          if (y > pageH - 30) { doc.addPage(); y = 20; }
          const status = m.pct >= 80 ? "Good" : m.pct >= 50 ? "Fair" : "Poor";
          doc.setFont("helvetica", "bold"); doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
          doc.text(`\u2022 ${m.name}: ${m.pct}% (${status})`, ml + 2, y); y += 4;
          doc.setFont("helvetica", "normal"); doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`  ${m.taken}/${m.expected} doses taken`, ml + 4, y); y += 5;
        });
      });

      const journal = (() => { try { return JSON.parse(localStorage.getItem("mt_journal") || "[]"); } catch { return []; } })();
      if (journal.length > 0) {
        addSection("Recent Journal Entries", () => {
          const recent = [...journal].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
          recent.forEach(e => {
            if (y > pageH - 30) { doc.addPage(); y = 20; }
            const moods = { great: "\u{1F604}", good: "\u{1F642}", okay: "\u{1F610}", bad: "\u{1F614}", terrible: "\u{1F622}" };
            const mood = moods[e.mood] || "";
            doc.setFont("helvetica", "bold"); doc.setFontSize(10);
            doc.setTextColor(30, 30, 30);
            doc.text(`${e.date}  ${mood}`, ml, y); y += 4;
            doc.setFont("helvetica", "normal"); doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            if (e.symptoms?.length) { doc.text(`  Symptoms: ${e.symptoms.join(", ")}`, ml + 2, y); y += 4; }
            if (e.notes) { doc.text(`  ${e.notes}`, ml + 2, y); y += 4; }
            y += 2;
          });
        });
      }

      const visits = getVisits().slice().sort((a, b) => ((b.date || "") + (b.time || "")).localeCompare((a.date || "") + (a.time || "")));
      if (visits.length > 0) {
        const labelFor = v => v.status === "attended" ? "Attended" : v.status === "missed" ? "Missed" : getVisitTime(v) < new Date() ? "Scheduled" : "Upcoming";
        addSection("Visit History", () => {
          visits.forEach(v => {
            if (y > pageH - 30) { doc.addPage(); y = 20; }
            doc.setFont("helvetica", "bold"); doc.setFontSize(10);
            doc.setTextColor(30, 30, 30);
            doc.text(`\u2022 ${v.reason || "Visit"} — ${v.date} at ${v.time} [${labelFor(v)}]`, ml, y); y += 4;
            doc.setFont("helvetica", "normal"); doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            if (v.facility) doc.text(`  Facility: ${v.facility}`, ml + 4, y); y += 4;
            if (v.doctor) doc.text(`  Doctor: ${v.doctor}`, ml + 4, y); y += 4;
            if (v.notes) doc.text(`  Notes: ${v.notes}`, ml + 4, y); y += 4;
            y += 2;
          });
        });
      }

      doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text("Generated by Adhera · adhera.app · Confidential", ml, pageH - 10);
      doc.save(`adhera_health_summary_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error("PDF export error:", e);
    }
  }

  async function exportBasicPdf() {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = 210, pageH = 297, ml = 20, mr = 20;
      let y = 20;

      doc.setFont("helvetica", "bold"); doc.setFontSize(22);
      doc.setTextColor(37, 99, 235);
      doc.text("Adhera", ml, y); y += 4;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      doc.setTextColor(140, 140, 140);
      doc.text("Basic Medication Report", ml, y); y += 3;
      doc.text(`${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, ml, y);
      y += 8;
      doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
      doc.line(ml, y, pageW - mr, y); y += 10;

      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.setTextColor(37, 99, 235);
      doc.text("Medications", ml, y); y += 8;
      const active = meds.filter(m => m.active);
      if (active.length === 0) {
        doc.setFont("helvetica", "italic"); doc.setFontSize(10);
        doc.setTextColor(140, 140, 140);
        doc.text("No active medications.", ml, y); y += 6;
      } else {
        active.forEach(med => {
          if (y > pageH - 30) { doc.addPage(); y = 20; }
          doc.setFont("helvetica", "bold"); doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
          doc.text(`\u2022 ${med.name}`, ml, y); y += 5;
          doc.setFont("helvetica", "normal"); doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`  ${med.dosage_amount} ${med.dosage_unit} \u00B7 ${med.times_per_day}x daily`, ml + 4, y); y += 6;
        });
      }

      y += 4;
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.setTextColor(37, 99, 235);
      doc.text("Adherence", ml, y); y += 8;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Overall: ${adherence}%`, ml, y); y += 5;
      doc.text(`Streak: ${streak} day${streak !== 1 ? "s" : ""}`, ml, y); y += 5;
      doc.text(`Days tracked: ${daysTracked}`, ml, y); y += 5;
      doc.text(`Total doses: ${totalDoses}`, ml, y); y += 8;

      const pm = perMedAdherence();
      if (pm.length > 0) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text("Per Medication:", ml, y); y += 6;
        pm.forEach(m => {
          if (y > pageH - 25) { doc.addPage(); y = 20; }
          const status = m.pct >= 80 ? "Good" : m.pct >= 50 ? "Fair" : "Poor";
          doc.setFont("helvetica", "normal"); doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          doc.text(`\u2022 ${m.name}: ${m.pct}% (${status}) \u2014 ${m.taken}/${m.expected} doses`, ml + 2, y); y += 5;
        });
      }

      y += 10;
      doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
      doc.line(ml, y, pageW - mr, y); y += 6;
      doc.setFont("helvetica", "italic"); doc.setFontSize(9);
      doc.setTextColor(140, 140, 140);
      doc.text("Upgrade to Pro for detailed charts, clinical insights, and doctor-ready reports.", ml, y); y += 5;
      doc.text("Generated by Adhera \u00B7 adhera.app \u00B7 Confidential", ml, y);

      doc.save(`adhera_basic_report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error("Basic PDF export error:", e);
    }
  }

  const pm = perMedAdherence();

  function AdherenceCard({ m, index }) {
    const colors = ["var(--ib1)","var(--ib4)","var(--ib5)","var(--ib3)","var(--ib2)","var(--ib6)"];
    const bg = colors[index % colors.length];
    return (
      <div style={{background:"var(--card)",borderRadius:"var(--rl)",padding:14,boxShadow:"var(--card-shadow)",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:30,height:30,borderRadius:8,background:bg,display:"grid",placeItems:"center",flexShrink:0}}><Ico><Pill size={16} strokeWidth={2.2} color="var(--t1)"/></Ico></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:600,color:"var(--t1)",marginBottom:2}}>{m.name}</div>
          <div style={{fontSize:12,color:"var(--t3)",marginBottom:4}}>{m.taken}/{m.expected} doses</div>
          <div className="prog"><div className="prog-fill" style={{transform:`scaleX(${m.pct/100})`,background:m.pct>=80?"var(--teal2)":m.pct>=50?"var(--orange)":"var(--red)"}}/></div>
        </div>
        <div style={{fontSize:17,fontWeight:700,color:m.pct>=80?"var(--teal2)":m.pct>=50?"var(--orange)":"var(--red)",flexShrink:0}}>{m.pct}%</div>
      </div>
    );
  }

  return (
    <div className="scroll">
      {onBack && <div style={{ padding: "4px 20px 0" }}><button className="btn btn-ghost" onClick={onBack}>{memberName ? "← Back to Family" : "← Back to Vitals"}</button></div>}
      <div className="nav-large">{t("reports.title")}</div>
      {memberName && <div style={{ margin: "-8px 0 8px", fontSize: 13, fontWeight: 600, color: "var(--accent, #2563eb)" }}>{memberName}&apos;s report</div>}

      {has("reports") ? (
        <div style={{ margin: "0 20px 14px" }}>
          <Segmented options={[["7d","7 days"],["30d","30 days"],["all","All time"]]} value={range} onChange={setRange} style={{ marginBottom: 10 }} />
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Adherence</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1, color: "var(--t1)" }}>{daysTracked ? adherence : "—"}%</span>
              {streak > 1 && <span className="streak-badge fire">🔥 {streak}-day streak</span>}
            </div>
            <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 6 }}>{daysTracked} days tracked · {totalDoses} doses logged{meds.length ? ` · ${meds.length} med${meds.length !== 1 ? "s" : ""}` : ""}</div>
          </Card>
        </div>
      ) : (
        <div className="chips">
          <div className="chip blue"><div className="chip-val">{daysTracked}</div><div className="chip-lbl">{t("reports.daysTracked")}</div></div>
          <div className="chip green"><div className="chip-val">{adherence}%</div><div className="chip-lbl">{t("reports.adherenceRate")}</div></div>
          <div className="chip purple"><div className="chip-val">{streak}</div><div className="chip-lbl">{t("reports.bestStreak")}</div></div>
        </div>
      )}

      {(memberName && vitals && vitals.length > 0) && (() => {
        const bpReadings = vitals.filter(v => v.type === "blood_pressure").sort((a, b) => b.created_at.localeCompare(a.created_at));
        const wtReadings = vitals.filter(v => v.type === "weight").sort((a, b) => b.created_at.localeCompare(a.created_at));
        const latestBp = bpReadings[0];
        const latestWt = wtReadings[0];
        return (
          <div className="section">
            <div className="section-header" style={{display:"flex",alignItems:"center",gap:8}}>
              <Ico><Heart size={15} strokeWidth={2.2} color="var(--red)"/></Ico> {t("vitals.title")}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {latestBp ? (
                <div style={{background:"var(--card)",borderRadius:"var(--rl)",padding:14,boxShadow:"var(--card-shadow)",borderLeft:"4px solid #FF3B30"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--t3)",marginBottom:4}}>Blood Pressure</div>
                  <div style={{fontSize:22,fontWeight:700,color:"var(--t1)",lineHeight:1}}>{latestBp.value}/{latestBp.value_secondary || "?"} <span style={{fontSize:12,fontWeight:400,color:"var(--t3)"}}>mmHg</span></div>
                  <div style={{fontSize:11,color:"var(--t3)",marginTop:4}}>{new Date(latestBp.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
                </div>
              ) : null}
              {latestWt ? (
                <div style={{background:"var(--card)",borderRadius:"var(--rl)",padding:14,boxShadow:"var(--card-shadow)",borderLeft:"4px solid #007AFF"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--t3)",marginBottom:4}}>Weight</div>
                  <div style={{fontSize:22,fontWeight:700,color:"var(--t1)",lineHeight:1}}>{latestWt.value} <span style={{fontSize:12,fontWeight:400,color:"var(--t3)"}}>kg</span></div>
                  <div style={{fontSize:11,color:"var(--t3)",marginTop:4}}>{new Date(latestWt.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
                </div>
              ) : null}
              {!latestBp && !latestWt ? (
                <div style={{background:"var(--card)",borderRadius:"var(--rl)",padding:14,boxShadow:"var(--card-shadow)",gridColumn:"1/-1",textAlign:"center",color:"var(--t3)",fontSize:13}}>No vitals recorded</div>
              ) : null}
            </div>
            <div style={{marginTop:10,fontSize:12,color:"var(--t3)"}}>
              {bpReadings.length} BP reading{bpReadings.length!==1?"s":""} · {wtReadings.length} weight reading{wtReadings.length!==1?"s":""} · {vitals.length} total
            </div>
          </div>
        );
      })()}

      <div className="section">
        <div className="section-header">{t("reports.adherenceByMed")}</div>
        {meds.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><Ico><BarChart3 size={52} strokeWidth={1.5} color="var(--t2)"/></Ico></div><div className="empty-state-title">{t("reports.noData")}</div><div className="empty-state-sub">{t("reports.noDataSub")}</div></div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {pm.map((m,i)=> <AdherenceCard key={m.id} m={m} index={i}/>)}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-header" style={{display:"flex",alignItems:"center",gap:8}}>
          <Ico><CalendarDays size={15} strokeWidth={2.2} color="var(--teal2)"/></Ico> Adherence calendar
        </div>
        <AdherenceCalendar logs={logs} meds={meds} tz={tz}/>
      </div>

      {has("reports") && (
        <div className="section">
          <div className="section-header" style={{display:"flex",alignItems:"center",gap:8}}>
            <Ico><TrendingUp size={15} strokeWidth={2.2} color="var(--teal2)"/></Ico> Detailed treatment analytics
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {meds.filter(m => m.active).map(med => {
              const medLogs = rangedLogs.filter(l => l.medication_id === med.id);
              const firstLog = medLogs[medLogs.length-1];
              const daysSinceStart = firstLog ? Math.ceil((today-new Date(firstLog.taken_at).getTime())/86400000) : 0;
              const expectedDaily = med.times_per_day || 1;
              const expectedTotal = daysSinceStart * expectedDaily;
              const pct = expectedTotal > 0 ? Math.round((medLogs.length/expectedTotal)*100) : 0;
              const skipRate = medLogs.length > 0 ? Math.round((1 - medLogs.length/Math.max(expectedTotal,medLogs.length))*100) : 0;
              const sorted = [...medLogs].sort((a,b) => new Date(a.taken_at) - new Date(b.taken_at));
              const recentHalf = sorted.slice(-7);
              const olderHalf = sorted.slice(0, 7);
              const trend = sorted.length >= 14
                ? (recentHalf.length >= olderHalf.length ? "improving" : "declining")
                : "insufficient data";
              const trendColor = trend==="improving"?"var(--teal2)":trend==="declining"?"var(--red)":"var(--t3)";
              const trendIcon = trend==="improving"?<TrendingUp size={14} strokeWidth={2.2}/>:trend==="declining"?<TrendingDown size={14} strokeWidth={2.2}/>:<BarChart3 size={14} strokeWidth={2.2}/>;
              return (
                <div key={med.id} style={{background:"var(--card)",borderRadius:"var(--rl)",padding:14,boxShadow:"var(--card-shadow)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:30,height:30,borderRadius:8,background:"var(--ib4)",display:"grid",placeItems:"center",flexShrink:0}}><Ico><BarChart3 size={16} strokeWidth={2.2} color="var(--t1)"/></Ico></div>
                    <div>
                      <div style={{fontSize:15,fontWeight:600,color:"var(--t1)"}}>{med.name}</div>
                      <div style={{fontSize:12,color:"var(--t3)"}}>{medLogs.length} total doses · {pct}% adherence</div>
                    </div>
                  </div>
                  <div className="prog" style={{marginBottom:8}}><div className="prog-fill" style={{transform:`scaleX(${pct/100})`,background:pct>=80?"var(--teal2)":pct>=50?"var(--orange)":"var(--red)"}}/></div>
                  <div style={{display:"flex",gap:16,fontSize:12}}>
                    <div style={{background:"var(--bg)",borderRadius:8,padding:"6px 10px",flex:1,textAlign:"center"}}>
                      <div style={{fontSize:11,color:"var(--t3)",marginBottom:1}}>Trend</div>
                      <div style={{fontWeight:600,color:trendColor,display:"flex",alignItems:"center",gap:4,justifyContent:"center"}}><Ico>{trendIcon}</Ico> {trend}</div>
                    </div>
                    <div style={{background:"var(--bg)",borderRadius:8,padding:"6px 10px",flex:1,textAlign:"center"}}>
                      <div style={{fontSize:11,color:"var(--t3)",marginBottom:1}}>Skip rate</div>
                      <div style={{fontWeight:600,color:"var(--t2)"}}>{skipRate}%</div>
                    </div>
                    <div style={{background:"var(--bg)",borderRadius:8,padding:"6px 10px",flex:1,textAlign:"center"}}>
                      <div style={{fontSize:11,color:"var(--t3)",marginBottom:1}}>Adherence</div>
                      <div style={{fontWeight:600,color:pct>=80?"var(--teal2)":pct>=50?"var(--orange)":"var(--red)"}}>{pct}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {has("reports") && (() => {
        const lowStock = meds.filter(m => {
          if (!m.pills_per_package) return false;
          const lastRefill = m.last_refill_date ? new Date(m.last_refill_date) : new Date(m.start_date);
          const since = rangedLogs.filter(l => l.medication_id === m.id && new Date(l.taken_at) >= lastRefill).length;
          return Math.max(0, m.pills_per_package - since) <= (m.refill_reminder_at || 5);
        });
        const weak = pm.filter(m => m.expected > 0 && m.pct < 80).sort((a, b) => a.pct - b.pct)[0];
        const insightList = [];
        if (daysTracked > 0) {
          insightList.push(adherence >= 80
            ? { id: "adh-good", tone: "good", headline: `${adherence}% adherence`, suggestion: "Great consistency — keep this habit going." }
            : adherence >= 50
              ? { id: "adh-warn", tone: "warn", headline: `Adherence at ${adherence}%`, suggestion: "A few more doses a day would bring this back to target." }
              : { id: "adh-bad", tone: "bad", headline: `Adherence is at ${adherence}%`, suggestion: "Set a daily reminder so doses don't slip." });
        }
        if (weak && daysTracked >= 7) {
          insightList.push({ id: `weak-${weak.id}`, tone: "warn", headline: `${weak.name} is at ${weak.pct}%`, suggestion: "Add a phone alert around its usual dosing time." });
        }
        if (streak >= 3) {
          insightList.push({ id: "streak", tone: "good", headline: `${streak}-day streak`, suggestion: "Log today's dose to keep the run alive." });
        }
        if (lowStock.length > 0) {
          const names = lowStock.slice(0, 2).map(m => m.name).join(", ");
          insightList.push({ id: "stock", tone: "warn", headline: `${names} ${lowStock.length > 1 ? "need" : "needs"} a refill soon`, suggestion: "Restock before you run out to avoid a gap in dosing." });
        }
        const visible = insightList.filter(i => !dismissed.includes(i.id));
        return (
          <div className="section">
            <div className="section-header" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Ico><Lightbulb size={15} strokeWidth={2.2} color="var(--orange)"/></Ico> Treatment insights
            </div>
            {visible.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--t3)", padding: "4px 2px" }}>Log a few days of doses to see personalized insights.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {visible.map(ins => (
                  <InsightCard key={ins.id} tone={ins.tone} headline={ins.headline} suggestion={ins.suggestion}
                    onDismiss={() => {
                      const next = [...dismissed, ins.id];
                      setDismissed(next);
                      try { localStorage.setItem("mt_dismissed_insights", JSON.stringify(next)); } catch {}
                    }} />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {!has("reports") && !has("perMemberReports") && !has("basicReports") && (
        <div className="upgrade-card" style={{margin:"0 20px 16px"}}>
          <div className="upgrade-title">Upgrade for advanced reports</div>
          <div className="upgrade-sub">
            Get detailed per-medication analytics, treatment insights, skip-rate tracking and trend analysis with Pro.
          </div>
          <button className="upgrade-btn" onClick={() => onNavigate?.("profile")}>
            Go to Profile →
          </button>
        </div>
      )}

      <div style={{padding:"0 20px 16px"}}>
        <AdherenceChart logs={logs} meds={meds} tz={tz}/>
      </div>

      {has("sideEffects") && (
        <div style={{padding:"0 20px 16px"}}>
          <SideEffectSummary meds={meds} logs={logs}/>
        </div>
      )}

      <div className="section" style={{margin:"0 20px 16px",padding:0}}>
          <div className="section-header" style={{display:"flex",alignItems:"center",gap:8}}>
            <Ico><DollarSign size={15} strokeWidth={2.2} color="var(--teal2)"/></Ico> Medication costs
          </div>
        <div style={{background:"var(--card)",borderRadius:16,padding:18,boxShadow:"var(--card-shadow)"}}>
          {(() => {
            const medsCosted = meds.filter(m => m.cost_per_package);
            if (!medsCosted.length) {
              return <div style={{textAlign:"center",padding:20,color:"var(--t3)",fontSize:13}}>Add cost info to your medications to track spending</div>;
            }
            const totalCost = medsCosted.reduce((s, m) => s + (Number(m.cost_per_package) || 0), 0);
            const currency = medsCosted[0]?.cost_currency || "GHS";
            const curSym = currencySymbol(currency) || currency;
            return (
              <>
                <div style={{textAlign:"center",marginBottom:20}}>
                  <div style={{fontSize:11,color:"var(--t3)",fontWeight:500,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Total medication cost</div>
                  <div style={{fontSize:30,fontWeight:800,color:"var(--t1)",letterSpacing:-.5}}>{curSym}{totalCost.toFixed(2)}</div>
                </div>
                {medsCosted.map(m => (
                  <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:"0.5px solid var(--sep)"}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:m.color||"var(--teal)",flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,color:"var(--t1)"}}>{m.name}</div>
                      <div style={{fontSize:11,color:"var(--t3)"}}>{m.pills_per_package ? `${m.pills_per_package} units/pkg` : "Per package"}</div>
                    </div>
                    <div style={{fontSize:14,fontWeight:700,color:"var(--t1)"}}>{currencySymbol(m.cost_currency) || curSym}{Number(m.cost_per_package).toFixed(2)}</div>
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      </div>

      <div className="section">
        <div className="section-header" style={{display:"flex",alignItems:"center",gap:8}}>
          <Ico><Stethoscope size={15} strokeWidth={2.2} color="var(--teal2)"/></Ico> Visit history
          {allVisits.length > 0 && (
            <button onClick={exportVisitsCsv}
              style={{marginLeft:"auto",fontSize:12,fontWeight:600,color:"var(--t2)",background:"var(--card)",padding:"6px 12px",borderRadius:99,border:"1px solid var(--sep)",display:"inline-flex",alignItems:"center",gap:5,cursor:"pointer"}}>
              <Ico><Download size={13} strokeWidth={2.2}/></Ico> CSV
            </button>
          )}
        </div>

        <div className="chip-group" style={{marginBottom:14,rowGap:8}}>
          <div className="chip blue"><div className="chip-val">{visitStats.upcoming}</div><div className="chip-lbl">Upcoming</div></div>
          <div className="chip green"><div className="chip-val">{visitStats.attended}</div><div className="chip-lbl">Attended</div></div>
          <div className="chip red"><div className="chip-val">{visitStats.missed}</div><div className="chip-lbl">Missed</div></div>
          <div className="chip"><div className="chip-val">{visitStats.total}</div><div className="chip-lbl">Total visits</div></div>
        </div>

        {allVisits.length === 0 ? (
          <div className="empty-state" style={{margin:"8px 0 0"}}>
            <div className="empty-state-icon"><Ico><Stethoscope size={52} strokeWidth={1.5} color="var(--t2)"/></Ico></div>
            <div className="empty-state-title">No visits yet</div>
            <div className="empty-state-sub">Schedule a hospital visit to start tracking your appointment history</div>
          </div>
        ) : (
          <>
            <div style={{background:"var(--card)",borderRadius:"var(--rl)",boxShadow:"var(--card-shadow)",overflow:"hidden"}}>
              {allVisits.slice(0, 3).map((v, i) => (
                <VisitRow key={v.id} v={v} expanded={expandedVisit === v.id} onClick={() => setExpandedVisit(expandedVisit === v.id ? null : v.id)} style={{borderTop: i > 0 ? "0.5px solid var(--sep)" : "none"}}/>
              ))}
            </div>
            {expandedVisit && (() => {
              const v = allVisits.find(x => x.id === expandedVisit);
              return v ? <VisitDetailCard v={v}/> : null;
            })()}
            <div className="row" style={{cursor:"pointer"}} onClick={() => onNavigate && onNavigate("visits")}>
              <div className="row-body"><div className="row-title" style={{fontSize:14}}>See all visits</div><div className="row-sub" style={{fontSize:11}}>{allVisits.length} visits total</div></div>
              <ChevronRight size={17} color="var(--t3)" strokeWidth={2}/>
            </div>
          </>
        )}
      </div>

      {has("healthJournal") && (
        <div className="section">
          <div className="section-header" style={{display:"flex",alignItems:"center",gap:8}}>
            <Ico><BookOpen size={15} strokeWidth={2.2} color="var(--purple)"/></Ico> Health journal
          </div>
          <div style={{padding:"0"}}>
            <JournalMiniCalendar entries={journalEntries} selectedDate={journalDate} onSelect={setJournalDate}/>
            {journalDate && <JournalEntrySheet date={journalDate} entry={getJournalEntry(journalDate)} onSave={() => { try { setJournalEntries(JSON.parse(localStorage.getItem("mt_journal") || "[]")); } catch {} }} onClose={() => setJournalDate(null)}/>}
            <JournalTimeline entries={journalEntries}/>
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-header" style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none"}} onClick={() => setShowHistory(!showHistory)}>
          <Ico><ClipboardList size={15} strokeWidth={2.2} color="var(--t1)"/></Ico> Dose history
          <span style={{marginLeft:"auto",fontSize:12,color:"var(--t3)",transition:"transform .2s",transform:showHistory?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
        </div>
        {showHistory && (() => {
          const maxDays = limits.history;
          const grouped2 = {};
          logs.forEach(l => {
            const d = localDayKey(new Date(l.taken_at), tz);
            if (d) { if (!grouped2[d]) grouped2[d] = []; grouped2[d].push(l); }
          });
          const days = Object.keys(grouped2).sort().reverse().slice(0, maxDays);
          const totalExpected = meds.filter(m => m.active).reduce((s, m) => {
            const dayDate = new Date(d + "T12:00:00");
            if (!isMedActiveOnDate(m, dayDate)) return s;
            return s + (m.times_per_day || 1);
          }, 0);

          if (days.length === 0) {
            return <div className="empty-state" style={{marginBottom:8}}><div className="empty-state-icon"><Ico><ClipboardList size={52} strokeWidth={1.5} color="var(--t2)"/></Ico></div><div className="empty-state-title">No history yet</div><div className="empty-state-sub">Your dose logs will appear here</div></div>;
          }

          return days.map(d => {
            const dayLogs = grouped2[d];
            const dayPct = totalExpected > 0 ? Math.min(Math.round(dayLogs.length / totalExpected * 100), 100) : 0;
            return (
              <div key={d} style={{marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,paddingLeft:4}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"var(--teal)",flexShrink:0}}/>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--t1)",letterSpacing:"-.2px"}}>{fmtDateLong(d+"T12:00:00")}</div>
                  <div style={{marginLeft:"auto",fontSize:11,color:"var(--t3)",background:"var(--bg)",padding:"2px 10px",borderRadius:99}}>{dayLogs.length} dose{dayLogs.length!==1?"s":""}</div>
                </div>
                <div style={{background:"var(--card)",borderRadius:"var(--rl)",overflow:"hidden",boxShadow:"var(--card-shadow)"}}>
                  {dayLogs.map((log, i) => (
                    <div key={log.id} className="row" style={{borderTop:i>0?"0.5px solid var(--sep)":"none",cursor:"default"}}>
                      <div style={{width:28,height:28,borderRadius:7,background:"var(--ib1)",display:"grid",placeItems:"center",flexShrink:0}}><Ico><Pill size={14} strokeWidth={2.2} color="var(--t1)"/></Ico></div>
                      <div className="row-body">
                        <div className="row-title" style={{fontSize:14}}>{log.medications?.name || "Medication"}</div>
                        {log.journal && <div className="row-sub" style={{fontSize:11,display:"flex",alignItems:"center",gap:4}}><Ico><FileText size={11} strokeWidth={2.2}/></Ico> {log.journal.slice(0, 40)}{log.journal.length > 40 ? "…" : ""}</div>}
                      </div>
                      <span style={{fontSize:12,fontWeight:500,color:"var(--t2)",background:"var(--bg)",padding:"3px 10px",borderRadius:99}}>{fmtTime(log.taken_at)}</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:6,padding:"0 4px",display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1,height:4,borderRadius:2,background:"var(--sep)",overflow:"hidden"}}>
                    <div style={{width:`${dayPct}%`,height:"100%",borderRadius:2,background:dayPct>=80?"var(--teal2)":dayPct>=50?"var(--orange)":"var(--red)",transition:"width .4s"}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:dayPct>=80?"var(--teal2)":dayPct>=50?"var(--orange)":"var(--red)"}}>{dayPct}%</span>
                </div>
              </div>
            );
          });
        })()}
      </div>

{(has("reports") || has("perMemberReports")) && (
         <>
           <div style={{padding:"4px 20px 8px",display:"flex",gap:10}}>
             <button className="btn btn-primary" onClick={generatePdfReport} disabled={meds.length === 0} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
               <Ico><FileText size={15} strokeWidth={2.2} color="white"/></Ico> Full PDF report
             </button>
             <button className="btn" onClick={exportHealthSummary} disabled={meds.length === 0}
               style={{flex:1,background:"var(--teal2)",color:"white",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
               <Ico><Download size={15} strokeWidth={2.2} color="white"/></Ico> Quick PDF
             </button>
           </div>

           <div style={{padding:"4px 20px 8px",display:"flex",gap:10}}>
             <button className="btn" onClick={shareWithDoctor} disabled={meds.length === 0}
               style={{flex:1,background:"var(--card)",color:"var(--t1)",fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:6,border:"0.5px solid var(--sep)"}}>
               <Ico><Stethoscope size={15} strokeWidth={2.2}/></Ico> Share with doctor
             </button>
             <button className="btn" onClick={() => exportCsv("dose_logs", logs, meds)}
               style={{flex:1,background:"var(--card)",color:"var(--t1)",fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:6,border:"0.5px solid var(--sep)"}}>
               <Ico><Download size={15} strokeWidth={2.2}/></Ico> Export CSV
             </button>
           </div>

           <div style={{padding:"0 20px 20px",display:"flex",gap:10}}>
             <button className="btn" onClick={exportJournalCsv}
               style={{flex:1,background:"var(--card)",color:"var(--t1)",fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:6,border:"0.5px solid var(--sep)"}}>
               <Ico><Download size={15} strokeWidth={2.2}/></Ico> Export journal
             </button>
           </div>
         </>
       )}

       {has("basicReports") && !has("reports") && (
         <div style={{padding:"4px 20px 16px"}}>
           <button className="btn" onClick={exportBasicPdf} disabled={meds.length === 0}
             style={{width:"100%",background:"var(--card)",color:"var(--t1)",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px 16px",borderRadius:14,border:"1px solid var(--sep)",boxShadow:"var(--card-shadow)"}}>
             <Ico><FileText size={18} strokeWidth={2.2} color="var(--teal2)"/></Ico>
             <span>Download Basic Report</span>
           </button>
           <div style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginTop:8}}>Upgrade to Pro for charts, clinical insights, and doctor-ready reports</div>
         </div>
       )}

      {pdfHtml && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "#f1f5f9", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch" }}>
            <div dangerouslySetInnerHTML={{ __html: pdfHtml }} />
          </div>
          <div style={{ position: "sticky", bottom: 0, display: "flex", gap: 10, padding: "12px 16px calc(12px + env(safe-area-inset-bottom,0px))", background: "var(--bar)", borderTop: "1px solid var(--sep)", boxShadow: "0 -4px 16px rgba(0,0,0,.06)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)" }}>
            <button className="btn btn-primary" onClick={printPdfReport} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Ico><Download size={15} strokeWidth={2.2} color="white"/></Ico> Print
            </button>
            <button className="btn btn-ghost" onClick={() => setPdfHtml(null)} style={{ flex: 1 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function exportCsv(name, logs, meds) {
  const medMap = {};
  meds.forEach(m => { medMap[m.id] = m.name; });
  const header = "Date,Time,Medication,Dosage,Journal\n";
  const rows = [...logs].reverse().map(l => {
    const d = new Date(l.taken_at);
    const date = d.toISOString().split("T")[0];
    const time = d.toTimeString().split(" ")[0].slice(0, 5);
    const medName = medMap[l.medication_id] || "Unknown";
    const dosage = l.medications ? `${l.medications.dosage_amount} ${l.medications.dosage_unit}` : "";
    const journal = (l.journal || "").replace(/"/g, '""');
    return `"${date}","${time}","${medName}","${dosage}","${journal}"`;
  }).join("\n");
  downloadCsv(header + rows, `${name}_${new Date().toISOString().split("T")[0]}.csv`);
}

function exportJournalCsv() {
  let entries = [];
  try { entries = JSON.parse(localStorage.getItem("mt_journal") || "[]"); } catch {}
  const header = "Date,Entry,Mood\n";
  const rows = entries.map(e => {
    const date = e.date || "";
    const text = (e.text || e.entry || "").replace(/"/g, '""');
    const mood = e.mood || "";
    return `"${date}","${text}","${mood}"`;
  }).join("\n");
  downloadCsv(header + rows, `journal_${new Date().toISOString().split("T")[0]}.csv`);
}

function exportVisitsCsv() {
  let visits = [];
  try { visits = JSON.parse(localStorage.getItem("mt_visits") || "[]"); } catch {}
  const header = "Date,Time,Doctor,Facility,Purpose,Status,Reminder,Notes\n";
  const rows = visits.slice().sort((a, b) => ((a.date || "") + (a.time || "")).localeCompare((b.date || "") + (b.time || ""))).map(v => {
    const status = v.status === "attended" ? "Attended" : v.status === "missed" ? "Missed" : getVisitTime(v) < new Date() ? "Scheduled" : "Upcoming";
    const reminder = v.reminder_minutes ? `${v.reminder_minutes} min before` : "";
    return `"${v.date || ""}","${v.time || ""}","${(v.doctor || "").replace(/"/g, '""')}","${(v.facility || "").replace(/"/g, '""')}","${(v.reason || "").replace(/"/g, '""')}","${status}","${reminder}","${(v.notes || "").replace(/"/g, '""')}"`;
  }).join("\n");
  downloadCsv(header + rows, `visit_history_${new Date().toISOString().split("T")[0]}.csv`);
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
