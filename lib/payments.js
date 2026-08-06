const PAYSTACK_KEY_MAP = {
  GH: process.env.NEXT_PUBLIC_PAYSTACK_KEY || "",
  NG: process.env.NEXT_PUBLIC_PAYSTACK_KEY_NG || "",
  ZA: process.env.NEXT_PUBLIC_PAYSTACK_KEY_ZA || "",
  KE: process.env.NEXT_PUBLIC_PAYSTACK_KEY_KE || "",
};

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

const PAYSTACK_PLANS = {
  GH: { pro: "PLN_w5rq3bkd5uh5mqj", family: "PLN_h9mlqfmujuh74c9" },
  NG: { pro: "", family: "" },
  ZA: { pro: "", family: "" },
  KE: { pro: "", family: "" },
};

export function getPaymentsConfig(country) {
  const code = (country || "GH").toUpperCase();
  const plans = PAYSTACK_PLANS[code];
  if (!plans) {
    return { gateway: "paystack", ready: false, reason: "Payments coming soon in your country.", key: "", plans: null };
  }
  const key = PAYSTACK_KEY_MAP[code];
  const ready = Boolean(key && plans.pro && plans.family);
  return { gateway: "paystack", ready, reason: ready ? "" : "Payments coming soon in your country.", key, plans };
}

export function getPaystackSecret() {
  return PAYSTACK_SECRET;
}
