// Server-side FCM push sender for native (Capacitor) devices.
// Requires FIREBASE_SERVICE_ACCOUNT_JSON env var (base64-encoded JSON key).
// Falls back gracefully if Firebase is not configured.

const FCM_PROJECT_ID = process.env.FCM_PROJECT_ID || "";

async function pemToCryptoKey(pem) {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(Buffer.from(b64, "base64"));
  return globalThis.crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

async function getAccessToken() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    let key = null;
    try { key = JSON.parse(raw); } catch {}
    if (!key) {
      try { key = JSON.parse(Buffer.from(raw, "base64").toString("utf8")); } catch {}
    }
    const { client_email, private_key } = key;
    if (!client_email || !private_key) return null;
    const { SignJWT } = await import("jose");
    const now = Math.floor(Date.now() / 1000);
    const signingKey = await pemToCryptoKey(private_key);
    return new SignJWT({
      iss: client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .sign(signingKey);
  } catch { return null; }
}

export async function sendFCMPush({ token, title, body, tag, data }) {
  if (!FCM_PROJECT_ID) return { ok: false, error: "FCM_PROJECT_ID not set" };
  const accessToken = await getAccessToken();
  if (!accessToken) return { ok: false, error: "FCM not configured (missing service account)" };

  try {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: { tag: tag || "", ...data },
          android: { priority: "high", ttl: "86400s" },
          apns: {
            payload: {
              aps: {
                "mutable-content": 1,
                sound: "default",
                badge: 1,
                "content-available": 1,
              },
            },
          },
        },
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `FCM ${res.status}: ${txt}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function sendNativePush({ endpoint, title, body, tag, data = {} }) {
  // endpoint is "fcm:<token>"
  if (!endpoint || !endpoint.startsWith("fcm:")) return { ok: false, error: "Not a native endpoint" };
  const token = endpoint.slice(4);
  return sendFCMPush({ token, title, body, tag, data });
}
