"use client";

import { useState, useEffect } from "react";
import { sb } from "@/lib/supabase";
import { CSS, GIcon, AuthLogo, RE_HAS_LOWER, RE_HAS_UPPER, RE_HAS_DIGIT, RE_HAS_SYMBOL, RE_EMAIL, RE_HTML_TAG, RE_DIGITS } from "@/lib/constants";
import { COUNTRIES, getPricing, TIER_LIMITS } from "@/lib/data";
import SentOtpView from "./SentOtpView";
import { CheckCircle2, Bell, Flame, BarChart3, Check, Circle, Globe } from "lucide-react";

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
    const { error } = await sb.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) { setObl(""); setErr(error.message); }
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
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, data: { full_name: cleanName, country, plan: tier } },
      });
      if (error) throw error;
      setPwStore(pw);
      startCooldown(60);
      setSent(true);
    } catch (e) {
      const m = e?.message || "";
      if (m.includes("SMTP") || m.includes("rate") || m.includes("timeout") || m.includes("unavailable") || m.includes("sending magic link")) {
        setErr("Email service not configured. Please try again later.");
      } else {
        setErr(m || "Something went wrong. Please try again.");
      }
    } finally { setBusy(false); }
  }

  async function handleResendOtp() {
    if (cooldown>0) return;
    setErr("");
    const { error } = await sb.auth.signInWithOtp({ email });
    if (error) {
      const m = error.message || "";
      setErr(m.includes("SMTP") || m.includes("rate") || m.includes("timeout") || m.includes("unavailable") ? "Email service not configured. Please try again later." : "Failed to resend - " + m);
    } else {
      startCooldown(60);
      setErr("Code resent - check your inbox.");
    }
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
      await sb.auth.updateUser({ password: pwStore });
      onAuth(vData.user, true);
    } catch (e) {
      setErr(e?.message || "Invalid or expired code.");
    } finally { setBusy(false); }
  }

  const selCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];
  const { pricing } = getPricing(country);

  const pwColors = ["rgba(255,255,255,.1)","#FF453A","#FF9500","#FFD60A","#34C759","#34C759"];

  if (view === "welcome") return (
    <div className="auth-screen" style={{justifyContent:"flex-end",padding:0}}>
      <style>{CSS}</style>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 32px 20px",color:"white",position:"relative",zIndex:1}}>
        <div style={{width:108,height:108,background:"rgba(255,255,255,.1)",borderRadius:32,display:"grid",placeItems:"center",marginBottom:24,backdropFilter:"blur(24px) saturate(1.6)",WebkitBackdropFilter:"blur(24px) saturate(1.6)",border:"1px solid rgba(255,255,255,.12)",boxShadow:"0 8px 40px rgba(0,0,0,.15),0 0 80px rgba(0,122,255,.08)",animation:"logoPop 1s cubic-bezier(.175,.885,.32,1.275) both"}}>
          <svg viewBox="0 0 48 48" width="52" height="52" fill="white">
            <rect x="17" y="4" width="14" height="40" rx="5" fill="white"/>
            <rect x="4" y="17" width="40" height="14" rx="5" fill="white"/>
          </svg>
        </div>
        <div style={{fontSize:38,fontWeight:800,letterSpacing:"-.5px",textAlign:"center",lineHeight:1.1,marginBottom:10,animation:"fadeUp .6s .15s cubic-bezier(.22,1,.36,1) both"}}>Adhera</div>
        <div style={{fontSize:17,fontWeight:500,opacity:.7,textAlign:"center",lineHeight:1.5,maxWidth:300,marginBottom:32,animation:"fadeUp .65s .3s cubic-bezier(.22,1,.36,1) both"}}>
          Your personal medication tracker
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",animation:"fadeUp .6s .4s cubic-bezier(.22,1,.36,1) both"}}>
          {[
            {icon:<CheckCircle2 size={14} color="white"/>,label:"Dose tracking"},
            {icon:<Bell size={14} color="white"/>,label:"Smart reminders"},
            {icon:<Flame size={14} color="white"/>,label:"Streak rewards"},
            {icon:<BarChart3 size={14} color="white"/>,label:"Adherence reports"},
          ].map(f=>(
            <div key={f.label} className="auth-feature-pill">
              <span style={{display:"inline-flex"}}>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="auth-welcome-card">
        <div style={{fontSize:24,fontWeight:700,marginBottom:4,color:"white",letterSpacing:"-.3px"}}>Get started</div>
        <div style={{fontSize:15,color:"rgba(255,255,255,.55)",marginBottom:22,lineHeight:1.4}}>Join thousands managing their health with Adhera</div>
        <button className="oauth-btn" onClick={()=>oauth("google")} disabled={!!obl} style={{marginBottom:12}}>
          {obl==="google"?"Redirecting...":<><GIcon/> Continue with Google</>}
        </button>
        <div className="divider">or</div>
        <button className="auth-btn auth-btn-primary" style={{marginBottom:12}} onClick={()=>setView("signup")}>Create free account</button>
        <button className="auth-btn auth-btn-ghost" style={{width:"100%"}} onClick={()=>setView("signin")}>Sign in to existing account</button>
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
          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
            <input className="auth-input" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>
            <div className="pw-wrap" style={{display:"flex"}}>
              <input className="auth-input" style={{flex:1,minWidth:0,border:"none",borderRadius:0,background:"transparent"}} type={pwShow?"text":"password"} placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} minLength={8} required autoComplete="current-password"/>
              <button type="button" onClick={()=>setPwShow(p=>!p)} style={{width:44,flexShrink:0,border:"none",borderRadius:0,background:"transparent",cursor:"pointer",color:"rgba(255,255,255,.4)",display:"flex",alignItems:"center",justifyContent:"center"}}
                onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.4)"}>
                {pwShow ?
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg> :
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
                }
              </button>
            </div>
          </div>
          <button className="auth-btn auth-btn-primary" type="submit" disabled={busy}>{busy?"Signing in...":"Sign in"}</button>
        </form>
        <div className="auth-switch">
          New to Adhera? <button onClick={()=>{setView("signup");setErr("");}}>Create account</button>
          <span style={{margin:"0 8px",color:"rgba(255,255,255,.2)"}}>·</span>
          <button onClick={()=>setView("welcome")} style={{color:"rgba(255,255,255,.5)"}}>Back</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card" key="signup">
        <AuthLogo/>
        <div className="auth-title">Create your account</div>
        <div className="auth-sub">Free forever · Upgrade anytime</div>

        <div className="oauth-stack">
          <button className="oauth-btn" onClick={()=>oauth("google")} disabled={!!obl}>{obl==="google"?"Redirecting...":<><GIcon/> Continue with Google</>}</button>
        </div>
        <div className="divider">or sign up with email</div>

        {err && <div className="err-msg">{err}</div>}

        <form onSubmit={handleSignUp}>
          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
            <input className="auth-input" type="text" placeholder="Full name" value={name} onChange={e=>setName(sanitizeHtml(e.target.value))} required autoComplete="name"/>
            <input className="auth-input" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value.trim())} required autoComplete="email"/>
            <PwFields pw={pw} setPw={setPw} confirmPw={confirmPw} setConfirmPw={setConfirmPw} pwScore={pwScore} pwColors={pwColors} RE_HAS_LOWER={RE_HAS_LOWER} RE_HAS_UPPER={RE_HAS_UPPER} RE_HAS_DIGIT={RE_HAS_DIGIT} RE_HAS_SYMBOL={RE_HAS_SYMBOL}/>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",zIndex:1,display:"inline-flex",color:"rgba(255,255,255,.5)"}}><Globe size={18}/></div>
              <select className="auth-select" style={{paddingLeft:40}} value={country} onChange={e=>setCountry(e.target.value)}>
                {COUNTRIES.map(c=>(<option key={c.code} value={c.code}>{c.name}</option>))}
              </select>
            </div>
            <div style={{border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"14px 16px",background:"rgba(255,255,255,.04)"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,.45)",fontWeight:600,textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:4}}><Globe size={12}/> {selCountry.name} — Choose plan</span>
              </div>
              <div className="auth-plan-grid">
                <div className={`auth-plan${tier==="free"?" selected":""}`} onClick={()=>setTier("free")}>
                  <div className="auth-plan-name">Free</div>
                  <div className="auth-plan-price">Free</div>
                  <div className="auth-plan-desc">{TIER_LIMITS.free.maxMeds} meds · {TIER_LIMITS.free.history}d</div>
                </div>
                <div className={`auth-plan${tier==="pro"?" selected":""}`} onClick={()=>setTier("pro")}>
                  <div className="auth-plan-name">Pro</div>
                  <div className="auth-plan-price">{pricing.pro.label}<span style={{fontSize:10,fontWeight:400,opacity:.6}}>/mo</span></div>
                  <div className="auth-plan-desc">Unlimited · Full history</div>
                </div>
                <div className={`auth-plan${tier==="family"?" selected":""}`} onClick={()=>setTier("family")}>
                  <div className="auth-plan-name">Family</div>
                  <div className="auth-plan-price">{pricing.family.label}<span style={{fontSize:10,fontWeight:400,opacity:.6}}>/mo</span></div>
                  <div className="auth-plan-desc">5 profiles · Dashboard</div>
                </div>
              </div>
            </div>
          </div>
          <button className="auth-btn auth-btn-primary" type="submit" disabled={busy}>
            {busy ? "Processing..." : "Create free account"}
          </button>
        </form>
        <div style={{fontSize:12,color:"rgba(255,255,255,.35)",textAlign:"center",marginTop:14,lineHeight:1.5}}>
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </div>
        <div className="auth-switch">
          Already have an account? <button onClick={()=>{setView("signin");setErr("");}}>Sign in</button>
          <span style={{margin:"0 8px",color:"rgba(255,255,255,.2)"}}>·</span>
          <button onClick={()=>setView("welcome")} style={{color:"rgba(255,255,255,.5)"}}>Back</button>
        </div>
      </div>
    </div>
  );
}

