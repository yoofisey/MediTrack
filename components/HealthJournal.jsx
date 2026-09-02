"use client";

import { useState } from "react";
import { Laugh, Smile, Meh, Frown, CloudRain, MoonStar, CircleAlert, Zap, Moon, Waves, Biohazard, Wind, Droplets, Thermometer, AlertTriangle, Utensils, NotebookPen, BarChart3, ArrowLeft } from "lucide-react";
import { useSwipe } from "@/lib/useSwipe";
import { FormControl } from "@/components/FormControls";
import { fetchJournal, saveJournalEntry } from "@/lib/healthData";

const MOODS = [
  { id:"great", label:"Great", icon:Laugh, color:"#30D158" },
  { id:"good", label:"Good", icon:Smile, color:"#007AFF" },
  { id:"okay", label:"Okay", icon:Meh, color:"#FF9500" },
  { id:"bad", label:"Bad", icon:Frown, color:"#FF6B00" },
  { id:"terrible", label:"Terrible", icon:CloudRain, color:"#FF3B30" },
];

const MOOD_SCORES = { great:5, good:4, okay:3, bad:2, terrible:1 };

const SLEEP_QUALITY = [
  { id:"excellent", label:"Excellent", icon:MoonStar, score:5 },
  { id:"good", label:"Good", icon:Smile, score:4 },
  { id:"fair", label:"Fair", icon:Meh, score:3 },
  { id:"poor", label:"Poor", icon:Frown, score:2 },
  { id:"terrible", label:"Terrible", icon:CircleAlert, score:1 },
];

const SYMPTOMS = [
  { id:"pain", label:"Pain", icon:Zap },
  { id:"fatigue", label:"Fatigue", icon:Moon },
  { id:"anxiety", label:"Anxiety", icon:Waves },
  { id:"nausea", label:"Nausea", icon:Biohazard },
  { id:"headache", label:"Headache", icon:CircleAlert },
  { id:"breathlessness", label:"Breathlessness", icon:Wind },
  { id:"swelling", label:"Swelling", icon:Droplets },
  { id:"fever", label:"Fever", icon:Thermometer },
  { id:"cough", label:"Cough", icon:AlertTriangle },
  { id:"appetite_change", label:"Appetite change", icon:Utensils },
];

function getJournal() {
  try { return JSON.parse(localStorage.getItem("mt_journal") || "[]"); } catch { return []; }
}

function saveJournal(data) {
  try { localStorage.setItem("mt_journal", JSON.stringify(data)); } catch {}
}

export function addJournalEntry(entry) {
  const journal = getJournal();
  const todayStr = new Date().toISOString().split("T")[0];
  const dateStr = (entry.date || todayStr) > todayStr ? todayStr : (entry.date || todayStr);
  const existing = journal.findIndex(e => e.date === dateStr);
  let saved;
  if (existing >= 0) {
    saved = { ...journal[existing], ...entry, updatedAt: new Date().toISOString() };
    journal[existing] = saved;
  } else {
    saved = { id: "j_" + Date.now(), date: dateStr, createdAt: new Date().toISOString(), ...entry };
    journal.push(saved);
  }
  saveJournal(journal);
  saveJournalEntry(saved).catch(() => {});
}

export function getJournalEntry(dateStr) {
  return getJournal().find(e => e.date === dateStr) || null;
}

