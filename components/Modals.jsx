"use client";

import { useState, useEffect } from "react";
import { CSS } from "@/lib/constants";
import { COUNTRIES, getPricing } from "@/lib/data";
import { getTierConfig } from "@/lib/tiers";
import { getPaymentsConfig } from "@/lib/payments";
import { Crown, Users, Sparkles, Trash2, Pill, Globe, Check } from "lucide-react";

function Ico({ children, ...props }) {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }} {...props}>{children}</span>;
}

export function PrivacyModal({ onClose }) {
  return (
    <div className="sheet-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet" style={{maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px",overflowY:"auto",maxHeight:"calc(90vh - 40px)"}}>
          <div style={{fontSize:20,fontWeight:700,marginBottom:16}}>Privacy Policy</div>
          <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.7,display:"flex",flexDirection:"column",gap:14}}>
            <p><strong>Effective date:</strong> July 1, 2026</p>
            <p>Adhera (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) respects your privacy. This policy explains how we collect, use, and safeguard your personal information when you use our medication tracking application.</p>
            <p><strong>1. Information We Collect</strong></p>
            <p>We collect information you provide directly: name, email address, medication names, dosages, schedules, dose logs, health conditions, and health goals. We also collect usage data such as app interactions and notification preferences.</p>
            <p><strong>2. Health Data</strong></p>
            <p>Adhera processes health-related data including medication schedules, dose history, and adherence patterns. This data is classified as &quot;special category data&quot; under GDPR and is treated with the highest level of protection. We process this data solely to deliver the Adhera service to you.</p>
            <p><strong>3. How We Use Your Information</strong></p>
            <p>Your data is used solely to deliver the Adhera service: tracking medications, sending reminders, generating adherence reports, and improving the app experience. We never sell your personal data.</p>
            <p><strong>4. Data Storage & Security</strong></p>
            <p>Your data is stored securely on Supabase servers with encryption at rest (AES-256) and in transit (TLS). We implement industry-standard security measures including HTTPS, encrypted database connections, and strict access controls.</p>
            <p><strong>5. Data Retention</strong></p>
            <p>We retain your data for as long as your account is active. You may request deletion of your data at any time by deleting your account within the app&apos;s Privacy & Data settings.</p>
            <p><strong>6. Your Rights</strong></p>
            <p>You have the right to: access your data, export your data (JSON or CSV), correct your data, delete your account and all associated data. You can exercise these rights directly through the app&apos;s Profile → Privacy & Data settings.</p>
            <p><strong>7. Third-Party Services</strong></p>
            <p>We use Supabase for authentication and database hosting. We use Paystack for payment processing. Push notifications may use your browser&apos;s notification API. No other third parties have access to your personal medication data.</p>
            <p><strong>8. Changes to This Policy</strong></p>
            <p>We may update this policy from time to time. Significant changes will be notified via email or in-app notice.</p>
            <p><strong>9. Contact</strong></p>
            <p>For privacy-related inquiries, contact us at privacy@adhera.app.</p>
          </div>
          <button className="btn btn-primary" style={{marginTop:20}} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export function TermsModal({ onClose }) {
  return (
    <div className="sheet-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet" style={{maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px",overflowY:"auto",maxHeight:"calc(90vh - 40px)"}}>
          <div style={{fontSize:20,fontWeight:700,marginBottom:16}}>Terms of Service</div>
          <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.7,display:"flex",flexDirection:"column",gap:14}}>
            <p><strong>Effective date:</strong> July 1, 2026</p>
            <p>By using Adhera (&quot;the App&quot;), you agree to the following terms and conditions.</p>
            <p><strong>1. Service Description</strong></p>
            <p>Adhera provides medication tracking, dose reminders, adherence analytics, and related health management tools. The App is a informational tool only and does not provide medical advice.</p>
            <p><strong>2. User Responsibilities</strong></p>
            <p>You are responsible for the accuracy of the medication information you enter. Always consult your healthcare provider before making changes to your medication regimen. Never rely solely on app reminders for critical health decisions.</p>
            <p><strong>3. Medical Disclaimer</strong></p>
            <p>Adhera is not a medical device and does not diagnose, treat, cure, or prevent any disease. The App does not replace professional medical advice, diagnosis, or treatment. If you have a medical emergency, call your doctor or emergency services immediately.</p>
            <p><strong>4. Account & Data</strong></p>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You own your data; we grant you no license to use the App&apos;s design or branding.</p>
            <p><strong>5. Acceptable Use</strong></p>
            <p>You agree not to misuse the App, including attempting unauthorized access, distributing malware, or using the service for any illegal purpose.</p>
            <p><strong>6. Limitation of Liability</strong></p>
            <p>Adhera and its developers shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App, including but not limited to missed doses, incorrect medication information, or health outcomes.</p>
            <p><strong>7. Subscription & Payments</strong></p>
            <p>Premium features require a paid subscription. Prices are displayed in local currency and may change with notice. Cancellation takes effect at the end of the current billing period. Refunds are handled per our refund policy.</p>
            <p><strong>8. Termination</strong></p>
            <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behavior. You may delete your account at any time.</p>
            <p><strong>9. Governing Law</strong></p>
            <p>These terms are governed by the laws of Ghana. Any disputes shall be resolved through binding arbitration.</p>
            <p><strong>10. Contact</strong></p>
            <p>For questions about these terms, contact us at legal@adhera.app.</p>
          </div>
          <button className="btn btn-primary" style={{marginTop:20}} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export function UpgradeModal({ country, userEmail, currentPlan, onClose, onUpgrade }) {
  const [selected, setSelected] = useState(currentPlan === "pro" || currentPlan === "family" ? currentPlan : "pro");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [paystackOpen, setPaystackOpen] = useState(false);

  function closePaystack() {
    document.querySelectorAll('[class*="paystack"]').forEach(el => el.remove());
    document.querySelectorAll('iframe[src*="paystack"]').forEach(el => el.remove());
    document.querySelectorAll('.paystack-iframe-modal, .paystack-overlay, .paystack-backdrop').forEach(el => el.remove());
    setPaystackOpen(false);
    setBusy(false);
  }

  useEffect(() => {
    if (!paystackOpen) return;
    function onKey(e) { if (e.key === "Escape") closePaystack(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paystackOpen]);
  const { pricing } = getPricing(country || "GH");
  const selCountry = COUNTRIES.find(c => c.code === (country || "GH")) || COUNTRIES[0];
  const pay = getPaymentsConfig(country || "GH");

  const plans = [
    {
      id: "pro",
      name: getTierConfig("pro").label,
      icon: <Crown size={22} strokeWidth={2.2} color={getTierConfig("pro").theme.accent}/>,
      color: getTierConfig("pro").theme.accent,
      price: pricing.pro.label,
      period: "/month",
      tagline: "Everything you need for full adherence",
      features: [
        "Unlimited medications",
        "Full history & analytics",
        "Caregiver sharing",
        "Refill reminders",
        "Drug interaction checker",
        "PDF adherence reports",
        "Priority support",
      ],
    },
    {
      id: "family",
      name: getTierConfig("family").label,
      icon: <Users size={22} strokeWidth={2.2} color={getTierConfig("family").theme.accent}/>,
      color: getTierConfig("family").theme.accent,
      price: pricing.family.label,
      period: "/month",
      tagline: "One account for the whole household",
      features: [
        "Everything in Pro",
        "Up to 5 family profiles",
        "Shared family dashboard",
        "Per-member medication tracking",
        "Doctor-friendly PDF summaries",
        "Caregiver mode with alerts",
      ],
    },
  ];

  const plan = plans.find(p => p.id === selected);

  async function handlePayment() {
    setBusy(true);
    setErr("");

    if (!pay.ready) {
      setErr(pay.reason);
      setBusy(false);
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        if (typeof window.PaystackPop === "undefined") {
          const s = document.createElement("script");
          s.src = "https://js.paystack.co/v1/inline.js";
          s.onload = () => { setTimeout(resolve, 300); };
          s.onerror = () => reject(new Error("Failed to load Paystack. Check your internet connection."));
          document.head.appendChild(s);
        } else {
          resolve();
        }
      });

      if (typeof window.PaystackPop?.setup !== "function") throw new Error("Paystack SDK not ready. Please try again.");

      const planCode = pay.plans[selected];
      const handler = window.PaystackPop.setup({
        key: pay.key,
        email: userEmail || "patient@example.com",
        plan: planCode,
        ref: "ADR" + Date.now() + Math.random().toString(36).slice(2,8).toUpperCase(),
        metadata: { plan: selected, country },
        callback: function(response) {
          onUpgrade(selected);
          setBusy(false);
        },
        onClose: function() {
          setBusy(false);
        },
      });
      sessionStorage.setItem("adhera_pending_plan", selected);
      if (handler?.openPopup) {
        handler.openPopup();
        setPaystackOpen(true);
      } else if (handler?.openIframe) {
        handler.openIframe();
        setPaystackOpen(true);
      } else {
        throw new Error("Paystack failed to initialize.");
      }
    } catch (e) {
      setErr(e.message || "Payment failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      {paystackOpen && (
        <div style={{
          position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:99999,
          pointerEvents:"none",
        }}>
          <button onClick={closePaystack}
            style={{
              position:"absolute", top:14, left:14, width:44, height:44,
              borderRadius:22, border:"none", cursor:"pointer",
              background:"rgba(0,0,0,.06)", backdropFilter:"blur(8px)",
              WebkitBackdropFilter:"blur(8px)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, color:"white", pointerEvents:"auto",
              boxShadow:"0 2px 8px rgba(0,0,0,.15)",
            }}
            aria-label="Back to app"
          >←</button>
        </div>
      )}
      <div className="sheet" style={{maxHeight:"95vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 8px",textAlign:"center"}}>
          <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><Ico><Sparkles size={26} strokeWidth={2} color="var(--orange)"/></Ico></div>
          <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Upgrade Adhera</div>
          <div style={{fontSize:14,color:"var(--t3)"}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:4}}><Globe size={13}/> {selCountry.name} · Paystack <Check size={11} strokeWidth={3}/></span>
          </div>
        </div>

        <div style={{display:"flex",gap:8,padding:"12px 16px"}}>
          {plans.map(p => (
            <div
              key={p.id}
              onClick={() => setSelected(p.id)}
              style={{
                flex:1, borderRadius:14, padding:"12px 8px", cursor:"pointer", textAlign:"center",
                border:`2px solid ${selected===p.id ? p.color : "var(--sep)"}`,
                background: selected===p.id ? `${p.color}10` : "var(--card)",
                transition:"all .15s",
                position:"relative",
              }}
            >
              {p.id === currentPlan && (
                <div style={{
                  position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)",
                  background:p.color, color:"white", fontSize:9, fontWeight:700,
                  padding:"2px 8px", borderRadius:99, letterSpacing:".3px", whiteSpace:"nowrap",
                  boxShadow:"0 1px 4px rgba(0,0,0,.15)",
                }}>CURRENT</div>
              )}
              <div style={{marginBottom:2,display:"flex",justifyContent:"center"}}>{p.icon}</div>
              <div style={{fontWeight:700,fontSize:13,color:selected===p.id?p.color:"var(--t1)"}}>{p.name}</div>
              <div style={{fontSize:15,fontWeight:800,color:selected===p.id?p.color:"var(--t2)",marginTop:2}}>
                {p.price}
              </div>
              <div style={{fontSize:10,color:"var(--t3)"}}>{p.period}</div>
            </div>
          ))}
        </div>

        <div style={{padding:"8px 20px 16px"}}>
          {err && <div className="err-msg" style={{marginBottom:8}}>{err}</div>}
          <div style={{fontSize:14,color:"var(--t3)",marginBottom:10}}>{plan.tagline}</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {plan.features.map(f => (
              <div key={f} style={{fontSize:14,color:"var(--t1)",display:"flex",alignItems:"center",gap:8}}>
                <span style={{color:plan.color,fontWeight:700,flexShrink:0}}>—</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:"8px 16px",borderTop:"1px solid var(--sep)"}}>
          {pay.ready ? (
            <button
              className="btn"
              disabled={busy || selected === currentPlan}
              style={{
                width:"100%", marginBottom:10,
                background: plan.color, color:"white",
                fontSize:16, fontWeight:700, opacity: (busy || selected === currentPlan) ? 0.5 : 1,
              }}
              onClick={handlePayment}
            >
              {busy ? "Processing…" : selected === currentPlan ? `You're on ${plan.name}` : `Unlock ${plan.name} · ${plan.price}/month`}
            </button>
          ) : (
            <div style={{
              width:"100%", marginBottom:10, padding:"14px 12px", borderRadius:12,
              background:"var(--ib3)", color:"var(--t2)", textAlign:"center",
              fontSize:14, fontWeight:600, boxSizing:"border-box",
            }}>
              Payments coming soon in {selCountry.name}
            </div>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            {busy ? "Cancel" : "Maybe later"}
          </button>
          <div style={{fontSize:10,color:"var(--t3)",textAlign:"center",marginTop:8,lineHeight:1.4}}>
            {pay.ready ? "Secure payment via Paystack. Cancel anytime." : "Free tier stays free — paid plans will unlock here when payments go live in your country."}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FamilyInviteModal({ members, onInvite, onRemove, onClose }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!email.trim()) return;
    onInvite(email.trim());
    setEmail("");
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{maxHeight:"80vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 20px"}}>
          <div style={{fontSize:20,fontWeight:700,marginBottom:16}}>Family members</div>

          {members.length > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:600,color:"var(--t2)",marginBottom:8}}>Invited members</div>
              <div className="list">
                {members.map((m, i) => (
                  <div key={m.id || i} className="row" style={{cursor:"default"}}>
                    <div className="row-icon" style={{background:"var(--ib4)"}}><Ico><User size={18} strokeWidth={2} color="var(--t1)"/></Ico></div>
                    <div className="row-body">
                      <div className="row-title">{m.member_email || m.email}</div>
                      <div className="row-sub">{m.status === "pending" ? "Invitation sent — they'll accept when they sign in" : "Active"}</div>
                    </div>
                    <button className="btn btn-sm" style={{background:"var(--ib6)",color:"var(--red)",border:"none"}} onClick={() => onRemove(m.id || i)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{fontSize:14,fontWeight:600,color:"var(--t2)",marginBottom:8}}>Invite new member</div>
          <div style={{display:"flex",gap:8}}>
            <input className="sheet-input" type="email" placeholder="family@example.com" value={email} onChange={e => setEmail(e.target.value)}
              style={{flex:1}} onKeyDown={e => e.key === "Enter" && handleSend()}/>
            <button className="btn btn-primary btn-sm" style={{width:"auto"}} onClick={handleSend} disabled={!email.trim()}>
              {sent ? <span style={{display:"inline-flex",alignItems:"center",gap:5}}><Check size={14}/> Sent!</span> : "Send invite"}
            </button>
          </div>
          <div style={{fontSize:12,color:"var(--t3)",marginTop:8}}>They&apos;ll receive an email to join your family group.</div>

          <button className="btn btn-ghost" style={{marginTop:16,width:"100%"}} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export function DeleteConfirmModal({ medName, onConfirm, onCancel }) {
  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="sheet" style={{maxHeight:"50vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"20px 20px calc(16px + var(--safe-bottom))",textAlign:"center"}}>
          <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><Ico><Trash2 size={44} strokeWidth={1.8} color="var(--red)"/></Ico></div>
          <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Delete medication?</div>
          <div style={{fontSize:15,color:"var(--t3)",lineHeight:1.5,marginBottom:20}}>
            This will permanently remove <strong style={{color:"var(--t1)"}}>{medName}</strong> and all its dose history. This cannot be undone.
          </div>
          <div className="sheet-actions">
            <button className="btn btn-red" onClick={onConfirm}>Delete permanently</button>
            <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LogDoseModal({ med, onConfirm, onCancel }) {
  const [journal, setJournal] = useState("");
  const now = new Date();
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [takenAt, setTakenAt] = useState(localISO);
  const todayStr = now.toISOString().split("T")[0];

  function handleConfirm() {
    const selected = new Date(takenAt);
    if (selected > now) { alert("Cannot log doses in the future."); return; }
    onConfirm(journal, takenAt);
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="sheet" style={{maxHeight:"75vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"4px 20px calc(16px + var(--safe-bottom))"}}>
          <div style={{fontSize:20,fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:6}}><Ico><Pill size={20} strokeWidth={2.2} color="var(--t1)"/></Ico> Log dose</div>
          <div style={{fontSize:15,color:"var(--t3)",marginBottom:16}}>
            {med.name} · {med.dosage_amount} {med.dosage_unit}
          </div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Date & time taken</div>
            <input className="sheet-input" type="datetime-local" value={takenAt}
              max={`${todayStr}T23:59`}
              onChange={e => setTakenAt(e.target.value)}
              style={{fontSize:16}}/>
          </div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:6,fontWeight:500}}>Journal (optional)</div>
            <textarea className="sheet-input" rows={3}
              placeholder="How are you feeling? Any side effects?"
              value={journal} onChange={e => setJournal(e.target.value)}
              style={{resize:"vertical",fontSize:16,background:"var(--bg)"}}/>
          </div>

          <div className="sheet-actions" style={{gap:8}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={handleConfirm}>Log dose</button>
            <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
