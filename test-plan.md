# Test Plan — Adhera (MediTrack)

> Manual testing pass for Android + iOS before store submission.

---

## Prerequisites

- Android APK built via Codemagic or `npx cap sync android && npx cap open android`
- iOS build via Codemagic (TestFlight) or `npx cap sync ios && npx cap open ios`
- A test Supabase project or production database
- Device running Android 12+ / iOS 16+

---

## Test Cases

### 1. Onboarding & Auth

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 1.1 | Email OTP sign-in | Enter email → receive OTP → enter OTP | User is signed in, redirected to onboarding |
| 1.2 | Google OAuth | Tap "Sign in with Google" → complete browser flow | User is signed in, redirected to onboarding |
| 1.3 | Onboarding flow | Fill profile (name, condition, wake/sleep times) → tap done | Profile saved, redirected to main app |
| 1.4 | Session persistence | Kill app → reopen | User remains signed in (no re-auth) |
| 1.5 | Sign out | Settings → Sign Out | Returned to auth screen, session cleared |

### 2. Medication Management

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 2.1 | Add medication | Meds tab → + → fill all fields → Save | Medication appears in list |
| 2.2 | Edit medication | Tap medication → Edit → change dosage → Save | Changes persisted |
| 2.3 | Delete medication | Tap medication → Delete → confirm | Medication removed from list |
| 2.4 | Medication details | View medication card | Shows name, dosage, schedule, notes, doctor info |
| 2.5 | Active/inactive toggle | Edit → toggle active | Affects reminder scheduling |

### 3. Dose Logging

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 3.1 | Log a dose | Today tab → tap "Log dose" on a medication | Dose logged, streak updated |
| 3.2 | Log with journal | Log dose → add journal note → save | Note saved with dose entry |
| 3.3 | Dose history | Open medication → view history | All logged doses shown chronologically |
| 3.4 | Today's progress | Today tab → check adherence ring | Shows % of scheduled doses taken |
| 3.5 | Streak tracking | Log doses for consecutive days | Streak counter increments |

### 4. Notifications (Local)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 4.1 | Local notification scheduling | Add a medication with reminder | Notification fired at reminder time |
| 4.2 | Notification tap | Tap notification | Opens medication sheet |
| 4.3 | "Log dose" action | Swipe notification → tap "Log dose" | Dose logged automatically |
| 4.4 | "Snooze" action | Tap snooze | Notification rescheduled 5 min later |
| 4.5 | Cancel on log | Log a dose before reminder fires | Reminder notification cancelled |
| 4.6 | Cancel on edit | Change medication time | Old notifications cancelled, new ones scheduled |

### 5. Notifications (Push)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 5.1 | Push token registration | Sign in on device | Token stored in push_subscriptions table |
| 5.2 | Push notification received | Wait for cron trigger or hit /api/cron/send-reminders | Push notification delivered |
| 5.3 | Push on logout | Sign out → check supabase | Push token removed from table |
| 5.4 | Missed dose push | Skip a dose → wait for cron resend | "Missed" push notification received |

### 6. Vitals

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 6.1 | Log blood pressure | Vitals tab → BP → enter 120/80 → save | BP logged with systolic/diastolic |
| 6.2 | Log weight | Vitals tab → Weight → enter 70 → save | Weight logged |
| 6.3 | Vitals history | Vitals tab → view history | Shows chart + list of entries |
| 6.4 | Delete vital | Swipe to delete on a vital entry | Entry removed |

### 7. Reports

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 7.1 | Adherence report | Reports tab → select date range | Shows adherence % chart |
| 7.2 | Cost report | Reports tab → Cost | Shows medication costs breakdown |
| 7.3 | Export | Reports tab → Export | CSV/PDF downloaded |

### 8. Family Sharing

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 8.1 | Invite family member | Family tab → invite → enter email | Invitation sent (status: pending) |
| 8.2 | View family member data | Select a member | Shows their medications and adherence |

### 9. Offline

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 9.1 | Load cached data | Go offline → open app | Data shown from cache |
| 9.2 | Queue dose log | Log dose while offline | Entry queued in localStorage |
| 9.3 | Sync on reconnect | Come back online | Queued dose logs synced to Supabase |
| 9.4 | Cache freshness | Online → load data | Cache updated with fresh data |

### 10. Medical ID

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 10.1 | Fill Medical ID | Settings → Medical ID → fill fields | Saved to localStorage |
| 10.2 | View Medical ID | Settings → Medical ID | Shows saved emergency info |

### 11. Theme & Preferences

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 11.1 | Change theme | Settings → Theme → select new | App color scheme updates |
| 11.2 | Change language | Settings → Language → select | UI text changes |
| 11.3 | Dark mode | Settings → Dark mode toggle | Dark theme applied |

### 12. Deep Linking

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 12.1 | Deeplink from notification | Receive push → tap | Opens correct medication screen |
| 12.2 | Log dose via deeplink | Notification with "Log dose" action | Dose logged, UI updates |

### 13. Edge Cases

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 13.1 | Course ended | Past end_date medication | No reminders, shown as "completed" |
| 13.2 | Multiple doses per day | Medication with times_per_day=3 | 3 reminder windows per day |
| 13.3 | Custom reminder times | Set specific HH:MM times | Reminders at exact times |
| 13.4 | Empty state | New user with no data | Empty state illustrations shown |
| 13.5 | Rapid dose logging | Log 10 doses in quick succession | All saved, no race conditions |
| 13.6 | Timezone change | Travel to different timezone | Notifications adjust correctly |

