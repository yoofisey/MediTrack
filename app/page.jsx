"use client";
import { useState, useEffect } from "react";
import { sb, fetchProfile } from "@/lib/supabase";
import { THEMES } from "@/lib/data";
import TransitionScreen from "@/components/TransitionScreen";
import AuthScreen from "@/components/AuthScreen";
import Onboarding from "@/components/Onboarding";
import MainApp from "@/components/MainApp";

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); });
}

(function detectSystemTheme() {
  if (typeof window === "undefined") return;
  try {
    const pref = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    sessionStorage.setItem("mt_sys_theme", pref);
  } catch {}
})();

(function captureOAuthTokens() {
  if (typeof window === "undefined") return;
  try {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const at = hash.get("access_token");
    const rt = hash.get("refresh_token");
    if (at) {
      localStorage.setItem("mt_at", at);
      if (rt) localStorage.setItem("mt_rt", rt);
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }
    const qs = new URLSearchParams(window.location.search);
    const code = qs.get("code");
    if (code) {
      sessionStorage.setItem("mt_code", code);
      window.history.replaceState(null, "", window.location.pathname);
    }
  } catch {}
})();

export default function App() {
  const [screen, setScreen]   = useState("splash");
  const [user,   setUser]     = useState(null);
  const [profile,setProfile]  = useState(null);
  const [splash, setSplash]   = useState({ emoji:"💊", message:"Adhera", sub:"Your Personal Treatment Companion" });

  async function resolveUser() {
    const { data } = await sb.auth.getUser();
    return data?.user ?? null;
  }

  async function go(u, escapeTimer) {
    if (!u) { if (escapeTimer) clearTimeout(escapeTimer); setScreen("auth"); return; }
    setUser(u);
    const displayName = u.user_metadata?.full_name?.split(" ")[0] || u.email?.split("@")[0] || "";
    setSplash({ emoji:"👋", message: displayName ? `Hey, ${displayName}!` : "Welcome back!", sub:"Loading your medications…" });
    try {
      const prof = await fetchProfile(u.id, u.user_metadata);
      setProfile(prof);
      await new Promise(r => setTimeout(r, 800));
      const dest = prof?.onboarded === true ? "app" : "onboarding";
      if (escapeTimer) clearTimeout(escapeTimer);
      setScreen(dest);
    } catch {
      await new Promise(r => setTimeout(r, 800));
      if (escapeTimer) clearTimeout(escapeTimer);
      setScreen("auth");
    }
  }

  useEffect(() => {
    const escape = setTimeout(() => setScreen(s => s === "splash" ? "auth" : s), 6000);
    resolveUser()
      .then(u => go(u, escape))
      .catch(() => { clearTimeout(escape); setScreen("auth"); });
  }, []);

  async function handleAuth(u, isNew = false) {
    setUser(u);
    setSplash({
      emoji: isNew ? "🎉" : "👋",
      message: isNew ? "Account created!" : "Welcome back!",
      sub: isNew ? "Setting up your experience…" : "Loading your medications…",
    });
    setScreen("splash");
    try {
      const prof = await fetchProfile(u.id, u.user_metadata);
      setProfile(prof);
      await new Promise(r => setTimeout(r, 800));
      const dest = prof?.onboarded === true ? "app" : "onboarding";
      setScreen(dest);
    } catch {
      await new Promise(r => setTimeout(r, 800));
      setScreen(isNew ? "onboarding" : "app");
    }
  }

  async function handleOnboardDone(prefs) {
    setProfile(p => ({ ...p, ...prefs, onboarded: true }));
    setSplash({ emoji:"🌟", message:"You're all set!", sub:"Your Personal Treatment Companion" });
    setScreen("splash");
    await new Promise(r => setTimeout(r, 1200));
    setScreen("app");
  }

  async function handleSignOut() {
    await sb.auth.signOut();
    setUser(null); setProfile(null); setScreen("auth");
  }

  if (screen === "splash")     return <TransitionScreen {...splash} />;
  if (screen === "auth")       return <AuthScreen onAuth={handleAuth} />;
  if (screen === "onboarding") return <Onboarding user={user} profile={profile} onDone={handleOnboardDone} />;
  if (!user)                   return <TransitionScreen emoji="💊" message="Adhera" sub="Your Personal Treatment Companion" />;
  return <MainApp user={user} profile={profile} onSignOut={handleSignOut} />;
}
