"use client";

export default function Ring({ pct, size = 80, stroke = 7, color = "#0A84FF" }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const p = Math.min(Math.max(pct, 0), 1);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={p===1?"#34C759":color} strokeWidth={stroke}
          strokeDasharray={`${p*c} ${c}`} strokeLinecap="round" style={{transition:"stroke-dasharray .5s ease,stroke .3s"}}/>
      </svg>
      <div className="ring-center">
        <div className="ring-pct">{Math.round(p*100)}%</div>
        <div className="ring-of">done</div>
      </div>
    </div>
  );
}
