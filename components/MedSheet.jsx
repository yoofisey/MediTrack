"use client";

import { useState, useMemo } from "react";
import { sb } from "@/lib/supabase";
import { canAddMed } from "@/lib/data";
import { checkInteractions, InteractionBadge } from "@/components/InteractionChecker";

export default function MedSheet({ med, userId, reminderLead, plan, medCount, onSave, onClose, allMeds }) {
  const isPro = plan === "pro" || plan === "family";
  const blank = { name:"", dosage_amount:"", dosage_unit:"tablet(s)", times_per_day:"1", dose_interval_hours:"8", course_duration_days:"", start_date:new Date().toISOString().split("T")[0], reminder_minutes:String(reminderLead||30), pills_per_package:"", refill_reminder_at:"", cost_per_package:"", cost_currency:"", notes:"" };
  const [f, setF] = useState(med ? { name:med.name, dosage_amount:String(med.dosage_amount), dosage_unit:med.dosage_unit, times_per_day:String(med.times_per_day||1), dose_interval_hours:String(med.dose_interval_hours), course_duration_days:String(med.course_duration_days), start_date:med.start_date, reminder_minutes:String(med.reminder_minutes||30), pills_per_package:String(med.pills_per_package||""), refill_reminder_at:String(med.refill_reminder_at||""), cost_per_package:String(med.cost_per_package||""), cost_currency:med.cost_currency||"", notes:med.notes||"" } : blank);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const existingMeds = allMeds || [];
  const currentInteractions = useMemo(() => {
    if (!f.name.trim() || !existingMeds.length) return [];
    return checkInteractions(f.name, existingMeds);
  }, [f.name, existingMeds]);

  function set(k, v) {
    setF(p => {
      const n = { ...p, [k]: v };
      if (k==="times_per_day" && Number(v)>0) n.dose_interval_hours = (24/Number(v)).toFixed(1);
      if (k==="dose_interval_hours" && Number(v)>0) n.times_per_day = String(Math.round(24/Number(v)));
      return n;
    });
  }

  async function save() {
    if (!med && !canAddMed(plan || "free", medCount || 0)) {
      setErr("Free plan allows up to 2 medications. Upgrade to Pro for unlimited medications.");
      return;
    }
    if (!f.name.trim()||!f.dosage_amount||!f.course_duration_days) { setErr("Please fill in name, dosage, and duration."); return; }
    if (!Number.isFinite(parseFloat(f.dosage_amount)) || parseFloat(f.dosage_amount) <= 0) { setErr("Dosage amount must be greater than 0."); return; }
    if (parseInt(f.course_duration_days) < 1) { setErr("Duration must be at least 1 day."); return; }
    if (parseInt(f.times_per_day) < 1) { setErr("Times per day must be at least 1."); return; }
    if (!f.start_date) { setErr("Please select a start date."); return; }
    const maxName = 200;
    if (f.name.trim().length > maxName) { setErr(`Medication name must be under ${maxName} characters.`); return; }
    const maxDosage = 999999;
    if (parseFloat(f.dosage_amount) > maxDosage) { setErr(`Dosage amount seems too high (max ${maxDosage}).`); return; }
    const maxDuration = 3650;
    if (parseInt(f.course_duration_days) > maxDuration) { setErr(`Duration seems too long (max ${maxDuration} days).`); return; }
    setBusy(true); setErr("");
    const payload = { user_id:userId, name:f.name.trim(), dosage_amount:parseFloat(f.dosage_amount), dosage_unit:f.dosage_unit, times_per_day:parseInt(f.times_per_day)||1, dose_interval_hours:parseFloat(f.dose_interval_hours), course_duration_days:parseInt(f.course_duration_days), start_date:f.start_date, reminder_minutes:parseInt(f.reminder_minutes), pills_per_package:f.pills_per_package?parseInt(f.pills_per_package):null, refill_reminder_at:f.refill_reminder_at?parseInt(f.refill_reminder_at):null, cost_per_package:f.cost_per_package?parseFloat(f.cost_per_package):null, cost_currency:f.cost_currency||null, notes:f.notes, active:true };
    try {
      const result = med?.id ? await sb.from("medications").eq("id",med.id).update(payload) : await sb.from("medications").insert([payload]);
      if (result.error) {
        const msg = result.error?.message || result.error?.error_description || JSON.stringify(result.error);
        setErr(msg); setBusy(false); return;
      }
      onSave();
    } catch (e) {
      const msg = e?.message || "Could not save. Check your connection and try again.";
      setErr(msg); setBusy(false);
    }
  }

  const units = ["tablet(s)","capsule(s)","ml","mg","mcg","IU","drop(s)","puff(s)","patch(es)","injection(s)"];

  return (
    <div className="sheet-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div className="sheet-title">{med?"Edit Medication":"New Medication"}</div>
        {err && <div style={{margin:"0 16px 8px"}} className="err-msg">{err}</div>}

        <div className="sheet-section">
          <div className="sheet-label">Medication name</div>
          <input className="sheet-input" placeholder="e.g. Amoxicillin 500mg" value={f.name} onChange={e=>set("name",e.target.value)}/>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">Dosage</div>
          <div className="sheet-row">
            <input className="sheet-input" type="number" inputMode="decimal" enterKeyHint="next" min="0.1" step="0.1" placeholder="Amount (e.g. 2)" value={f.dosage_amount} onChange={e=>set("dosage_amount",e.target.value)}/>
            <select className="sheet-input" value={f.dosage_unit} onChange={e=>set("dosage_unit",e.target.value)}>
              {units.map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">Schedule</div>
          <div className="sheet-row" style={{marginBottom:10}}>
            <div>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:5}}>Times per day</div>
              <input className="sheet-input" type="number" inputMode="numeric" enterKeyHint="next" min="1" max="24" step="1" placeholder="e.g. 3" value={f.times_per_day} onChange={e=>set("times_per_day",e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:5}}>Hours between doses</div>
              <input className="sheet-input" type="number" inputMode="decimal" enterKeyHint="next" min="0.5" step="0.5" value={f.dose_interval_hours} onChange={e=>set("dose_interval_hours",e.target.value)}/>
            </div>
          </div>
          <div className="sheet-row">
            <div>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:5}}>Duration (days)</div>
              <input className="sheet-input" type="number" inputMode="numeric" enterKeyHint="done" min="1" step="1" placeholder="e.g. 7" value={f.course_duration_days} onChange={e=>set("course_duration_days",e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:5}}>Start date</div>
              <input className="sheet-input" type="date" value={f.start_date} onChange={e=>set("start_date",e.target.value)}/>
            </div>
          </div>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">Remind me</div>
          <select className="sheet-input" value={f.reminder_minutes} onChange={e=>set("reminder_minutes",e.target.value)}>
            <option value="0">At dose time</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="120">2 hours before</option>
          </select>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">Stock & refill tracking</div>
          <div className="sheet-row">
            <div>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:5}}>Pills/doses per package</div>
              <input className="sheet-input" type="number" inputMode="numeric" min="1" step="1" placeholder="e.g. 30" value={f.pills_per_package} onChange={e=>set("pills_per_package",e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:5}}>Alert when ≤</div>
              <input className="sheet-input" type="number" inputMode="numeric" min="1" step="1" placeholder="e.g. 5" value={f.refill_reminder_at} onChange={e=>set("refill_reminder_at",e.target.value)}/>
            </div>
          </div>
          <div style={{fontSize:12,color:"var(--t3)",marginTop:6}}>Set your package size and Adhera will alert you when stock is running low.</div>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">Cost tracking</div>
          <div className="sheet-row">
            <div>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:5}}>Cost per package</div>
              <input className="sheet-input" type="number" inputMode="decimal" min="0" step="0.01" placeholder="e.g. 50" value={f.cost_per_package} onChange={e=>set("cost_per_package",e.target.value)}/>
            </div>
            <div>
              <div style={{fontSize:12,color:"var(--t3)",marginBottom:5}}>Currency</div>
              <select className="sheet-input" value={f.cost_currency} onChange={e=>set("cost_currency",e.target.value)}>
                <option value="">Select</option>
                <option value="GHS">₵ GHS</option>
                <option value="NGN">₦ NGN</option>
                <option value="KES">KSh KES</option>
                <option value="ZAR">R ZAR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
                <option value="INR">₹ INR</option>
              </select>
            </div>
          </div>
          <div style={{fontSize:12,color:"var(--t3)",marginTop:6}}>Track how much you spend on medications. Cost per dose calculated automatically.</div>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">Notes (optional)</div>
          <textarea className="sheet-input" rows={2} placeholder="e.g. Take with food" value={f.notes} onChange={e=>set("notes",e.target.value)} style={{resize:"vertical"}}/>
        </div>

        <div className="sheet-actions">
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy?"Saving…":med?"Save changes":"Add medication"}</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
