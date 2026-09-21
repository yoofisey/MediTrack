import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, LevelFormat, NumberFormat, convertInchesToTwip } from "docx";
import { writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "Adhera_Project_Report.docx");

const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text, bold: true, size: 32, color: "007AFF" })] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 160 }, children: [new TextRun({ text, bold: true, size: 26, color: "5856D6" })] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 }, children: [new TextRun({ text, bold: true, size: 22 })] });
const para = (text, opts = {}) => new Paragraph({ spacing: { after: 120, line: 276 }, ...opts, children: [new TextRun({ text, size: 21, ...opts.run })] });
const bullet = (text, opts = {}) => new Paragraph({ spacing: { after: 60, line: 260 }, bullet: { level: 0 }, ...opts, children: [new TextRun({ text, size: 21, ...opts.run })] });
const bullet2 = (text) => new Paragraph({ spacing: { after: 60, line: 260 }, bullet: { level: 1 }, children: [new TextRun({ text, size: 20, color: "555555" })] });
const empty = () => new Paragraph({ spacing: { after: 80 }, children: [] });

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 21 } } },
  },
  sections: [{
    properties: {},
    children: [
      // ════════════════════════════════════
      // TITLE PAGE
      // ════════════════════════════════════
      new Paragraph({ spacing: { before: 3000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: "Adhera", size: 64, bold: true, color: "007AFF" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: "Your Personal Treatment Companion", size: 28, color: "666666" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ text: "Progress Report & Roadmap", size: 32, bold: true, color: "5856D6" })],
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prepared: September 2026", size: 22, color: "888888" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Version 3.0", size: 22, color: "888888" })] }),

      // ════════════════════════════════════
      // 1. EXECUTIVE SUMMARY
      // ════════════════════════════════════
      h1("1. Executive Summary"),
      para("Adhera is a modern, multilingual medication tracking application built with Next.js and Supabase. Designed for patients, caregivers, and healthcare providers, it combines a clean, accessible interface with robust backend services to help users stay on top of their medication schedules. The web app is deployed on Vercel at https://www.useadhera.com, and native Android/iOS shells are packaged with Capacitor and built continuously by Codemagic."),
      para("As of September 2026, Adhera is in beta testing with most core and growth features operational: email OTP and Google OAuth authentication, medication management, dose tracking with push notifications, adherence analytics and PDF/CSV reports, doctor report sharing, vitals tracking, family/caregiver sharing, a community feed, gamification, a lock-screen Medical ID, biometric-style sign-in UX, and a 12-language interface. Billing runs through FastSpring (global subscriptions) with Paystack handling supported African markets. The codebase is lint-clean (0 ESLint errors), and the Android release pipeline produces a signed AAB/APK, on the way to store submission."),

      // ════════════════════════════════════
      // 2. PROJECT JOURNEY
      // ════════════════════════════════════
      h1("2. Project Journey"),
      para("The project began as a solo-developer effort to create a personal medication management tool that prioritizes user experience, adherence tracking, and reliable push notifications. Development has evolved through iterative phases, each building on real-world testing on an iPhone, the web, and now Android emulators."),

      h2("2.1 Ideation & Foundation"),
      bullet("Concept: A treatment companion app that replaces paper-based medication tracking with smart digital reminders, adherence analytics, and seamless family/caregiver sharing."),
      bullet("Tech stack selection: Next.js (App Router) frontend, Supabase for authentication + database + storage + serverless edge functions, Vercel for hosting."),
      bullet("Initial prototype: user auth (email + Google OAuth), medication CRUD, dose logging, basic notification support."),

      h2("2.2 Core Feature Development"),
      bullet("Authentication: Email/password signup and Google OAuth via Supabase Auth; 6-digit OTP verification; password reset; unified AuthScreen component with a premium iOS-style transition screen."),
      bullet("Medication management: Full CRUD via the MedSheet bottom sheet — name, dosage, interval, times-per-day, course duration, start date, color-coded appearance."),
      bullet("Dose tracking: Dose logging with journal support, refill date tracking, streak calculation, daily adherence percentage, missed-dose detection."),
      bullet("Schedule & alarms: Notification system (scheduleDoseAlarms) with client-side timers and a service worker; wake/bedtime schedules, configurable reminder lead time, full-screen alarm overlay with an audible beep."),
      bullet("Reports & analytics: Adherence history, facet charts, doctor-ready clinical summaries, PDF reports, and CSV export."),

      h2("2.3 Growth Features"),
      bullet("Vitals tracking: blood pressure, glucose, weight, pulse, temperature, oxygen, with trend charts and time-series logging."),
      bullet("Family & caregivers: linked member profiles, managed medication entry, per-member adherence, visit history, care notes, pending invites via email."),
      bullet("Community: public feed with categories, posts, comments, and reactions for peer support."),
      bullet("Gamification: streak milestones, badges, XP, daily challenges to sustain adherence motivation."),
      bullet("Medical ID: lock-screen emergency info (blood type, allergies, conditions, medications, emergency contact) with multi-country dial codes."),
      bullet("Side-effect tracker, interaction checker (built-in med database), journaling, and a reflection calendar."),
      bullet("Localization: full UI translation in 12 languages including English, French, Spanish, Portuguese, Arabic, Swahili, Hausa, Igbo, Yoruba, Mandarin, German, and Italian."),

      h2("2.4 Production Polish"),
      bullet("Refined splash/loading experience with animated status messages (\"Verifying your session\" → \"Syncing your data\" → \"Almost ready\")."),
      bullet("New brand identity: custom logo tile and full icon set (PNG sizes 48–512px, SVG, apple-touch-icon, Android adaptive icons)."),
      bullet("Premium iOS-light transition/loading screens centered on the brand logo, with film-grain, gradient underline, and animated orbital accents."),
      bullet("Full-screen alarm overlay with beeping sound, medication details, and dismiss interaction."),
      bullet("OpenGraph and Twitter Card meta tags; .env.example for developer onboarding; refactored hardcoded payment keys into environment variables."),

      h2("2.5 Payments: FastSpring + Paystack"),
      bullet("Global recurring subscriptions (Pro / Family plans) migrated to FastSpring, with server-side order verification, signed webhooks, plan tags, refund detection, and anti-abuse rate limiting (app/api/fastspring/*)."),
      bullet("Country-aware routing: FastSpring for most global markets, Paystack for supported African markets (app/api/paystack/* with init/verify/webhook flows)."),
      bullet("Test mode fully exercised end-to-end; live catalog and credentials pending final setup."),

      h2("2.6 Doctor Report Sharing"),
      bullet("\"Share with Doctor\" from the Reports tab: clinical summary with adherence rate, streak, and per-medication Good/Fair/Poor status."),
      bullet("Uses the Web Share API for native iPhone sharing (WhatsApp, email, messages); clipboard fallback."),
      bullet("Report format optimized for clinical communication — clean, concise, and scannable."),

      h2("2.7 Native Mobile Shells (Capacitor)"),
      bullet("Android and iOS projects scaffolded with Capacitor, loading the live web app (server.url set to https://www.useadhera.com)."),
      bullet("Android native icon set rebuilt and verified by SHA-256; app installed and tested on a Pixel-form-factor emulator and a Samsung Galaxy S24 device profile."),
      bullet("Fixed stale native-view caching by versioning the service-worker cache (adhera-v3) and cache-busting logo assets (?v=3), verified from live traffic."),
      bullet("Capacitor 8 CLI requires Node ≥22 — reflected in CI configuration."),

      h2("2.8 CI/CD & Release Pipeline (Codemagic)"),
      bullet("codemagic.yaml defines android-release (AAB + APK, signed) and ios-release (IPA, App Store) workflows triggered on push/tag."),
      bullet("Secret groups populated: android_keystore (base64 keystore + passwords + alias) and google_services (google-services.json for FCM)."),
      bullet("Android release build verified working after bumping the CI Node runtime to 22; artifacts: signed .aab, .apk, and mapping.txt."),
      bullet("iOS build defined but blocked pending an Apple Developer account and the appstore_connect secret group."),
      bullet("Google Play publishing block is ready behind a service-account credential once the Play Console app exists."),

      h2("2.9 Code Quality & Maintainability"),
      bullet("Full ESLint sweep completed: react-hooks misuse (setState-in-effect, components created during render), any-types, unescaped entities, and raw <a> navigation converted to next/link — 0 errors remaining."),
      bullet("Type-safe FastSpring handlers and typed Supabase data-access layer (lib/db.ts) using PostgrestError instead of any."),
      bullet("eslint config scoped sensibly: build artifacts ignored, standalone scripts/ and Supabase edge functions get relaxed rules."),
      bullet("Service worker cache hygiene and offline support revisited (adhera-api-v1, adhera-v3)."),

      // ════════════════════════════════════
      // 3. TECHNICAL ARCHITECTURE
      // ════════════════════════════════════
      h1("3. Technical Architecture"),
      h2("3.1 Frontend (Web)"),
      bullet("Framework: Next.js 16 (App Router) with Turbopack; React clients; styled via a global CSS constant and inline styles."),
      bullet("Key components: AuthScreen, MainApp, TransitionScreen, AlarmOverlay, ForegroundAlert, TodayTab, MedsTab, VitalsTab, ReportsTab, HistoryTab, ProfileTab, CommunityTab, FamilyTab, GamificationTab, MedicalID, HealthJournal, AdherenceCalendar, MemberDetail, MedSheet, CheckoutSheet, VisitSheet, and more."),
      bullet("PWA: service worker (sw.js, cache adhera-v3) + manifest for installability and background notification scheduling."),
      bullet("i18n: custom translation layer (lib/i18n.js) covering 12 languages."),

      h2("3.2 Mobile (Native Shells)"),
      bullet("Capacitor 8 projects under android/ and ios/, packaging the remote web app for the stores."),
      bullet("Android: signed release build via Codemagic (keystore.properties generated from secrets), google-services.json restored in CI for FCM."),
      bullet("Push: browser Notification API + service worker on web; FCM config present for native."),

      h2("3.3 Backend & Data"),
      bullet("Database: Supabase (PostgreSQL) — profiles, medications, dose_logs, vitals, family_members, community_posts, payment_references, and related tables, guarded by row-level security."),
      bullet("Authentication: Supabase Auth — email OTP (6-digit) + Google OAuth; password reset flows."),
      bullet("Edge functions: supabase/functions/send-reminders for scheduled medication reminders."),
      bullet("Serverless API routes (app/api/*): fastspring (init/verify/webhook), paystack (init/verify/webhook), account/delete, cron (manage, send-reminders, downgrade-expired), invite."),
      bullet("Rate limiting for payment routes to mitigate abuse."),

      h2("3.4 Hosting & CI/CD"),
      bullet("Web: Vercel, production at https://www.useadhera.com, auto-deploys on push to main."),
      bullet("Mobile: Codemagic (macOS arm runners) — android-release and ios-release workflows defined in codemagic.yaml."),
      bullet("Email: Resend SMTP, domain useadhera.com verified, sender noreply@useadhera.com."),

      // ════════════════════════════════════
      // 4. CHALLENGES FACED
      // ════════════════════════════════════
      h1("4. Challenges Faced"),
      h2("4.1 iOS Push Notifications"),
      para("iOS Safari restricts the Notification API to PWAs added to the home screen (iOS 16.4+); in regular Safari it reports \"unsupported\". Users are guided to install Adhera to the home screen; native iOS push via APNs/FCM is planned post-launch."),

      h2("4.2 Stale Native Cache After Rebrand"),
      para("After switching to the Adhera logo, Android still showed the old icon and the first screen cached stale images. Root cause: the service worker served cache-first, and activating a renamed cache is what purges the old one. Fixed by bumping the cache to adhera-v3 and appending ?v=3 to logo URLs; verified from live network traces and purged caches."),

      h2("4.3 Capacitor CLI / CI Node Version"),
      para("Codemagic builds failed with \u201cCapacitor CLI requires NodeJS ≥22.0.0\u201d because the workflow pinned Node 20. Bumped codemagic.yaml to Node 22 (both workflows); Android release build now completes successfully."),

      h2("4.4 FastSpring vs Paystack Geo-Routing"),
      para("Reconciling two payment providers required a country matrix (FastSpring for global, Paystack for select African markets) plus separate verify/webhook handlers, refund handling, and plan-tag extraction for both providers."),

      h2("4.5 Mobile Tooling on Windows"),
      para("Android emulator management and capturing device screenshots required Non-standard tooling (hand-built AVD profiles, cmd-based screencap to avoid binary corruption in PowerShell). Resolved with a repeatable playbook."),

      h2("4.6 Watchlist: Vercel Deployment Reliability"),
      para("Earlier auto-deploys were inconsistent; current GitHub-integrated auto-deploy on push to main has been stable for the recent release cycles. Manual vercel deploy --prod remains the fallback."),

      // ════════════════════════════════════
      // 5. REGULATORY COMPLIANCE
      // ════════════════════════════════════
      h1("5. Regulatory Compliance"),
      para("As Adhera targets US and EU markets, healthcare-data compliance is a core concern. The framework below reflects Adhera's current and planned features."),

      h2("5.1 Current Classification: General Wellness App"),
      para("Adhera tracks medication schedules, sends reminders, and generates adherence reports. It does NOT diagnose, recommend treatments, or replace medical advice — classifying it as a \"general wellness\" app, exempt from medical-device regulation (FDA in the US, MDR in the EU). This classification must be preserved unless clinical decision-support features are added."),

      h2("5.2 US: HIPAA"),
      bullet("Applicability: HIPAA applies when Protected Health Information (PHI) is stored or transmitted. Adhera stores medication names, dosages, and adherence data — health data."),
      bullet("Current status: A standalone patient-facing app without provider integration is not strictly HIPAA-triggering, but all health data is treated as sensitive."),
      bullet("When it becomes mandatory: vitals sharing with providers, doctor dashboards, or provider data exchange."),
      bullet("Action items (when triggered): BAA with Supabase, audit logging, encryption at rest and in transit."),

      h2("5.3 EU: GDPR"),
      bullet("Applies to all EU users; health data is \"special category\" data (Art. 9) needing the highest protection tier."),
      bullet("Implemented: data export (JSON/CSV) from Profile → Privacy & Data, account deletion via /api/account/delete, privacy policy, terms, and refund policy pages."),
      bullet("Action items: consent management for health-data processing, DPA with Supabase, final privacy-policy review for health-data disclosure."),

      h2("5.4 US: FDA & FTC"),
      bullet("FDA: medication trackers are general wellness; no clearance required unless clinical advice features are added (e.g., clinical interaction guidance)."),
      bullet("FTC: clear privacy policy, no deceptive outcome claims, transparent data practices."),

      h2("5.5 EU: MDR"),
      bullet("Same line as FDA: general wellness apps are exempt; clinical features fall under MDR."),

      h2("5.6 Compliance Roadmap"),
      bullet("Done: data export (JSON/CSV), account deletion, privacy/terms/refund policy pages, .env.example."),
      bullet("Pre-launch: add explicit consent management for health data; DPA with Supabase; no clinical claims in marketing or store listings."),
      bullet("If adding provider/vitals-clinical features: BAA with Supabase, audit logging, regulatory counsel for FDA/MDR classification."),

      // ════════════════════════════════════
      // 6. TIMELINE & MILESTONES
      // ════════════════════════════════════
      h1("6. Timeline & Milestones"),
      para("Key phases, milestones achieved, and current status."),
      empty(),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: ["Phase", "Milestone", "Status"].map(h => new TableCell({
              width: { size: h === "Status" ? 20 : 40, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: "FFFFFF" })], spacing: { after: 0 } })],
              shading: { fill: "007AFF" },
            })),
          }),
          ...[
            ["Foundation", "Next.js + Supabase + Vercel scaffolded", "Completed"],
            ["Authentication", "Email OTP + Google OAuth, login/signup/reset flows", "Completed"],
            ["Core Features", "Medication CRUD, dose logging, schedule management", "Completed"],
            ["Notifications", "Push notifications, service worker, alarm overlay", "Completed"],
            ["Growth Features", "Vitals, family/caregiver, community, gamification, Medical ID, journal, side effects", "Completed"],
            ["Localization", "12-language UI", "Completed"],
            ["GDPR Tooling", "Data export (JSON/CSV) + account deletion", "Completed"],
            ["Legal Pages", "Privacy policy, terms, refund policy", "Completed"],
            ["Brand Identity", "Custom logo, full icon set, iOS loading screens", "Completed"],
            ["Analytics & Reports", "History, adherence metrics, PDF + CSV reports, doctor sharing", "Completed"],
            ["Payments", "FastSpring (global) + Paystack (Africa) — test mode exercised", "In Progress"],
            ["Native Shells", "Capacitor Android + iOS projects; Android tested on emulators", "Completed"],
            ["CI/CD", "Codemagic android-release signed builds working", "Completed"],
            ["Code Quality", "ESLint sweep to 0 errors; typed data layer", "Completed"],
            ["Beta Testing", "App live at www.useadhera.com — gathering feedback", "In Progress"],
            ["Android Store Submission", "Play Console account + AAB upload + internal testing", "Pending"],
            ["iOS Store Submission", "Apple Developer account + TestFlight + app review", "Pending"],
            ["Payments Go-Live", "FastSpring/Paystack live keys wired into Vercel env", "Pending"],
          ].map(row => new TableRow({
            children: row.map((cell, i) => new TableCell({
              width: { size: i === 2 ? 20 : 40, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: cell, size: 19 })], spacing: { after: 0 } })],
            })),
          })),
        ],
      }),
      empty(),

      // ════════════════════════════════════
      // 7. ROADMAP
      // ════════════════════════════════════
      h1("7. Roadmap"),

      h2("7.1 Launch Blockers (Do Next)"),
      h3("Payments go-live"),
      bullet2("Activate FastSpring/Paystack live catalog, wire live keys + webhook URLs into Vercel environment variables."),
      bullet2("End-to-end live payment test on device (subscribe, webhook upgrade, renewal/refund handling)."),
      bullet2("Confirm VAT/tax settings and country routing in production."),
      h3("Store submission"),
      bullet2("Create Android Play Console app (com.useadhera.app); upload the Codemagic-signed AAB to Internal testing; run a signer-verification check (SHA-256 of builds)."),
      bullet2("Create Apple Developer account ($99/yr); register bundle id com.useadhera.app; generate App Store Connect API key and populate the appstore_connect secret group; run ios-release on a tag."),
      bullet2("Add store listings (screenshots from Pixel + Samsung emulators, descriptions, privacy links)."),
      h3("Compliance & QA"),
      bullet2("Add explicit health-data consent management; final privacy-policy review."),
      bullet2("Beta-tester onboarding list and feedback loop."),

      h2("7.2 Launch Preparation"),
      h3("Development"),
      bullet2("Accessibility audit (keyboard navigation, screen reader, contrast)."),
      bullet2("Core Web Vitals / Lighthouse performance pass."),
      bullet2("Error monitoring (e.g., Sentry) and uptime alerts."),
      h3("Non-Development"),
      bullet2("Analytics (Plausible/PostHog), Search Console + sitemap submission."),
      bullet2("Customer support channel; social presence; health-tech outreach."),
      bullet2("Optionally enable automated Google Play publishing via a service account (GCLOUD_SERVICE_ACCOUNT_CREDENTIALS)."),

      h2("7.3 Post-Launch (Month 1–3)"),
      bullet2("Collect beta/production feedback; prioritize feature requests."),
      bullet2("Caregiver notification preferences and reminder channels."),
      bullet2("Vitals trend reports for doctors; pre-visit intake forms."),
      bullet2("Iterate on pricing based on market response."),

      h2("7.4 Medium-Term (3–6 Months)"),
      bullet("Native iOS push reliability (APNs via FCM) and in-app notification center."),
      bullet("AI-powered insights: predict missed doses, suggest schedule optimizations."),
      bullet("Apple Health / Google Fit integration; wearable device hooks."),
      bullet("Offline-first architecture with local-first data sync."),
      bullet("Doctor/Clinic dashboard (patient lists, adherence views, secure report links) — the ClinchPro-equivalent path."),

      // ════════════════════════════════════
      // 8. APPENDIX: KEY METRICS
      // ════════════════════════════════════
      h1("8. Appendix: Key Metrics"),
      bullet("Tech Stack: Next.js 16 + Supabase + Vercel + Capacitor 8"),
      bullet("Web deployment: https://www.useadhera.com (auto-deploy on push to main)"),
      bullet("Mobile CI/CD: Codemagic — android-release (signed AAB/APK) working; ios-release defined"),
      bullet("Authentication: Email OTP (6-digit) + Google OAuth"),
      bullet("Database: PostgreSQL via Supabase (RLS-enforced)"),
      bullet("Payments: FastSpring (global) + Paystack (Africa), test-mode exercised"),
      bullet("Email: Resend SMTP (useadhera.com verified; noreply@useadhera.com)"),
      bullet("Notifications: Browser Notification API + Service Worker (web); FCM config for native"),
      bullet("Languages: 12 (EN, FR, ES, PT, AR, SW, HA, IG, YO, ZH, DE, IT)"),
      bullet("PWA: manifest + service worker (adhera-v3 cache) + full icon set"),
      bullet("Code Quality: 0 ESLint errors; typed data layer (PostgrestError); API rate limiting on payment routes"),
      bullet("Regulatory: general wellness classification (exempt from FDA/MDR); HIPAA-ready roadmap; GDPR tooling shipped"),
      bullet("Approximate build health: next build + TypeScript pass clean"),

      empty(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [new TextRun({ text: "— End of Report —", size: 22, color: "888888", italics: true })],
      }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(outPath, buffer);
console.log(`OK Word document generated: ${outPath}`);