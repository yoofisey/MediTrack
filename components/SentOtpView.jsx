"use client";

export default function SentOtpView({ email, otp, onOtpChange, onOtpVerify, onResend, onBack, busy, cooldown, err }) {
  return (
    <div>
      <div style={{fontSize:48,marginBottom:12}}>📬</div>
      <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Check your email</div>
      <div style={{fontSize:15,color:"var(--t3)",lineHeight:1.5,marginBottom:16}}>
        We sent a 6-digit code to <strong style={{color:"var(--t1)"}}>{email}</strong>
      </div>
      {err && <div className="err-msg">{err}</div>}
      <form onSubmit={onOtpVerify}>
        <div style={{marginBottom:16}}>
          <input
            className="input-field"
            type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
            placeholder="000000" value={otp} onChange={onOtpChange}
            style={{textAlign:"center",fontSize:28,fontWeight:700,letterSpacing:12}}
            autoFocus required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy || otp.length < 6}>
          {busy ? "Verifying..." : "Verify email"}
        </button>
      </form>
      <div style={{textAlign:"center",marginTop:16,fontSize:14,color:"var(--t3)"}}>
        Didn&apos;t get it?{" "}
        <button
          style={{background:"none",border:"none",color:"var(--teal)",fontWeight:600,cursor:cooldown>0?"not-allowed":"pointer",fontSize:14,fontFamily:"inherit",opacity:cooldown>0?0.5:1,transition:"opacity .2s"}}
          disabled={cooldown>0}
          onClick={onResend}
        >
          {cooldown>0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
        {" · "}
        <button
          style={{background:"none",border:"none",color:"var(--t3)",cursor:"pointer",fontSize:14,fontFamily:"inherit"}}
          onClick={onBack}
        >
          Back
        </button>
      </div>
      <div style={{marginTop:16,padding:"10px 14px",background:"var(--bg)",borderRadius:10}}>
        <div style={{fontSize:13,color:"var(--t3)",lineHeight:1.6}}>
          📧 Didn&apos;t get it? Check your spam folder. If issues persist, configure SMTP in Supabase dashboard → Authentication → Settings.
        </div>
      </div>
    </div>
  );
}
