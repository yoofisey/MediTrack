"use client";
import { useState, useEffect } from "react";
import { sb, fetchProfile } from "@/lib/supabase";
import TransitionScreen from "@/components/TransitionScreen";
import AuthScreen from "@/components/AuthScreen";
import Onboarding from "@/components/Onboarding";
import MainApp from "@/components/MainApp";
import LandingPage from "@/components/LandingPage";

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
  const [screen, setScreen]   = useState("loading");
  const [user,   setUser]     = useState(null);
  const [profile,setProfile]  = useState(null);
  const [hasSession, setHasSession] = useState(false);

  async function handleAuth(u, isNew = false) {
    setUser(u);
    try {
      const prof = await fetchProfile(u.id, u.user_metadata);
      setProfile(prof);
      setScreen(prof?.onboarded === true ? "app" : "onboarding");
    } catch {
      setScreen(isNew ? "onboarding" : "app");
    }
  }

  async function handleOnboardDone(prefs) {
    setProfile(p => ({ ...p, ...prefs, onboarded: true }));
    setScreen("app");
  }

  async function handleSignOut() {
    await sb.auth.signOut();
    setUser(null); setProfile(null); setScreen("landing");
  }

  useEffect(() => {
    const MIN_LOAD_MS = 4500;
    const MAX_LOAD_MS = 7000;
    let cancelled = false;
    let       dest = "landing";

    async function init() {
      const start = Date.now();
      try {
        const { data } = await sb.auth.getUser();
        const u = data?.user ?? null;
        if (cancelled) return;
        if (u) {
          setUser(u);
          setHasSession(true);
          const prof = await fetchProfile(u.id, u.user_metadata);
          if (cancelled) return;
          setProfile(prof);
          dest = prof?.onboarded === true ? "app" : "onboarding";
        }
      } catch {}
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_LOAD_MS - elapsed);
      await new Promise(r => setTimeout(r, remaining));
      if (!cancelled) setScreen(dest);
    }

    init();
    const fallback = setTimeout(() => { if (!cancelled) setScreen(dest); }, MAX_LOAD_MS);
    return () => { cancelled = true; clearTimeout(fallback); };
  }, []);

  useEffect(() => {
    if (screen !== "transition") return;
    const t = setTimeout(() => setScreen("auth"), 1800);
    return () => clearTimeout(t);
  }, [screen]);

  if (screen === "loading")    return <TransitionScreen showMessages={hasSession} />;
  if (screen === "landing")    return <LandingPage onGetStarted={() => setScreen("transition")} />;
  if (screen === "transition") return <TransitionScreen />;
  if (screen === "auth")       return <AuthScreen onAuth={handleAuth} />;
  if (screen === "onboarding") return <Onboarding user={user} profile={profile} onDone={handleOnboardDone} />;
  if (!user)                   return <TransitionScreen />;
  return <MainApp user={user} profile={profile} onSignOut={handleSignOut} />;
}
