"use client";

import { useState } from "react";
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

const SECTION_TITLES = {
  blood_type: "Blood Type",
  allergies: "Allergies",
  conditions: "Medical Conditions",
  medications: "Current Medications",
  contact: "Emergency Contact",
};

const DIAL_CODES = [
  { name:"Ghana", iso:"GH", flag:"🇬🇭", dial:"+233" },
  { name:"Nigeria", iso:"NG", flag:"🇳🇬", dial:"+234" },
  { name:"United States", iso:"US", flag:"🇺🇸", dial:"+1" },
  { name:"Canada", iso:"CA", flag:"🇨🇦", dial:"+1" },
  { name:"United Kingdom", iso:"GB", flag:"🇬🇧", dial:"+44" },
  { name:"Kenya", iso:"KE", flag:"🇰🇪", dial:"+254" },
  { name:"Tanzania", iso:"TZ", flag:"🇹🇿", dial:"+255" },
  { name:"Uganda", iso:"UG", flag:"🇺🇬", dial:"+256" },
  { name:"Rwanda", iso:"RW", flag:"🇷🇼", dial:"+250" },
  { name:"Burundi", iso:"BI", flag:"🇧🇮", dial:"+257" },
  { name:"Ethiopia", iso:"ET", flag:"🇪🇹", dial:"+251" },
  { name:"Somalia", iso:"SO", flag:"🇸🇴", dial:"+252" },
  { name:"South Sudan", iso:"SS", flag:"🇸🇸", dial:"+211" },
  { name:"Sudan", iso:"SD", flag:"🇸🇩", dial:"+249" },
  { name:"Egypt", iso:"EG", flag:"🇪🇬", dial:"+20" },
  { name:"Morocco", iso:"MA", flag:"🇲🇦", dial:"+212" },
  { name:"Algeria", iso:"DZ", flag:"🇩🇿", dial:"+213" },
  { name:"Tunisia", iso:"TN", flag:"🇹🇳", dial:"+216" },
  { name:"Libya", iso:"LY", flag:"🇱🇾", dial:"+218" },
  { name:"Senegal", iso:"SN", flag:"🇸🇳", dial:"+221" },
  { name:"Côte d'Ivoire", iso:"CI", flag:"🇨🇮", dial:"+225" },
  { name:"Mali", iso:"ML", flag:"🇲🇱", dial:"+223" },
  { name:"Burkina Faso", iso:"BF", flag:"🇧🇫", dial:"+226" },
  { name:"Niger", iso:"NE", flag:"🇳🇪", dial:"+227" },
  { name:"Togo", iso:"TG", flag:"🇹🇬", dial:"+228" },
  { name:"Benin", iso:"BJ", flag:"🇧🇯", dial:"+229" },
  { name:"Cameroon", iso:"CM", flag:"🇨🇲", dial:"+237" },
  { name:"DR Congo", iso:"CD", flag:"🇨🇩", dial:"+243" },
  { name:"Congo", iso:"CG", flag:"🇨🇬", dial:"+242" },
  { name:"Gabon", iso:"GA", flag:"🇬🇦", dial:"+241" },
  { name:"Angola", iso:"AO", flag:"🇦🇴", dial:"+244" },
  { name:"Zambia", iso:"ZM", flag:"🇿🇲", dial:"+260" },
  { name:"Malawi", iso:"MW", flag:"🇲🇼", dial:"+265" },
  { name:"Zimbabwe", iso:"ZW", flag:"🇿🇼", dial:"+263" },
  { name:"Mozambique", iso:"MZ", flag:"🇲🇿", dial:"+258" },
  { name:"Botswana", iso:"BW", flag:"🇧🇼", dial:"+267" },
  { name:"Namibia", iso:"NA", flag:"🇳🇦", dial:"+264" },
  { name:"South Africa", iso:"ZA", flag:"🇿🇦", dial:"+27" },
  { name:"Lesotho", iso:"LS", flag:"🇱🇸", dial:"+266" },
  { name:"Eswatini", iso:"SZ", flag:"🇸🇿", dial:"+268" },
  { name:"Mauritius", iso:"MU", flag:"🇲🇺", dial:"+230" },
  { name:"Madagascar", iso:"MG", flag:"🇲🇬", dial:"+261" },
  { name:"Seychelles", iso:"SC", flag:"🇸🇨", dial:"+248" },
  { name:"Cape Verde", iso:"CV", flag:"🇨🇻", dial:"+238" },
  { name:"Guinea", iso:"GN", flag:"🇬🇳", dial:"+224" },
  { name:"Sierra Leone", iso:"SL", flag:"🇸🇱", dial:"+232" },
  { name:"Liberia", iso:"LR", flag:"🇱🇷", dial:"+231" },
  { name:"Gambia", iso:"GM", flag:"🇬🇲", dial:"+220" },
  { name:"Chad", iso:"TD", flag:"🇹🇩", dial:"+235" },
  { name:"Central African Rep.", iso:"CF", flag:"🇨🇫", dial:"+236" },
  { name:"Eritrea", iso:"ER", flag:"🇪🇷", dial:"+291" },
  { name:"Djibouti", iso:"DJ", flag:"🇩🇯", dial:"+253" },
  { name:"Comoros", iso:"KM", flag:"🇰🇲", dial:"+269" },
  { name:"India", iso:"IN", flag:"🇮🇳", dial:"+91" },
  { name:"Pakistan", iso:"PK", flag:"🇵🇰", dial:"+92" },
  { name:"Bangladesh", iso:"BD", flag:"🇧🇩", dial:"+880" },
  { name:"Sri Lanka", iso:"LK", flag:"🇱🇰", dial:"+94" },
  { name:"Nepal", iso:"NP", flag:"🇳🇵", dial:"+977" },
  { name:"China", iso:"CN", flag:"🇨🇳", dial:"+86" },
  { name:"Japan", iso:"JP", flag:"🇯🇵", dial:"+81" },
  { name:"South Korea", iso:"KR", flag:"🇰🇷", dial:"+82" },
  { name:"Indonesia", iso:"ID", flag:"🇮🇩", dial:"+62" },
  { name:"Malaysia", iso:"MY", flag:"🇲🇾", dial:"+60" },
  { name:"Singapore", iso:"SG", flag:"🇸🇬", dial:"+65" },
  { name:"Philippines", iso:"PH", flag:"🇵🇭", dial:"+63" },
  { name:"Thailand", iso:"TH", flag:"🇹🇭", dial:"+66" },
  { name:"Vietnam", iso:"VN", flag:"🇻🇳", dial:"+84" },
  { name:"Myanmar", iso:"MM", flag:"🇲🇲", dial:"+95" },
  { name:"United Arab Emirates", iso:"AE", flag:"🇦🇪", dial:"+971" },
  { name:"Saudi Arabia", iso:"SA", flag:"🇸🇦", dial:"+966" },
  { name:"Qatar", iso:"QA", flag:"🇶🇦", dial:"+974" },
  { name:"Kuwait", iso:"KW", flag:"🇰🇼", dial:"+965" },
  { name:"Bahrain", iso:"BH", flag:"🇧🇭", dial:"+973" },
  { name:"Oman", iso:"OM", flag:"🇴🇲", dial:"+968" },
  { name:"Israel", iso:"IL", flag:"🇮🇱", dial:"+972" },
  { name:"Jordan", iso:"JO", flag:"🇯🇴", dial:"+962" },
  { name:"Lebanon", iso:"LB", flag:"🇱🇧", dial:"+961" },
  { name:"Turkey", iso:"TR", flag:"🇹🇷", dial:"+90" },
  { name:"Germany", iso:"DE", flag:"🇩🇪", dial:"+49" },
  { name:"France", iso:"FR", flag:"🇫🇷", dial:"+33" },
  { name:"Italy", iso:"IT", flag:"🇮🇹", dial:"+39" },
  { name:"Spain", iso:"ES", flag:"🇪🇸", dial:"+34" },
  { name:"Portugal", iso:"PT", flag:"🇵🇹", dial:"+351" },
  { name:"Netherlands", iso:"NL", flag:"🇳🇱", dial:"+31" },
  { name:"Belgium", iso:"BE", flag:"🇧🇪", dial:"+32" },
  { name:"Switzerland", iso:"CH", flag:"🇨🇭", dial:"+41" },
  { name:"Austria", iso:"AT", flag:"🇦🇹", dial:"+43" },
  { name:"Sweden", iso:"SE", flag:"🇸🇪", dial:"+46" },
  { name:"Norway", iso:"NO", flag:"🇳🇴", dial:"+47" },
  { name:"Denmark", iso:"DK", flag:"🇩🇰", dial:"+45" },
  { name:"Finland", iso:"FI", flag:"🇫🇮", dial:"+358" },
  { name:"Ireland", iso:"IE", flag:"🇮🇪", dial:"+353" },
  { name:"Poland", iso:"PL", flag:"🇵🇱", dial:"+48" },
  { name:"Czech Republic", iso:"CZ", flag:"🇨🇿", dial:"+420" },
  { name:"Ukraine", iso:"UA", flag:"🇺🇦", dial:"+380" },
  { name:"Romania", iso:"RO", flag:"🇷🇴", dial:"+40" },
  { name:"Greece", iso:"GR", flag:"🇬🇷", dial:"+30" },
  { name:"Australia", iso:"AU", flag:"🇦🇺", dial:"+61" },
  { name:"New Zealand", iso:"NZ", flag:"🇳🇿", dial:"+64" },
  { name:"Brazil", iso:"BR", flag:"🇧🇷", dial:"+55" },
  { name:"Mexico", iso:"MX", flag:"🇲🇽", dial:"+52" },
  { name:"Argentina", iso:"AR", flag:"🇦🇷", dial:"+54" },
  { name:"Chile", iso:"CL", flag:"🇨🇱", dial:"+56" },
  { name:"Colombia", iso:"CO", flag:"🇨🇴", dial:"+57" },
  { name:"Peru", iso:"PE", flag:"🇵🇪", dial:"+51" },
  { name:"Venezuela", iso:"VE", flag:"🇻🇪", dial:"+58" },
];

