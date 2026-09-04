const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export function getPaystackSecret() {
  return PAYSTACK_SECRET;
}
