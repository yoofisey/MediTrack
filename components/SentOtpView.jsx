"use client";

export default function SentOtpView({ email, otp, onOtpChange, onOtpVerify, onResend, onBack, busy, cooldown, err }) {
  return (
    <div>
      <div style={{width:56,height:56,borderRadius:16,background:"rgba(255,255,255,.1)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,.12)",display:"grid",placeItems:"center",margin:"0 auto 20px",boxShadow:"0 8px 24px rgba(0,0,0,.1)"}}>
        <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="M2 7l10 6 10-6"/>
        </svg>
      </div>
      <div style={{fontSize:22,fontWeight:700,marginBottom:8,letterSpacing:"-.3px",textAlign:"center",color:"white"}}>Check your inbox</div>
      <div style={{fontSize:14,color:"rgba(255,255,255,.55)",lineHeight:1.5,marginBottom:24,textAlign:"center"}}>
        We sent a 6-digit code to<br/>
        <strong style={{color:"white",fontWeight:600}}>{email}</strong>
      </div>
      {err && <div className="err-msg">{err}</div>}
      <form onSubmit={onOtpVerify}>
        <div style={{marginBottom:20}}>
          <input
            className="auth-input"
            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
            placeholder="000000" value={otp} onChange={onOtpChange}
            style={{textAlign:"center",fontSize:30,fontWeight:700,letterSpacing:14,padding:"16px",borderRadius:14,fontFamily:"ui-monospace,SFMono-Regular,monospace",width:"100%",boxSizing:"border-box"}}
            autoFocus required
          />
        </div>
        <button className="auth-btn auth-btn-primary" type="submit" disabled={busy || otp.length < 6} style={{width:"100%"}}>
          {busy ? "Verifying..." : "Verify email"}
        </button>
      </form>
      <div style={{textAlign:"center",marginTop:18,fontSize:14,color:"rgba(255,255,255,.5)"}}>
        Didn&apos;t get it?{" "}
        <button
          style={{background:"none",border:"none",color:"rgba(255,255,255,.85)",fontWeight:600,cursor:cooldown>0?"not-allowed":"pointer",fontSize:14,fontFamily:"inherit",opacity:cooldown>0?0.5:1,transition:"opacity .2s"}}
          disabled={cooldown>0}
          onClick={onResend}
        >
          {cooldown>0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
        {" · "}
        <button
          style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:500}}
          onClick={onBack}
        >
          Back
        </button>
      </div>
      <div style={{marginTop:20,padding:"12px 16px",background:"rgba(255,255,255,.06)",borderRadius:12,border:"1px solid rgba(255,255,255,.06)"}}>
        <div style={{fontSize:13,color:"rgba(255,255,255,.4)",lineHeight:1.6}}>
          Check your spam folder if you don&apos;t see it.
        </div>
      </div>
    </div>
  );
}
