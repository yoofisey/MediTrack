"use client";

import { useState, useMemo } from "react";
import { Pill, FileText, Activity, Search, X } from "lucide-react";

function Ico({ children, ...props }) {
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",lineHeight:1,flexShrink:0}} {...props}>{children}</span>;
}

export default function SearchSheet({ meds, logs, journalEntries, onClose, onLogDose, onEditMed }) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    if (!q.trim()) return { meds: [], logs: [], journal: [] };
    const lq = q.toLowerCase();
    const filterMeds = meds.filter(m => m.name?.toLowerCase().includes(lq) || m.notes?.toLowerCase().includes(lq));
    const filterLogs = logs.filter(l => l.medications?.name?.toLowerCase().includes(lq) || l.journal?.toLowerCase().includes(lq)).slice(0, 20);
    let filterJournal = [];
    try {
      filterJournal = (journalEntries||[]).filter(e => (e.text||e.entry||"").toLowerCase().includes(lq)).slice(0, 10);
    } catch {}
    return { meds: filterMeds, logs: filterLogs, journal: filterJournal };
  }, [q, meds, logs, journalEntries]);

  return (
    <div className="sheet-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet" style={{maxHeight:"85vh"}} onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,background:"var(--input)",borderRadius:12,padding:"4px 14px",border:"0.5px solid var(--sep)"}}>
            <Ico><Search size={18} strokeWidth={2.2} color="var(--t3)"/></Ico>
            <input autoFocus type="text" placeholder="Search medications, doses, journal..." value={q} onChange={e=>setQ(e.target.value)}
              style={{flex:1,padding:"12px 0",border:"none",background:"none",fontSize:16,fontFamily:"inherit",color:"var(--t1)",outline:"none"}}/>
            {q && <button onClick={()=>setQ("")} style={{background:"none",border:"none",color:"var(--t3)",cursor:"pointer",display:"grid",placeItems:"center",padding:4}}><X size={16}/></button>}
          </div>

          {q.trim() && (
            <div style={{marginTop:16}}>
              {results.meds.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Medications ({results.meds.length})</div>
                  {results.meds.map(m => (
                    <div key={m.id} className="row" style={{cursor:"pointer",padding:"10px 14px",background:"var(--card)",borderRadius:12,marginBottom:4}} onClick={()=>{onEditMed?.(m);onClose();}}>
                      <div className="row-icon" style={{background:"var(--ib1)",width:28,height:28,borderRadius:7}}><Ico><Pill size={14} strokeWidth={2.2} color="var(--t1)"/></Ico></div>
                      <div className="row-body"><div className="row-title" style={{fontSize:14}}>{m.name}</div><div className="row-sub" style={{fontSize:11}}>{m.dosage_amount} {m.dosage_unit}</div></div>
                      <span style={{fontSize:14,color:"var(--t3)"}}>›</span>
                    </div>
                  ))}
                </div>
              )}
              {results.logs.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Dose logs ({results.logs.length})</div>
                  {results.logs.map(l => (
                    <div key={l.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:"var(--card)",borderRadius:12,marginBottom:4}}>
                      <div style={{width:28,height:28,borderRadius:7,background:"var(--ib2)",display:"grid",placeItems:"center",flexShrink:0}}><Ico><Activity size={14} strokeWidth={2.2} color="var(--t1)"/></Ico></div>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{l.medications?.name||"Medication"}</div>{l.journal&&<div style={{fontSize:11,color:"var(--t3)"}}>{l.journal}</div>}</div>
                      <span style={{fontSize:11,color:"var(--t3)"}}>{new Date(l.taken_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {results.journal.length > 0 && (
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Journal entries ({results.journal.length})</div>
                  {results.journal.map((e,i) => (
                    <div key={e.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:"var(--card)",borderRadius:12,marginBottom:4}}>
                      <div style={{width:28,height:28,borderRadius:7,background:"var(--ib4)",display:"grid",placeItems:"center",flexShrink:0}}><Ico><FileText size={14} strokeWidth={2.2} color="var(--t1)"/></Ico></div>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{(e.text||e.entry||"").slice(0,60)}</div><div style={{fontSize:11,color:"var(--t3)"}}>{e.date}</div></div>
                    </div>
                  ))}
                </div>
              )}
              {results.meds.length === 0 && results.logs.length === 0 && results.journal.length === 0 && (
                <div style={{textAlign:"center",padding:40,color:"var(--t3)",fontSize:14}}>No results for &quot;{q}&quot;</div>
              )}
            </div>
          )}

          {!q.trim() && (
            <div style={{textAlign:"center",padding:40,color:"var(--t3)",fontSize:13}}>Start typing to search across medications, dose logs, and journal entries.</div>
          )}
        </div>
      </div>
    </div>
  );
}
