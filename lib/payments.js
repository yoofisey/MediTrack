const PAYSTACK_KEY_MAP = {
  GH: process.env.NEXT_PUBLIC_PAYSTACK_KEY || "",
  NG: process.env.NEXT_PUBLIC_PAYSTACK_KEY_NG || "",
  ZA: process.env.NEXT_PUBLIC_PAYSTACK_KEY_ZA || "",
  KE: process.env.NEXT_PUBLIC_PAYSTACK_KEY_KE || "",
};

const PAYSTACK_COUNTRIES = ["GH", "NG", "ZA", "KE"];

const PADDLE_PRICE_IDS = {
  pro: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || "",
  family: process.env.NEXT_PUBLIC_PADDLE_PRICE_FAMILY || "",
};

const PAYSTACK_PLANS = {
  GH: {
    pro: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PRO_GH || "PLN_w5rq3bkd5uh5mqj",
    family: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_FAMILY_GH || "PLN_h9mlqfmujuh74c9",
  },
  NG: {
    pro: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PRO_NG || "",
    family: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_FAMILY_NG || "",
  },
  ZA: {
    pro: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PRO_ZA || "",
    family: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_FAMILY_ZA || "",
  },
  KE: {
    pro: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PRO_KE || "",
    family: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_FAMILY_KE || "",
  },
};

export function getPaymentsConfig(country) {
  const code = (country || "GH").toUpperCase();
  if (PAYSTACK_COUNTRIES.includes(code)) {
    const plans = PAYSTACK_PLANS[code];
    const key = PAYSTACK_KEY_MAP[code];
    const ready = Boolean(key && plans.pro && plans.family);
    return { gateway: "paystack", ready, reason: ready ? "" : "Payments coming soon in your country.", key, plans };
  }
  const paddleReady = Boolean(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN && PADDLE_PRICE_IDS.pro && PADDLE_PRICE_IDS.family);
  return {
    gateway: "paddle",
    ready: paddleReady,
    reason: paddleReady ? "" : "Payments coming soon in your country.",
    key: "",
    plans: null,
    paddle: {
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "",
      env: process.env.NEXT_PUBLIC_PADDLE_ENV || "production",
      prices: PADDLE_PRICE_IDS,
    },
  };
}