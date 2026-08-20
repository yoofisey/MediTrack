"use client";

import { useState, useEffect } from "react";
import { Biohazard, CircleAlert, Waves, Moon, MoonStar, TriangleAlert, Zap, Droplets, CircleDot, Utensils, Droplet, Dumbbell, Meh, HelpCircle, CheckCircle2 } from "lucide-react";

const SIDE_EFFECT_TYPES = [
  { id:"nausea", label:"Nausea", icon:Biohazard },
  { id:"headache", label:"Headache", icon:CircleAlert },
  { id:"dizziness", label:"Dizziness", icon:Waves },
  { id:"fatigue", label:"Fatigue", icon:Moon },
  { id:"insomnia", label:"Insomnia", icon:MoonStar },
  { id:"rash", label:"Rash", icon:TriangleAlert },
  { id:"stomach", label:"Stomach pain", icon:Zap },
  { id:"diarrhea", label:"Diarrhea", icon:Droplets },
  { id:"constipation", label:"Constipation", icon:CircleDot },
  { id:"appetite_loss", label:"Appetite loss", icon:Utensils },
  { id:"dry_mouth", label:"Dry mouth", icon:Droplet },
  { id:"muscle_pain", label:"Muscle pain", icon:Dumbbell },
  { id:"mood_change", label:"Mood change", icon:Meh },
  { id:"other", label:"Other", icon:HelpCircle },
];

const SEVERITY_LEVELS = [
  { id:"mild", label:"Mild", color:"#FF9500" },
  { id:"moderate", label:"Moderate", color:"#FF6B00" },
  { id:"severe", label:"Severe", color:"#FF3B30" },
];

function getSideEffects() {
  try { return JSON.parse(localStorage.getItem("mt_side_effects") || "[]"); } catch { return []; }
}

function saveSideEffects(data) {
  try { localStorage.setItem("mt_side_effects", JSON.stringify(data)); } catch {}
}

export function logSideEffect(entry) {
  const all = getSideEffects();
  all.push({ id: "se_" + Date.now() + Math.random().toString(36).slice(2,5), createdAt: new Date().toISOString(), ...entry });
  saveSideEffects(all);
}

export function getSideEffectSummary(meds, logs) {
  const all = getSideEffects();
  const last30 = new Date(); last30.setDate(last30.getDate() - 30);
  const recent = all.filter(e => new Date(e.createdAt) >= last30);

  const byType = {};
  recent.forEach(e => { byType[e.type] = (byType[e.type] || 0) + 1; });

  const byMed = {};
  recent.forEach(e => {
    const med = meds.find(m => m.id === e.medId);
    if (med) {
      if (!byMed[med.name]) byMed[med.name] = { count: 0, types: {} };
      byMed[med.name].count++;
      byMed[med.name].types[e.type] = (byMed[med.name].types[e.type] || 0) + 1;
    }
  });

  return { total: recent.length, byType, byMed, recent: recent.slice(0, 20) };
}

