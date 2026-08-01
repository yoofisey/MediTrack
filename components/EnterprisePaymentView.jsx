"use client";

import { Hospital, Check, Mail } from "lucide-react";

export default function EnterprisePaymentView({
  orgName, email, otp, onOtpChange, onOtpVerify,
  onResend, onBack, busy, cooldown, err,
  selCountry, selectedEntTier, enterpriseTier, setEnterpriseTier,
  ENTERPRISE_TIERS
}) {
  return (
    <div>
      <div style={{fontSize:36,marginBottom:8}}><Hospital size={36} color="var(--teal)"/></div>
      <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Enterprise plan — {orgName}</div>
      <div style={{fontSize:14,color:"var(--t3)"}}>Verify your email to continue. A verification code was sent to <strong>{email}</strong>.</div>

      <div style={{background:"linear-gradient(135deg,var(--teal2),var(--teal))",borderRadius:16,padding:16,color:"white",marginBottom:16,marginTop:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:14,fontWeight:600}}>{selectedEntTier.label} — {selectedEntTier.range}</span>
          <span style={{fontSize:18,fontWeight:800}}>{selCountry.code === "GH" ? selectedEntTier.annualLabel : selectedEntTier.annualUsdLabel}<span style={{fontSize:12,fontWeight:400}}>/yr</span></span>
        </div>
        <div style={{fontSize:13,opacity:.9,lineHeight:1.5,display:"flex",flexWrap:"wrap",gap:"4px 12px"}}>
          {["Unlimited patients","HIPAA compliance","API access","Custom branding","Dedicated manager","24/7 support"].map(f=>(
            <span key={f} style={{display:"inline-flex",alignItems:"center",gap:5}}><Check size={12} strokeWidth={3}/>{f}</span>
          ))}
        </div>
      </div>

      {err && <div className="err-msg">{err}</div>}

      <form onSubmit={onOtpVerify}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13,color:"var(--t3)",marginBottom:6}}>Enter verification code</div>
          <input
            className="input-field"
            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
            placeholder="000000" value={otp} onChange={onOtpChange}
            style={{textAlign:"center",fontSize:28,fontWeight:700,letterSpacing:12,fontFamily:"ui-monospace,SFMono-Regular,monospace"}}
            autoFocus required
          />
        </div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:13,color:"var(--t3)",marginBottom:8,fontWeight:600}}>Select your organization size</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {ENTERPRISE_TIERS.map(t => (
              <div key={t.id} onClick={() => setEnterpriseTier(t.id)}
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderRadius:10,cursor:"pointer",
                  background:enterpriseTier===t.id?"var(--sel)":"var(--card)",border:enterpriseTier===t.id?"1.5px solid var(--teal)":"1px solid var(--sep)",transition:"all .15s"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--t1)"}}>{t.label}</div>
                  <div style={{fontSize:12,color:"var(--t3)"}}>{t.range}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--teal)"}}>{selCountry.code === "GH" ? t.annualLabel : t.annualUsdLabel}</div>
                  <div style={{fontSize:11,color:"var(--t3)"}}>per year</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy || otp.length < 6}>
          {busy ? "Verifying..." : "Verify & activate enterprise account"}
        </button>
      </form>

      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button className="btn btn-ghost" style={{flex:1}} onClick={onBack}>
          Back to form
        </button>
        <button className="btn btn-ghost" style={{flex:1,opacity:cooldown>0?0.5:1}} disabled={cooldown>0} onClick={onResend}>
          {cooldown>0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
      <div style={{marginTop:12,padding:"10px 12px",background:"var(--bg)",borderRadius:8,fontSize:12,color:"var(--t3)",lineHeight:1.5}}>
        <span style={{display:"inline-flex",alignItems:"center",gap:5}}><Mail size={13}/> Didn&apos;t receive the code? Check your spam folder, or contact support for help with email delivery.</span>
      </div>
    </div>
  );
}
