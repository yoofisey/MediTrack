"use client";

import { useState, useEffect } from "react";
import { addVisit, updateVisit, deleteVisit, getVisits } from "@/lib/data";
import { Building2, ClipboardList } from "lucide-react";

function Ico({ children, ...props }) {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }} {...props}>{children}</span>;
}

export default function VisitSheet({ onClose, editingVisit, onSaved, initialView }) {
  const today = new Date().toISOString().split("T")[0];
  const [f, setF] = useState({
    date: editingVisit?.date || today,
    time: editingVisit?.time || "09:00",
    doctor: editingVisit?.doctor || "",
    facility: editingVisit?.facility || "",
    reason: editingVisit?.reason || "",
    notes: editingVisit?.notes || "",
    reminder_minutes: editingVisit?.reminder_minutes || "60",
  });
  const [busy, setBusy] = useState(false);
  const [showList, setShowList] = useState(initialView === "list");
  const [delId, setDelId] = useState(null);
  const [editingId, setEditingId] = useState(editingVisit?.id || null);

  useEffect(() => {}, []);

  function set(k, v) { setF(p => ({ ...p, [k]: v })); }

  function handleSave() {
    if (!f.date) return;
    setBusy(true);
    if (editingId) {
      updateVisit(editingId, f);
    } else {
      addVisit(f);
    }
    onSaved?.();
    setBusy(false);
  }

  function handleDelete(id) {
    deleteVisit(id);
    setDelId(null);
  }

  const upcoming = getVisits().filter(v => v.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = getVisits().filter(v => v.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const reminderOpts = [
    { value: "0", label: "At time" },
    { value: "30", label: "30 min before" },
    { value: "60", label: "1 hour before" },
    { value: "1440", label: "1 day before" },
    { value: "2880", label: "2 days before" },
  ];

  if (showList) {
    return (
      <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="sheet" style={{maxHeight:"90vh"}} onClick={e => e.stopPropagation()}>
          <div className="sheet-handle"/>
          <div style={{padding:"0 20px 20px",overflowY:"auto",maxHeight:"calc(90vh - 40px)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div style={{fontSize:20,fontWeight:700}}>All visits</div>
              <button className="btn btn-sm" style={{background:"var(--hover)",border:"none",fontSize:13}} onClick={()=>setShowList(false)}>← Back</button>
            </div>
            {upcoming.length === 0 && past.length === 0 && (
              <div style={{textAlign:"center",padding:40,color:"var(--t3)"}}>
                <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><Ico><Building2 size={36} strokeWidth={1.6} color="var(--t4)"/></Ico></div>
                <div style={{fontSize:15,fontWeight:500}}>No visits scheduled yet</div>
              </div>
            )}
            {upcoming.length > 0 && (
              <>
                <div style={{fontSize:13,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Upcoming</div>
                <div className="list" style={{marginBottom:20}}>
                  {upcoming.map(v => (
                    <div key={v.id} className="row" style={{cursor:"default",alignItems:"flex-start"}}>
                      <div className="row-icon" style={{background:"var(--ib5)",marginTop:2}}><Ico><Building2 size={18} strokeWidth={2} color="var(--t1)"/></Ico></div>
                      <div className="row-body" style={{flex:1}}>
                        <div className="row-title">{v.reason || "Hospital visit"}</div>
                        <div className="row-sub">{v.date} at {v.time} · {v.facility || v.doctor || ""}</div>
                        {v.notes && <div style={{fontSize:12,color:"var(--t3)",marginTop:3,display:"flex",alignItems:"center",gap:4}}><Ico><ClipboardList size={11} strokeWidth={2.2}/></Ico> {v.notes}</div>}
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button className="btn btn-sm" style={{background:"var(--hover)",border:"none",fontSize:11,padding:"5px 10px"}} onClick={()=>{
                          setF({date:v.date,time:v.time,doctor:v.doctor||"",facility:v.facility||"",reason:v.reason||"",notes:v.notes||"",reminder_minutes:String(v.reminder_minutes||"60")});
                          setEditingId(v.id);
                          setShowList(false);
                        }}>Edit</button>
                        <button className="btn btn-sm" style={{background:"var(--ib6)",color:"var(--red)",border:"none",fontSize:11,padding:"5px 10px"}} onClick={()=>setDelId(v.id)}>Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {past.length > 0 && (
              <>
                <div style={{fontSize:13,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Past</div>
                <div className="list">
                  {past.slice(0, 10).map(v => (
                    <div key={v.id} className="row" style={{cursor:"default",opacity:.6,alignItems:"flex-start"}}>
                      <div className="row-icon" style={{background:"var(--hover)",marginTop:2}}><Ico><ClipboardList size={18} strokeWidth={2} color="var(--t2)"/></Ico></div>
                      <div className="row-body">
                        <div className="row-title">{v.reason || "Hospital visit"}</div>
                        <div className="row-sub">{v.date} · {v.facility || v.doctor || ""}</div>
                      </div>
                      <button className="btn btn-sm" style={{background:"var(--ib6)",color:"var(--red)",border:"none",fontSize:11,padding:"5px 10px"}} onClick={()=>setDelId(v.id)}>Del</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {delId && (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:310,display:"grid",placeItems:"center"}} onClick={()=>setDelId(null)}>
              <div style={{background:"var(--card)",borderRadius:16,padding:24,width:"80%",maxWidth:300,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:17,fontWeight:600,marginBottom:8}}>Delete visit?</div>
                <div style={{fontSize:14,color:"var(--t3)",marginBottom:16}}>This cannot be undone.</div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn" style={{flex:1,background:"var(--red)",color:"white"}} onClick={()=>handleDelete(delId)}>Delete</button>
                  <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setDelId(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{maxHeight:"90vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px",overflowY:"auto",maxHeight:"calc(90vh - 40px)"}}>
          <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>{editingId ? "Edit visit" : "Schedule a visit"}</div>
          <div style={{fontSize:14,color:"var(--t3)",marginBottom:24}}>Track upcoming hospital or clinic appointments.</div>

          <div style={{display:"flex",gap:10,marginBottom:18}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Date</div>
              <input className="sheet-input" type="date" value={f.date} onChange={e => set("date", e.target.value)} style={{fontSize:16}}/>
            </div>
            <div style={{width:110}}>
              <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Time</div>
              <input className="sheet-input" type="time" value={f.time} onChange={e => set("time", e.target.value)} style={{fontSize:16}}/>
            </div>
          </div>

          <div style={{marginBottom:18}}>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Doctor / Specialist</div>
            <input className="sheet-input" type="text" placeholder="e.g. Dr. Mensah" value={f.doctor} onChange={e => set("doctor", e.target.value)} style={{fontSize:16}}/>
          </div>

          <div style={{marginBottom:18}}>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Hospital / Facility</div>
            <input className="sheet-input" type="text" placeholder="e.g. Korle Bu Teaching Hospital" value={f.facility} onChange={e => set("facility", e.target.value)} style={{fontSize:16}}/>
          </div>

          <div style={{marginBottom:18}}>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Reason for visit</div>
            <input className="sheet-input" type="text" placeholder="e.g. Routine checkup, blood work" value={f.reason} onChange={e => set("reason", e.target.value)} style={{fontSize:16}}/>
          </div>

          <div style={{marginBottom:18}}>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Remind me</div>
            <select className="sheet-input" value={f.reminder_minutes} onChange={e => set("reminder_minutes", e.target.value)} style={{fontSize:16}}>
              {reminderOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div style={{marginBottom:24}}>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Notes (optional)</div>
            <textarea className="sheet-input" rows={2} placeholder="e.g. Bring previous lab results" value={f.notes} onChange={e => set("notes", e.target.value)} style={{resize:"vertical",fontSize:16}}/>
          </div>

          <div className="sheet-actions" style={{gap:10}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={handleSave} disabled={busy || !f.date}>{busy ? "Saving..." : editingId ? "Save changes" : "Add visit"}</button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>

          <div style={{textAlign:"center",marginTop:20}}>
            <button className="btn btn-sm" style={{background:"none",border:"none",color:"var(--teal)",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:4,margin:"0 auto"}} onClick={() => setShowList(true)}>
              <Ico><ClipboardList size={14} strokeWidth={2.2}/></Ico> View all visits ({getVisits().length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
