"use client";

import { useState } from "react";
import { CSS, Chevron } from "@/lib/constants";
import { THEMES } from "@/lib/data";
import { UpgradeModal, PrivacyModal, TermsModal } from "@/components/Modals";
import { initials } from "@/lib/household";
import { Bell, Palette, BarChart3, LogOut, Crown, HeartPulse } from "lucide-react";

function Ico({ children, ...props }) {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }} {...props}>{children}</span>;
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={onChange}
      style={{ width: 48, height: 28, borderRadius: 99, background: on ? "var(--teal)" : "var(--sep)", position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: on ? 23 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
    </div>
  );
}

function Row({ icon, bg, title, sub, onClick, children }) {
  return (
    <div className="row" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="row-icon" style={{ background: bg || "var(--ib1)" }}>{icon}</div>
      <div className="row-body"><div className="row-title">{title}</div>{sub && <div className="row-sub">{sub}</div>}</div>
      {children}
      {onClick && !children && <Chevron />}
    </div>
  );
}

const PLAN_LABELS = { free: "Free", pro: "Pro", family: "Family", enterprise: "Enterprise" };

export default function MeTab({ user, profile, plan, country, notifPerm, onEnableNotif, onSaveProfile, onSignOut, onOpenReports, onGoVitals }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const name = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Me";
  const notifOn = () => { try { return localStorage.getItem("mt_notif_on") === "1"; } catch { return false; } };
  const themeKeys = Object.keys(THEMES);

  return (
    <div className="scroll">
      <style>{CSS}</style>

      <div style={{ padding: "26px 20px 6px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", overflow: "hidden", background: "var(--ib1)", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 800, color: "var(--t1)", border: "2px solid var(--card)", boxShadow: "0 8px 20px rgba(0,0,0,.1)", flexShrink: 0 }}>
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials({ name })}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -.4, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "var(--ib2)", color: "var(--teal)" }}>
            <Crown size={12} /> {PLAN_LABELS[plan] || "Free"} plan
          </span>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 4 }}>
        <div className="list">
          <Row icon={<Ico><Bell size={20} /></Ico>} bg="var(--ib2)" title="Notifications" sub={notifPerm === "granted" ? "Dose reminders are on" : "Tap to enable dose reminders"}>
            <Toggle on={notifOn()} onChange={() => onEnableNotif()} />
          </Row>
          <Row icon={<Ico><Palette size={20} /></Ico>} bg="var(--ib4)" title="Appearance" sub="Accent color" onClick={() => setShowTheme(true)} />
          <Row icon={<Ico><BarChart3 size={20} /></Ico>} bg="var(--ib1)" title="My reports" sub="Adherence charts & history" onClick={() => onOpenReports()} />
          {plan === "free" && <Row icon={<Ico><Crown size={20} /></Ico>} bg="var(--ib3)" title="Upgrade to Pro" sub="Unlimited meds, insights & advanced reports" onClick={() => setShowUpgrade(true)} />}
          {plan === "free"
            ? <Row icon={<Ico><HeartPulse size={20} /></Ico>} bg="var(--ib6)" title="Health readings" sub="Vitals tracking is a Pro feature" onClick={() => setShowUpgrade(true)} />
            : <Row icon={<Ico><HeartPulse size={20} /></Ico>} bg="var(--ib6)" title="Health readings" sub="Blood pressure, glucose & more" onClick={onGoVitals} />}
        </div>
      </div>

      <div className="section" style={{ paddingTop: 4 }}>
        <div className="list">
          <Row icon={<Ico><LogOut size={20} /></Ico>} bg="var(--ib6)" title="Sign out" sub={user?.email} onClick={onSignOut} />
        </div>
      </div>

      <div style={{ padding: "18px 20px 30px", display: "flex", gap: 18, justifyContent: "center" }}>
        <button onClick={() => setShowPrivacy(true)} style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Privacy</button>
        <button onClick={() => setShowTerms(true)} style={{ background: "none", border: "none", color: "var(--t3)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Terms</button>
      </div>

      {showTheme && (
        <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setShowTheme(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Appearance</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {themeKeys.map(k => (
                  <button key={k} onClick={() => { onSaveProfile({ theme: k }); setShowTheme(false); }} style={{
                    background: "none", border: profile?.theme === k ? `2px solid ${THEMES[k].accent}` : "2px solid var(--sep)",
                    borderRadius: 14, padding: 10, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontFamily: "inherit",
                  }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: THEMES[k].accent }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t2)", textTransform: "capitalize" }}>{k}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpgrade && (
        <UpgradeModal
          country={country}
          userEmail={user?.email}
          currentPlan={plan}
          onClose={() => setShowUpgrade(false)}
          onUpgrade={p => { onSaveProfile({ plan: p }); setShowUpgrade(false); }}
        />
      )}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}
