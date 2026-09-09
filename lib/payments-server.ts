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



const FASTSPRING_PRODUCTS = {
  pro: process.env.FASTSPRING_PRODUCT_PRO || "plan-pro",
  family: process.env.FASTSPRING_PRODUCT_FAMILY || "plan-family",
};

const FASTSPRING_COUNTRY_BLOCKLIST = ["CU", "IR", "IQ", "MM", "KP", "RU", "SO", "SD", "SY"];

const FASTSPRING_PAYSTACK_COUNTRIES = ["GH", "NG", "ZA", "KE"];

export function getFastSpringProduct(plan: PaystackPlanKey) {
  return FASTSPRING_PRODUCTS[plan] || "";
}

export function planForFastSpringProduct(product: string): PaystackPlanKey | "" {
  if (product && product === FASTSPRING_PRODUCTS.pro) return "pro";
  if (product && product === FASTSPRING_PRODUCTS.family) return "family";
  return "";
}

export function getFastSpringConfig() {
  return {
    storeId: process.env.FASTSPRING_STORE_ID || "",
    username: process.env.FASTSPRING_USERNAME || "",
    password: process.env.FASTSPRING_PASSWORD || "",
    webhookSecret: process.env.FASTSPRING_WEBHOOK_SECRET || "",
    currency: process.env.FASTSPRING_CURRENCY || "USD",
  };
}

export function getFastSpringAuthHeader(config: { username: string; password: string }) {
  return "Basic " + Buffer.from(`${config.username}:${config.password}`).toString("base64");
}

export function verifyFastSpringSignature(rawBody: string, signatureHeader: string, secret: string) {
  if (!signatureHeader || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signatureHeader, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function fastspringCountryStatus(country: string) {
  const code = (country || "").toUpperCase();
  if (FASTSPRING_PAYSTACK_COUNTRIES.includes(code)) return "paystack";
  if (FASTSPRING_COUNTRY_BLOCKLIST.includes(code)) return "blocked";
  return "fastspring";
}