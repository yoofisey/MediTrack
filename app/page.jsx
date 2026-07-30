"use client";
import { useState, useEffect } from "react";
import { sb, fetchProfile } from "@/lib/supabase";
import { LanguageProvider } from "@/lib/i18n";
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

export default function App() {
  const [screen, setScreen]   = useState("loading");
  const [user,   setUser]     = useState(null);
  const [profile,setProfile]  = useState(null);
  const [hasSession, setHasSession] = useState(false);
  const [destScreen, setDestScreen] = useState(null);

  async function handleAuth(u, isNew = false) {
    setUser(u);
    try {
      const prof = await fetchProfile(u.id, u.user_metadata);
      setProfile(prof);
      smoothTransition(prof?.onboarded === true ? "app" : "onboarding");
    } catch {
      smoothTransition(isNew ? "onboarding" : "app");
    }
  }

  async function handleOnboardDone(prefs) {
    setProfile(p => ({ ...p, ...prefs, onboarded: true }));
    smoothTransition("app");
  }

  async function handleSignOut() {
    await sb.auth.signOut();
    setUser(null); setProfile(null); setScreen("landing");
  }

  function smoothTransition(target) {
    setDestScreen(target);
    setScreen("fading");
    setTimeout(() => setScreen(target), 420);
  }

  useEffect(() => {
    const MIN_LOAD_MS = 4500;
    const MAX_LOAD_MS = 7000;
    let cancelled = false;
    let       dest = "landing";

    async function init() {
      const start = Date.now();

      try {
        const oldAt = typeof localStorage !== "undefined" ? localStorage.getItem("mt_at") : null;
        if (oldAt && !localStorage.getItem("mt_sb_session")) {
          const oldRt = localStorage.getItem("mt_rt");
          await sb.auth.setSession({
            access_token: oldAt,
            refresh_token: oldRt,
          }).catch(() => {});
          localStorage.removeItem("mt_at");
          localStorage.removeItem("mt_rt");
        }
      } catch {}

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
      if (!cancelled) {
        setDestScreen(dest);
        setScreen("fading");
        setTimeout(() => { if (!cancelled) setScreen(dest); }, 420);
      }
    }

    init();
    const fallback = setTimeout(() => {
      if (!cancelled) {
        setDestScreen(dest);
        setScreen("fading");
        setTimeout(() => { if (!cancelled) setScreen(dest); }, 420);
      }
    }, MAX_LOAD_MS);
    return () => { cancelled = true; clearTimeout(fallback); };
  }, []);

  if (screen === "loading")    return <LanguageProvider><TransitionScreen showMessages={hasSession} /></LanguageProvider>;
  if (screen === "fading")     return (
    <LanguageProvider>
      {destScreen === "app" && user && <MainApp user={user} profile={profile} onSignOut={handleSignOut} />}
      {destScreen === "onboarding" && user && <Onboarding user={user} profile={profile} onDone={handleOnboardDone} />}
      {destScreen === "landing" && <LandingPage onGetStarted={() => setScreen("auth")} />}
      <TransitionScreen showMessages={hasSession} fadeOut />
    </LanguageProvider>
  );
  if (screen === "landing")    return <LanguageProvider><LandingPage onGetStarted={() => setScreen("auth")} /></LanguageProvider>;
  if (screen === "auth")       return <LanguageProvider><AuthScreen onAuth={handleAuth} /></LanguageProvider>;
  if (screen === "onboarding") return <LanguageProvider><Onboarding user={user} profile={profile} onDone={handleOnboardDone} /></LanguageProvider>;
  if (!user)                   return <LanguageProvider><TransitionScreen /></LanguageProvider>;
  return <LanguageProvider><MainApp user={user} profile={profile} onSignOut={handleSignOut} /></LanguageProvider>;
}
