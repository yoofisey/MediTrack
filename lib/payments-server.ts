import { getPaymentsConfig } from "./payments";
import crypto from "crypto";

export type PaystackCountry = "GH" | "NG" | "ZA" | "KE";
export type PaystackPlanKey = "pro" | "family";

const PAYSTACK_SECRETS: Record<PaystackCountry, string> = {
  GH: process.env.PAYSTACK_SECRET_KEY || "",
  NG: process.env.PAYSTACK_SECRET_KEY_NG || "",
  ZA: process.env.PAYSTACK_SECRET_KEY_ZA || "",
  KE: process.env.PAYSTACK_SECRET_KEY_KE || "",
};

export const PAYSTACK_CURRENCIES: Record<PaystackCountry, string> = {
  GH: "GHS",
  NG: "NGN",
  ZA: "ZAR",
  KE: "KES",
};

// Paystack reports amounts in the smallest currency unit (pesewas/kobo/cents),
// matching the amounts charged by /api/paystack/init and the region pricing map.
export const PLAN_MIN_AMOUNTS: Record<string, Record<PaystackPlanKey, number>> = {
  GHS: { pro: 1500, family: 2800 },
  NGN: { pro: 250000, family: 450000 },
  ZAR: { pro: 5900, family: 10900 },
  KES: { pro: 30000, family: 55000 },
};

export function getPaystackSecret(country?: string) {
  const code = (country || "GH").toUpperCase() as PaystackCountry;
  return PAYSTACK_SECRETS[code] || "";
}

export function getPaystackPlans(country: string) {
  return getPaymentsConfig(country).plans;
}

const PADDLE_PRICE_IDS = {
  pro: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || "",
  family: process.env.NEXT_PUBLIC_PADDLE_PRICE_FAMILY || "",
};

export function getPaddleWebhookSecret() {
  return process.env.PADDLE_WEBHOOK_SECRET || "";
}

export function getPaddlePriceId(plan: PaystackPlanKey) {
  return PADDLE_PRICE_IDS[plan] || "";
}

export function planForPaddlePriceId(priceId: string): PaystackPlanKey | "" {
  if (priceId && priceId === PADDLE_PRICE_IDS.pro) return "pro";
  if (priceId && priceId === PADDLE_PRICE_IDS.family) return "family";
  return "";
}

export function verifyPaddleSignature(rawBody: string, signatureHeader: string, secret: string) {
  if (!signatureHeader || !secret) return false;
  const parts = new Map<string, string>();
  for (const pair of signatureHeader.split(";")) {
    const [k, ...rest] = pair.split("=");
    if (k && rest.length) parts.set(k, rest.join("="));
  }
  const ts = parts.get("ts");
  if (!ts || !/^\d+$/.test(ts)) return false;
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (age > 300) return false;
  const h1 = parts.get("h1");
  if (!h1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(h1, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}