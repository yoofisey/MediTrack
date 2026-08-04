"use client";

import { initials } from "@/lib/household";

export function Card({ children, style, onClick, pad = true }) {
  return (
    <div className="card" style={{ ...(pad ? { padding: 16 } : { padding: 0 }), ...style }} onClick={onClick}>
      {children}
    </div>
  );
}

export function Section({ title, right, children, style }) {
  return (
    <div className="section" style={style}>
      {(title || right) && (
        <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {title && <span>{title}</span>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function ListRow({ icon, iconBg, title, sub, value, right, onClick }) {
  return (
    <div className="row" style={onClick ? undefined : { cursor: "default" }} onClick={onClick}>
      {icon && <div className="row-icon" style={iconBg ? { background: iconBg } : undefined}>{icon}</div>}
      <div className="row-body">
        <div className="row-title">{title}</div>
        {sub ? <div className="row-sub">{sub}</div> : null}
      </div>
      {value ? <span className="row-value">{value}</span> : null}
      {right}
    </div>
  );
}

export function Metric({ value, label, accent }) {
  return (
    <div style={{ flex: 1, background: "var(--hover)", borderRadius: 16, padding: "14px 8px", textAlign: "center", minWidth: 0 }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.3px", color: accent || "var(--t1)" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 3, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export function Segmented({ options, value, onChange, style }) {
  return (
    <div className="seg" style={style}>
      {options.map(([id, label]) => (
        <button key={id} className={`seg-btn${value === id ? " on" : ""}`} onClick={() => onChange(id)}>{label}</button>
      ))}
    </div>
  );
}

const INSIGHT_DOT = {
  good: "#34C759",
  warn: "#FF9500",
  bad: "#FF3B30",
};

export function InsightCard({ tone = "good", headline, suggestion, onClick, onDismiss }) {
  return (
    <div className="insight-card" onClick={onClick}>
      <div className="insight-head">
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "var(--t1)", fontSize: 14 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: INSIGHT_DOT[tone] || "#34C759", flexShrink: 0 }} />
          {headline}
        </span>
        {onDismiss && (
          <button onClick={(e) => { e.stopPropagation(); onDismiss(); }} aria-label="Dismiss"
            style={{ background: "none", border: "none", color: "var(--t4)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 2, fontFamily: "inherit" }}>✕</button>
        )}
      </div>
      {suggestion && <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 4, lineHeight: 1.4 }}>{suggestion}</div>}
    </div>
  );
}

export function MemberSwitcher({ members, value, onChange, ring, style }) {
  if (!members || members.length === 0) return null;
  const R = 25;
  const C = 2 * Math.PI * R;
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 2px 6px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", ...style }}>
      {members.map(m => {
        const active = m.key === value;
        const pct = ring ? ring(m) : null;
        const ringColor = m.pending ? "var(--t4)" : pct >= 1 ? "var(--green)" : pct > 0 ? "var(--teal)" : "var(--red)";
        return (
          <div key={m.key} onClick={() => onChange?.(m.key)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 74, cursor: "pointer", userSelect: "none", WebkitTapHighlightColor: "transparent" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", padding: active ? 2 : 1.5,
              background: active ? "linear-gradient(135deg,var(--teal),var(--purple))" : "transparent",
              boxShadow: active ? "0 4px 14px rgba(0,122,255,.35)" : "none",
              transition: "padding .18s ease, box-shadow .18s ease",
              display: "grid", placeItems: "center",
            }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--card)", display: "grid", placeItems: "center", position: "relative" }}>
                <svg width="100%" height="100%" viewBox={`0 0 56 56`} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                  <circle cx="28" cy="28" r={R} fill="none" stroke="var(--sep)" strokeWidth="3" />
                  {pct !== null && pct !== undefined && (
                    <circle cx="28" cy="28" r={R} fill="none" stroke={ringColor} strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${Math.max(0, Math.min(pct, 1)) * C} ${C}`} />
                  )}
                </svg>
                <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden", background: "var(--ib1)", display: "grid", placeItems: "center", fontSize: 17, fontWeight: 800, color: "var(--t1)" }}>
                  {m.avatarUrl ? <img src={m.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(m)}
                </div>
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: active ? 700 : 500, color: active ? "var(--t1)" : "var(--t3)",
              maxWidth: 74, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              background: active ? "var(--ib3)" : "transparent", padding: active ? "2px 9px" : 0, borderRadius: 99, transition: "background .18s ease",
            }}>
              {m.pending ? "Invited" : m.name.split(" ")[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
