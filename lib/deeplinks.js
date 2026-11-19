let cleanup = null;

export function isCapacitor() {
  return typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
}

function extractPath(url) {
  try {
    const hashMatch = url.match(/#\/([\w-]+)/);
    if (hashMatch) return hashMatch[1];
    const u = new URL(url);
    return u.pathname.replace(/^\/+/, "").split("/")[0];
  } catch {
    return "";
  }
}

export async function initUrlDeeplinks() {
  if (typeof window === "undefined" || !isCapacitor()) return null;
  if (cleanup) return cleanup;
  try {
    const mod = await import("@capacitor/app");
    const App = mod.App;
    const listener = await App.addListener("appUrlOpen", (data) => {
      const url = data?.url || "";
      const path = extractPath(url);
      if (path) {
        try {
          window.dispatchEvent(new CustomEvent("mt-deeplink-url", { detail: { url, path } }));
        } catch {}
      }
    });
    cleanup = () => listener.remove();
    return cleanup;
  } catch {
    return null;
  }
}

export function cleanupUrlDeeplinks() {
  if (cleanup) {
    try { cleanup(); } catch {}
    cleanup = null;
  }
}
