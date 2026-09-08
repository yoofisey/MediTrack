import { getPaymentsConfig } from "./payments";

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