export function SideEffectLogSheet({ medId, medName, onClose }) {
  const [types, setTypes] = useState([]);
  const [severity, setSeverity] = useState("mild");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  function toggleType(id) {
    setTypes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleSave() {
    if (!types.length) return;
    types.forEach(typeId => {
      logSideEffect({ medId, medName, type: typeId, severity, notes: notes.trim() || null });
    });
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  }

  if (saved) {
    return (
      <div className="sheet-overlay" onClick={onClose}>
        <div className="sheet" style={{maxHeight:"60dvh"}} onClick={e => e.stopPropagation()}>
          <div style={{padding:32,textAlign:"center"}}>
            <div style={{display:"grid",placeItems:"center",marginBottom:12}}><CheckCircle2 size={48} strokeWidth={1.5}/></div>
            <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Side effects logged</div>
            <div style={{fontSize:14,color:"var(--t3)"}}>Thank you for tracking this.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{maxHeight:"85dvh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px",overflowY:"auto",maxHeight:"calc(85dvh - 40px)"}}>
          <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Log side effects</div>
          <div style={{fontSize:13,color:"var(--t3)",marginBottom:16}}>for {medName}</div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:8}}>What did you experience?</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {SIDE_EFFECT_TYPES.map(se => (
                <div key={se.id} onClick={() => toggleType(se.id)} style={{
                  padding:"8px 12px",borderRadius:10,fontSize:13,fontWeight:500,cursor:"pointer",
                  background: types.includes(se.id) ? "var(--sel)" : "var(--hover)",
                  border:`1.5px solid ${types.includes(se.id) ? "var(--teal)" : "transparent"}`,
                  color: types.includes(se.id) ? "var(--teal)" : "var(--t2)",
                  transition:"all .15s",
                }}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4}}><se.icon size={14}/> {se.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:8}}>Severity</div>
            <div style={{display:"flex",gap:8}}>
              {SEVERITY_LEVELS.map(sl => (
                <div key={sl.id} onClick={() => setSeverity(sl.id)} style={{
                  flex:1,padding:"10px",borderRadius:10,textAlign:"center",cursor:"pointer",fontSize:13,fontWeight:600,
                  background: severity === sl.id ? `${sl.color}18` : "var(--hover)",
                  color: severity === sl.id ? sl.color : "var(--t2)",
                  border:`1.5px solid ${severity === sl.id ? `${sl.color}40` : "transparent"}`,
                  transition:"all .15s",
                }}>
                  {sl.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--t3)",marginBottom:6}}>Notes (optional)</div>
            <textarea className="sheet-input" rows={2} placeholder="Any additional details..."
              value={notes} onChange={e => setNotes(e.target.value)} style={{resize:"vertical",fontSize:16}}/>
          </div>

          <div className="sheet-actions" style={{gap:8}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={handleSave} disabled={!types.length}>Save</button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SideEffectSummary({ meds, logs }) {
  const [showLog, setShowLog] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const summary = getSideEffectSummary(meds, logs);
  const topTypes = Object.entries(summary.byType).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topMeds = Object.entries(summary.byMed).sort((a, b) => b[1].count - a[1].count).slice(0, 3);

  return (
    <div style={{background:"var(--card)",borderRadius:18,padding:20,boxShadow:"var(--card-shadow)",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:16,fontWeight:700,color:"var(--t1)"}}>Side Effects (30d)</div>
        <button className="btn btn-sm" style={{background:"var(--ib6)",color:"var(--red)",border:"none",fontSize:11}} onClick={() => {
          if (meds.length) { setSelectedMed(meds[0]); setShowLog(true); }
        }}>+ Log</button>
      </div>

      {summary.total === 0 ? (
        <div style={{textAlign:"center",padding:20,color:"var(--t3)",fontSize:13}}>No side effects logged in the last 30 days</div>
      ) : (
        <>
          <div style={{fontSize:13,fontWeight:500,color:"var(--t3)",marginBottom:8}}>Most common</div>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
            {topTypes.map(([typeId, count]) => {
              const se = SIDE_EFFECT_TYPES.find(s => s.id === typeId);
              return (
                <div key={typeId} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14,display:"inline-flex",alignItems:"center",justifyContent:"center",width:18}}>{se ? <se.icon size={14}/> : <HelpCircle size={14}/>}</span>
                  <span style={{fontSize:13,flex:1}}>{se?.label || typeId}</span>
                  <span style={{fontSize:12,fontWeight:600,color:"var(--t2)"}}>{count}×</span>
                </div>
              );
            })}
          </div>

          {topMeds.length > 0 && (
            <>
              <div style={{fontSize:13,fontWeight:500,color:"var(--t3)",marginBottom:8}}>By medication</div>
              {topMeds.map(([name, data]) => (
                <div key={name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <div style={{flex:1,fontSize:13}}>{name}</div>
                  <div style={{fontSize:12,color:"var(--t3)"}}>{data.count} reports</div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {showLog && selectedMed && (
        <SideEffectLogSheet medId={selectedMed.id} medName={selectedMed.name} onClose={() => { setShowLog(false); setSelectedMed(null); }}/>
      )}
    </div>
  );
}
