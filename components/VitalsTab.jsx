"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/lib/i18n";
import { Stethoscope, Scale, Droplets, Heart, Thermometer, Wind, FlaskConical, Ruler, Droplet, Gauge, BarChart3 } from "lucide-react";

const VITAL_TYPES = [
  { id:"blood_pressure", label:"Blood Pressure", icon:Stethoscope, unit:"mmHg", secondaryLabel:"Systolic / Diastolic", color:"#FF3B30", normal:{min:90,max:120}, normalDiastolic:{min:60,max:80}, hasSecondary:true, placeholderA:"120", placeholderB:"80" },
  { id:"weight", label:"Weight", icon:Scale, unit:"kg", color:"#007AFF", normal:{min:45,max:100}, placeholderA:"70" },
  { id:"glucose", label:"Blood Sugar", icon:Droplets, unit:"mg/dL", color:"#FF9500", normal:{min:70,max:140}, placeholderA:"100" },
  { id:"heart_rate", label:"Heart Rate", icon:Heart, unit:"bpm", color:"#FF2D55", normal:{min:60,max:100}, placeholderA:"72" },
  { id:"temperature", label:"Temperature", icon:Thermometer, unit:"°F", color:"#AF52DE", normal:{min:97,max:99}, placeholderA:"98.6" },
  { id:"spo2", label:"Oxygen Level", icon:Wind, unit:"%", color:"#30D158", normal:{min:95,max:100}, placeholderA:"98" },
  { id:"cholesterol", label:"Total Cholesterol", icon:FlaskConical, unit:"mg/dL", color:"#8E8E93", normal:{min:125,max:200}, placeholderA:"180" },
  { id:"bmi", label:"BMI", icon:Ruler, unit:"kg/m²", color:"#5856D6", normal:{min:18.5,max:24.9}, placeholderA:"23" },
  { id:"hba1c", label:"HbA1c", icon:Droplets, unit:"%", color:"#FF3B30", normal:{min:4,max:5.6}, placeholderA:"5.4" },
  { id:"water_intake", label:"Water Intake", icon:Droplet, unit:"L", color:"#0A84FF", normal:{min:1.5,max:3.5}, placeholderA:"2" },
  { id:"peak_flow", label:"Peak Flow", icon:Gauge, unit:"L/min", color:"#FF9F0A", normal:{min:400,max:700}, placeholderA:"550" },
];

const FREQUENCIES = [
  { id:"daily", label:"Once daily" },
  { id:"twice", label:"Twice daily" },
  { id:"weekly", label:"Once a week" },
  { id:"custom", label:"Custom" },
];

const REMINDER_INTERVALS = [
  { id:"4h", label:"Every 4 hours", hours: 4 },
  { id:"6h", label:"Every 6 hours", hours: 6 },
  { id:"8h", label:"Every 8 hours", hours: 8 },
  { id:"12h", label:"Every 12 hours", hours: 12 },
  { id:"24h", label:"Once daily", hours: 24 },
  { id:"morning_evening", label:"Morning & evening", hours: 12, custom:true },
  { id:"off", label:"No reminder", hours: 0 },
];

function getStatus(vital) {
  const t = VITAL_TYPES.find(v => v.id === vital.type);
  if (!t) return "normal";
  const v = vital.value;
  if (t.hasSecondary && vital.value_secondary != null) {
    if (v > t.normal.max || vital.value_secondary > (t.normalDiastolic?.max || 80)) return "high";
    if (v < t.normal.min || vital.value_secondary < (t.normalDiastolic?.min || 60)) return "low";
    return "normal";
  }
  if (v > t.normal.max) return "high";
  if (v < t.normal.min) return "low";
  return "normal";
}

function statusColor(status) {
  if (status === "high") return "#FF3B30";
  if (status === "low") return "#FF9500";
  return "#30D158";
}

