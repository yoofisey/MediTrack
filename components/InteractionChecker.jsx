"use client";

import { useState, useEffect } from "react";
import { CircleAlert, TriangleAlert, CheckCircle2 } from "lucide-react";

const INTERACTIONS_DB = [
  { a: "warfarin", b: "aspirin", severity: "major", msg: "Increased bleeding risk. Monitor closely or use alternative." },
  { a: "warfarin", b: "ibuprofen", severity: "major", msg: "NSAIDs increase bleeding risk with anticoagulants." },
  { a: "warfarin", b: "naproxen", severity: "major", msg: "NSAIDs increase bleeding risk with anticoagulants." },
  { a: "metformin", b: "alcohol", severity: "moderate", msg: "Alcohol increases risk of lactic acidosis with metformin." },
  { a: "lisinopril", b: "potassium", severity: "major", msg: "ACE inhibitors + potassium supplements can cause hyperkalemia." },
  { a: "lisinopril", b: "ibuprofen", severity: "moderate", msg: "NSAIDs may reduce the blood pressure-lowering effect of ACE inhibitors." },
  { a: "amlodipine", b: "simvastatin", severity: "moderate", msg: "High-dose simvastatin with amlodipine increases risk of muscle damage." },
  { a: "metoprolol", b: "verapamil", severity: "major", msg: "Combined use can cause severe bradycardia and heart block." },
  { a: "levothyroxine", b: "calcium", severity: "moderate", msg: "Calcium supplements can reduce levothyroxine absorption. Space 4 hours apart." },
  { a: "levothyroxine", b: "iron", severity: "moderate", msg: "Iron supplements can reduce levothyroxine absorption. Space 4 hours apart." },
  { a: "sertraline", b: "tramadol", severity: "major", msg: "Combined use increases risk of serotonin syndrome." },
  { a: "fluoxetine", b: "tramadol", severity: "major", msg: "Combined use increases risk of serotonin syndrome." },
  { a: "citalopram", b: "tramadol", severity: "major", msg: "Combined use increases risk of serotonin syndrome." },
  { a: "lithium", b: "ibuprofen", severity: "major", msg: "NSAIDs increase lithium levels, risking toxicity." },
  { a: "lithium", b: "naproxen", severity: "major", msg: "NSAIDs increase lithium levels, risking toxicity." },
  { a: "digoxin", b: "amiodarone", severity: "major", msg: "Amiodarone increases digoxin levels significantly. Reduce digoxin dose." },
  { a: "methotrexate", b: "ibuprofen", severity: "major", msg: "NSAIDs reduce methotrexate clearance, increasing toxicity risk." },
  { a: "clopidogrel", b: "omeprazole", severity: "moderate", msg: "Omeprazole may reduce effectiveness of clopidogrel. Consider pantoprazole." },
  { a: "spironolactone", b: "potassium", severity: "major", msg: "Combined use can cause life-threatening hyperkalemia." },
  { a: "doxycycline", b: "calcium", severity: "moderate", msg: "Calcium reduces doxycycline absorption. Space 2 hours apart." },
  { a: "ciprofloxacin", b: "calcium", severity: "moderate", msg: "Calcium reduces ciprofloxacin absorption. Space 2 hours apart." },
  { a: "ciprofloxacin", b: "iron", severity: "moderate", msg: "Iron reduces ciprofloxacin absorption. Space 2 hours apart." },
  { a: "simvastatin", b: "clarithromycin", severity: "major", msg: "Clarithromycin increases statin levels, risk of rhabdomyolysis." },
  { a: "simvastatin", b: "erythromycin", severity: "major", msg: "Erythromycin increases statin levels, risk of rhabdomyolysis." },
  { a: "losartan", b: "potassium", severity: "major", msg: "ARBs + potassium supplements can cause hyperkalemia." },
  { a: "enalapril", b: "potassium", severity: "major", msg: "ACE inhibitors + potassium supplements can cause hyperkalemia." },
  { a: "prednisone", b: "ibuprofen", severity: "moderate", msg: "Combined use increases risk of gastrointestinal bleeding." },
  { a: "gabapentin", b: "morphine", severity: "moderate", msg: "Combined use can cause excessive sedation and respiratory depression." },
  { a: "hydrochlorothiazide", b: "lithium", severity: "moderate", msg: "Thiazides reduce lithium clearance, increasing toxicity risk." },
  { a: "metformin", b: "contrast dye", severity: "major", msg: "Hold metformin before and after IV contrast to prevent kidney damage." },
  { a: "aspirin", b: "ibuprofen", severity: "moderate", msg: "Ibuprofen may reduce the cardioprotective effect of low-dose aspirin." },
  { a: "paracetamol", b: "warfarin", severity: "moderate", msg: "High-dose paracetamol may increase INR with warfarin. Monitor." },
  { a: "acetaminophen", b: "warfarin", severity: "moderate", msg: "High-dose acetaminophen may increase INR with warfarin. Monitor." },
  { a: "atorvastatin", b: "clarithromycin", severity: "major", msg: "Clarithromycin increases statin levels, risk of rhabdomyolysis." },
  { a: "rosuvastatin", b: "clarithromycin", severity: "major", msg: "Clarithromycin increases statin levels, risk of rhabdomyolysis." },
  { a: "amoxicillin", b: "methotrexate", severity: "moderate", msg: "Some antibiotics may increase methotrexate toxicity." },
  { a: "trimethoprim", b: "warfarin", severity: "moderate", msg: "Trimethoprim may enhance anticoagulant effect of warfarin." },
  { a: "diltiazem", b: "simvastatin", severity: "major", msg: "Diltiazem increases simvastatin levels. Limit simvastatin to 10mg." },
  { a: "cyclosporine", b: "ibuprofen", severity: "major", msg: "NSAIDs increase nephrotoxicity risk with cyclosporine." },
  { a: "phenytoin", b: "warfarin", severity: "moderate", msg: "Phenytoin may alter warfarin metabolism. Monitor INR closely." },
  { a: "carbamazepine", b: "erythromycin", severity: "moderate", msg: "Erythromycin may increase carbamazepine levels." },
  { a: "metformin", b: "furosemide", severity: "moderate", msg: "Furosemide may increase metformin levels." },
  { a: "amlodipine", b: "cyclosporine", severity: "moderate", msg: "Amlodipine may increase cyclosporine levels." },
  { a: "tamsulosin", b: "verapamil", severity: "moderate", msg: "Verapamil may increase tamsulosin levels. Monitor for side effects." },
  { a: "sildenafil", b: "nitroglycerin", severity: "major", msg: "Combined use can cause severe, potentially fatal hypotension." },
  { a: "tadalafil", b: "nitroglycerin", severity: "major", msg: "Combined use can cause severe, potentially fatal hypotension." },
  { a: "vardenafil", b: "nitroglycerin", severity: "major", msg: "Combined use can cause severe, potentially fatal hypotension." },
];

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export function checkInteractions(medName, allMeds) {
  const results = [];
  const norm = normalize(medName);
  for (const med of allMeds) {
    const otherNorm = normalize(med.name);
    if (norm === otherNorm) continue;
    for (const rule of INTERACTIONS_DB) {
      const ruleA = normalize(rule.a);
      const ruleB = normalize(rule.b);
      if ((norm.includes(ruleA) && otherNorm.includes(ruleB)) || (norm.includes(ruleB) && otherNorm.includes(ruleA))) {
        results.push({ ...rule, with: med.name });
      }
    }
  }
  return results;
}

