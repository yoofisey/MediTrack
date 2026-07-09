"use client";

import { useState } from "react";
import { CSS } from "@/lib/constants";
import { COUNTRIES, getPricing, usesPaystack } from "@/lib/data";

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
            <p>We collect information you provide directly: name, email address, medication names, dosages, schedules, dose logs, and health goals. We also collect usage data such as app interactions and notification preferences.</p>
            <p><strong>2. How We Use Your Information</strong></p>
            <p>Your data is used solely to deliver the Adhera service: tracking medications, sending reminders, generating adherence reports, and improving the app experience. We never sell your personal data.</p>
            <p><strong>3. Data Storage & Security</strong></p>
            <p>Your data is stored securely on Supabase servers with encryption at rest and in transit. We implement industry-standard security measures including HTTPS, encrypted database connections, and strict access controls.</p>
            <p><strong>4. Data Retention</strong></p>
            <p>We retain your data for as long as your account is active. You may request deletion of your data at any time by contacting us or deleting your account within the app.</p>
            <p><strong>5. Third-Party Services</strong></p>
            <p>We use Supabase for authentication and database hosting. Push notifications may use your browser&apos;s notification API. No other third parties have access to your personal medication data.</p>
            <p><strong>6. Your Rights</strong></p>
            <p>You have the right to access, correct, or delete your personal data. You can manage most information directly through the app&apos;s profile settings.</p>
            <p><strong>7. Changes to This Policy</strong></p>
            <p>We may update this policy from time to time. Significant changes will be notified via email or in-app notice.</p>
            <p><strong>8. Contact</strong></p>
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

export function UpgradeModal({ country, userEmail, onClose, onUpgrade }) {
  const [selected, setSelected] = useState("pro");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { pricing } = getPricing(country || "GH");
  const selCountry = COUNTRIES.find(c => c.code === (country || "GH")) || COUNTRIES[0];
  const usePaystack = usesPaystack(country);

  const plans = [
    {
      id: "pro",
      name: "Pro",
      icon: "⭐",
      color: "#2563EB",
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
      name: "Family",
      icon: "👨‍👩‍👧",
      color: "#AF52DE",
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
    {
      id: "enterprise",
      name: "Enterprise",
      icon: "🏥",
      color: "#7C3AED",
      price: pricing.enterprise.label,
      period: "/month",
      tagline: "For hospitals, clinics & insurers",
      features: [
        "Everything in Family",
        "Bulk patient management",
        "API access & integrations",
        "Custom branding & white-label",
        "HIPAA-compliant infrastructure",
        "Dedicated account manager",
        "Custom reporting & analytics",
        "Priority 24/7 support",
      ],
    },
  ];

  const plan = plans.find(p => p.id === selected);

  async function handlePayment() {
    setBusy(true);
    setErr("");

    if (selected === "enterprise") {
      const subj = encodeURIComponent("Adhera Enterprise Inquiry");
      const body = encodeURIComponent(`I'm interested in the Enterprise plan for my organization.\n\nCountry: ${selCountry.name}\nPlan: ${plan.name} (${plan.price}/month)`);
      window.open(`mailto:sales@adhera.app?subject=${subj}&body=${body}`, "_blank");
      setBusy(false);
      onClose();
      return;
    }

    const amountInCents = Math.round(pricing[selected].amount * 100);

    try {
      if (usePaystack) {
        await new Promise((resolve, reject) => {
          if (typeof window.PaystackPop === "undefined") {
            const s = document.createElement("script");
            s.src = "https://js.paystack.co/v1/inline.js";
            s.onload = resolve;
            s.onerror = () => reject(new Error("Failed to load Paystack"));
            document.head.appendChild(s);
          } else {
            resolve();
          }
        });

        const handler = window.PaystackPop.setup({
          key: "pk_test_8a7b6c5d4e3f2a1b0c9d8e7f", // demo key — replace with real key
          email: userEmail || "patient@example.com",
          amount: pricing[selected].amount * 100,
          currency: selCountry.currency,
          ref: "adr_" + Date.now() + "_" + Math.random().toString(36).slice(2,8),
          metadata: { plan: selected, country: country },
          callback: function() {
            onUpgrade(selected);
            setBusy(false);
          },
          onClose: function() {
            setBusy(false);
          },
        });
        handler.openIframe();
      } else {
        await new Promise((resolve, reject) => {
          if (typeof window.Stripe === "undefined") {
            const s = document.createElement("script");
            s.src = "https://js.stripe.com/v3/";
            s.onload = resolve;
            s.onerror = () => reject(new Error("Failed to load Stripe"));
            document.head.appendChild(s);
          } else {
            resolve();
          }
        });

        const stripe = window.Stripe("pk_test_51ABCDEFGHIJKLMNOPQRSTUVWXYZ"); // demo key — replace with real key
        const { error } = await stripe.redirectToCheckout({
          lineItems: [{ price: selected === "pro" ? "price_pro_monthly" : "price_family_monthly", quantity: 1 }],
          mode: "subscription",
          successUrl: window.location.href + "?payment=success",
          cancelUrl: window.location.href + "?payment=cancelled",
          customerEmail: userEmail,
        });
        if (error) throw error;
      }
    } catch (e) {
      setErr(e.message || "Payment failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet" style={{maxHeight:"95vh"}} onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{padding:"0 20px 8px",textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:4}}>✨</div>
          <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Upgrade Adhera</div>
          <div style={{fontSize:14,color:"var(--t3)"}}>
            {selCountry.flag} {selCountry.name} · {usePaystack ? "Paystack" : "Stripe"} ✓
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
              }}
            >
              <div style={{fontSize:22,marginBottom:2}}>{p.icon}</div>
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
          <button
            className="btn"
            disabled={busy}
            style={{
              width:"100%", marginBottom:10,
              background: plan.color, color:"white",
              fontSize:16, fontWeight:700, opacity: busy ? 0.6 : 1,
            }}
            onClick={handlePayment}
          >
            {busy ? "Processing…" : selected === "enterprise"
              ? "Contact sales →"
              : `${usePaystack ? "Pay with Paystack" : "Pay with Stripe"} · ${plan.price}/month`}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            {busy ? "Cancel" : "Maybe later"}
          </button>
          <div style={{fontSize:10,color:"var(--t3)",textAlign:"center",marginTop:8,lineHeight:1.4}}>
            Secure payment via {usePaystack ? "Paystack" : "Stripe"}. Cancel anytime.
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
                  <div key={i} className="row" style={{cursor:"default"}}>
                    <div className="row-icon" style={{background:"var(--ib4)",fontSize:18}}>👤</div>
                    <div className="row-body">
                      <div className="row-title">{m.email}</div>
                      <div className="row-sub">{m.status === "pending" ? "Invitation sent" : "Active"}</div>
                    </div>
                    <button className="btn btn-sm" style={{background:"var(--ib6)",color:"var(--red)",border:"none"}} onClick={() => onRemove(i)}>Remove</button>
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
              {sent ? "Sent! ✓" : "Send invite"}
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
          <div style={{fontSize:48,marginBottom:12}}>🗑️</div>
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