function MiniSparkline({ data, color, width = 120, height = 32 }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => d.value);
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} style={{display:"block"}}>
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace("#","")})`}/>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={points.split(" ").pop().split(",")[0]} cy={points.split(" ").pop().split(",")[1]} r="3" fill={color}/>
    </svg>
  );
}

function VitalCard({ vitalType, entries, onLog, onConfigure, config }) {
  const { t } = useLang();
  const latest = entries[0];
  const status = latest ? getStatus(latest) : null;
  const recent7 = entries.slice(0, 7).reverse();

  return (
    <div style={{
      background:"var(--card)", borderRadius:16, padding:16,
      boxShadow:"var(--card-shadow)", marginBottom:8,
      animation:"fadeUp .3s ease both",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:vitalType.color,opacity:0.8}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:10,background:`${vitalType.color}12`,display:"grid",placeItems:"center"}}>
            <vitalType.icon size={20}/>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:"var(--t1)"}}>{vitalType.label}</div>
            <div style={{fontSize:12,color:"var(--t3)"}}>
              {config?.frequency || "Not configured"}
            </div>
          </div>
        </div>
        {latest && (
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {recent7.length >= 2 && <MiniSparkline data={recent7} color={vitalType.color}/>}
            <div style={{
              width:8,height:8,borderRadius:"50%",
              background: statusColor(status),
              boxShadow:`0 0 8px ${statusColor(status)}40`,
            }}/>
          </div>
        )}
      </div>

      {latest ? (
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{fontSize:28,fontWeight:700,letterSpacing:-.5,color:"var(--t1)",lineHeight:1}}>
              {latest.value}
              {latest.value_secondary != null && <span style={{fontSize:20,fontWeight:600}}>/{latest.value_secondary}</span>}
            </div>
            <div style={{fontSize:12,color:"var(--t3)",marginTop:2}}>{vitalType.unit} · {new Date(latest.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</div>
          </div>
          {status && (
            <div style={{
              padding:"4px 10px",borderRadius:8,
              background:`${statusColor(status)}12`,
              color:statusColor(status),
              fontSize:12,fontWeight:600,
            }}>
          {status === "normal" ? t("vitals.normal") : status === "high" ? t("vitals.high") : t("vitals.low")}
            </div>
          )}
        </div>
      ) : (
        <div style={{fontSize:14,color:"var(--t3)",marginBottom:12,textAlign:"center",padding:"8px 0"}}>
          No readings yet
        </div>
      )}

      <button onClick={() => onLog(vitalType)} style={{
        width:"100%",padding:"11px",borderRadius:12,border:`1.5px solid ${vitalType.color}20`,
        background:`${vitalType.color}08`,color:vitalType.color,
        fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
        transition:"all .15s",
      }}>
        + {t("btn.log")} {vitalType.label}
      </button>
    </div>
  );
}

function LogSheet({ vitalType, onSave, onClose }) {
  const { t } = useLang();
  const [valA, setValA] = useState("");
  const [valB, setValB] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function handleSave() {
    if (!valA) return;
    setSaving(true);
    const reading = {
      type: vitalType.id,
      value: parseFloat(valA),
      value_secondary: vitalType.hasSecondary ? parseFloat(valB) || null : null,
      unit: vitalType.unit,
      notes: notes.trim() || null,
    };
    onSave(reading);
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{maxHeight:"85vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <div style={{width:42,height:42,borderRadius:12,background:`${vitalType.color}12`,display:"grid",placeItems:"center"}}>
              <vitalType.icon size={22}/>
            </div>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:"var(--t1)"}}>{t("btn.log")} {vitalType.label}</div>
              <div style={{fontSize:13,color:"var(--t3)"}}>{vitalType.normal.min}–{vitalType.normal.max} {vitalType.unit} {t("vitals.isNormal")}</div>
            </div>
          </div>

          {vitalType.hasSecondary ? (
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:14}}>
              <div>
                <div style={{fontSize:12,color:"var(--t3)",marginBottom:6,fontWeight:500}}>{t("vitals.systolic")}</div>
                <input className="sheet-input" type="number" inputMode="decimal" placeholder={vitalType.placeholderA}
                  value={valA} onChange={e => setValA(e.target.value)} style={{fontSize:20,fontWeight:700,textAlign:"center",padding:"16px 12px"}}/>
              </div>
              <div style={{fontSize:24,fontWeight:300,color:"var(--t4)",paddingTop:20}}>/</div>
              <div>
                <div style={{fontSize:12,color:"var(--t3)",marginBottom:6,fontWeight:500}}>{t("vitals.diastolic")}</div>
                <input className="sheet-input" type="number" inputMode="decimal" placeholder={vitalType.placeholderB}
                  value={valB} onChange={e => setValB(e.target.value)} style={{fontSize:20,fontWeight:700,textAlign:"center",padding:"16px 12px"}}/>
              </div>
            </div>
          ) : (
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:6,fontWeight:500}}>{t("vitals.value")} ({vitalType.unit})</div>
              <input className="sheet-input" type="number" inputMode="decimal" placeholder={vitalType.placeholderA}
                value={valA} onChange={e => setValA(e.target.value)} style={{fontSize:28,fontWeight:700,textAlign:"center",padding:"20px 12px",letterSpacing:-.5}}/>
            </div>
          )}

          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:"var(--t3)",marginBottom:6,fontWeight:500}}>{t("vitals.notes")}</div>
            <textarea className="sheet-input" rows={2} placeholder={t("vitals.howFeeling")}
              value={notes} onChange={e => setNotes(e.target.value)} style={{resize:"none",fontSize:16,background:"var(--bg)"}}/>
          </div>

          <button className="btn" onClick={handleSave} disabled={!valA || saving} style={{
            width:"100%",marginBottom:8,
            background:vitalType.color,opacity:!valA || saving ? .6 : 1,
          }}>
            {saving ? t("vitals.saving") : t("vitals.saveReading")}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>{t("vitals.cancel")}</button>
        </div>
      </div>
    </div>
  );
}

function HistorySheet({ vitalType, entries, onClose }) {
  const { t } = useLang();
  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{maxHeight:"90vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:36,height:36,borderRadius:10,background:`${vitalType.color}12`,display:"grid",placeItems:"center"}}>
              <vitalType.icon size={18}/>
            </div>
            <div style={{fontSize:18,fontWeight:700,color:"var(--t1)"}}>{vitalType.label} {t("vitals.historyTitle")}</div>
          </div>

          {entries.length === 0 ? (
            <div style={{textAlign:"center",padding:"32px 0",color:"var(--t3)",fontSize:14}}>{t("vitals.noReadings")}</div>
          ) : (
            <div className="list">
              {entries.map(e => {
                const status = getStatus(e);
                return (
                  <div key={e.id} className="row" style={{cursor:"default"}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:statusColor(status),flexShrink:0,boxShadow:`0 0 6px ${statusColor(status)}30`}}/>
                    <div className="row-body">
                      <div className="row-title" style={{fontWeight:600}}>
                        {e.value}{e.value_secondary != null ? `/${e.value_secondary}` : ""} <span style={{fontSize:13,fontWeight:400,color:"var(--t3)"}}>{e.unit}</span>
                      </div>
                      {e.notes && <div className="row-sub">{e.notes}</div>}
                    </div>
                    <div style={{fontSize:13,color:"var(--t3)",textAlign:"right"}}>
                      {new Date(e.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                      <br/>
                      <span style={{fontSize:12}}>{new Date(e.created_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button className="btn btn-ghost" style={{marginTop:16}} onClick={onClose}>{t("btn.close")}</button>
        </div>
      </div>
    </div>
  );
}

function ConfigureSheet({ enabled, onToggle, frequency, onFrequency, vitalReminders, onUpdateReminder, onClose }) {
  const { t } = useLang();
  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{maxHeight:"70vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px"}}>
        <div style={{fontSize:18,fontWeight:700,marginBottom:16}}>{t("vitals.configureTitle")}</div>

          <div style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--t2)",marginBottom:10}}>{t("vitals.trackThese")}</div>
            {VITAL_TYPES.map(vt => {
              const isOn = enabled.includes(vt.id);
              return (
                <div key={vt.id} onClick={() => onToggle(vt.id)} style={{
                  display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
                  background:isOn ? `${vt.color}08` : "var(--hover)",borderRadius:12,
                  marginBottom:6, cursor:"pointer",
                  border:`1.5px solid ${isOn ? `${vt.color}30` : "transparent"}`,
                  transition:"all .15s",
                }}>
                  <div style={{width:32,height:32,borderRadius:8,background:`${vt.color}12`,display:"grid",placeItems:"center"}}><vt.icon size={16}/></div>
                  <div style={{flex:1,fontSize:14,fontWeight:500,color:"var(--t1)"}}>{vt.label}</div>
                  <div style={{
                    width:44,height:26,borderRadius:13,position:"relative",cursor:"pointer",
                    background:isOn ? vt.color : "var(--sep)",transition:"background .2s",
                  }}>
                    <div style={{
                      width:22,height:22,borderRadius:11,background:"white",
                      position:"absolute",top:2,left:isOn ? 20 : 2,
                      boxShadow:"0 1px 4px rgba(0,0,0,.15)",transition:"left .2s",
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div style={{fontSize:13,fontWeight:600,color:"var(--t2)",marginBottom:10}}>{t("vitals.defaultFreq")}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {FREQUENCIES.map(f => (
                <div key={f.id} onClick={() => onFrequency(f.id)} style={{
                  padding:"12px 14px",background:frequency===f.id ? "var(--sel)" : "var(--hover)",
                  borderRadius:12,cursor:"pointer",
                  border:`1.5px solid ${frequency===f.id ? "var(--teal)" : "transparent"}`,
                  fontSize:14,fontWeight:500,color:frequency===f.id ? "var(--teal)" : "var(--t1)",
                  transition:"all .15s",
                }}>
                  {f.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{marginTop:20}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--t2)",marginBottom:6}}>{t("vitals.reminderIntervals")}</div>
            <div style={{fontSize:12,color:"var(--t3)",marginBottom:10}}>{t("vitals.setReminder")}</div>
            {enabled.map(vtId => {
              const vt = VITAL_TYPES.find(v => v.id === vtId);
              const rem = vitalReminders[vtId] || { intervalId:"off" };
              return (
                <div key={vtId} style={{marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{display:"inline-flex"}}><vt.icon size={16}/></span>
                    <span style={{fontSize:14,fontWeight:600,color:"var(--t1)"}}>{vt.label}</span>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {REMINDER_INTERVALS.map(ri => (
                      <div key={ri.id} onClick={() => onUpdateReminder(vtId, ri.id)} style={{
                        padding:"7px 12px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",
                        background: rem.intervalId === ri.id ? `${vt.color}18` : "var(--hover)",
                        color: rem.intervalId === ri.id ? vt.color : "var(--t2)",
                        border:`1.5px solid ${rem.intervalId === ri.id ? `${vt.color}40` : "transparent"}`,
                        transition:"all .15s",
                      }}>
                        {ri.label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn btn-ghost" style={{marginTop:16}} onClick={onClose}>{t("vitals.done")}</button>
        </div>
      </div>
    </div>
  );
}

export default function VitalsTab({ vitals: allVitals, onRefresh, user }) {
  const { t } = useLang();
  const [logType, setLogType] = useState(null);
  const [historyType, setHistoryType] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return ["blood_pressure","glucose"];
    try { return JSON.parse(localStorage.getItem("mt_vitals_enabled") || '["blood_pressure","glucose"]'); } catch { return ["blood_pressure","glucose"]; }
  });
  const [frequency, setFrequency] = useState(() => {
    if (typeof window === "undefined") return "daily";
    return localStorage.getItem("mt_vitals_freq") || "daily";
  });
  const [vitalReminders, setVitalReminders] = useState(() => {
    if (typeof window === "undefined") return { blood_pressure:{ intervalId:"off" }, glucose:{ intervalId:"off" } };
    try { return JSON.parse(localStorage.getItem("mt_vital_reminders") || '{"blood_pressure":{"intervalId":"off"},"glucose":{"intervalId":"off"}}'); } catch { return { blood_pressure:{ intervalId:"off" }, glucose:{ intervalId:"off" } }; }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mt_vitals_enabled", JSON.stringify(enabled));
      localStorage.setItem("mt_vitals_freq", frequency);
      localStorage.setItem("mt_vital_reminders", JSON.stringify(vitalReminders));
    }
  }, [enabled, frequency, vitalReminders]);

  const toggleVital = useCallback((id) => {
    setEnabled(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const updateVitalReminder = useCallback((vitalId, intervalId) => {
    setVitalReminders(prev => ({ ...prev, [vitalId]: { intervalId } }));
  }, []);

  const totalReadings = allVitals.length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayReadings = allVitals.filter(v => v.created_at?.startsWith(todayStr)).length;

  return (
    <div className="scroll" style={{paddingTop:0}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cardIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
      `}</style>

      <div style={{margin:"16px 16px 12px",background:"linear-gradient(145deg,#007AFF,#0055CC)",borderRadius:16,padding:20,color:"white",position:"relative",overflow:"hidden",animation:"fadeUp .3s ease both"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.08)"}}/>
        <div style={{position:"absolute",bottom:-30,left:-10,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:13,fontWeight:500,opacity:.8,marginBottom:4}}>{t("vitals.overview")}</div>
          <div style={{display:"flex",gap:20,alignItems:"flex-end"}}>
            <div>
              <div style={{fontSize:34,fontWeight:700,letterSpacing:-.8,lineHeight:1}}>{todayReadings}</div>
              <div style={{fontSize:12,opacity:.7,marginTop:2}}>{t("vitals.readingsToday")}</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,opacity:.7}}>{enabled.length} {t("vitals.tracked")}</div>
              <div style={{fontSize:13,opacity:.7}}>{totalReadings} {t("vitals.totalReadings")}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 16px 8px"}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:.5}}>{t("vitals.trackedVitals")}</div>
        <button onClick={() => setShowConfig(true)} style={{
          background:"none",border:"none",color:"var(--teal)",fontSize:13,fontWeight:600,
          cursor:"pointer",fontFamily:"inherit",padding:"4px 8px",
        }}>
          {t("vitals.configure")}
        </button>
      </div>

      <div style={{padding:"0 16px"}}>
        {enabled.length === 0 ? (
          <div style={{textAlign:"center",padding:"48px 24px",color:"var(--t3)"}}>
            <div style={{display:"grid",placeItems:"center",marginBottom:12}}><BarChart3 size={48} strokeWidth={1.5}/></div>
            <div style={{fontSize:17,fontWeight:600,color:"var(--t2)",marginBottom:6}}>{t("vitals.noConfigured")}</div>
            <div style={{fontSize:14,marginBottom:20}}>{t("vitals.tapConfigure")}</div>
            <button className="btn btn-primary" style={{width:"auto",padding:"12px 24px"}} onClick={() => setShowConfig(true)}>{t("vitals.configureVitals")}</button>
          </div>
        ) : (
          enabled.map((id, i) => {
            const vt = VITAL_TYPES.find(v => v.id === id);
            if (!vt) return null;
            const entries = allVitals.filter(v => v.type === id);
            return (
              <div key={id} style={{animation:`fadeUp .3s ${i * .06}s ease both`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,marginTop:i > 0 ? 8 : 0}}>
                  <div/>
                  {entries.length > 0 && (
                    <button onClick={() => setHistoryType(vt)} style={{
                      background:"none",border:"none",color:"var(--t3)",fontSize:12,fontWeight:500,
                      cursor:"pointer",fontFamily:"inherit",padding:"4px 8px",
                    }}>
                      History →
                    </button>
                  )}
                </div>
                <VitalCard vitalType={vt} entries={entries} onLog={setLogType}/>
              </div>
            );
          })
        )}
      </div>

      {logType && (
        <LogSheet vitalType={logType} onClose={() => setLogType(null)} onSave={async (reading) => {
          const { sb } = await import("@/lib/supabase");
          await sb.from("vitals").insert({ user_id: user.id, ...reading });
          setLogType(null);
          if (onRefresh) onRefresh();
        }}/>
      )}
      {historyType && (
        <HistorySheet vitalType={historyType} entries={allVitals.filter(v => v.type === historyType.id)} onClose={() => setHistoryType(null)}/>
      )}
      {showConfig && (
        <ConfigureSheet enabled={enabled} onToggle={toggleVital} frequency={frequency} onFrequency={setFrequency} vitalReminders={vitalReminders} onUpdateReminder={updateVitalReminder} onClose={() => setShowConfig(false)}/>
      )}
    </div>
  );
}
