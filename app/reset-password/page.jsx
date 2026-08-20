"use client";

import { useState, useEffect } from "react";
import { sb } from "@/lib/supabase";
import { CSS, AuthLogo, RE_HAS_LOWER, RE_HAS_UPPER, RE_HAS_DIGIT, RE_HAS_SYMBOL } from "@/lib/constants";

export default function ResetPasswordPage() {
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [vis, setVis] = useState(false);
  const [ready, setReady] = useState(false);
  const [sessionErr, setSessionErr] = useState("");

  useEffect(() => {
    let timeout;

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        clearTimeout(timeout);
      }
    });

    const tryParseUrl = () => {
      try {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const queryParams = new URLSearchParams(url.search);

        const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") || queryParams.get("refresh_token");
        const tokenHash = hashParams.get("token_hash") || queryParams.get("token_hash");
        const type = hashParams.get("type") || queryParams.get("type");

        if (type === "recovery" && accessToken && refreshToken) {
          sb.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            .then(({ error }) => {
              if (!error) { setReady(true); clearTimeout(timeout); }
            })
            .catch(() => {});
        } else if (type === "recovery" && tokenHash) {
          sb.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
            .then(({ error }) => {
              if (!error) { setReady(true); clearTimeout(timeout); }
            })
            .catch(() => {});
        }
      } catch {}
    };

    tryParseUrl();
    window.addEventListener("hashchange", tryParseUrl);
    window.addEventListener("popstate", tryParseUrl);

    timeout = setTimeout(() => {
      if (!ready) {
        setSessionErr("Invalid or expired reset link. Please request a new one from the app.");
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
      window.removeEventListener("hashchange", tryParseUrl);
      window.removeEventListener("popstate", tryParseUrl);
    };
  }, []);

  function pwScore(p) {
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (RE_HAS_LOWER.test(p) && RE_HAS_UPPER.test(p)) s++;
    if (RE_HAS_DIGIT.test(p)) s++;
    if (RE_HAS_SYMBOL.test(p)) s++;
    return s;
  }

  async function handleReset(e) {
    e.preventDefault();
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (pw !== confirmPw) { setErr("Passwords do not match."); return; }
    if (pwScore(pw) < 3) { setErr("Password is too weak — use a mix of upper/lowercase, numbers, and symbols."); return; }
    setBusy(true); setErr("");
    try {
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) throw error;
      await sb.auth.signOut().catch(() => {});
      window.history.replaceState(null, "", window.location.pathname);
      setDone(true);
    } catch (e2) {
      setErr(e2?.message || "This reset link is invalid or has expired. Please request a new one.");
    } finally { setBusy(false); }
  }

  if (sessionErr) return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card">
        <AuthLogo />
        <div className="auth-title">Reset failed</div>
        <div className="auth-sub">{sessionErr}</div>
        <a className="auth-btn auth-btn-primary" href="/" style={{ textDecoration: "none", textAlign: "center" }}>Open Adhera</a>
      </div>
    </div>
  );

  if (done) return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card">
        <AuthLogo />
        <div className="auth-title">Password updated</div>
        <div className="auth-sub">You can now sign in with your new password.</div>
        <a className="auth-btn auth-btn-primary" href="/" style={{ textDecoration: "none", textAlign: "center" }}>Open Adhera</a>
      </div>
    </div>
  );

  if (!ready) return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card">
        <AuthLogo />
        <div className="auth-title">Loading...</div>
        <div className="auth-sub">Verifying your reset link.</div>
      </div>
    </div>
  );

  return (
    <div className="auth-screen"><style>{CSS}</style>
      <div className="auth-card">
        <AuthLogo />
        <div className="auth-title">Set a new password</div>
        <div className="auth-sub">Choose a new password for your account.</div>
        {err && <div className="err-msg">{err}</div>}
        <form onSubmit={handleReset}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            <input className="auth-input" type={vis ? "text" : "password"} placeholder="New password" value={pw} onChange={e => setPw(e.target.value)} minLength={8} required autoComplete="new-password" />
            <input className="auth-input" type={vis ? "text" : "password"} placeholder="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} minLength={8} required autoComplete="new-password" />
          </div>
          <button className="auth-btn auth-btn-primary" type="submit" disabled={busy}>{busy ? "Saving..." : "Update password"}</button>
        </form>
        <div className="auth-switch">
          <button type="button" onClick={() => setVis(v => !v)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
            {vis ? "Hide passwords" : "Show passwords"}
          </button>
        </div>
      </div>
    </div>
  );
}
