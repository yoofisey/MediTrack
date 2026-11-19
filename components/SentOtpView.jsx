"use client";

export default function SentOtpView({ email, otp, onOtpChange, onOtpVerify, onResend, onBack, busy, cooldown, err, otpAttempts }) {
  const locked = otpAttempts && !otpAttempts.allowed;
  return (
    <div>
      <div style={{width:56,height:56,borderRadius:17,background:"var(--ib1)",display:"grid",placeItems:"center",margin:"0 auto 18px",boxShadow:"inset 0 0 0 0.5px rgba(0,122,255,.12),0 6px 18px rgba(0,122,255,.12)"}}>
        <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="M2 7l10 6 10-6"/>
        </svg>
      </div>
      <div style={{fontSize:22,fontWeight:700,marginBottom:8,letterSpacing:"-.3px",textAlign:"center",color:"var(--t1)"}}>Check your inbox</div>
      <div style={{fontSize:14,color:"var(--t3)",lineHeight:1.5,marginBottom:24,textAlign:"center"}}>
        We sent a 6-digit code to<br/>
        <strong style={{color:"var(--t1)",fontWeight:600}}>{email}</strong>
      </div>
      {err && <div className="err-msg">{err}</div>}
      {locked && <div style={{fontSize:13,color:"var(--red)",textAlign:"center",marginBottom:12}}>Too many failed attempts. Try again in {otpAttempts.waitMin} minutes.</div>}
      <form onSubmit={onOtpVerify}>
        <div style={{marginBottom:20}}>
          <input
            className="auth-input"
            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
            placeholder="000000" value={otp} onChange={onOtpChange}
            style={{textAlign:"center",fontSize:30,fontWeight:700,letterSpacing:14,padding:"16px",borderRadius:14,fontFamily:"ui-monospace,SFMono-Regular,monospace",width:"100%",boxSizing:"border-box"}}
            disabled={locked}
            required
          />
        </div>
        <button className="auth-btn auth-btn-primary" type="submit" disabled={busy || otp.length < 6 || locked} style={{width:"100%"}}>
          {busy ? "Verifying..." : "Verify email"}
        </button>
      </form>
      <div style={{textAlign:"center",marginTop:18,fontSize:14,color:"var(--t3)"}}>
        Didn&apos;t get it?{" "}
        <button
          style={{background:"none",border:"none",color:"var(--teal)",fontWeight:600,cursor:cooldown>0?"not-allowed":"pointer",fontSize:14,fontFamily:"inherit",opacity:cooldown>0?0.5:1,transition:"opacity .2s"}}
          disabled={cooldown>0 || locked}
          onClick={onResend}
        >
          {cooldown>0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
        {" · "}
        <button
          style={{background:"none",border:"none",color:"var(--t3)",cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:500}}
          onClick={onBack}
        >
          Back
        </button>
      </div>
      <div style={{marginTop:20,padding:"12px 16px",background:"var(--hover)",borderRadius:12,border:"0.5px solid var(--sep)"}}>
        <div style={{fontSize:13,color:"var(--t3)",lineHeight:1.6}}>
          Check your spam folder if you don&apos;t see it.
        </div>
      </div>
    </div>
  );
}