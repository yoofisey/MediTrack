"use client";

import { useState } from "react";
import { CSS, Chevron } from "@/lib/constants";
import { THEMES } from "@/lib/data";
import { UpgradeModal, PrivacyModal, TermsModal } from "@/components/Modals";
import { initials } from "@/lib/household";
import { Bell, Palette, FileText, BarChart3, LogOut, Crown, HeartPulse } from "lucide-react";

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

export default function MeTab({ user, profile, household, plan, country, notifPerm, onEnableNotif, onSaveProfile, onSignOut, onOpenMember, onGenerateReport, onOpenReports, onOpenVitals }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const self = household.find(m => m.kind === "self") || {};
  const name = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Me";
  const members = household.filter(m => m.kind !== "self");
  const stack = [self, ...members].filter(Boolean).slice(0, 5);
  const notifOn = () => { try { return localStorage.getItem("mt_notif_on") === "1"; } catch { return false; } };
  const themeKeys = Object.keys(THEMES);

  return (
    <div className="scroll">
      <style>{CSS}</style>

      <div style={{ padding: "26px 20px 6px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", overflow: "hidden", background: "var(--ib1)", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 800, color: "var(--t1)", border: "2px solid var(--card)", boxShadow: "0 8px 20px rgba(0,0,0,.1)", flexShrink: 0 }}>
          {self.avatarUrl ? <img src={self.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials({ name })}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -.4, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "var(--ib2)", color: "var(--teal)" }}>
            <Crown size={12} /> {PLAN_LABELS[plan] || "Free"} plan
          </span>
        </div>
      </div>

      <div style={{ margin: "18px 20px", background: "var(--card)", borderRadius: 24, padding: 18, boxShadow: "var(--card-shadow)", border: "var(--card-border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)" }}>Your household</div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{members.length} of {plan === "family" ? 5 : plan === "enterprise" ? 999 : 0} profiles · {household.filter(m => !m.pending && m.kind !== "self").length} active</div>
          </div>
          <button className="nav-action" style={{ fontSize: 13 }} onClick={() => setShowUpgrade(true)}>Manage plan</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 16 }}>
          {stack.map((m, i) => (
            <div key={m.key} onClick={() => m.kind !== "self" && onOpenMember(m)} style={{
              width: 40, height: 40, borderRadius: "50%", overflow: "hidden", marginLeft: i > 0 ? -10 : 0,
              background: "var(--ib2)", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800, color: "var(--t1)",
              border: "2px solid var(--card)", boxShadow: "0 4px 10px rgba(0,0,0,.08)", cursor: m.kind === "self" ? "default" : "pointer", position: "relative", zIndex: stack.length - i,
            }}>
              {m.avatarUrl ? <img src={m.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(m)}
            </div>
          ))}
          {plan !== "family" && plan !== "enterprise" && (
            <div style={{ marginLeft: 10, fontSize: 12, color: "var(--t3)" }}>Upgrade to add profiles</div>
          )}
        </div>
      </div>

      <div className="section" style={{ paddingTop: 4 }}>
        <div className="list">
          <Row icon={<Ico><Bell size={20} /></Ico>} bg="var(--ib2)" title="Notifications" sub={notifPerm === "granted" ? "Dose reminders are on" : "Tap to enable dose reminders"}>
            <Toggle on={notifOn()} onChange={() => onEnableNotif()} />
          </Row>
          <Row icon={<Ico><Palette size={20} /></Ico>} bg="var(--ib4)" title="Appearance" sub="Accent color" onClick={() => setShowTheme(true)} />
          <Row icon={<Ico><BarChart3 size={20} /></Ico>} bg="var(--ib1)" title="My reports" sub="Adherence charts & history" onClick={() => onOpenReports()} />
          <Row icon={<Ico><HeartPulse size={20} /></Ico>} bg="var(--ib6)" title="Health readings" sub="Blood pressure, glucose & more" onClick={() => onOpenVitals()} />
          <Row icon={<Ico><FileText size={20} /></Ico>} bg="var(--ib3)" title="Family report for the doctor" sub="PDF of everyone's adherence" onClick={onGenerateReport} />
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