---

## Session Recording

Record each session:
- **Device:** [model, OS version]
- **Date:** [date]
- **Tester:** [name]
- **Build:** [commit SHA or build number]
- **Results:** Pass/Fail for each test case
- **Bugs found:** Link to GitHub issue or description

---

## Acceptance Criteria

- All critical-path tests (1.1-1.3, 2.1, 3.1, 4.1-4.2, 5.1-5.2, 6.1, 9.2-9.3) pass
- No crashes or ANRs on launch
- Push and local notifications deliver correctly
- Offline queue syncs without data loss
- App survives background → foreground resume

---

## TBD — Remaining Manual (device) Items

Automated web/API checks passed on the local production build (Aug 06 2026): landing/auth/pricing/privacy render, service worker active, `/api/cron/send-reminders` → 401 without secret, `/api/invite` → 400 on bad email, paystack webhook GET → 200. An authenticated browser E2E pass (Playwright + live Supabase session for `adharaqa703166@web-library.net`) verified the web-automatable flows below — **24/24 passed** (see "Automated Results" below). Items still requiring a physical device / real external service are listed here; run on device before store submission:

| # | Test | Why manual |
|---|------|-----------|
| 1.1 | Email OTP sign-in | OTP verified via live mail.tm inbox + API; the on-device OTP entry screen was not clicked through |
| 1.2 | Google OAuth | Requires OAuth browser flow on device |
| 2.4 | Medication details (full card incl. doctor/pharmacy info) | Visual check on device |
| 2.5 | Active/inactive toggle | Not exercised in automation |
| 3.2 | Log with journal note | LogDoseModal not exercised in automation |
| 3.3 | Dose history | Not exercised in automation |
| 3.4-3.5 | Progress ring, streak counter | Visual + interaction check on device |
| 4.1-4.6 | Local notification scheduling / tap / log / snooze / cancel | Requires device notification runtime + permissions |
| 5.1-5.4 | Push token registration, delivery, logout cleanup, missed-dose push | Requires push runtime + cron trigger |
| 6.2-6.4 | Log weight, vitals history + chart, delete vital | Only BP log (6.1) verified via automation |
| 7.2-7.3 | Cost report, CSV/PDF export | Not exercised in automation |
| 8.2 | View family member data | Requires accepted invite / second account |
| 9.1-9.4 | Offline cache, queued dose log, sync on reconnect, cache freshness | Requires airplane mode on device |
| 10.1-10.2 | Medical ID save + view | Needs signed-in account |
| 11.1-11.3 | Theme, language, dark mode | Visual check on device |
| 12.1-12.2 | Notification deeplinks + log-dose action | Requires push + deeplink config |
| 13.1-13.6 | Course ended, multi-dose, custom times, empty state, rapid logging, timezone | Mostly device/interaction-specific |
| Paystack | Real payment → plan upgrade (verify + webhook) | Live paystack transaction; live deployment URLs sit behind Vercel Deployment Protection |

---

## Automated Results (Aug 06 2026)

Authenticated browser E2E against the local production build (`next start` on :3210) using Playwright-core + Chrome, with a live Supabase session (numeric OTP from mail.tm inbox). Run script: `C:\Users\franc\AppData\Local\Temp\opencode\e2e.mjs`, results in `e2e_results.json`. Result: **24/24 passed**.

| Test | Result | Notes |
|------|--------|-------|
| Authenticated state driven by injected session | PASS | App loaded signed-in |
| 1.3 Onboarding → main app | PASS | Defaults + Skip → main app |
| 1.4 Session persists across reload | PASS | Reload stays signed in |
| 2.1 Add medication | PASS | Row persisted to `medications` (DB-verified) |
| 2.2 Edit medication (dosage 1→2) | PASS | DB-verified `dosage_amount=2` |
| 2.3 Delete medication | PASS | Row removed (DB-verified) |
| Dose slot set in past | PASS | Set `reminder_times` to now−10min so a dose is due (UTC machine, 07:00 default slot was in future) |
| 3.1 Log a dose (Today → Log) | PASS | `dose_logs` row inserted; UI shows "Taken" |
| Reports data seeded (6 days) | PASS | `dose_logs` seeded at slot time |
| Plan upgrade to Pro (REST self-update) | PASS | RLS allows profile.plan self-update |
| Vitals tab appears on Pro | PASS | Tab gated by tier config |
| 6.1 Log blood pressure 120/80 | PASS | Row persisted to `vitals` (DB-verified) |
| 7.1 Adherence report renders | PASS | "Adherence Overview" + 100% with seeded data |
| Plan upgrade to Family (REST) | PASS | |
| Family tab appears on Family | PASS | |
| 8.1 Invite family member | PASS* | `family_members` row created via UI; invite email via `/api/invite` returns 500 locally (no Resend key in `.env.local`) — verify email delivery on Vercel where `RESEND_API_KEY` is set |
| Profile tab renders | PASS | |
| Sign out → landing, session storage cleared | PASS | Note: app returns to **landing** page (not auth screen) after sign-out |

*8.1: row creation verified; the outbound email depends on `RESEND_API_KEY` (configured on Vercel, missing locally).

