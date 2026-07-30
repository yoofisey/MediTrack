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