function PwFields({ pw, setPw, confirmPw, setConfirmPw, pwScore, pwColors, RE_HAS_LOWER, RE_HAS_UPPER, RE_HAS_DIGIT, RE_HAS_SYMBOL }) {
  const [pwVis, setPwVis] = useState(false);
  const [cfVis, setCfVis] = useState(false);
  return (
    <>
      <div className="pw-wrap" style={{display:"flex"}}>
        <input className="auth-input" style={{flex:1,minWidth:0,border:"none",borderRadius:0,background:"transparent"}} type={pwVis?"text":"password"} placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} minLength={8} required autoComplete="new-password"/>
        <button type="button" onClick={()=>setPwVis(p=>!p)} style={{width:44,flexShrink:0,border:"none",borderRadius:0,background:"transparent",cursor:"pointer",color:"rgba(255,255,255,.4)",display:"flex",alignItems:"center",justifyContent:"center"}}
          onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,.7)"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.4)"}>
          {pwVis ?
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            :
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
          }
        </button>
      </div>
      {pw.length > 0 && (
        <div style={{marginTop:-4,marginBottom:4,fontSize:12}}>
          <div className="auth-pw-bar">
            {[0,1,2,3,4].map(i=>{
              const score = pwScore(pw);
              return <div key={i} className="auth-pw-segment" style={{background:i<score?pwColors[score]:"rgba(255,255,255,.08)"}}/>;
            })}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"2px 12px"}}>
            {[
              { label:"8+ chars", ok:pw.length>=8 },
              { label:"Upper & lower", ok:Boolean(RE_HAS_LOWER.test(pw) && RE_HAS_UPPER.test(pw)) },
              { label:"Number", ok:Boolean(RE_HAS_DIGIT.test(pw)) },
              { label:"Symbol", ok:Boolean(RE_HAS_SYMBOL.test(pw)) },
            ].map(r=>(
              <div key={r.label} className="auth-pw-check" style={{color:r.ok?"#34C759":"rgba(255,255,255,.3)"}}>
                <span style={{fontWeight:700,display:"inline-flex"}}>{r.ok ? <Check size={12}/> : <Circle size={12}/>}</span>
                <span>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="pw-wrap" style={{display:"flex"}}>
        <input className="auth-input" style={{flex:1,minWidth:0,border:"none",borderRadius:0,background:"transparent"}} type={cfVis?"text":"password"} placeholder="Confirm password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} minLength={8} required autoComplete="new-password"/>
        <button type="button" onClick={()=>setCfVis(p=>!p)} style={{width:44,flexShrink:0,border:"none",borderRadius:0,background:"transparent",cursor:"pointer",color:confirmPw.length>0&&pw===confirmPw?"#34C759":"rgba(255,255,255,.4)",display:"flex",alignItems:"center",justifyContent:"center"}}
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
