"use client";

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
