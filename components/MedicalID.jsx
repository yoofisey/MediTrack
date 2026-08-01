"use client";

import { useState, useEffect } from "react";
import { Heart, Phone, AlertTriangle, Droplets, Info, Pill, X } from "lucide-react";

function Ico({ children, ...props }) {
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",lineHeight:1,flexShrink:0}} {...props}>{children}</span>;
}

const STORAGE_KEY = "mt_medical_id";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {}; } catch { return {}; }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export default function MedicalID({ meds = [], onClose }) {
  const [data, setData] = useState(load);
  const [editing, setEditing] = useState(!data.blood_type && !data.allergies?.length);
  const [customAllergy, setCustomAllergy] = useState("");

  function update(key, val) {
    const next = { ...data, [key]: val };
    setData(next);
    save(next);
  }

  function addAllergy(a) {
    const list = data.allergies || [];
    if (!list.includes(a)) update("allergies", [...list, a]);
  }

  function removeAllergy(a) {
    update("allergies", (data.allergies || []).filter(x => x !== a));
  }

  function addCondition(c) {
    const list = data.conditions || [];
    if (!list.includes(c)) update("conditions", [...list, c]);
  }

  function removeCondition(c) {
    update("conditions", (data.conditions || []).filter(x => x !== c));
  }

  function addMedication(id) {
    const list = data.medication_ids || [];
    if (!list.includes(id)) update("medication_ids", [...list, id]);
  }

  function removeMedication(id) {
    update("medication_ids", (data.medication_ids || []).filter(x => x !== id));
  }

  const selectedMeds = (data.medication_ids || []).map(id => meds.find(m => m.id === id)).filter(Boolean);

  const commonAllergies = ["Penicillin", "Sulfa", "Aspirin", "Ibuprofen", "Naproxen", "Codeine", "Morphine", "Tramadol", "Amoxicillin", "Erythromycin", "Tetracycline", "Latex", "Peanuts", "Tree nuts", "Soy", "Wheat", "Shellfish", "Fish", "Eggs", "Milk / Dairy", "Bee stings", "Dust mites", "Pollen", "Mold", "Iodine", "Contrast dye"];
  const commonConditions = ["Diabetes", "Hypertension", "Asthma", "Heart disease", "Epilepsy", "Thyroid disorder", "Anemia", "Sickle cell", "High cholesterol", "Kidney disease", "Liver disease", "Arthritis", "Migraine", "Allergic rhinitis", "COPD", "HIV/AIDS", "Tuberculosis", "Malaria"];

  return (
    <div className="sheet-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet" style={{maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px",overflowY:"auto",maxHeight:"calc(90vh - 40px)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{fontSize:20,fontWeight:700}}>Medical ID</div>
            <button className="btn btn-sm" style={{background:"var(--hover)",border:"none",fontSize:13}} onClick={()=>setEditing(!editing)}>{editing?"Done":"Edit"}</button>
          </div>

          <div style={{background:"linear-gradient(135deg,#FF3B30,#FF6B3A)",borderRadius:16,padding:18,color:"white",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <Ico><Heart size={20} strokeWidth={2.2} color="white"/></Ico>
              <span style={{fontSize:16,fontWeight:600}}>Emergency Info</span>
            </div>
            <div style={{fontSize:12,opacity:0.85,marginBottom:4,lineHeight:1.4}}>
              This information is stored on your device and can help first responders in an emergency.
            </div>
          </div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Blood Type</div>
            {editing ? (
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"].map(t => (
                  <button key={t} onClick={()=>update("blood_type",t===data.blood_type?"":t)}
                    style={{padding:"8px 16px",borderRadius:8,border:data.blood_type===t?"2px solid var(--teal)":"0.5px solid var(--sep)",background:data.blood_type===t?"var(--sel)":"var(--card)",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"var(--t1)"}}>{t}</button>
                ))}
              </div>
            ) : (
              <div style={{fontSize:24,fontWeight:700,color:"var(--t1)"}}>{data.blood_type || "—"}</div>
            )}
          </div>

          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <Ico><AlertTriangle size={14} strokeWidth={2.2} color="var(--orange)"/></Ico>
              <span style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5}}>Allergies</span>
            </div>
            {editing ? (
              <div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {commonAllergies.map(a => {
                    const has = (data.allergies||[]).includes(a);
                    return <button key={a} onClick={()=>has?removeAllergy(a):addAllergy(a)}
                      style={{padding:"6px 12px",borderRadius:8,border:has?"2px solid var(--orange)":"0.5px solid var(--sep)",background:has?"var(--ib3)":"var(--card)",fontSize:13,cursor:"pointer",fontFamily:"inherit",color:has?"var(--orange)":"var(--t1)"}}>
                      {has?<X size={12} style={{display:"inline",verticalAlign:"-2px",marginRight:2}}/>:""}{a}</button>;
                  })}
                </div>
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <input className="sheet-input" type="text" placeholder="Add a custom allergy…" value={customAllergy}
                    onChange={e=>setCustomAllergy(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&customAllergy.trim()){addAllergy(customAllergy.trim());setCustomAllergy("");}}}
                    style={{fontSize:14,flex:1}}/>
                  <button className="btn btn-sm" style={{background:"var(--orange)",color:"white",border:"none",fontSize:13}}
                    disabled={!customAllergy.trim()}
                    onClick={()=>{if(customAllergy.trim()){addAllergy(customAllergy.trim());setCustomAllergy("");}}}>+ Add</button>
                </div>
              </div>
            ) : (
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {(data.allergies||[]).length ? (data.allergies||[]).map(a => <span key={a} style={{padding:"4px 10px",borderRadius:99,background:"var(--ib3)",color:"var(--orange)",fontSize:13,fontWeight:500}}>{a}</span>)
                  : <span style={{color:"var(--t3)",fontSize:14}}>None recorded</span>}
              </div>
            )}
          </div>

          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <Ico><Info size={14} strokeWidth={2.2} color="var(--teal)"/></Ico>
              <span style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5}}>Medical Conditions</span>
            </div>
            {editing ? (
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {commonConditions.map(c => {
                  const has = (data.conditions||[]).includes(c);
                  return <button key={c} onClick={()=>has?removeCondition(c):addCondition(c)}
                    style={{padding:"6px 12px",borderRadius:8,border:has?"2px solid var(--teal)":"0.5px solid var(--sep)",background:has?"var(--ib2)":"var(--card)",fontSize:13,cursor:"pointer",fontFamily:"inherit",color:has?"var(--teal)":"var(--t1)"}}>
                    {has?<X size={12} style={{display:"inline",verticalAlign:"-2px",marginRight:2}}/>:""}{c}</button>;
                })}
              </div>
            ) : (
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {(data.conditions||[]).length ? (data.conditions||[]).map(c => <span key={c} style={{padding:"4px 10px",borderRadius:99,background:"var(--ib2)",color:"var(--teal2)",fontSize:13,fontWeight:500}}>{c}</span>)
                  : <span style={{color:"var(--t3)",fontSize:14}}>None recorded</span>}
              </div>
            )}
          </div>

          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <Ico><Pill size={14} strokeWidth={2.2} color="var(--teal)"/></Ico>
              <span style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5}}>Current Medications</span>
            </div>
            {editing ? (
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {(meds || []).filter(m => m.active !== false).length ? (meds || []).filter(m => m.active !== false).map(m => {
                  const has = (data.medication_ids||[]).includes(m.id);
                  return <button key={m.id} onClick={()=>has?removeMedication(m.id):addMedication(m.id)}
                    style={{padding:"6px 12px",borderRadius:8,border:has?"2px solid var(--teal)":"0.5px solid var(--sep)",background:has?"var(--ib2)":"var(--card)",fontSize:13,cursor:"pointer",fontFamily:"inherit",color:has?"var(--teal)":"var(--t1)"}}>
                    {has?<X size={12} style={{display:"inline",verticalAlign:"-2px",marginRight:2}}/>:""}{m.name}{m.dosage_amount?` · ${m.dosage_amount} ${m.dosage_unit}`:""}</button>;
                }) : <span style={{color:"var(--t3)",fontSize:14}}>No medications yet — add some in the Medications tab.</span>}
              </div>
            ) : (
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {selectedMeds.length ? selectedMeds.map(m => <span key={m.id} style={{padding:"4px 10px",borderRadius:99,background:"var(--ib2)",color:"var(--teal2)",fontSize:13,fontWeight:500}}>{m.name}{m.dosage_amount?` · ${m.dosage_amount} ${m.dosage_unit}`:""}</span>)
                  : <span style={{color:"var(--t3)",fontSize:14}}>None recorded</span>}
              </div>
            )}
          </div>

          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <Ico><Droplets size={14} strokeWidth={2.2} color="var(--teal)"/></Ico>
              <span style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5}}>Emergency Contacts</span>
            </div>
            {editing ? (
              <div>
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:11,color:"var(--t3)",marginBottom:4}}>Name</div>
                  <input className="sheet-input" type="text" placeholder="Contact name" value={data.emergency_name||""} onChange={e=>update("emergency_name",e.target.value)} style={{fontSize:14}}/>
                </div>
                <div>
                  <div style={{fontSize:11,color:"var(--t3)",marginBottom:4}}>Phone</div>
                  <input className="sheet-input" type="tel" placeholder="+233..." value={data.emergency_phone||""} onChange={e=>update("emergency_phone",e.target.value)} style={{fontSize:14}}/>
                </div>
              </div>
            ) : (
              <div>
                {data.emergency_name ? (
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"var(--bg)",borderRadius:12}}>
                    <Ico><Phone size={16} strokeWidth={2.2} color="var(--teal)"/></Ico>
                    <div><div style={{fontSize:14,fontWeight:500}}>{data.emergency_name}</div>{data.emergency_phone&&<div style={{fontSize:12,color:"var(--t3)"}}>{data.emergency_phone}</div>}</div>
                  </div>
                ) : <span style={{color:"var(--t3)",fontSize:14}}>No emergency contact set</span>}
              </div>
            )}
          </div>

          <button className="btn btn-ghost" style={{width:"100%"}} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
