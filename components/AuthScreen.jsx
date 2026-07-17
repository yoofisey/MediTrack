"use client";

import { useState, useEffect } from "react";
import { sb } from "@/lib/supabase";
import { CSS, GIcon, AuthLogo, RE_HAS_LOWER, RE_HAS_UPPER, RE_HAS_DIGIT, RE_HAS_SYMBOL, RE_EMAIL, RE_HTML_TAG, RE_DIGITS } from "@/lib/constants";
import { COUNTRIES, getPricing, TIER_LIMITS, ENTERPRISE_TIERS } from "@/lib/data";
import SentOtpView from "./SentOtpView";
import EnterprisePaymentView from "./EnterprisePaymentView";

export default function AuthScreen({ onAuth }) {
  const [view, setView]     = useState("welcome");
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [name, setName]     = useState("");
  const [country, setCountry] = useState("GH");
  const [tier, setTier]       = useState("free");
  const [otp, setOtp]       = useState("");
  const [busy, setBusy]     = useState(false);
  const [obl, setObl]       = useState("");
  const [err, setErr]       = useState("");
  const [sent, setSent]     = useState(false);
  const [pwStore, setPwStore] = useState("");
  const [pwShow, setPwShow] = useState(false);
  const [regType, setRegType] = useState("individual");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [orgSize, setOrgSize] = useState("");
  const [phone, setPhone]     = useState("");
  const [deployment, setDeployment] = useState("cloud");
  const [enterpriseTier, setEnterpriseTier] = useState("small");
  const [step, setStep]       = useState("form");
  const [cooldown, setCooldown] = useState(0);

  function startCooldown(sec = 60) { setCooldown(sec); const t = setInterval(() => { setCooldown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }); }, 1000); }

  function handleOtpChange(e) { setOtp(e.target.value.replace(RE_DIGITS,"").slice(0,6)); }

  useEffect(() => {
    const stored = (() => { try { return localStorage.getItem("mt_at"); } catch { return null; } })();
    if (!stored) return;
    sb.auth.getUser().then(({ data }) => {
      if (data?.user) onAuth(data.user, false);
    }).catch(() => {});
  }, []);

  async function oauth(provider) {
    setErr(""); setObl(provider);
    await new Promise(r => setTimeout(r, 80));
    sb.auth.signInWithOAuth({ provider });
  }

  async function handleSignIn(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) throw new Error(error?.message || "Login failed.");
      if (!data?.user) throw new Error("Login failed.");
      onAuth(data.user, false);
    } catch (e) {
      setErr(e?.message || "Something went wrong.");
    } finally { setBusy(false); }
  }

  function sanitizeHtml(str) { return str.replace(RE_HTML_TAG,""); }

  function pwScore(p) {
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (RE_HAS_LOWER.test(p) && RE_HAS_UPPER.test(p)) s++;
    if (RE_HAS_DIGIT.test(p)) s++;
    if (RE_HAS_SYMBOL.test(p)) s++;
    return s;
  }

  function isValidEmail(e) { return RE_EMAIL.test(e); }

  async function handleSignUp(e) {
    e.preventDefault(); setBusy(true); setErr("");
    const cleanName = sanitizeHtml(name).trim();
    if (!cleanName) { setErr("Please enter your name."); setBusy(false); return; }
    if (!isValidEmail(email)) { setErr("Please enter a valid email address."); setBusy(false); return; }
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); setBusy(false); return; }
    if (pw !== confirmPw) { setErr("Passwords do not match."); setBusy(false); return; }
    if (pwScore(pw) < 3) { setErr("Password is too weak — use a mix of upper/lowercase, numbers, and symbols."); setBusy(false); return; }
    try {
      const { error } = await sb.auth.signUpOtp({
        email,
        options: { data: { full_name: cleanName, country, plan: tier } },
      });
      if (error) throw error;
      setPwStore(pw);
      startCooldown(60);
      setSent(true);
    } catch (e) {
      const m = e?.message || "";
      if (m.includes("SMTP") || m.includes("rate") || m.includes("timeout") || m.includes("unavailable") || m.includes("sending magic link")) {
        setErr("📧 Email service not configured.\n\nYour Supabase project needs SMTP settings to send emails. Go to your Supabase dashboard → Authentication → Settings → SMTP and add a provider (SendGrid, Resend, or Mailgun — all offer free tiers).\n\nIf using Resend, make sure you've verified a domain on resend.com/domains (the free onboarding@resend.dev sender only works with authorized emails). Also check your API key is valid.");
      } else {
        setErr(m || "Something went wrong. Please try again.");
      }
    } finally { setBusy(false); }
  }

  async function handleResendOtp() {
    if (cooldown>0) return;
    setErr("");
    const { error } = await sb.auth.signUpOtp({ email });
    if (error) {
      const m = error.message || "";
      setErr(m.includes("SMTP") || m.includes("rate") || m.includes("timeout") || m.includes("unavailable") ? "Email service not configured. Set up SMTP in Supabase dashboard." : "Failed to resend - " + m);
    } else {
      startCooldown(60);
      setErr("Code resent - check your inbox.");
    }
  }

  async function handleEnterpriseSignUp(e) {
    e.preventDefault(); setBusy(true); setErr("");
    if (!orgName.trim()) { setErr("Enter your organization name."); setBusy(false); return; }
    if (!orgType) { setErr("Select your organization type."); setBusy(false); return; }
    if (!sanitizeHtml(name).trim()) { setErr("Enter your full name."); setBusy(false); return; }
    if (!isValidEmail(email)) { setErr("Enter a valid work email."); setBusy(false); return; }
    if (!phone.trim()) { setErr("Enter a contact phone number."); setBusy(false); return; }
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); setBusy(false); return; }
    if (pw !== confirmPw) { setErr("Passwords do not match."); setBusy(false); return; }
    try {
      const { error } = await sb.auth.signUpOtp({
        email,
        options: { data: { full_name: sanitizeHtml(name).trim(), org_name: orgName.trim(), org_type: orgType, org_size: orgSize, phone: phone.trim(), deployment, country, plan: "enterprise", enterprise_tier: enterpriseTier } },
      });
      if (error) throw error;
      setPwStore(pw);
      startCooldown(60);
      setStep("payment");
    } catch (e) {
      const m = e?.message || "";
      if (m.includes("SMTP") || m.includes("rate") || m.includes("timeout") || m.includes("unavailable")) {
        setErr("📧 Email service not configured. Configure SMTP in Supabase dashboard → Authentication → Settings → SMTP to enable email delivery.");
      } else {
        setErr(m || "Something went wrong. Please try again.");
      }
    } finally { setBusy(false); }
  }

  async function handleEnterpriseResend() {
    if (cooldown>0) return;
    setOtp(""); setErr(""); setBusy(true);
    try {
      const { error } = await sb.auth.signUpOtp({ email });
      if (error) throw error;
      startCooldown(60);
      setErr("Code resent — check your inbox.");
    } catch (e) {
      const m = e?.message||"";
      setErr(m.includes("SMTP")||m.includes("rate")||m.includes("timeout")||m.includes("unavailable") ? "Email not configured. Set up SMTP in Supabase dashboard." : "Failed to resend.");
    } finally { setBusy(false); }
  }

  async function handleOtpVerify(e) {
    e.preventDefault();
    if (otp.length < 6) { setErr("Enter the 6-digit code from your email."); return; }
    setBusy(true); setErr("");
    try {
      const { data: vData, error: vErr } = await sb.auth.verifyOtp({ email, token: otp });
      if (vErr) throw vErr;
      if (!vData?.user) throw new Error("Verification failed.");
      const { data: existing } = await sb.from("profiles").select("id").eq("id", vData.user.id);
      if (existing?.length > 0) {
        await sb.auth.signOut();
        throw new Error("This email is already registered — please sign in instead.");
      }
      if (isEnt) {
        await sb.auth.updateUser({ data: { enterprise_tier: enterpriseTier } });
      }
      await sb.auth.updateUser({ password: pwStore });
      onAuth(vData.user, true);
    } catch (e) {
      setErr(e?.message || "Invalid or expired code.");
    } finally { setBusy(false); }
  }

  const selCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];
  const { pricing } = getPricing(country);
  const selectedEntTier = ENTERPRISE_TIERS.find(t => t.id === enterpriseTier) || ENTERPRISE_TIERS[0];
  const isEnt = regType === "enterprise";

  function RegToggle() {
    const tabs = [
      { id:"individual", label:"👤 Individual" },
      { id:"enterprise", label:"🏥 Enterprise" },
    ];
    return (
      <div style={{display:"flex",background:"var(--bg)",borderRadius:12,padding:3,marginBottom:16,border:"1px solid var(--sep)"}}>
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={()=>{setRegType(t.id);setErr("");}}
            style={{flex:1,padding:"8px 12px",borderRadius:9,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",
              background:regType===t.id?"var(--card)":"transparent",color:regType===t.id?"var(--t1)":"var(--t3)",
              boxShadow:regType===t.id?"0 1px 4px rgba(0,0,0,.06)":"none",transition:"all .2s"}}>{t.label}</button>
        ))}
      </div>
    );
  }

  if (view === "welcome") return (
    <div className="auth-screen" style={{padding:0,justifyContent:"flex-end",background:"linear-gradient(180deg,#007AFF 0%,#0055CC 100%)",overflow:"hidden"}}>
      <style>{CSS}</style>
      <div style={{position:"absolute",top:"-20%",right:"-30%",width:"90%",height:"90%",background:"radial-gradient(circle,rgba(255,255,255,.2) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"30%",left:"-20%",width:"60%",height:"60%",background:"radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 32px 20px",color:"white",position:"relative",zIndex:1}}>
        <div style={{width:88,height:88,background:"rgba(255,255,255,.2)",borderRadius:26,display:"grid",placeItems:"center",marginBottom:20,backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.15)",boxShadow:"0 12px 40px rgba(0,0,0,.15)"}}>
          <svg viewBox="0 0 100 100" width={44} height={44} fill="white">
            <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="3" strokeOpacity=".3"/>
            <circle cx="50" cy="14" r="6" fill="white"/>
            <circle cx="50" cy="86" r="6" fill="white"/>
            <text x="24" y="58" fontFamily="system-ui,sans-serif" fontSize="34" fontWeight="700" fill="white">A</text>
            <rect x="56" y="38" width="4" height="18" rx="2" fill="white" transform="translate(58,47)"/>
            <rect x="52" y="43" width="16" height="4" rx="2" fill="white" transform="translate(60,45)"/>
          </svg>
        </div>
        <div style={{fontSize:36,fontWeight:800,letterSpacing:"-.5px",textAlign:"center",lineHeight:1.15,marginBottom:10}}>Adhera</div>
        <div style={{fontSize:17,fontWeight:400,opacity:.85,textAlign:"center",lineHeight:1.5,maxWidth:300,marginBottom:28}}>
          Your personal medication tracker with smart reminders and adherence insights.
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
          {[
            {icon:"💊",label:"Dose tracking"},
            {icon:"🔔",label:"Smart reminders"},
            {icon:"🔥",label:"Streak rewards"},
            {icon:"📊",label:"Adherence reports"},
          ].map(f=>(
            <div key={f.label} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.15)",backdropFilter:"blur(10px)",borderRadius:99,padding:"7px 14px",fontSize:13,fontWeight:500,color:"white",border:"1px solid rgba(255,255,255,.1)"}}>
              <span style={{fontSize:14}}>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:"var(--card)",borderRadius:"28px 28px 0 0",padding:"28px 24px calc(28px + env(safe-area-inset-bottom,0px))",width:"100%",boxShadow:"0 -4px 20px rgba(0,0,0,.08)",position:"relative",zIndex:1}}>
        <div style={{fontSize:22,fontWeight:700,marginBottom:4,color:"var(--t1)",letterSpacing:"-.3px"}}>Get started</div>
        <div style={{fontSize:15,color:"var(--t3)",marginBottom:20,lineHeight:1.4}}>Join thousands managing their health with Adhera</div>
        <button className="oauth-btn" onClick={()=>oauth("google")} disabled={!!obl} style={{marginBottom:12}}>
          {obl==="google"?"Redirecting...":<><GIcon/> Continue with Google</>}
        </button>
        <div className="divider">or</div>
        <button className="btn btn-primary" style={{marginBottom:12}} onClick={()=>setView("signup")}>Create free account</button>
        <button className="btn btn-ghost" style={{width:"100%"}} onClick={()=>setView("signin")}>Sign in to existing account</button>
      </div>
    </div>
  );

  if (sent) return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card" key="sent">
        <SentOtpView
          email={email} otp={otp} onOtpChange={handleOtpChange}
          onOtpVerify={handleOtpVerify} onResend={handleResendOtp}
          onBack={() => { setSent(false); setOtp(""); setErr(""); }}
          busy={busy} cooldown={cooldown} err={err}
        />
      </div>
    </div>
  );

  if (view === "signin") return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card" key="signin">
        <AuthLogo/>
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Sign in to manage your medications</div>
        <div className="oauth-stack">
          <button className="oauth-btn" onClick={()=>oauth("google")} disabled={!!obl}>{obl==="google"?"Redirecting...":<><GIcon/> Continue with Google</>}</button>
        </div>
        <div className="divider">or sign in with email</div>
        {err && <div className="err-msg">{err}</div>}
        <form onSubmit={handleSignIn}>
          <div className="input-group">
            <input className="input-field" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>
            <div className="pw-wrap" style={{display:"flex",border:"1.5px solid var(--sep)",borderRadius:12,overflow:"hidden"}}>
              <input className="input-field" style={{flex:1,minWidth:0,border:"none",borderRadius:0,background:"var(--input)"}} type={pwShow?"text":"password"} placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} minLength={8} required autoComplete="current-password"/>
              <button type="button" onClick={()=>setPwShow(p=>!p)} style={{width:44,flexShrink:0,border:"none",borderRadius:0,background:"var(--input)",cursor:"pointer",color:"var(--t4)",display:"flex",alignItems:"center",justifyContent:"center",opacity:.7}}
                onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.7}>
                {pwShow ?
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                  :
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
                }
              </button>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy?"Signing in...":"Sign in"}</button>
        </form>
        <div className="auth-switch">
          New to Adhera? <button onClick={()=>{setView("signup");setErr("");}}>Create account</button>
          <span style={{margin:"0 8px",color:"var(--sep)"}}>·</span>
          <button onClick={()=>setView("welcome")} style={{color:"var(--t3)"}}>Back</button>
        </div>
      </div>
    </div>
  );

  if (isEnt && step === "payment") return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card" key="enterprise-payment">
        <EnterprisePaymentView
          orgName={orgName} email={email} otp={otp}
          onOtpChange={handleOtpChange} onOtpVerify={handleOtpVerify}
          onResend={handleEnterpriseResend}
          onBack={() => { setStep("form"); setErr(""); }}
          busy={busy} cooldown={cooldown} err={err}
          selCountry={selCountry} selectedEntTier={selectedEntTier}
          enterpriseTier={enterpriseTier} setEnterpriseTier={setEnterpriseTier}
          ENTERPRISE_TIERS={ENTERPRISE_TIERS}
        />
      </div>
    </div>
  );

  return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card" style={{maxWidth:isEnt?480:440}} key="signup">
        <AuthLogo/>
        <div className="auth-title">{isEnt ? "Register your organization" : "Create your account"}</div>
        <div className="auth-sub">{isEnt ? "Enterprise-grade medication management" : "Free forever · Upgrade anytime"}</div>

        <RegToggle/>

        {!isEnt && (
          <>
            <div className="oauth-stack">
              <button className="oauth-btn" onClick={()=>oauth("google")} disabled={!!obl}>{obl==="google"?"Redirecting...":<><GIcon/> Continue with Google</>}</button>
            </div>
            <div className="divider">or sign up with email</div>
          </>
        )}

        {err && <div className="err-msg">{err}</div>}

        <form onSubmit={isEnt ? handleEnterpriseSignUp : handleSignUp}>
          <div className="input-group">
            {isEnt ? (
              <>
                <input className="input-field" type="text" placeholder="Organization name *" value={orgName} onChange={e=>setOrgName(e.target.value)} required autoComplete="organization"/>
                <div style={{position:"relative"}}>
                  <select className="input-field" value={orgType} onChange={e=>setOrgType(e.target.value)} required style={{color:orgType?"var(--t1)":"var(--t4)"}}>
                    <option value="" disabled>Organization type *</option>
                    <option value="hospital">🏥 Hospital</option>
                    <option value="clinic">🏪 Clinic</option>
                    <option value="insurance">🛡️ Insurance</option>
                    <option value="pharmacy">💊 Pharmacy</option>
                    <option value="research">🔬 Research</option>
                    <option value="govt">🏛️ Government</option>
                    <option value="other">📋 Other</option>
                  </select>
                </div>
                <div style={{position:"relative"}}>
                  <select className="input-field" value={orgSize} onChange={e=>setOrgSize(e.target.value)} required style={{color:orgSize?"var(--t1)":"var(--t4)"}}>
                    <option value="" disabled>Organization size *</option>
                    <option value="1-100">Up to 100</option>
                    <option value="100-1000">100 – 1,000</option>
                    <option value="1000-10000">1,000 – 10,000</option>
                    <option value="10000+">10,000+</option>
                  </select>
                </div>
                <input className="input-field" type="text" placeholder="Your full name *" value={name} onChange={e=>setName(sanitizeHtml(e.target.value))} required autoComplete="name"/>
                <input className="input-field" type="email" placeholder="Work email *" value={email} onChange={e=>setEmail(e.target.value.trim())} required autoComplete="email"/>
                <input className="input-field" type="tel" placeholder="Phone *" value={phone} onChange={e=>setPhone(e.target.value)} required autoComplete="tel"/>
                <div style={{position:"relative"}}>
                  <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:20,pointerEvents:"none",zIndex:1}}>{selCountry.flag}</div>
                  <select className="input-field" style={{paddingLeft:40}} value={country} onChange={e=>setCountry(e.target.value)}>
                    {COUNTRIES.map(c=>(<option key={c.code} value={c.code}>{c.name}</option>))}
                  </select>
                </div>
                <div style={{position:"relative"}}>
                  <select className="input-field" value={deployment} onChange={e=>setDeployment(e.target.value)}>
                    <option value="cloud">☁️ Cloud hosted</option>
                    <option value="onprem">🖥️ On-premise</option>
                    <option value="hybrid">🔀 Hybrid</option>
                  </select>
                </div>
                <PwFields pw={pw} setPw={setPw} confirmPw={confirmPw} setConfirmPw={setConfirmPw} pwScore={pwScore} RE_HAS_LOWER={RE_HAS_LOWER} RE_HAS_UPPER={RE_HAS_UPPER} RE_HAS_DIGIT={RE_HAS_DIGIT} RE_HAS_SYMBOL={RE_HAS_SYMBOL}/>
                <div style={{background:"linear-gradient(135deg,var(--teal2),var(--teal))",borderRadius:12,padding:"10px 14px",color:"white",marginTop:4}}>
                  <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>Enterprise pricing (annual)</div>
                  <div style={{display:"flex",flexDirection:"column",gap:2}}>
                    {ENTERPRISE_TIERS.map(t => (
                      <div key={t.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,opacity:.9}}>
                        <span>{t.label}</span>
                        <span style={{fontWeight:600}}>{selCountry.code === "GH" ? t.annualLabel : t.annualUsdLabel}/yr</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <input className="input-field" type="text" placeholder="Full name" value={name} onChange={e=>setName(sanitizeHtml(e.target.value))} required autoComplete="name"/>
                <input className="input-field" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value.trim())} required autoComplete="email"/>
                <PwFields pw={pw} setPw={setPw} confirmPw={confirmPw} setConfirmPw={setConfirmPw} pwScore={pwScore} RE_HAS_LOWER={RE_HAS_LOWER} RE_HAS_UPPER={RE_HAS_UPPER} RE_HAS_DIGIT={RE_HAS_DIGIT} RE_HAS_SYMBOL={RE_HAS_SYMBOL}/>
                <div style={{position:"relative"}}>
                  <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:20,pointerEvents:"none",zIndex:1}}>{selCountry.flag}</div>
                  <select className="input-field" style={{paddingLeft:40}} value={country} onChange={e=>setCountry(e.target.value)}>
                    {COUNTRIES.map(c=>(<option key={c.code} value={c.code}>{c.name}</option>))}
                  </select>
                </div>
                <div style={{background:"var(--card)",border:"1px solid var(--sep)",borderRadius:12,padding:"10px 14px"}}>
                  <div style={{fontSize:11,color:"var(--t3)",fontWeight:600,textTransform:"uppercase",letterSpacing:".3px",marginBottom:8}}>
                    {selCountry.flag} {selCountry.name} — Choose plan
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div onClick={()=>setTier("free")} style={{background:tier==="free"?"var(--sel)":"var(--input)",borderRadius:8,padding:"8px 10px",border:tier==="free"?"1.5px solid var(--teal)":"1px solid var(--sep)",cursor:"pointer",transition:"all .15s"}}>
                      <div style={{fontSize:11,color:"var(--t3)",marginBottom:2}}>Free</div>
                      <div style={{fontSize:16,fontWeight:700,color:"var(--teal2)"}}>Free</div>
                      <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>{TIER_LIMITS.free.maxMeds} meds · {TIER_LIMITS.free.history}d history</div>
                    </div>
                    <div onClick={()=>setTier("pro")} style={{background:tier==="pro"?"var(--sel)":"var(--input)",borderRadius:8,padding:"8px 10px",border:tier==="pro"?"1.5px solid var(--teal)":"1px solid var(--sep)",cursor:"pointer",transition:"all .15s"}}>
                      <div style={{fontSize:11,color:"var(--t3)",marginBottom:2}}>Pro</div>
                      <div style={{fontSize:16,fontWeight:700,color:"var(--teal)"}}>{pricing.pro.label}<span style={{fontSize:11,fontWeight:400}}>/mo</span></div>
                      <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>Unlimited · Full history</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Processing..." : isEnt ? "Register organization" : "Create free account"}
          </button>
        </form>
        <div style={{fontSize:11,color:"var(--t3)",textAlign:"center",marginTop:12,lineHeight:1.5}}>
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </div>
        <div className="auth-switch">
          Already have an account? <button onClick={()=>{setView("signin");setErr("");}}>Sign in</button>
          <span style={{margin:"0 8px",color:"var(--sep)"}}>·</span>
          <button onClick={()=>setView("welcome")} style={{color:"var(--t3)"}}>Back</button>
        </div>
      </div>
    </div>
  );
}

