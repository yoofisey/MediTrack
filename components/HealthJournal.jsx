"use client";

import { useState, useEffect } from "react";
import { Laugh, Smile, Meh, Frown, CloudRain, MoonStar, CircleAlert, Zap, Moon, Waves, Biohazard, Wind, Droplets, Thermometer, AlertTriangle, Utensils, NotebookPen } from "lucide-react";
import { useSwipe } from "@/lib/useSwipe";

const MOODS = [
  { id:"great", label:"Great", icon:Laugh, color:"#30D158" },
  { id:"good", label:"Good", icon:Smile, color:"#007AFF" },
  { id:"okay", label:"Okay", icon:Meh, color:"#FF9500" },
  { id:"bad", label:"Bad", icon:Frown, color:"#FF6B00" },
  { id:"terrible", label:"Terrible", icon:CloudRain, color:"#FF3B30" },
];

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
  const dateStr = entry.date || new Date().toISOString().split("T")[0];
  const todayStr = new Date().toISOString().split("T")[0];
  if (dateStr > todayStr) return;
  const existing = journal.findIndex(e => e.date === dateStr);
  if (existing >= 0) {
    journal[existing] = { ...journal[existing], ...entry, updatedAt: new Date().toISOString() };
  } else {
    journal.push({ id: "j_" + Date.now(), date: dateStr, createdAt: new Date().toISOString(), ...entry });
  }
  saveJournal(journal);
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

export function JournalEntrySheet({ date, entry, onSave, onClose }) {
  const [mood, setMood] = useState(entry?.mood || "");
  const [sleep, setSleep] = useState(entry?.sleep || "");
  const [symptoms, setSymptoms] = useState(entry?.symptoms || []);
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saved, setSaved] = useState(false);
  const handleSwipe = useSwipe({ onSwipeDown: onClose });

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
        <div className="sheet" style={{maxHeight:"50vh"}} onClick={e => e.stopPropagation()}>
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
      <div className="sheet" style={{maxHeight:"90vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" {...handleSwipe}/>
        <div style={{padding:"0 24px 24px",overflowY:"auto",maxHeight:"calc(90vh - 40px)"}}>
          <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>Health Journal</div>
          <div style={{fontSize:14,color:"var(--t3)",marginBottom:24}}>{date}</div>

          <div style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:10}}>How are you feeling?</div>
            <div style={{display:"flex",gap:10}}>
              {MOODS.map(m => (
                <div key={m.id} onClick={() => setMood(m.id)} style={{
                  flex:1,padding:"14px 8px",borderRadius:14,textAlign:"center",cursor:"pointer",
                  background: mood === m.id ? `${m.color}18` : "var(--hover)",
                  border:`1.5px solid ${mood === m.id ? `${m.color}40` : "transparent"}`,
                  transition:"all .15s",
                }}>
                  <div style={{display:"grid",placeItems:"center",marginBottom:2}}><m.icon size={24}/></div>
                  <div style={{fontSize:11,fontWeight:500,color:mood === m.id ? m.color : "var(--t3)"}}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:10}}>Sleep quality</div>
            <div style={{display:"flex",gap:8}}>
              {SLEEP_QUALITY.map(sq => (
                <div key={sq.id} onClick={() => setSleep(sq.id)} style={{
                  flex:1,padding:"12px 6px",borderRadius:12,textAlign:"center",cursor:"pointer",fontSize:12,fontWeight:500,
                  background: sleep === sq.id ? "var(--sel)" : "var(--hover)",
                  border:`1.5px solid ${sleep === sq.id ? "var(--teal)" : "transparent"}`,
                  color: sleep === sq.id ? "var(--teal)" : "var(--t3)",
                  transition:"all .15s",
                }}>
                  <div style={{display:"grid",placeItems:"center",marginBottom:2}}><sq.icon size={18}/></div>
                  {sq.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:10}}>Any symptoms?</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {SYMPTOMS.map(s => (
                <div key={s.id} onClick={() => toggleSymptom(s.id)} style={{
                  padding:"8px 14px",borderRadius:12,fontSize:13,fontWeight:500,cursor:"pointer",
                  background: symptoms.includes(s.id) ? "var(--sel)" : "var(--hover)",
                  border:`1.5px solid ${symptoms.includes(s.id) ? "var(--teal)" : "transparent"}`,
                  color: symptoms.includes(s.id) ? "var(--teal)" : "var(--t2)",
                  transition:"all .15s",
                }}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4}}><s.icon size={14}/> {s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{marginBottom:24}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:8}}>Notes (optional)</div>
            <textarea className="sheet-input" rows={3} placeholder="How was your day? Any changes in how you feel?"
              value={notes} onChange={e => setNotes(e.target.value)} style={{resize:"vertical",fontSize:16}}/>
          </div>

          <div className="sheet-actions" style={{gap:8}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={handleSave} disabled={!mood}>Save entry</button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
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
