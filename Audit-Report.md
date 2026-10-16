# Adhera (MediTrack) — Product/Code Audit Report

**Scope:** UX, accessibility, internationalization, error & edge-case handling, dead code, copy/naming consistency, and PWA/offline behavior.
**Method:** Static source audit only — no files were modified. All findings verified against source with file:line references.

---

## HIGH PRIORITY

### H1. Paywall advertises Pro features that the entitlement system denies
**Files:** `components/Modals.jsx:171-179`, `components/ProfileTab.jsx:509`, `lib/tiers.js:26-39`

The in-app Pro plan card promises features the tier config explicitly turns off:

```js
// components/Modals.jsx:171-179
features: [
  "Unlimited medications",
  "Full history & analytics",
  "Caregiver sharing",        // <- tier says false
  "Refill reminders",
  "Drug interaction checker", // <- tier says false
  "PDF adherence reports",
  "Priority support",
],
```

```js
// lib/tiers.js:33,36  (Pro)
caregiving: false,
interactionCheck: false,
```
Family is the tier that owns both (`tiers.js:47,50`). `MedSheet.jsx:105` correctly gates the interaction checker behind `has("interactionCheck")`, so Pro subscribers will never see it despite it being listed on the checkout screen. `ProfileTab.jsx:509` also advertises `t("profile.drugCheck")` as a Pro feature to free users.