function PwFields({ pw, setPw, confirmPw, setConfirmPw, pwScore, RE_HAS_LOWER, RE_HAS_UPPER, RE_HAS_DIGIT, RE_HAS_SYMBOL }) {
  const [pwVis, setPwVis] = useState(false);
  const [cfVis, setCfVis] = useState(false);
  return (
    <>
      <div className="pw-wrap" style={{display:"flex",border:"1.5px solid var(--sep)",borderRadius:12,overflow:"hidden"}}>
        <input className="input-field" style={{flex:1,minWidth:0,border:"none",borderRadius:0,background:"var(--input)"}} type={pwVis?"text":"password"} placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} minLength={8} required autoComplete="new-password"/>
        <button type="button" onClick={()=>setPwVis(p=>!p)} style={{width:44,flexShrink:0,border:"none",borderRadius:0,background:"var(--input)",cursor:"pointer",color:"var(--t4)",display:"flex",alignItems:"center",justifyContent:"center",opacity:.7}}
          onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.7}>
          {pwVis ?
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            :
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
          }
        </button>
      </div>
      {pw.length > 0 && (
        <div style={{marginTop:-6,marginBottom:4,fontSize:12}}>
          <div style={{display:"flex",gap:4,marginBottom:6}}>
            {[
              { min:0, color:"var(--sep)" },
              { min:1, color:"#FF453A" },
              { min:2, color:"#FF9500" },
              { min:3, color:"#FFD60A" },
              { min:4, color:"#34C759" },
            ].map((s,i)=>{
              const score = pwScore(pw);
              return <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<score?s.color:"var(--sep)",transition:"background .25s"}}/>;
            })}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"2px 12px"}}>
            {[
              { label:"8+ chars", ok:pw.length>=8 },
              { label:"Upper & lower", ok:Boolean(RE_HAS_LOWER.test(pw) && RE_HAS_UPPER.test(pw)) },
              { label:"Number", ok:Boolean(RE_HAS_DIGIT.test(pw)) },
              { label:"Symbol", ok:Boolean(RE_HAS_SYMBOL.test(pw)) },
            ].map(r=>(
              <div key={r.label} style={{display:"flex",alignItems:"center",gap:3,color:r.ok?"var(--teal2)":"var(--t4)",transition:"color .2s"}}>
                <span style={{fontSize:11,fontWeight:700}}>{r.ok?"✓":"○"}</span>
                <span style={{fontSize:11,color:r.ok?"var(--teal2)":"var(--t3)"}}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="pw-wrap" style={{display:"flex",border:"1.5px solid var(--sep)",borderRadius:12,overflow:"hidden"}}>
        <input className="input-field" style={{flex:1,minWidth:0,border:"none",borderRadius:0,background:"var(--input)"}} type={cfVis?"text":"password"} placeholder="Confirm password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} minLength={8} required autoComplete="new-password"/>
        <button type="button" onClick={()=>setCfVis(p=>!p)} style={{width:44,flexShrink:0,border:"none",borderRadius:0,background:"var(--input)",cursor:"pointer",color:confirmPw.length>0&&pw===confirmPw?"var(--teal2)":"var(--t4)",display:"flex",alignItems:"center",justifyContent:"center",opacity:.7}}
          onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.7}>
          {cfVis ?
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            :
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
          }
        </button>
      </div>
    </>
  );
}