export function InteractionBadge({ interactions }) {
  if (!interactions || !interactions.length) return null;
  const hasMajor = interactions.some(i => i.severity === "major");
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:8}}>
      {interactions.map((inter, i) => (
        <div key={i} style={{
          padding:"10px 12px",
          borderRadius:10,
          background: hasMajor && inter.severity === "major" ? "rgba(220,38,38,0.08)" : "rgba(217,119,6,0.08)",
          border: `1px solid ${hasMajor && inter.severity === "major" ? "rgba(220,38,38,0.2)" : "rgba(217,119,6,0.2)"}`,
          fontSize:13,
          lineHeight:1.5,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <span style={{fontSize:14,display:"inline-flex"}}>{inter.severity === "major" ? <CircleAlert size={14} color="#dc2626"/> : <TriangleAlert size={14} color="#d97706"/>}</span>
            <span style={{fontWeight:600,color:inter.severity === "major" ? "#dc2626" : "#d97706",fontSize:12,textTransform:"uppercase",letterSpacing:0.5}}>
              {inter.severity} interaction
            </span>
          </div>
          <div style={{color:"var(--t2)"}}>
            <strong>{inter.a}</strong> × <strong>{inter.with}</strong> — {inter.msg}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InteractionChecker({ meds, currentName, onClose }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (currentName) {
      setResults(checkInteractions(currentName, meds));
    } else {
      const allResults = [];
      meds.forEach(med => {
        const found = checkInteractions(med.name, meds);
        found.forEach(r => {
          if (!allResults.find(e => e.a === r.a && e.b === r.b)) allResults.push(r);
        });
      });
      setResults(allResults);
    }
  }, [meds, currentName]);

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{maxHeight:"85dvh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px",overflowY:"auto",maxHeight:"calc(85dvh - 40px)"}}>
          <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Drug Interactions</div>
          <div style={{fontSize:14,color:"var(--t3)",marginBottom:16}}>
            {currentName ? `Checking "${currentName}" against your medications` : "Checking all your medications against each other"}
          </div>

          {results.length === 0 ? (
            <div className="empty-state" style={{marginBottom:16}}>
              <div className="empty-state-icon"><CheckCircle2 size={52} strokeWidth={1.5} color="var(--teal)"/></div>
              <div className="empty-state-title">No interactions found</div>
              <div className="empty-state-sub">{currentName ? "This medication appears safe with your current prescriptions" : "No known interactions between your medications"}</div>
            </div>
          ) : (
            <>
              <div style={{marginBottom:12,padding:"10px 14px",borderRadius:10,background:"rgba(217,119,6,0.08)",border:"1px solid rgba(217,119,6,0.2)",fontSize:13,color:"var(--t2)"}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:6}}><TriangleAlert size={14} color="#d97706"/> Found <strong>{results.length}</strong> potential interaction{results.length !== 1 ? "s" : ""}. Always consult your pharmacist or doctor before making changes.</span>
              </div>
              <InteractionBadge interactions={results}/>
            </>
          )}

          <div style={{fontSize:11,color:"var(--t3)",padding:"8px 0",borderTop:"1px solid var(--sep)",marginTop:8,lineHeight:1.5}}>
            This checker covers common interactions only and is not exhaustive. Always consult a healthcare professional for medical advice.
          </div>

          <button className="btn btn-ghost" style={{marginTop:8,width:"100%"}} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
