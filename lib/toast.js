// Minimal dependency-free toast. It renders itself into a fixed host appended
// to <body>, so it works from any component (and from non-React code) without a
// provider — replacing native alert(), which blocks the page, can't be styled,
// is truncated on iOS, and can't be translated.

let host = null;

function ensureHost() {
  if (typeof document === "undefined") return null;
  if (host && document.body.contains(host)) return host;
  host = document.createElement("div");
  host.id = "mt-toast-host";
  host.style.cssText = [
    "position:fixed",
    "left:50%",
    "bottom:calc(24px + env(safe-area-inset-bottom,0px))",
    "transform:translateX(-50%)",
    "z-index:10000",
    "display:flex",
    "flex-direction:column",
    "gap:8px",
    "align-items:center",
    "pointer-events:none",
    "max-width:min(92vw,420px)",
  ].join(";");
  document.body.appendChild(host);
  return host;
}

export function toast(message, { tone = "default", duration = 4000, assertive = false } = {}) {
  const el = ensureHost()?.appendChild(document.createElement("div"));
  if (!el) return;
  const bg = tone === "error" ? "var(--red, #FF3B30)" : tone === "success" ? "#1f9d55" : "var(--t1, #111)";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", assertive ? "assertive" : "polite");
  el.style.cssText = [
    "pointer-events:auto",
    `background:${bg}`,
    "color:#fff",
    "padding:12px 16px",
    "border-radius:12px",
    "font-size:14px",
    "line-height:1.4",
    "font-weight:500",
    "box-shadow:0 8px 24px rgba(0,0,0,.18)",
    "opacity:0",
    "transform:translateY(8px)",
    "transition:opacity .18s ease, transform .18s ease",
    "word-break:break-word",
  ].join(";");
  el.textContent = message;
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => el.remove(), 200);
  }, duration);
}

export function toastError(message, opts) {
  return toast(message, { ...opts, tone: "error", assertive: true });
}

export function toastSuccess(message, opts) {
  return toast(message, { ...opts, tone: "success" });
}