export default function MedicalID({ meds = [], onClose, section }) {
  const [data, setData] = useState(load);
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
  const emergencyCode = data.emergency_code || "+233";
  const showFull = !section;

  const commonAllergies = ["Penicillin", "Sulfa", "Aspirin", "Ibuprofen", "Naproxen", "Codeine", "Morphine", "Tramadol", "Amoxicillin", "Erythromycin", "Tetracycline", "Latex", "Peanuts", "Tree nuts", "Soy", "Wheat", "Shellfish", "Fish", "Eggs", "Milk / Dairy", "Bee stings", "Dust mites", "Pollen", "Mold", "Iodine", "Contrast dye"];
  const commonConditions = ["Diabetes", "Hypertension", "Asthma", "Heart disease", "Epilepsy", "Thyroid disorder", "Anemia", "Sickle cell", "High cholesterol", "Kidney disease", "Liver disease", "Arthritis", "Migraine", "Allergic rhinitis", "COPD", "HIV/AIDS", "Tuberculosis", "Malaria"];
  const relations = ["Parent / Guardian", "Spouse", "Partner", "Sibling", "Child", "Grandparent", "Friend", "Neighbor", "Colleague", "Caregiver", "Other"];

  function chipStyle(active, activeColor) {
    return {
      padding:"6px 12px",borderRadius:8,
      border:active?`2px solid ${activeColor}`:"0.5px solid var(--sep)",
      background:active?"var(--ib2)":"var(--card)",
      fontSize:13,cursor:"pointer",fontFamily:"inherit",
      color:active?activeColor:"var(--t1)",
    };
  }

  function NoneChip({ active, onClick }) {
    return (
      <button onClick={onClick} style={{
        padding:"6px 12px",borderRadius:8,
        border:active?"2px solid var(--t3)":"0.5px solid var(--sep)",
        background:active?"var(--hover)":"var(--card)",
        fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
        color:active?"var(--t1)":"var(--t3)",
      }}>None</button>
    );
  }

  const noneAllergy = (data.allergies || []).length === 0;
  const noneCondition = (data.conditions || []).length === 0;
  const noneMeds = (data.medication_ids || []).length === 0;

  return (
    <div className="sheet-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet" style={{maxHeight:"90dvh"}} onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px",overflowY:"auto",maxHeight:"calc(90dvh - 40px)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{fontSize:20,fontWeight:700}}>{showFull ? "Medical ID" : SECTION_TITLES[section] || "Medical ID"}</div>
            <button onClick={onClose} style={{background:"none",border:"none",color:"var(--t3)",cursor:"pointer",display:"grid",placeItems:"center",padding:6}}>
              <X size={20} strokeWidth={2.2}/>
            </button>
          </div>

          {showFull && (
            <div style={{background:"linear-gradient(135deg,var(--red),#FF6B3A)",borderRadius:16,padding:18,color:"white",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <Ico><Heart size={20} strokeWidth={2.2} color="white"/></Ico>
                <span style={{fontSize:16,fontWeight:600}}>Emergency Info</span>
              </div>
              <div style={{fontSize:12,opacity:0.85,marginBottom:4,lineHeight:1.4}}>
                This information is stored on your device and can help first responders in an emergency.
              </div>
            </div>
          )}

          {(showFull || section === "blood_type") && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Blood Type</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"].map(t => (
                  <button key={t} onClick={()=>update("blood_type",t===data.blood_type?"":t)}
                    style={chipStyle(data.blood_type===t,"var(--teal)")}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {(showFull || section === "allergies") && (
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <Ico><AlertTriangle size={14} strokeWidth={2.2} color="var(--orange)"/></Ico>
                <span style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5}}>Allergies</span>
              </div>
              <div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <NoneChip active={noneAllergy} onClick={()=>update("allergies",[])}/>
                  {commonAllergies.map(a => {
                    const has = (data.allergies||[]).includes(a);
                    return <button key={a} onClick={()=>has?removeAllergy(a):addAllergy(a)}
                      style={chipStyle(has,"var(--orange)")}>
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
                {showFull && (data.allergies||[]).length > 0 && (
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
                    {(data.allergies||[]).map(a => <span key={a} style={{padding:"4px 10px",borderRadius:99,background:"var(--ib3)",color:"var(--orange)",fontSize:13,fontWeight:500}}>{a}</span>)}
                  </div>
                )}
              </div>
            </div>
          )}

          {(showFull || section === "conditions") && (
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <Ico><Info size={14} strokeWidth={2.2} color="var(--teal)"/></Ico>
                <span style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5}}>Medical Conditions</span>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <NoneChip active={noneCondition} onClick={()=>update("conditions",[])}/>
                {commonConditions.map(c => {
                  const has = (data.conditions||[]).includes(c);
                  return <button key={c} onClick={()=>has?removeCondition(c):addCondition(c)}
                    style={chipStyle(has,"var(--teal)")}>
                    {has?<X size={12} style={{display:"inline",verticalAlign:"-2px",marginRight:2}}/>:""}{c}</button>;
                })}
              </div>
              {showFull && (data.conditions||[]).length > 0 && (
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
                  {(data.conditions||[]).map(c => <span key={c} style={{padding:"4px 10px",borderRadius:99,background:"var(--ib2)",color:"var(--teal2)",fontSize:13,fontWeight:500}}>{c}</span>)}
                </div>
              )}
            </div>
          )}

          {(showFull || section === "medications") && (
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <Ico><Pill size={14} strokeWidth={2.2} color="var(--teal)"/></Ico>
                <span style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5}}>Current Medications</span>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <NoneChip active={noneMeds} onClick={()=>update("medication_ids",[])}/>
                {(meds || []).filter(m => m.active !== false).length ? (meds || []).filter(m => m.active !== false).map(m => {
                  const has = (data.medication_ids||[]).includes(m.id);
                  return <button key={m.id} onClick={()=>has?removeMedication(m.id):addMedication(m.id)}
                    style={chipStyle(has,"var(--teal)")}>
                    {has?<X size={12} style={{display:"inline",verticalAlign:"-2px",marginRight:2}}/>:""}{m.name}{m.dosage_amount?` · ${m.dosage_amount} ${m.dosage_unit}`:""}</button>;
                }) : <span style={{color:"var(--t3)",fontSize:14}}>No medications yet — add some in the Medications tab.</span>}
              </div>
              {showFull && selectedMeds.length > 0 && (
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
                  {selectedMeds.map(m => <span key={m.id} style={{padding:"4px 10px",borderRadius:99,background:"var(--ib2)",color:"var(--teal2)",fontSize:13,fontWeight:500}}>{m.name}{m.dosage_amount?` · ${m.dosage_amount} ${m.dosage_unit}`:""}</span>)}
                </div>
              )}
            </div>
          )}

          {(showFull || section === "contact") && (
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <Ico><Droplets size={14} strokeWidth={2.2} color="var(--teal)"/></Ico>
                <span style={{fontSize:12,fontWeight:600,color:"var(--t3)",textTransform:"uppercase",letterSpacing:0.5}}>Emergency Contacts</span>
              </div>
              <div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11,color:"var(--t3)",marginBottom:6}}>Relation</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {relations.map(r => {
                      const has = data.emergency_relation === r;
                      return <button key={r} onClick={()=>update("emergency_relation", has ? "" : r)}
                        style={chipStyle(has,"var(--teal)")}>{r}</button>;
                    })}
                  </div>
                </div>
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:11,color:"var(--t3)",marginBottom:4}}>Name</div>
                  <input className="sheet-input" type="text" placeholder="Contact name" value={data.emergency_name||""} onChange={e=>update("emergency_name",e.target.value)} style={{fontSize:14}}/>
                </div>
                <div>
                  <div style={{fontSize:11,color:"var(--t3)",marginBottom:4}}>Phone</div>
                  <div style={{display:"flex",gap:8,alignItems:"stretch"}}>
                    <div style={{position:"relative",flexShrink:0,minWidth:0}}>
                      <select
                        value={emergencyCode}
                        onChange={e=>update("emergency_code",e.target.value)}
                        style={{height:"100%",border:"1.5px solid var(--sep)",borderRadius:12,background:"var(--input)",color:"var(--t1)",fontSize:14,fontWeight:600,fontFamily:"inherit",cursor:"pointer",padding:"12px 26px 12px 12px",outline:"none",appearance:"none",WebkitAppearance:"none",maxWidth:150}}>
                        {DIAL_CODES.map(c => <option key={c.iso} value={c.dial}>{c.flag} {c.dial}</option>)}
                      </select>
                      <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:10,color:"var(--t4)",pointerEvents:"none"}}>▼</span>
                    </div>
                    <input className="sheet-input" type="tel" inputMode="tel" placeholder="Phone number" value={data.emergency_phone||""} onChange={e=>update("emergency_phone",e.target.value.replace(/[^0-9]/g,""))} style={{fontSize:14,flex:1}}/>
                  </div>
                </div>
                {data.emergency_name || data.emergency_phone ? (
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"var(--bg)",borderRadius:12,marginTop:10}}>
                    <Ico><Phone size={16} strokeWidth={2.2} color="var(--teal)"/></Ico>
                    <div>
                      {data.emergency_name && <div style={{fontSize:14,fontWeight:500}}>{data.emergency_name}{data.emergency_relation ? <span style={{fontSize:12,fontWeight:400,color:"var(--t3)"}}> · {data.emergency_relation}</span> : null}</div>}
                      {data.emergency_phone && <div style={{fontSize:12,color:"var(--t3)"}}>{emergencyCode} {data.emergency_phone}</div>}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <button className="btn btn-ghost" style={{width:"100%"}} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