**Fix:** Derive the paywall feature list from `TIER_CONFIG` (the file's header literally says it is the "single source of truth") instead of hand-maintained arrays, or add a `marketingFeatures` list to the tier config so checkout copy can never drift from entitlements.

---

### H2. Every non-English locale is missing the same 3 keys used by Vitals
**Files:** `components/VitalsTab.jsx:156,237,647`, `lib/i18n.js`

Key-count audit: `en` has 283 keys; the other 11 locales (fr, sw, es, ha, ig, yo, pt, ar, zh, de, it) each have 280. The same three keys are absent from **all** of them:

```js
// components/VitalsTab.jsx:156
{entries.length > 0 ? `${entries.length} ${t("vitals.readings")}` : t("vitals.noReadings")}
// :237
{t("vitals.viewHistory")}
// :647
{t("vitals.lastLogged")}:
```

`t()` falls back to English (`i18n.js:3409`), so Arabic/Portuguese/Kiswahili users silently get English in these three spots.

**Fix:** Add `vitals.readings`, `vitals.lastLogged`, `vitals.viewHistory` to the other 11 dictionaries. Add a CI lint step (i18n library style) that fails when key sets diverge across locales.

---

### H3. `t("profile.unlimitedMedsAd")` renders the raw key string in English
**Files:** `components/ProfileTab.jsx:505`, `lib/i18n.js`

```js
// components/ProfileTab.jsx:505
<div className="upgrade-sub">{plan === "pro" ? "Track up to 5 family members with shared dashboards" : t("profile.unlimitedMedsAd")}</div>
```

The key is defined in the 11 non-English locales (e.g. `lib/i18n.js:492,774,1056,...`) but **not in `en`** (en only has `profile.unlimitedMeds`, `i18n.js:210`). Because the fallback chain ends with `|| key` (`i18n.js:3409`), English users on the free plan see the literal text `profile.unlimitedMedsAd`.

**Fix:** Either define `profile.unlimitedMedsAd` in `en` or change the call to the existing `profile.unlimitedMeds` key.

---

### H4. Dose reminders live in ephemeral service-worker timers and can silently die
**File:** `public/sw.js:12,77-110`

```js
const doseDB = {};                       // in-memory, nothing persisted
doseDB[timerId] = { timer: setTimeout(() => { ...showNotification("Take ...") }, delay), item };
```

The entire local-alarm schedule is `setTimeout` callbacks held in a plain object with zero persistence. Browsers terminate idle service workers at any time; when that happens every pending dose reminder is lost with no recovery, no IndexedDB fallback, and no rescheduling on `activate`. Physicians-facing medication reminders silently vanishing is a serious correctness issue for this product class.

**Fix:** Persist the schedule to IndexedDB in the SW, re-arm timers on `activate` against the stored schedule, and/or push `showNotification` responsibilities to the server push path (`send-reminders`) when the PWA isn't guaranteed to be alive. At minimum, `clear-alarms` and a persisted ledger would make the failure surface explicit.

---

### H5. `alert()` used as the primary error/feedback channel (15 call sites)
**Files:** `MainApp.jsx:315-316,366,414,750,752` · `Modals.jsx:665` · `ProfileTab.jsx:170,263` · `ReportsTab.jsx:128,136` · `TodayTab.jsx:295` · `VitalsTab.jsx:719,724` · `AvatarPicker.jsx:39`

Examples:

```js
// components/MainApp.jsx:750-752
if (waitM < 60) { alert(`⏳ Wait ${waitM} more minutes before your next dose.`); return; }
...
alert(`⏳ Wait ~${waitH} more hour${waitH>1?"s":""} before your next dose.`); return;

// components/AvatarPicker.jsx:39
alert(`Upload failed: ${err?.message || err}. Make sure the 'avatars' storage bucket exists and has INSERT policies for authenticated users.`);
```

Problems: (a) native `alert()` blocks the whole page and cannot be styled; (b) strings are hardcoded English, bypassing `t()`; (c) on iOS Safari the body is truncated to ~30 chars; (d) the avatar-upload messages leak infrastructure details (bucket names, RLS policy names) to end users. The project already has a better pattern (`MedSheet.jsx` uses `err-msg` inline banners + a 20s timeout race, `setErr` state).

**Fix:** Replace with the existing in-component error banner/toast pattern used by `MedSheet.jsx`; keep user messages consumer-friendly; route infra-level messages to `console.error`/Sentry instead of the UI.

---

## MEDIUM PRIORITY

### M1. Large parts of the UI hardcode English and bypass `t()`
Most tabs never call `t()` at all. Verified hardcoded strings:

- `TodayTab.jsx` — greeting "Good morning/afternoon/evening"; `VITAL_LABELS`/`VITAL_UNITS` (13-22); "MISSED DOSE"/"UP NEXT" (289); "Nothing to track yet"/"Add a medication..." (306-307); "All doses done for today", "On track · n doses left today" (282).
- `FamilyTab.jsx` — `VITAL_LABELS` (14-23); "No family members yet" (116); "You"/"Add" (135,147); "Today's medications" (198); "No medications scheduled"/"No medications yet" (209,243); "Hospital visits" (274); "No visits scheduled" (282); "Attended"/"Missed" (299-307).
- `AlertsTab.jsx` — entire screen: "MISSED DOSE" (42), "Call now/name" (52), "Refill" (79), empty state (28-29).
- `CommunityTab.jsx` — `CATEGORIES` labels (8-15), `timeAgo()` "just now"/"m ago"/"h ago"/"d ago" (30-36), "Share something with the community..." (303), "Posting publicly" (314), "Post"/"Posting..." (384), empty states (396-401).
- `HistoryTab.jsx` — entire screen: "History" (21), "Total doses"/"Days tracked"/"Journal entries" (24-26), "No history yet" (30), "doses", "Has journal note" (53).
- `GamificationTab.jsx` — `CATEGORY_META` (17-25), "Total Points" (49), "day streak" (57), "challenges" (61), "Earned" (120), "Badges"/"Challenges" (141,260).
- `MemberDetail.jsx` — entire screen (49,108-109,116,180-181,202,236,245,258,266).
- `Onboarding.jsx` — names a local variable `conditions`/`reminders` arrays fully hardcoded (44-56), step titles (60-64).
- `MedLogButton.jsx:27,34` — "Taken"/"Log". `MedSheet.jsx` — section labels ("Medication name", "Dosage", "Schedule"). `HealthJournal.jsx:9-38` — `MOODS`/`SLEEP_QUALITY`/`SYMPTOMS` labels; weekdays (91).
- `TodayTab.jsx:433` — "No readings yet".

**Fix:** Route these through `t()`. The dict already has near-miss keys (`today.loggedToday`, `frequencies.*`, `reminders.*`, `vitalLabels.*`, `streak.*` are all defined but unused — see L2), suggesting these screens predate the i18n system. This is the single largest localization gap.

### M2. `<html lang>` never updates and there is no RTL support (Arabic)
**Files:** `app/layout.tsx:60`, `lib/i18n.js:3396-3415`

```tsx
<html lang="en">
```
`lang` is stored in `localStorage` (`mt_lang`, `i18n.js:3398-3404`) but the `lang`/`dir` attributes on `<html>` are never updated. `ar` is one of the 12 shipped locales, so Arabic users see a left-to-right layout with an LTR-script `<html lang="en">` — breaking screen-reader pronunciation, font selection, mirroring, and any `dir`-sensitive CSS.

**Fix:** Apply `lang`/`dir` on `<html>` from the active locale (e.g. a `useEffect` in `LanguageProvider`), or serve canonical locale routes.

### M3. Locale-blind date/time/number formatting hardcoded to `en-US` / `en-CA`
**Files:** `AdherenceChart.jsx:89` · `lib/data.js:243` · `MainApp.jsx:377,606` · `VitalsTab.jsx:67,136,202,351-353,599-601,647` · `HealthJournal.jsx:76,130` · `TodayTab.jsx:25-26` · `MemberDetail.jsx:154`

```js
// components/VitalsTab.jsx:647
{t("vitals.lastLogged")}: ... · {new Date(lastLogged.created_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}
// components/MainApp.jsx:377
doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, ...)
```

Uses `toLocaleDateString("en-CA")` (YYYY-MM-DD hack) or `"en-US"` in a dozen places, so dates render in the wrong shape/order for every non-US locale (and the month/day order flips for ar/zh and others). FamilyTab:27 is the only place that correctly uses the browser default via `toLocaleDateString([])`.

**Fix:** Centralize into `lib/i18n.js` (e.g. a `formatDate`/`formatTime` that takes the active locale) and use it everywhere; replace the `en-CA` hack with `Intl` `yyyy-MM-dd` formatting.

### M4. Near-zero keyboard/AT accessibility
A repository-wide scan for `role=`, `aria-*`, and `tabIndex` found only **8** matches (AuthScreen honeypot, a handful of `aria-label`s, two `tabIndex`). Everything else is pointer-only:

- `components/ui.jsx:5-39` — `Card` and `ListRow` are clickable `<div>`s; `MemberSwitcher` (~line 89) same. No `role`, `tabIndex`, or keydown handler.
- `components/FamilyTab.jsx:131-148` — member "pills" + "Add" button are `<div onClick>`.
- `components/CommunityTab.jsx:270-289` (category chips), `297-307` (composer trigger), `343-359` (selector in composer) — all `<div onClick>`.
- `components/HealthJournal.jsx:103` — calendar day cells are `<div onClick>`.
- `components/AlarmOverlay.jsx` — only does Escape/Enter/Space keys (line 11); renders a clickable overlay `<div>` (line 21) and never sets `role="dialog"`, `aria-modal`, or traps focus.
- `components/Modals.jsx:20-21` — `sheet-overlay`/`sheet` have no dialog semantics or focus management.
- Images missing meaningful `alt` (`alt=""` or none): `CommunityTab.jsx:56`, `AvatarPicker.jsx:53`, `FamilyTab.jsx:133,159`, `MemberDetail.jsx:20`, `MedsTab.jsx:43`, `MainApp.jsx:904`, `ProfileTab.jsx:419`.

**Fix:** Convert pointer-only controls to `<button>`/`<a>` (free keyboard + semantics), or add `role="tab"/"button"` + `tabIndex` + `onKeyDown`. Add `role="dialog" aria-modal="true"` + focus trap to `AlarmOverlay` and the sheets. Add descriptive `alt` for member/avatar images.

### M5. Errors in user-critical data paths are swallowed silently
**Files:** `lib/offline.js:11,18,23,28,43,50` · `components/MainApp.jsx:327,336,342,420-429` · `supabase/functions/send-reminders/index.ts:37,48,53,68,93`

```js
// lib/offline.js (queueDoseLog / flushQueue region)
try { localStorage.setItem(...); } catch {}
...
try { flushQueue(...) } catch {}        // offline dose never reaches server, user never told
// components/MainApp.jsx:327
if (error) console.error("markDose:", error?.message || error);   // UI still `reload()`s; user believes dose logged
```

Specific gaps: (a) a dose **logged while offline that fails to flush** is dropped with no badge, no retry count, no notice; (b) in `MainApp.jsx:327` a failed dose insert only hits `console.error` and the view reloads — the user gets no indication the dose was not saved; (c) the background badge check at `MainApp.jsx:336` and push subscription at `429` are `catch {}`.

**Fix:** `queueDoseLog` should move failures to a dead-letter with retry/backoff and expose a "X changes pending sync" indicator (data already exists in `getQueueLength`, currently dead code — see L1); surface insert failures in the dose UI; at least `console.error` every swallowed catch, and send critical ones to Sentry.

### M6. `100vh` used where `100dvh` is needed (mobile URL-bar overflow)
**Files:** `app/privacy/page.jsx:7`, `app/terms/page.jsx:7`, `app/refund-policy/page.jsx:7`, `components/ErrorBoundary.jsx:28`, `components/LandingPage.jsx:18`, `components/PricingPage.jsx:34`

The project already established the correct pattern in `lib/constants.js:195`:
```css
.auth-screen{min-height:100vh;min-height:100dvh;...}
```
but legal pages, `ErrorBoundary`, `LandingPage`, and the pricing page still use bare `min-height: 100vh`, so on mobile browsers the bottom folds under the address bar and contact content gets clipped or requires awkward scrolling.

**Fix:** Apply the `100vh;100dvh` fallback to those spots.

### M7. `colorScheme: "light"` conflicts with the app's own dark themes
**File:** `app/layout.tsx:46-52`, `app/page.jsx:19-25`

```tsx
export const viewport: Viewport = { themeColor: "#007AFF", colorScheme: "light", ... }
```
The app detects and persists the system theme (`mt_sys_theme`, `Onboarding.jsx:24`) and supports dark themes, but `colorScheme:"light"` forces native form controls, scrollbars, and UA-rendered UI to stay light inside dark themes.

**Fix:** Set `colorScheme` dynamically with the active theme or use `"light dark"`.

---

## LOW / INFORMATIONAL

### L1. Dead exports (defined in `lib/`, never imported anywhere)
Audited by symbol-occurrence scan + grep confirmation (only the definition site matches):
- `lib/db.ts:5,9,13,70,74,78,82` — `fetchMeds`, `fetchLogs`, `fetchVitals`, `insertDoseLog`, `insertVital`, `updateMedication`, `deleteMedication`
- `lib/i18n.js:3428` — `getLangList` (unused despite a language picker existing)
- `lib/gamification.js:144` — `awardPoints`
- `lib/notifications.js:621` — `checkAndNotifyChallenges`
- `lib/offline.js:26,75` — `clearCache`, `getQueueLength` (the latter should probably be surfaced — see M5)
- `lib/server-fcm.js:104` — `sendNativePush`
- `lib/useSwipe.js:41,45` — `useSwipeBack`, `SwipeDismiss`
- Others flagged by the same scan: `lib/data.js` (`usesPaystack`, `themeVars`, `setStock`, `saveVisits`, `doseIntervalMs`, `computeMissedDoses`, `ENTERPRISE_TIERS`), `lib/healthData.js` (`fetchPersonalDetails`, `fetchStock`), `lib/household.js` (`managedKey`, `getManagedData`, `saveManagedData`, `takenTodayCount`, `buildUpNext`, `lowStockMeds`, `MANAGED_STORAGE_KEY`), `lib/notifications.js` (`removePushSubscription`, `playAlarmSound`, `getVitalNextDue`), `lib/rateLimit.js` (`checkRateLimit` — exported but only self-referenced).

**Fix:** Delete or wire up. Several (`getQueueLength`, `playAlarmSound`) look like they were meant to be used and were abandoned.

### L2. 153 of 282 i18n keys are unused; one locale has a typo'd key
- Unused example clusters: `nav.profile`, `nav.alerts`, `nav.me`; `today.*` (19 keys); `meds.*`; `vitals.*`; `reports.*` (~45 keys, incl. the whole caregiver/report analytics surface); `profile.yourPlanIncludes` + `profile.*plan` (16); `frequencies.*`; `reminders.*`; `vitalLabels.*` (11); `streak.*` (7); `log.*`.
- `sw` locale defines `profile.yourPlanInclude` (en has `profile.yourPlanIncludes`) — a typo'd orphan key.
- Meanwhile `profile.unlimitedMedsAd` is *missing* from `en` but present in 11 locales (H3) — the key sets are clearly drifting independently.

**Fix:** Prune unused keys (bundle-size win — the dict is a 3,440-line single file) and add a locale-key-diff check to CI.

### L3. Unreferenced public assets
`public/icon-48.png`, `icon-72.png`, `icon-96.png`, `icon-128.png`, `icon-144.png`, `icon-152.png`, `icon-256.png`, `icon-384.png`, plus boilerplate `file.svg`, `globe.svg`, `window.svg`, `next.svg`, `vercel.svg` — zero references in code or `manifest.json` (which only uses 192/512/`.svg`, `public/manifest.json:11-15`).

**Fix:** Remove, or plug `icon-152.tsx`.../the 256px asset into the manifest/apple meta if intended for Android adaptive icons.

### L4. Stale product name "MediTrack" in user-facing copy
**File:** `components/Modals.jsx:555`
```jsx
Invite by email — they need a MediTrack account
```
The rebrand to **Adhera** is complete everywhere else (`app/layout.tsx`, `public/manifest.json`, PDF reports `MainApp.jsx:374,412`, `PricingPage`), and `MediTrack` remains only in repo docs/scripts (`test-plan.md`, `store-listing.md`, `scripts/gen_progress_report.py`).

**Fix:** Replace with "Adhera account".

### L5. `app/not-found.js` silently hard-redirects with no fallback UI
**File:** `app/not-found.js:4-6`
```jsx
useEffect(() => { window.location.replace("/"); }, []);
return null;
```
Unknown routes produce a blank screen then a full page reload to `/` only after JS executes. No 404 content, no link, poor non-JS / offline behavior.

**Fix:** Render a styled 404 with a home link; or use `next/navigation` `redirect()` so the client router handles it.

### L6. Offline overlay blocks the whole (working) app
**File:** `components/OfflineScreen.jsx:26-63`

The overlay sits at `zIndex: 9998`, `position:fixed; inset:0` over everything whenever `navigator.onLine` flips false — even though the SW cache (`public/sw.js:148-175`) makes the app largely functional offline. `navigator.onLine` is also unreliable (false negatives on network-cache hits). It's dismissible but appears again on every reconnect blip.

**Fix:** Show a non-blocking banner when offline, keep writing to the offline queue, and/or gate on actual request failures rather than `navigator.onLine`.

### L7. `ErrorBoundary` doesn't report to Sentry; "retry" can loop forever
**File:** `components/ErrorBoundary.jsx:15-21`

`componentDidCatch` only `console.error`s (the app ships with Sentry — `app/error.tsx:4,14` uses it), and `handleRetry` just resets state so the same crashing subtree re-renders into the same crash.

**Fix:** `Sentry.captureException` in `componentDidCatch`; give retry a reset key/breadcrumb count so a persistent crash doesn't re-loop.

### L8. Form label association is broken / dead ternary
**File:** `components/FormControls.jsx:9-13`
```jsx
{label && <label ... htmlFor={inputId}>{label}</label>}
{typeof children === "object" && children !== null
  ? <div id={inputId}>{children}</div>
  : <div id={inputId}>{children}</div>}
```
Both branches are identical (dead ternary), and `htmlFor` points at a wrapper `<div>`, not the focusable input — clicking the label won't focus the field, and screen readers won't associate them.

**Fix:** Collapse the ternary and forward `id` into the inner control (or wrap with `<label>` directly).

---

## POSITIVE NOTES / NON-ISSUES (verified)

- **Empty & loading states are broadly in place:** `MedsTab.jsx:120-126`, `FamilyTab.jsx:109-121,207-210,280-283`, `CommunityTab.jsx:226-247,392-403` (skeleton loaders too), `HistoryTab.jsx:29-30`, `AlertsTab.jsx:23-30`, `TodayTab.jsx:303-309`. No missing-empty-state defects found.
- **API routes return proper JSON errors** (4xx/5xx with messages): `app/api/paystack/webhook/route.ts`, `app/api/invite/route.ts`, `app/api/waitlist/route.ts`, `app/api/account/delete/route.ts`, `app/api/fastspring/verify/route.ts`.
- **`MedSheet.jsx` is the model error-handling implementation** — inline `err-msg`, 20-second timeout race (line 65), entitlement cap-hit upsell (94-100), server-side USD validation — other forms should follow it.
- **`lib/constants.js` CSS** already models the correct `100vh`/`100dvh` fallback; `manifest.json` is well-formed (standalone, theme, maskable icons).
- Secondary vital readings (`value_secondary`) and cumulative-vital targets (`CUMULATIVE_TYPES`) show attention to clinical edge cases.
- No `TODO`/`FIXME`/`HACK` markers anywhere in source (grep clean, only a noise hit in `package-lock.json`).

---

## Suggested Fix Order

1. **H1/H2/H3** — 15 minutes each, all copy/entitlement mismatches and translation gaps that users hit on the most active screens (upgrade, vitals, free-tier upsell).
2. **H4** — reminder delivery is the core product promise; persist + re-arm SW timers or move to push.
3. **H5/M1/M3** — consolidate on `t()` + inline error banners + locale-aware dates.
4. **M2/M4** — `<html lang/dir>` and keyboard/ARIA pass (biggest surface but mechanical).
5. **M5** — offline queue durability + visible sync state.
6. **L1-L8** — cleanup sweep (dead code, unused assets, stale brand string, 404 page).