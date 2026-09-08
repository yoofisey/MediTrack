# FastSpring merchant application + integration

## Why FastSpring

Paddle rejected us because their Acceptable Use Policy excludes "Health & Fitness /
Medical Services". FastSpring's AUP does not restrict digital health/wellness apps and
lists Ghana as a supported seller country, so we can stay Ghana-incorporated while
selling to customers worldwide. FastSpring is the Merchant of Record for every country
outside our Paystack markets (GH/NG/ZA/KE): they handle VAT/sales tax, invoicing, and
payouts to us via their Payouts Portal.

- Product page reference: https://fastspring.com
- Seller countries that FastSpring supports includes Ghana.
- Restricted buyer countries (cannot complete a purchase): Cuba, Iran, Iraq, Myanmar,
  North Korea, Russia, Somalia, Sudan, Syria.

We **have not submitted an application yet**. FastSpring still runs an underwriting
review; health-adjacent SaaS is usually fine, but approval is not guaranteed.

## Merchant application description (paste/polish for the form)

The form asks for a company/product description. Draft you can use:

> **Adhera** is a mobile-first medication adherence and wellness companion app
> (web app + published PWA, iOS/Android wrapper via Capacitor). It helps users track
> medications, set refill reminders, share caregiving dashboards with family, detect
> drug interactions, and export adherence PDF reports. It is **not** a medical
> provider, pharmacy, telehealth service, or licensed-care business — no diagnosis,
> no prescription fulfillment, no patient data brokering. Health content is purely
> educational and voluntary.
>
> Business model: freemium SaaS. Core tracking is free; **Adhera Pro** and
> **Adhera Family** are monthly subscriptions billed through FastSpring for all
> non-Africa markets. Payments are standard recurring subscriptions; no goods,
> no cryptocurrency, no adult content, no pharmaceuticals, no gambling.
>
> Company incorporation: Ghana (sole founder / small business). We chose FastSpring
> as Merchant of Record specifically because it supports Ghana-based sellers and
> handles global sales-tax/VAT compliance for us.

## Integration plan (after approval)

1. **Store Builder**: create two **Subscription** products:
   - `plan-pro` — monthly, $9.99 (Adhera Pro)
   - `plan-family` — monthly, $17.99 (Adhera Family)
   - Enable FastSpring hosted checkout (redirect). Set a USD price list (multi-currency
     price lists optional, keyed by locale).
2. **Webhooks** in Dashboard → Integrations (JWT/HMAC auth, secret you control):
   - Endpoint: `https://www.useadhera.com/api/fastspring/webhook`
   - Events to forward: `order.completed`, `subscription.activated`,
     `subscription.payment.completed`. Signing = HMAC-SHA256 of the raw request body
     with the webhook secret, sent in the `X-FastSpring-Signature` header (hex).
3. **Host-to-host checkout**: our server calls `POST https://api.fastspring.com/orders`
   (HTTP Basic auth from the FastSpring API credentials) to create a session. FastSpring
   returns `order.reference` + `order.url`; we send the user to `order.url`, and on
   completion/cancel FastSpring redirects them back with `completionUrl`/`cancelUrl`
   (we use `/`).
4. **Client flow** mirrors Paystack: themed in-app checkout sheet → redirect to hosted
   checkout → back on app → `/api/fastspring/verify` validates the order server-side →
   profile upgraded.

## Routes scaffolded here

| Route | Purpose |
| --- | --- |
| `app/api/fastspring/init/route.ts` | Auth check, product lookup from `FASTSPRING_PRODUCT_PRO/FAMILY`, creates a FastSpring order session, returns `{ url, reference }`. Rejects Paystack countries and the FastSpring blocklist. |
| `app/api/fastspring/verify/route.ts` | Auth check; `GET /orders/{reference}`; validates `completed`, no refunds, email match, tag/product → plan; inserts `payment_references` + upgrades `profiles`. |
| `app/api/fastspring/webhook/route.ts` | Verifies `X-FastSpring-Signature` (HMAC-SHA256), handles `order.completed` + subscription activation/payment events, upgrades the profile by email. |

## Environment variables (`PAYSTACK_*` markets keep using Paystack)

| Variable | Required | Notes |
| --- | --- | --- |
| `FASTSPRING_STORE_ID` | yes | e.g. `adhera`. Used for store URLs / dashboard. |
| `FASTSPRING_USERNAME` | yes | API credential (Basic auth) from Dashboard → API access. |
| `FASTSPRING_PASSWORD` | yes | API credential secret. Server-only. |
| `FASTSPRING_WEBHOOK_SECRET` | yes | Webhook signing secret. Server-only. |
| `FASTSPRING_CURRENCY` | no | Defaults to `USD`. |
| `FASTSPRING_PRODUCT_PRO` | no | Product path; defaults to `plan-pro`. |
| `FASTSPRING_PRODUCT_FAMILY` | no | Product path; defaults to `plan-family`. |

Set the first five on Vercel (server env). `FASTSPRING_PRODUCT_*` only needs to match
the Store Builder product paths.

## Notes

- FastSpring API returns amounts in **decimal** major units (e.g. `"total": 9.99`),
  unlike Paystack's minor units. The verify route only checks `total > 0` plus plan +
  completed + email, so per-country price lists won't cause false negatives.
- If you ever want the hosted checkout in an in-app overlay instead of a redirect, you
  must add `frame-src https://sites.fastspring.com` to the CSP in `next.config.ts`.
  The redirect flow needs no CSP change.
- `app/api/paddle/webhook` and the old `lib/payments-server.ts` Paddle helpers are now
  dead code and can be deleted once the FastSpring flow is proven in production.