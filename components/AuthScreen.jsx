"use client";

import { useState, useEffect } from "react";
import { sb, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { CSS, GIcon, AuthLogo } from "@/lib/constants";
import { COUNTRIES, getPricing } from "@/lib/data";

export default function AuthScreen({ onAuth }) {
  const [view, setView]     = useState("welcome");
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [name, setName]     = useState("");
  const [country, setCountry] = useState("GH");
  const [otp, setOtp]       = useState("");
  const [busy, setBusy]     = useState(false);
  const [obl, setObl]       = useState("");
  const [err, setErr]       = useState("");
  const [sent, setSent]     = useState(false);

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
      if (error) throw new Error(error?.message || "Login failed — please check your credentials.");
      if (!data?.user) throw new Error("Login failed — please check your credentials.");
      onAuth(data.user, false);
    } catch (e) {
      setErr(e?.message || "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  function sanitize(str) { return str.replace(/<[^>]*>/g,"").trim(); }

  function pwScore(p) {
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  }

  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  async function handleSignUp(e) {
    e.preventDefault(); setBusy(true); setErr("");
    const cleanName = sanitize(name);
    if (!cleanName) { setErr("Please enter your name."); setBusy(false); return; }
    if (!isValidEmail(email)) { setErr("Please enter a valid email address."); setBusy(false); return; }
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); setBusy(false); return; }
    if (pw !== confirmPw) { setErr("Passwords do not match."); setBusy(false); return; }
    if (pwScore(pw) < 3) { setErr("Password is too weak — use a mix of upper/lowercase, numbers, and symbols."); setBusy(false); return; }
    try {
      const { data, error } = await sb.auth.signUp({
        email, password: pw,
        options: { data: { full_name: cleanName, country } },
      });
      if (error) throw new Error(error?.message || "Sign up failed — please try again.");
      if (data?.user?.identities?.length === 0) throw new Error("Email already registered — sign in instead.");
      if (data?.session?.access_token) onAuth(data.user, true);
      else setSent(true);
    } catch (e) {
      setErr(e?.message || "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  async function handleOtpVerify(e) {
    e.preventDefault();
    if (otp.length < 6) { setErr("Enter the 6-digit code from your email."); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ type: "signup", email, token: otp }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.message || d?.error_description || "Invalid or expired code.");
      if (d?.access_token) {
        try { localStorage.setItem("mt_at", d.access_token); if (d.refresh_token) localStorage.setItem("mt_rt", d.refresh_token); } catch {}
        onAuth(d.user, true);
      } else {
        throw new Error("Verification failed — please try again.");
      }
    } catch (e) {
      setErr(e?.message || "Verification failed.");
    } finally { setBusy(false); }
  }

  if (sent) return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card">
        <AuthLogo/>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:48,marginBottom:12}}>📬</div>
          <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Check your email</div>
          <div style={{fontSize:15,color:"var(--t3)",lineHeight:1.5}}>
            We sent a 6-digit code to <strong style={{color:"var(--t1)"}}>{email}</strong>
          </div>
        </div>
        {err && <div className="err-msg">{err}</div>}
        <form onSubmit={handleOtpVerify}>
          <div style={{marginBottom:16}}>
            <input
              className="input-field"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
              style={{textAlign:"center",fontSize:28,fontWeight:700,letterSpacing:12}}
              autoFocus
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy || otp.length < 6}>
            {busy ? "Verifying…" : "Verify email"}
          </button>
        </form>
        <div style={{textAlign:"center",marginTop:16,fontSize:14,color:"var(--t3)"}}>
          Didn&apos;t get it?{" "}
          <button
            style={{background:"none",border:"none",color:"var(--teal)",fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}
            onClick={async () => {
              setErr("");
              try {
                await fetch(`${SUPABASE_URL}/auth/v1/resend`, {
                  method:"POST",
                  headers:{"Content-Type":"application/json",apikey:SUPABASE_ANON_KEY},
                  body: JSON.stringify({ type:"signup", email }),
                });
              } catch {}
              setErr("Code resent — check your inbox.");
            }}
          >
            Resend code
          </button>
          {" · "}
          <button
            style={{background:"none",border:"none",color:"var(--t3)",cursor:"pointer",fontSize:14,fontFamily:"inherit"}}
            onClick={() => { setSent(false); setOtp(""); setErr(""); }}
          >
            Back
          </button>
        </div>
        <div style={{marginTop:20,padding:"12px 14px",background:"var(--bg)",borderRadius:10}}>
          <div style={{fontSize:13,color:"var(--t3)",lineHeight:1.6}}>
            💡 <strong>Tip:</strong> You can also click the link in the email directly — it will sign you in automatically.
          </div>
        </div>
      </div>
    </div>
  );

  if (view === "welcome") return (
    <div className="auth-screen" style={{background:"linear-gradient(160deg,#0A2463 0%,#0A84FF 60%,#32ADE6 100%)",justifyContent:"flex-end",paddingBottom:0}}>
      <style>{CSS}</style>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px 24px",color:"white"}}>
        <div style={{fontSize:72,marginBottom:16,filter:"drop-shadow(0 8px 24px rgba(0,0,0,.3))"}}>💊</div>
        <div style={{fontSize:32,fontWeight:800,letterSpacing:"-1px",textAlign:"center",lineHeight:1.1,marginBottom:12}}>
          Never miss a<br/>dose again
        </div>
        <div style={{fontSize:16,opacity:.85,textAlign:"center",lineHeight:1.6,maxWidth:300}}>
          Track medications, get smart reminders, and stay on top of your health — all in one place.
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginTop:24}}>
          {["💊 Dose tracking","🔔 Smart reminders","🔥 Streak rewards","📊 Adherence reports"].map(f=>(
            <div key={f} style={{background:"rgba(255,255,255,.15)",backdropFilter:"blur(10px)",borderRadius:99,padding:"6px 14px",fontSize:13,fontWeight:500,color:"white"}}>{f}</div>
          ))}
        </div>
      </div>
      <div style={{background:"white",borderRadius:"24px 24px 0 0",padding:"28px 24px calc(28px + env(safe-area-inset-bottom,0px))",width:"100%"}}>
        <div style={{fontSize:22,fontWeight:700,marginBottom:6,color:"var(--t1)"}}>Get started</div>
        <div style={{fontSize:15,color:"var(--t3)",marginBottom:20}}>Join thousands managing their health with MediTrack</div>
        <div className="oauth-stack" style={{marginBottom:16}}>
          <button className="oauth-btn" onClick={()=>oauth("google")} disabled={!!obl} style={{background:"#fff"}}>
            {obl==="google"?"Redirecting…":<><GIcon/> Continue with Google</>}
          </button>
        </div>
        <div className="divider">or</div>
        <button className="btn btn-primary" style={{marginBottom:12}} onClick={()=>setView("signup")}>Create free account</button>
        <button className="btn btn-ghost" onClick={()=>setView("signin")}>Sign in to existing account</button>
      </div>
    </div>
  );

  if (view === "signin") return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card">
        <AuthLogo/>
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Sign in to manage your medications</div>
        <div className="oauth-stack">
          <button className="oauth-btn" onClick={()=>oauth("google")} disabled={!!obl}>{obl==="google"?"Redirecting…":<><GIcon/> Continue with Google</>}</button>
        </div>
        <div className="divider">or sign in with email</div>
        {err && <div className="err-msg">{err}</div>}
        <form onSubmit={handleSignIn}>
          <div className="input-group">
            <input className="input-field" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>
            <input className="input-field" type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} minLength={8} required autoComplete="current-password"/>
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy?"Signing in…":"Sign in"}</button>
        </form>
        <div className="auth-switch">
          New to MediTrack? <button onClick={()=>{setView("signup");setErr("");}}>Create account</button>
          <span style={{margin:"0 8px",color:"var(--sep)"}}>·</span>
          <button onClick={()=>setView("welcome")} style={{color:"var(--t3)"}}>Back</button>
        </div>
      </div>
    </div>
  );

  const selCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];
  const { pricing } = getPricing(country);

  return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card" style={{maxWidth:440}}>
        <AuthLogo/>
        <div className="auth-title">Create your account</div>
        <div className="auth-sub">Free forever · Upgrade anytime</div>
        <div className="oauth-stack">
          <button className="oauth-btn" onClick={()=>oauth("google")} disabled={!!obl}>{obl==="google"?"Redirecting…":<><GIcon/> Continue with Google</>}</button>
        </div>
        <div className="divider">or sign up with email</div>
        {err && <div className="err-msg">{err}</div>}
        <form onSubmit={handleSignUp}>
          <div className="input-group">
            <input className="input-field" type="text" placeholder="Full name" value={name} onChange={e=>setName(sanitize(e.target.value))} required autoComplete="name"/>
            <input className="input-field" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value.trim())} required autoComplete="email"/>
            <input className="input-field" type="password" placeholder="Password (8+ characters)" value={pw} onChange={e=>setPw(e.target.value)} minLength={8} required autoComplete="new-password"/>
            {pw.length > 0 && (
              <div style={{display:"flex",gap:4,marginTop:-8}}>
                {[1,2,3,4,5].map(i=>(
                  <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=pwScore(pw)?["#FF453A","#FF9500","#FFD60A","#34C759","#30D158"][i-1]:"var(--sep)",transition:"background .2s"}}/>
                ))}
              </div>
            )}
            <input className="input-field" type="password" placeholder="Confirm password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} minLength={8} required autoComplete="new-password"/>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:20,pointerEvents:"none",zIndex:1}}>
                {selCountry.flag}
              </div>
              <select
                className="input-field"
                value={country}
                onChange={e=>setCountry(e.target.value)}
                style={{paddingLeft:46}}
              >
                {COUNTRIES.map(c=>(
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{background:"linear-gradient(135deg,#EFF6FF,#F0FDF4)",border:"1px solid #BFDBFE",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:12,color:"var(--t3)",fontWeight:600,textTransform:"uppercase",letterSpacing:".3px",marginBottom:8}}>
              {selCountry.flag} {selCountry.name} pricing
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div style={{background:"white",borderRadius:8,padding:"8px 10px",border:"1px solid #E0F2FE"}}>
                <div style={{fontSize:11,color:"var(--t3)",marginBottom:2}}>Free plan</div>
                <div style={{fontSize:16,fontWeight:700,color:"var(--teal2)"}}>Free</div>
                <div style={{fontSize:11,color:"var(--t3)"}}>3 medications</div>
              </div>
              <div style={{background:"white",borderRadius:8,padding:"8px 10px",border:"1px solid #BFDBFE"}}>
                <div style={{fontSize:11,color:"var(--t3)",marginBottom:2}}>Pro plan</div>
                <div style={{fontSize:16,fontWeight:700,color:"var(--teal)"}}>{pricing.pro.label}<span style={{fontSize:11,fontWeight:400}}>/mo</span></div>
                <div style={{fontSize:11,color:"var(--t3)"}}>Unlimited + more</div>
              </div>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy?"Creating account…":"Create free account"}</button>
        </form>
        <div style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginTop:12,lineHeight:1.5}}>
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
