"use client";

import { useState } from "react";
import { CSS } from "@/lib/constants";
import { insertFamilyMember, insertManagedFamilyMember, removeFamilyMember } from "@/lib/db";
import { memberStatus, initials } from "@/lib/household";
import { UpgradeModal } from "@/components/Modals";
import { Users, Plus, ChevronRight, Mail } from "lucide-react";

function Ico({ children, ...props }) {
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }} {...props}>{children}</span>;
}

export default function FamilyTab({ household, plan, country, userEmail, onSaveProfile, onOpenMember, onChanged }) {
  const [showAdd, setShowAdd] = useState(false);
  const [mode, setMode] = useState("invite");
  const [email, setEmail] = useState("");
  const [mname, setMname] = useState("");
  const [rel, setRel] = useState("Child");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [removeId, setRemoveId] = useState(null);
  const [sent, setSent] = useState(false);

  async function sendInviteEmail(to) {
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, senderName: userEmail || "Adhera Team" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        console.error("Invite email error:", data?.error || res.status);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Failed to send invite email:", e);
      return false;
    }
  }

  const isFamily = plan === "family";
  const members = household.filter(m => m.kind !== "self");
  const maxMembers = isFamily ? 5 : 0;
  const slotsLeft = Math.max(0, maxMembers - members.length);

  const toneColors = { teal: ["var(--ib2)", "#0A7A54"], red: ["var(--ib6)", "#D9382E"], gray: ["var(--hover)", "var(--t3)"], green: ["#E8F7EC", "#1F8A3D"] };

  async function doAdd() {
    setErr("");
    if (mode === "invite") {
      if (!email.trim() || !email.includes("@")) { setErr("Enter a valid email address."); return; }
      setBusy(true);
      try {
        const { error, data } = await insertFamilyMember(userId(), email);
        if (error) { setErr(error.message || "Could not send invite."); }
        else {
          const sent = await sendInviteEmail(email);
          if (sent) { setSent(true); }
          reset(); onChanged();
        }
      } catch (e) { setErr(e?.message || "Could not send invite."); }
      setBusy(false);
      return;
    }
    if (!mname.trim()) { setErr("Enter a name."); return; }
    setBusy(true);
    try {
      const { error } = await insertManagedFamilyMember(userId(), {
        member_name: mname.trim(),
        relationship: rel,
        age: age ? parseInt(age) : null,
        phone: phone.trim() || null,
      });
      if (error) { setErr(error.message || "Could not add."); }
      else { reset(); onChanged(); }
    } catch (e) { setErr(e?.message || "Could not add."); }
    setBusy(false);
  }

  function userId() {
    return household.find(m => m.kind === "self")?.userId || "";
  }

  function reset() {
    setEmail(""); setMname(""); setAge(""); setPhone(""); setShowAdd(false); setMode("invite"); setErr("");
  }

  async function doRemove() {
    const id = removeId;
    setRemoveId(null);
    if (!id) return;
    try { await removeFamilyMember(id); onChanged(); } catch (e) { console.error("remove:", e); }
  }

  return (
    <div className="scroll">
      <style>{CSS}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 0" }}>
        <div className="nav-large" style={{ padding: 0 }}>Family</div>
        {isFamily && slotsLeft > 0 && (
          <button className="nav-action" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }} onClick={() => setShowAdd(true)}>
            <Plus size={16} strokeWidth={2.5} /> Add
          </button>
        )}
      </div>

      {!isFamily ? (
        <div className="upgrade-card" style={{ margin: "16px 20px" }}>
          <div className="upgrade-title">Track your family's medications</div>
          <div className="upgrade-sub">Add up to 5 profiles — a partner, kids, or aging parents. Get caregiver alerts when a dose is missed.</div>
          <button className="upgrade-btn" onClick={() => setShowUpgrade(true)}>Upgrade to Family →</button>
        </div>
      ) : members.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 60 }}>
          <div className="empty-state-icon"><Users size={52} strokeWidth={1.5} /></div>
          <div className="empty-state-title">No family members yet</div>
          <div className="empty-state-sub">Add your loved ones to see their medications at a glance.</div>
          <button className="btn btn-primary" style={{ width: "auto", marginTop: 14, padding: "12px 24px" }} onClick={() => setShowAdd(true)}>
            <Plus size={17} strokeWidth={2.5} /> Add family member
          </button>
        </div>
      ) : (
        <>
          <div style={{ padding: "4px 20px 2px", display: "flex", gap: 6, alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "var(--t3)", fontWeight: 600 }}>{members.length} of {maxMembers} profiles used</span>
            <div style={{ flex: 1, height: 4, borderRadius: 99, background: "var(--sep)", overflow: "hidden" }}>
              <div style={{ width: `${(members.length / maxMembers) * 100}%`, height: "100%", background: "var(--teal)", borderRadius: 99 }} />
            </div>
          </div>

          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {members.map(m => {
              const st = memberStatus(m);
              const tone = toneColors[st.tone] || toneColors.gray;
              return (
                <div key={m.key} onClick={() => !m.pending && onOpenMember(m)} style={{
                  background: "var(--card)", borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", border: "var(--card-border)",
                  display: "flex", alignItems: "center", gap: 14, cursor: m.pending ? "default" : "pointer",
                }}>
                  <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", background: "var(--ib1)", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 800, color: "var(--t1)", flexShrink: 0, border: "2px solid var(--card)", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
                    {m.avatarUrl ? <img src={m.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(m)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                    <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                      {m.pending && <Ico><Mail size={12} /></Ico>}
                      {m.pending ? "Waiting for them to accept" : [m.relationship, m.age ? `${m.age} yrs` : null].filter(Boolean).join(" · ") || "Family member"}
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: tone[0], color: tone[1] }}>
                      {m.pending ? <Ico><Mail size={11} /></Ico> : <Ico><span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} /></Ico>}
                      {st.label}
                    </span>
                  </div>
                  {!m.pending ? <ChevronRight size={20} color="var(--t4)" /> : (
                    <button onClick={e => { e.stopPropagation(); setRemoveId(m.rowId); }} style={{ background: "none", border: "none", color: "var(--t4)", fontSize: 20, cursor: "pointer", padding: 6 }}>…</button>
                  )}
                </div>
              );
            })}
          </div>

          {slotsLeft > 0 && (
            <button onClick={() => setShowAdd(true)} style={{ margin: "0 20px 8px", padding: 18, borderRadius: 22, border: "2px dashed var(--sep)", background: "none", color: "var(--t3)", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
              <Plus size={18} strokeWidth={2.5} /> Add {slotsLeft > 1 ? `another member (${slotsLeft} left)` : "a family member"}
            </button>
          )}
        </>
      )}

      {showAdd && (
        <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && reset()}>
          <div className="sheet" style={{ maxHeight: "82vh" }} onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>Add family member</div>
              <div style={{ display: "flex", background: "var(--hover)", borderRadius: 14, padding: 4, marginBottom: 16 }}>
                {[["invite", "Has their own account", "Invite by email"], ["managed", "No app needed", "Add without app"]].map(([m, sub, label]) => (
                  <button key={m} onClick={() => setMode(m)} style={{
                    flex: 1, padding: 10, borderRadius: 12, border: "none", background: "transparent",
                    color: mode === m ? "var(--t1)" : "var(--t3)", fontSize: 15, fontWeight: 500,
                    cursor: "pointer", transition: "all .2s",
                    boxShadow: mode === m ? "inset 0 0 0 1px var(--teal), 0 2px 4px rgba(0,0,0,.04)" : "none",
                  }}>{label}</button>
                ))}
              </div>

              {mode === "invite" ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 6, fontWeight: 500 }}>Their email</div>
                  <input className="sheet-input" type="email" placeholder="family@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 13, color: "var(--t4)", marginBottom: 16 }}>They'll get an invite email. Once they accept, you can see their medications and get alerts.</div>
                  {err && <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>{err}</div>}
                </>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 6, fontWeight: 500 }}>Name</div>
                      <input className="sheet-input" type="text" placeholder="e.g., Grandma Mary" value={mname}
                        onChange={e => setMname(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 6, fontWeight: 500 }}>Relationship</div>
                        <select className="sheet-input" value={rel} onChange={e => setRel(e.target.value)}>
                          {[["Child", "Child"], ["Partner", "Partner"], ["Sibling", "Sibling"], ["Parent", "Parent"], ["Grandparent", "Grandparent"], ["Other", "Other"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 6, fontWeight: 500 }}>Age (optional)</div>
                        <input className="sheet-input" type="number" placeholder="e.g., 72" value={age}
                          onChange={e => setAge(e.target.value)} min="0" max="120" />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 6, fontWeight: 500 }}>Phone (optional)</div>
                      <input className="sheet-input" type="tel" placeholder="e.g., 555-123-4567" value={phone}
                        onChange={e => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--t4)", marginTop: 16, lineHeight: 1.5 }}>Their medications stay private to your household — no account or email needed.</div>
                </>
              )}

              <button className="btn btn-primary" style={{ flex: 1 }} onClick={doAdd} disabled={busy}>
                {busy ? "Adding…" : mode === "invite" ? "Send invite" : "Add member"}
              </button>
              <button className="btn btn-ghost" onClick={reset}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showUpgrade && <UpgradeModal country={country} userEmail={userEmail} currentPlan="free" onClose={() => setShowUpgrade(false)} />}

      {removeId && (
        <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setRemoveId(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: "20px 20px calc(16px + var(--safe-bottom))" }}>
              <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
                <Ico><Mail size={44} strokeWidth={1.8} color="var(--t1)"/></Ico>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Remove this member?</div>
              <div style={{ fontSize: 15, color: "var(--t3)", lineHeight: 1.5, marginBottom: 20 }}>
                The invite will be revoked. Their profile will disappear from your family view.
              </div>
              <div className="sheet-actions">
                <button className="btn btn-primary" style={{ flex: 1, background: "var(--red)", boxShadow: "none" }} onClick={doRemove}>Remove</button>
                <button className="btn btn-ghost" onClick={() => setRemoveId(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}