export function JournalMiniCalendar({ entries, selectedDate, onSelect }) {
  const [viewDate, setViewDate] = useState(() => selectedDate ? new Date(selectedDate) : new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];
  const monthName = viewDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const entryDates = new Set(entries.map(e => e.date));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{background:"var(--card)",borderRadius:16,padding:18,marginBottom:16,boxShadow:"var(--card-shadow)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <button className="btn btn-sm" style={{background:"var(--hover)",border:"none",width:34,height:34,padding:0,display:"grid",placeItems:"center",fontSize:16}} onClick={()=>setViewDate(new Date(year,month-1))}>‹</button>
        <span style={{fontSize:16,fontWeight:700}}>{monthName}</span>
        <button className="btn btn-sm" style={{background:"var(--hover)",border:"none",width:34,height:34,padding:0,display:"grid",placeItems:"center",fontSize:16}} onClick={()=>setViewDate(new Date(year,month+1))}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,textAlign:"center",marginBottom:6}}>
        {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{fontSize:11,color:"var(--t3)",fontWeight:600,padding:4}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((d, i) => {
          if (!d) return <div key={"e"+i}/>;
          const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const hasEntry = entryDates.has(ds);
          const isToday = ds === today;
          const isSelected = ds === selectedDate;
          const entry = entries.find(e => e.date === ds);
          const mood = entry?.mood ? MOODS.find(m => m.id === entry.mood) : null;
          return (
            <div key={ds} onClick={() => onSelect(ds)} style={{
              width:"100%",aspectRatio:"1",borderRadius:8,display:"grid",placeItems:"center",cursor:"pointer",fontSize:13,fontWeight:500,
              background: isSelected ? "var(--teal)" : isToday ? "var(--sel)" : "transparent",
              color: isSelected ? "white" : isToday ? "var(--teal)" : "var(--t1)",
              position:"relative",
            }}>
              {mood && !isSelected ? <span style={{display:"inline-flex"}}><mood.icon size={10}/></span> : d}
              {hasEntry && !mood && <div style={{width:5,height:5,borderRadius:"50%",background:isSelected?"white":"var(--teal)",position:"absolute",bottom:2}}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MoodTrendChart({ entries }) {
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const entry = entries.find(e => e.date === dateStr);
    const score = entry?.mood ? MOOD_SCORES[entry.mood] : null;
    days.push({
      date: dateStr,
      dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
      score,
    });
  }

  const padL = 36, padR = 12, padT = 14, padB = 28;
  const w = 320, h = 130;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const moodLabels = ["", "T", "B", "O", "G", "Gr"];

  const points = days.map((d, i) => {
    const x = padL + (i / 6) * plotW;
    const y = d.score != null ? padT + ((5 - d.score) / 4) * plotH : null;
    return { x, y, ...d };
  });

  const validPoints = points.filter(p => p.y != null);
  const linePoints = validPoints.map(p => `${p.x},${p.y}`).join(" ");
  const areaPoints = validPoints.length > 1
    ? `${validPoints[0].x},${padT + plotH} ${validPoints.map(p => `${p.x},${p.y}`).join(" ")} ${validPoints[validPoints.length - 1].x},${padT + plotH}`
    : "";

  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      {gridLevels.map(score => {
        const y = padT + ((5 - score) / 4) * plotH;
        return (
          <g key={score}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="var(--sep)" strokeWidth={0.5} strokeDasharray={score === 3 ? "none" : "3 3"} />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={8} fill="var(--t3)" fontWeight={500}>
              {moodLabels[score]}
            </text>
          </g>
        );
      })}
      {areaPoints && (
        <polygon points={areaPoints} fill="url(#moodGrad)" />
      )}
      <defs>
        <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.18} />
          <stop offset="100%" stopColor="var(--teal)" stopOpacity={0.01} />
        </linearGradient>
      </defs>
      {linePoints && (
        <polyline points={linePoints} fill="none" stroke="var(--teal)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {points.map((p, i) => (
        p.y != null ? (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5} fill="var(--teal)" opacity={0.12} />
            <circle cx={p.x} cy={p.y} r={3} fill="var(--teal)" stroke="var(--card)" strokeWidth={1.5} />
          </g>
        ) : (
          <g key={i}>
            <circle cx={p.x} cy={padT + plotH * 0.75} r={2} fill="var(--t4)" opacity={0.4} />
          </g>
        )
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={h - 6} textAnchor="middle" fontSize={8.5} fill={i === 6 ? "var(--teal)" : "var(--t3)"} fontWeight={i === 6 ? 700 : 500}>
          {p.dayLabel}
        </text>
      ))}
    </svg>
  );
}

function SymptomFrequencyChart({ entries }) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const freq = {};
  entries.filter(e => e.date >= cutoffStr).forEach(e => {
    (e.symptoms || []).forEach(s => { freq[s] = (freq[s] || 0) + 1; });
  });

  const sorted = Object.entries(freq)
    .map(([id, count]) => ({ id, count, ...SYMPTOMS.find(s => s.id === id) }))
    .filter(s => s.label)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (!sorted.length) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}><BarChart3 size={32} /></div>
        <div style={{ fontSize: 13, color: "var(--t3)" }}>No symptoms logged in the last 30 days</div>
      </div>
    );
  }

  const maxCount = sorted[0].count;
  const barH = 28;
  const gap = 8;
  const padL = 110, padR = 40, padT = 6;
  const h = padT + sorted.length * (barH + gap);
  const w = 320;
  const barAreaW = w - padL - padR;

  const barColors = [
    "var(--teal)", "#007AFF", "#34C759", "#AF52DE",
    "var(--orange)", "#FF2D55", "#5856D6", "#00C7BE",
  ];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      {sorted.map((s, i) => {
        const y = padT + i * (barH + gap);
        const barW = Math.max(4, (s.count / maxCount) * barAreaW);
        const color = barColors[i % barColors.length];
        return (
          <g key={s.id}>
            <text x={padL - 8} y={y + barH / 2 + 3.5} textAnchor="end" fontSize={10.5} fill="var(--t2)" fontWeight={500}>
              {s.label}
            </text>
            <rect x={padL} y={y} width={barAreaW} height={barH} rx={6} fill="var(--sep)" opacity={0.5} />
            <rect x={padL} y={y} width={barW} height={barH} rx={6} fill={color} opacity={0.2} />
            <rect x={padL} y={y} width={barW} height={barH} rx={6} fill={color} opacity={0.6} />
            <text x={padL + barW + 8} y={y + barH / 2 + 4} fontSize={11} fill="var(--t1)" fontWeight={700}>
              {s.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SleepTrendChart({ entries }) {
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const entry = entries.find(e => e.date === dateStr);
    const sq = entry?.sleep ? SLEEP_QUALITY.find(s => s.id === entry.sleep) : null;
    days.push({
      date: dateStr,
      dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
      score: sq?.score || null,
    });
  }

  const padL = 36, padR = 12, padT = 14, padB = 28;
  const w = 320, h = 130;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const sleepLabels = { 5: "Exc", 4: "Good", 3: "Fair", 2: "Poor", 1: "Ter" };

  const points = days.map((d, i) => {
    const x = padL + (i / 6) * plotW;
    const y = d.score != null ? padT + ((5 - d.score) / 4) * plotH : null;
    return { x, y, ...d };
  });

  const validPoints = points.filter(p => p.y != null);
  const linePoints = validPoints.map(p => `${p.x},${p.y}`).join(" ");
  const areaPoints = validPoints.length > 1
    ? `${validPoints[0].x},${padT + plotH} ${validPoints.map(p => `${p.x},${p.y}`).join(" ")} ${validPoints[validPoints.length - 1].x},${padT + plotH}`
    : "";

  const gridLevels = [1, 3, 5];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      {[1, 2, 3, 4, 5].map(score => {
        const y = padT + ((5 - score) / 4) * plotH;
        const showLabel = gridLevels.includes(score);
        return (
          <g key={score}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="var(--sep)" strokeWidth={0.5} strokeDasharray="3 3" />
            {showLabel && (
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={8} fill="var(--t3)" fontWeight={500}>
                {sleepLabels[score]}
              </text>
            )}
          </g>
        );
      })}
      {areaPoints && (
        <polygon points={areaPoints} fill="url(#sleepGrad)" />
      )}
      <defs>
        <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5856D6" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#5856D6" stopOpacity={0.01} />
        </linearGradient>
      </defs>
      {linePoints && (
        <polyline points={linePoints} fill="none" stroke="#5856D6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {points.map((p, i) => (
        p.y != null ? (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5} fill="#5856D6" opacity={0.12} />
            <circle cx={p.x} cy={p.y} r={3} fill="#5856D6" stroke="var(--card)" strokeWidth={1.5} />
          </g>
        ) : (
          <g key={i}>
            <circle cx={p.x} cy={padT + plotH * 0.75} r={2} fill="var(--t4)" opacity={0.4} />
          </g>
        )
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={h - 6} textAnchor="middle" fontSize={8.5} fill={i === 6 ? "#5856D6" : "var(--t3)"} fontWeight={i === 6 ? 700 : 500}>
          {p.dayLabel}
        </text>
      ))}
    </svg>
  );
}

function JournalPatterns({ entries }) {
  return (
    <div style={{ padding: "8px 20px 20px", overflowY: "auto", maxHeight: "calc(90dvh - 80px)" }}>
      <div style={{ fontSize: 14, color: "var(--t3)", marginBottom: 20, textAlign: "center" }}>Patterns &amp; trends from your journal</div>

      <div style={{ background: "var(--card)", borderRadius: 16, padding: 18, marginBottom: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-flex", width: 20, height: 20, borderRadius: 6, background: "var(--sel)", alignItems: "center", justifyContent: "center" }}>
            <Smile size={12} color="var(--teal)" />
          </span>
          Mood trend — 7 days
        </div>
        <MoodTrendChart entries={entries} />
        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 8 }}>
          {MOODS.slice(0, 4).map(m => (
            <span key={m.id} style={{ fontSize: 9, color: "var(--t3)", display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, display: "inline-block" }} />
              {m.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--card)", borderRadius: 16, padding: 18, marginBottom: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-flex", width: 20, height: 20, borderRadius: 6, background: "rgba(88,86,214,.08)", alignItems: "center", justifyContent: "center" }}>
            <Moon size={12} color="#5856D6" />
          </span>
          Sleep quality — 7 days
        </div>
        <SleepTrendChart entries={entries} />
      </div>

      <div style={{ background: "var(--card)", borderRadius: 16, padding: 18, marginBottom: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-flex", width: 20, height: 20, borderRadius: 6, background: "rgba(255,149,0,.08)", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={12} color="var(--orange)" />
          </span>
          Symptom frequency — 30 days
        </div>
        <SymptomFrequencyChart entries={entries} />
      </div>
    </div>
  );
}

export function JournalEntrySheet({ date, entry, onSave, onClose }) {
  const [mood, setMood] = useState(entry?.mood || "");
  const [sleep, setSleep] = useState(entry?.sleep || "");
  const [symptoms, setSymptoms] = useState(entry?.symptoms || []);
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState("entry");
  const [journalEntries, setJournalEntries] = useState([]);
  const handleSwipe = useSwipe({ onSwipeDown: onClose });

  function showPatterns() {
    setJournalEntries(getJournal());
    setView("patterns");
  }

  function toggleSymptom(id) {
    setSymptoms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleSave() {
    if (!mood) return;
    addJournalEntry({ date, mood, sleep, symptoms, notes: notes.trim() || null });
    onSave?.();
    setSaved(true);
    setTimeout(() => onClose(), 1000);
  }

  if (saved) {
    return (
      <div className="sheet-overlay" onClick={onClose}>
        <div className="sheet" style={{maxHeight:"50dvh"}} onClick={e => e.stopPropagation()}>
          <div style={{padding:32,textAlign:"center"}}>
            <div style={{display:"grid",placeItems:"center",marginBottom:12}}><NotebookPen size={48} strokeWidth={1.5}/></div>
            <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Journal saved</div>
            <div style={{fontSize:14,color:"var(--t3)"}}>{date}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{maxHeight:"90dvh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" {...handleSwipe}/>
        <div style={{display:"flex",alignItems:"center",padding:"0 20px 12px",borderBottom:"0.5px solid var(--sep)",marginBottom:8,position:"relative"}}>
          {view === "patterns" ? (
            <button onClick={() => setView("entry")} style={{background:"var(--hover)",border:"none",width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
              <ArrowLeft size={16} color="var(--t1)"/>
            </button>
          ) : (
            <div style={{width:32}}/>
          )}
          <div style={{flex:1,textAlign:"center",fontSize:17,fontWeight:600,letterSpacing:"-.2px"}}>
            {view === "patterns" ? "Patterns" : "Health Journal"}
          </div>
          {view === "entry" ? (
            <button onClick={showPatterns} style={{
              display:"flex",alignItems:"center",gap:4,background:"var(--sel)",border:"none",borderRadius:99,padding:"5px 10px",cursor:"pointer",flexShrink:0,
              fontSize:11,fontWeight:600,color:"var(--teal)",fontFamily:"inherit",transition:"all .15s",
            }}>
              <BarChart3 size={12} strokeWidth={2.2}/>
              Patterns
            </button>
          ) : (
            <div style={{width:32}}/>
          )}
        </div>

        {view === "patterns" ? (
          <JournalPatterns entries={journalEntries} />
        ) : (
          <div style={{padding:"8px 20px 20px",overflowY:"auto",maxHeight:"calc(90dvh - 80px)"}}>
            <div style={{fontSize:14,color:"var(--t3)",marginBottom:20,textAlign:"center"}}>{date}</div>

            <FormControl label="How are you feeling?">
              <div style={{display:"flex",gap:8}}>
                {MOODS.map(m => (
                  <div key={m.id} onClick={() => setMood(m.id)} style={{
                    flex:1,padding:"14px 8px",borderRadius:14,textAlign:"center",cursor:"pointer",
                    background: mood === m.id ? `${m.color}18` : "var(--hover)",
                    border:`1.5px solid ${mood === m.id ? `${m.color}40` : "var(--sep)"}`,
                    transition:"all .2s cubic-bezier(.25,.1,.25,1)",
                  }}>
                    <div style={{display:"grid",placeItems:"center",marginBottom:2}}><m.icon size={24}/></div>
                    <div style={{fontSize:11,fontWeight:600,color:mood === m.id ? m.color : "var(--t3)"}}>{m.label}</div>
                  </div>
                ))}
              </div>
            </FormControl>

            <FormControl label="Sleep quality">
              <div style={{display:"flex",gap:8}}>
                {SLEEP_QUALITY.map(sq => (
                  <div key={sq.id} onClick={() => setSleep(sq.id)} style={{
                    flex:1,padding:"12px 6px",borderRadius:12,textAlign:"center",cursor:"pointer",fontSize:12,fontWeight:600,
                    background: sleep === sq.id ? "rgba(0,122,255,.08)" : "var(--hover)",
                    border:`1.5px solid ${sleep === sq.id ? "var(--teal)" : "var(--sep)"}`,
                    color: sleep === sq.id ? "var(--teal)" : "var(--t3)",
                    transition:"all .2s cubic-bezier(.25,.1,.25,1)",
                  }}>
                    <div style={{display:"grid",placeItems:"center",marginBottom:2}}><sq.icon size={18}/></div>
                    {sq.label}
                  </div>
                ))}
              </div>
            </FormControl>

            <FormControl label="Any symptoms?">
              <div className="chip-group">
                {SYMPTOMS.map(s => (
                  <div key={s.id} onClick={() => toggleSymptom(s.id)} className={`pill${symptoms.includes(s.id) ? " on" : ""}`}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:4}}><s.icon size={14}/> {s.label}</span>
                  </div>
                ))}
              </div>
            </FormControl>

            <FormControl label="Notes (optional)">
              <textarea className="sheet-input" rows={3} placeholder="How was your day? Any changes in how you feel?"
                value={notes} onChange={e => setNotes(e.target.value)}/>
            </FormControl>

            <div className="sheet-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={!mood}>Save entry</button>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function JournalTimeline({ entries }) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  if (!sorted.length) return null;

  return (
    <div style={{background:"var(--card)",borderRadius:16,padding:18,boxShadow:"var(--card-shadow)",marginBottom:10}}>
      <div style={{fontSize:16,fontWeight:700,color:"var(--t1)",marginBottom:14}}>Recent journal entries</div>
      {sorted.map(entry => {
        const mood = MOODS.find(m => m.id === entry.mood);
        const sleep = SLEEP_QUALITY.find(s => s.id === entry.sleep);
        return (
          <div key={entry.id || entry.date} style={{padding:"12px 0",borderTop:"0.5px solid var(--sep)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <span style={{fontSize:18}}>{mood ? <mood.icon size={18}/> : <NotebookPen size={18}/>}</span>
              <span style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{entry.date}</span>
              {sleep && <span style={{fontSize:12,color:"var(--t3)",display:"inline-flex",alignItems:"center",gap:4}}><Moon size={13}/> {sleep.label}</span>}
            </div>
            {entry.symptoms?.length > 0 && (
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
                {entry.symptoms.map(s => {
                  const sym = SYMPTOMS.find(x => x.id === s);
                  return <span key={s} style={{fontSize:11,background:"var(--hover)",borderRadius:6,padding:"2px 8px",color:"var(--t2)",display:"inline-flex",alignItems:"center",gap:4}}>{sym ? <sym.icon size={12}/> : null} {sym?.label || s}</span>;
                })}
              </div>
            )}
            {entry.notes && <div style={{fontSize:13,color:"var(--t3)",lineHeight:1.4}}>{entry.notes}</div>}
          </div>
        );
      })}
    </div>
  );
}
