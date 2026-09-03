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
        children: [new TextRun({ text: "Project Report & Roadmap", size: 32, bold: true, color: "5856D6" })],
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prepared: July 2026", size: 22, color: "888888" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Version 2.0", size: 22, color: "888888" })] }),

      // ════════════════════════════════════
      // 1. EXECUTIVE SUMMARY
      // ════════════════════════════════════
      h1("1. Executive Summary"),
      para("Adhera is a modern medication tracking web application built with Next.js 16 and Supabase. Designed for patients, caregivers, and healthcare providers, it combines a clean, accessible interface with robust backend services to help users stay on top of their medication schedules. The app is deployed on Vercel and is being progressively refined toward a production-ready public launch."),
      para("As of July 2026, Adhera is live with core features operational: email OTP authentication, Google OAuth, medication management, dose tracking with push notifications, adherence analytics with PDF reports, doctor report sharing, Paystack subscription billing, and a PWA-optimized experience for iPhone users. The app is now entering beta testing with a focus on regulatory compliance for US (HIPAA) and EU (GDPR) market entry."),

      // ════════════════════════════════════
      // 2. PROJECT JOURNEY
      // ════════════════════════════════════
      h1("2. Project Journey"),
      para("The project was initiated as a solo-developer effort to create a personal medication management tool that prioritizes user experience, adherence tracking, and reliable push notifications. The development process has evolved through several phases of iteration, each building on feedback from real-world testing on an iPhone."),

      h2("2.1 Ideation & Foundation"),
      bullet("Concept: A treatment companion app that replaces paper-based medication tracking with smart digital reminders, adherence analytics, and seamless family/caregiver sharing."),
      bullet("Tech stack selection: Next.js 16 (App Router) for the frontend, Supabase for authentication + database + storage, Vercel for hosting."),
      bullet("Initial prototype built with core features: user auth (email + Google OAuth), medication CRUD, dose logging, basic notification support."),

      h2("2.2 Core Feature Development"),
      bullet("Authentication: Email/password signup and Google OAuth integration via Supabase Auth. Login, signup, password reset flows built into a unified AuthScreen component."),
      bullet("Medication management: Full CRUD via MedSheet bottom-sheet component. Fields include name, dosage, interval, times-per-day, course duration, start date, color-coded appearance."),
      bullet("Dose tracking: Dose logging with journal support, refill date tracking, streak calculation, daily adherence percentage."),
      bullet("Schedule & alarms: Notifications system (scheduleDoseAlarms) that runs timers client-side and via service worker. Supports wake/bedtime schedules, configurable reminder lead time, missed-dose detection and alerts."),

      h2("2.3 UI/UX Refinement"),
      bullet("Tab-based layout (Today, Meds, History, Reports, Profile) with sticky bottom tab bar."),
      bullet("Profile section with avatar upload (Supabase Storage), theme color picker, health condition, country/org field for enterprise users."),
      bullet("Paywall/upgrade flow via UpgradeModal with Paystack (Africa) and Stripe (global) payment processing."),
      bullet("Milestone celebration system that shows a notification when users hit 3, 7, 14, 30, 60, 90, or 180 day streaks."),

      h2("2.4 Production Polish"),
      bullet("Refined the splash/loading experience with animated status messages (\"Verifying your session\" → \"Syncing your data\" → \"Almost ready\")."),
      bullet("Full-screen alarm overlay with beeping alarm sound, medication details, and dismiss interaction."),
      bullet("Generated proper PWA icon set (PNG sizes from 48px to 512px + apple-touch-icon)."),
      bullet("Refactored hardcoded payment keys into environment variables."),
      bullet("Added OpenGraph and Twitter Card meta tags for social sharing."),
      bullet("Added .env.example for developer onboarding."),

      h2("2.5 Payment & Authentication Overhaul"),
      bullet("Switched Paystack from one-time payments to recurring subscription plans (Pro: PLN_w5rq3bkd5uh5mqj, Family: PLN_h9mlqfmujuh74c9)."),
      bullet("Replaced Paystack iframe integration (openIframe) with popup-based flow (openPopup) to bypass domain whitelist restrictions."),
      bullet("Added Paystack redirect fallback handler (trxref URL parameter detection) for cases where popups are blocked."),
      bullet("Switched Supabase Auth from magic links to 6-digit OTP verification codes."),
      bullet("Set up Resend domain (useadhera.com) with auto-configured DNS, enabling email delivery for password resets and family invites."),

      h2("2.6 Doctor Report Sharing"),
      bullet("Added \"Share with Doctor\" feature to Reports tab — generates a clinical summary with adherence rate, streak, per-medication breakdown with Good/Fair/Poor status."),
      bullet("Uses Web Share API for native iPhone sharing (WhatsApp, email, messages)."),
      bullet("Fallback: copies report to clipboard for manual sharing."),
      bullet("Report format optimized for clinical communication — clean, concise, scannable."),

      // ════════════════════════════════════
      // 3. TECHNICAL ARCHITECTURE
      // ════════════════════════════════════
      h1("3. Technical Architecture"),
      h2("3.1 Frontend"),
      bullet("Framework: Next.js 16 (App Router) with Turbopack for development builds."),
      bullet("Language: JavaScript (JSX) with TypeScript for layout/metadata."),
      bullet("Styling: CSS-in-JS via inline styles, global constants file (CSS constant), minimal Tailwind CSS."),
      bullet("Key components: AuthScreen, MainApp, TodayTab, MedsTab, VitalsTab, ReportsTab, VisitHistoryTab, ProfileTab, MedSheet, VisitSheet, Modals (DeleteConfirm, LogDose, Upgrade, FamilyInvite, Privacy, Terms), TransitionScreen, AlarmOverlay, SentOtpView."),
      bullet("PWA: Service worker (sw.js) for background notification scheduling, manifest.json for installability."),

      h2("3.2 Backend"),
      bullet("Database: Supabase (PostgreSQL) — tables: profiles, medications, dose_logs, family_members."),
      bullet("Authentication: Supabase Auth with email OTP (6-digit codes) and Google OAuth. Row-level security (RLS) policies for data isolation."),
      bullet("Storage: Supabase Storage for profile avatar uploads."),
      bullet("Hosting: Vercel (production URL: meditrack-delta-pied.vercel.app)."),

      h2("3.3 Integrations"),
      bullet("Payment: Paystack (Africa) with live subscription plans, Stripe (global) with test keys."),
      bullet("Email: Resend SMTP — domain verified (useadhera.com), sender: noreply@useadhera.com."),
      bullet("Push: Browser Notification API + Service Worker for dose alarms."),
      bullet("Sharing: Web Share API for doctor report sharing (WhatsApp, email, messages)."),

      // ════════════════════════════════════
      // 4. CHALLENGES FACED
      // ════════════════════════════════════
      h1("4. Challenges Faced"),
      h2("4.1 iOS Push Notifications"),
      para("The most significant technical challenge. iOS Safari restricts the Notification API to websites added to the home screen as PWAs (iOS 16.4+). In regular Safari, Notification returns \"unsupported\". This limitation was documented and the user instructed to add Adhera to their home screen."),

      h2("4.2 Vercel Deployment Reliability"),
      para("GitHub-integrated auto-deployment was inconsistent — builds would fail or not trigger. Solved by switching to manual CLI deployment (vercel deploy --prod --yes), which consistently works."),

      h2("4.3 Email Delivery (Resend)"),
      para("Resend SMTP required domain verification before emails could be sent. Resolved by registering useadhera.com on Cloudflare, using Resend's auto-configure DNS feature to add all required records (TXT verification, CNAME DKIM, SPF) automatically."),

      h2("4.4 Supabase Storage Policies"),
      para("Initial attempts to set storage policies via SQL failed; policies had to be configured through the Supabase Dashboard UI."),

      h2("4.5 OAuth Redirects"),
      para("Google OAuth redirect_uri needed to match exactly. Solved by setting NEXT_PUBLIC_SITE_URL as a Vercel environment variable and referencing it in the OAuth redirect flow."),

      h2("4.6 Responsive Layout Overflow"),
      para("Several UI elements (country selects, time inputs, list items) caused horizontal overflow on iPhone. Fixed with universal box-sizing:border-box, max-width constraints, and media queries."),

      h2("4.7 Paystack Domain Whitelist"),
      para("Paystack's inline.js (openIframe) requires the app domain to be whitelisted. This setting was not available in the Paystack dashboard. Solved by switching from openIframe (iframe modal) to openPopup (new window/tab), which bypasses the domain restriction. Added a redirect fallback handler for cases where popups are blocked."),

      h2("4.8 OTP Length Configuration"),
      para("Supabase Auth was sending 10-digit OTP codes by default. The app's input validation was set to 6 digits. Resolved by changing the OTP length setting in Supabase Dashboard → Authentication → Settings."),

      h2("4.9 Multiple Lockfiles Warning"),
      para("Next.js warned about multiple lockfiles (root-level and project-level package-lock.json). No functional impact but a lingering configuration concern."),

      // ════════════════════════════════════
      // 5. REGULATORY COMPLIANCE
      // ════════════════════════════════════
      h1("5. Regulatory Compliance"),
      para("As Adhera targets US and EU markets, compliance with healthcare data regulations is critical. The following framework applies to Adhera's current and planned features."),

      h2("5.1 Current Classification: General Wellness App"),
      para("Adhera currently tracks medication schedules, sends reminders, and generates adherence reports. It does NOT diagnose conditions, recommend treatments, or replace medical advice. This classifies it as a \"general wellness\" app, which is exempt from medical device regulations (FDA in the US, MDR in the EU). This classification must be maintained unless clinical decision-support features are added."),

      h2("5.2 US: HIPAA (Health Insurance Portability and Accountability Act)"),
      bullet("Applicability: HIPAA applies when Protected Health Information (PHI) is stored or transmitted. Adhera stores medication names, dosages, and adherence data — this constitutes health data."),
      bullet("Current status: As a standalone patient-facing app (no provider integration), HIPAA compliance is not strictly required. However, best practice is to treat all health data as PHI."),
      bullet("When HIPAA becomes mandatory: Adding vitals tracking, doctor integrations, or sharing data with healthcare providers triggers HIPAA requirements."),
      bullet("Action items: Obtain a Business Associate Agreement (BAA) with Supabase (available on paid plans), implement audit logging, add data encryption at rest and in transit."),

      h2("5.3 EU: GDPR (General Data Protection Regulation)"),
      bullet("Applicability: GDPR applies to all EU users. Health data is classified as \"special category\" data under Article 9, requiring the highest protection tier."),
      bullet("Required: Explicit consent for health data processing, data portability (export user data), right to deletion (account deletion), a Data Processing Agreement with Supabase, and a comprehensive privacy policy."),
      bullet("Action items: Implement data export (CSV/JSON), implement account deletion, update privacy policy to cover health data collection, add consent management."),

      h2("5.4 US: FDA & FTC"),
      bullet("FDA: Medication trackers are typically classified as \"general wellness\" and don't require FDA clearance. Adding features like drug interaction checkers that give clinical advice crosses into medical device territory."),
      bullet("FTC: Must have a clear privacy policy, no deceptive claims about health outcomes, and transparent data practices."),

      h2("5.5 EU: MDR (Medical Device Regulation)"),
      bullet("Same line as FDA. General wellness apps are exempt. Clinical features are regulated under MDR."),

      h2("5.6 Compliance Roadmap"),
      bullet("Immediate: Update privacy policy to explicitly mention health data collection."),
      bullet("Immediate: Add data export functionality (users can download their medication data)."),
      bullet("Immediate: Add account deletion functionality."),
      bullet("Pre-launch: Don't make clinical claims in marketing or app store listings."),
      bullet("Pre-launch: Set up Data Processing Agreement with Supabase."),
      bullet("If adding vitals/doctor features: Obtain BAA with Supabase for HIPAA compliance."),
      bullet("If adding vitals/doctor features: Implement audit logging for all data access."),
      bullet("If adding clinical features: Consult regulatory counsel for FDA/MDR classification."),

      // ════════════════════════════════════
      // 6. TIMELINE & MILESTONES
      // ════════════════════════════════════
      h1("6. Timeline & Milestones"),
      para("The following table outlines the key phases, milestones achieved, and estimated dates."),
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
            ["Foundation", "Project setup, Next.js + Supabase + Vercel scaffolded", "Completed"],
            ["Authentication", "Email OTP + Google OAuth, login/signup flows", "Completed"],
            ["Core Features", "Medication CRUD, dose logging, schedule management", "Completed"],
            ["Notifications", "Push notification system, service worker, alarm timers", "Completed"],
            ["UI Polish", "Tab layout, themes, profile, avatar upload", "Completed"],
            ["Payment Integration", "Paystack subscriptions + Stripe (test mode)", "Completed"],
            ["Analytics", "History, reports, streaks, adherence metrics", "Completed"],
            ["Production Polish", "Splash screen, loader, alarm overlay, responsive CSS, PWA icons", "Completed"],
            ["Email Setup", "Resend SMTP configured, useadhera.com domain verified", "Completed"],
            ["Doctor Reports", "Share with Doctor feature (Web Share API + clipboard)", "Completed"],
            ["OTP Auth", "6-digit OTP verification, Supabase Auth configured", "Completed"],
            ["Regulatory Research", "HIPAA/GDPR/FDA/MDR compliance framework documented", "In Progress"],
            ["Data Export", "CSV/JSON data export for GDPR portability", "Pending"],
            ["Account Deletion", "Full account + data deletion for GDPR compliance", "Pending"],
            ["Privacy Policy Update", "Health data disclosure, consent management", "Pending"],
            ["Beta Launch", "App live — ready for beta users", "In Progress"],
          ].map(row => new TableRow({
            children: row.map(cell => new TableCell({
              width: { size: cell === row[2] ? 20 : 40, type: WidthType.PERCENTAGE },
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

      h2("7.1 Pre-Launch (Immediate — 1-2 Weeks)"),
      h3("Development"),
      bullet2("Implement data export (CSV/JSON) for user data portability (GDPR)"),
      bullet2("Implement account deletion (GDPR right to erasure)"),
      bullet2("Update privacy policy to explicitly mention health data collection"),
      bullet2("Add consent management for health data processing"),
      bullet2("Test Paystack subscription flow end-to-end on iPhone"),
      bullet2("Test OTP authentication flow end-to-end"),
      bullet2("Add proper error boundaries (ErrorBoundary component)"),
      bullet2("Add loading skeletons for data-fetching states"),
      h3("Non-Development"),
      bullet2("Set up Data Processing Agreement with Supabase"),
      bullet2("Write comprehensive Privacy Policy covering health data (US + EU)"),
      bullet2("Prepare beta tester list and invite process"),
      bullet2("Set up Google Search Console and submit sitemap"),

      h2("7.2 Launch Preparation (2-4 Weeks)"),
      h3("Development"),
      bullet2("Implement vitals tracking (BP, weight, glucose, temperature) with trend charts"),
      bullet2("Add appointment scheduling with push notification reminders"),
      bullet2("Build family/caregiver sharing feature end-to-end"),
      bullet2("Add medication interaction warnings at the point of adding new meds"),
      bullet2("Accessibility audit (keyboard navigation, screen reader support, color contrast)"),
      bullet2("Performance optimization (Lighthouse scores, Core Web Vitals)"),
      h3("Non-Development"),
      bullet2("Set up analytics (Plausible, PostHog, or Google Analytics)"),
      bullet2("Create user onboarding materials (guided tour, help docs)"),
      bullet2("Design social media presence (Twitter/X, LinkedIn)"),
      bullet2("Reach out to health-tech blogs and communities for coverage"),
      bullet2("Set up customer support ticketing (Intercom, Crisp, or email)"),
      bullet2("Set up BAA with Supabase if targeting US healthcare providers"),

      h2("7.3 Post-Launch (Month 1-3)"),
      h3("Development"),
      bullet2("Collect beta feedback and prioritize feature requests"),
      bullet2("Implement caregiver notification preferences"),
      bullet2("Build admin dashboard for enterprise customers"),
      bullet2("Implement end-to-end encryption for sensitive health data"),
      bullet2("Add audit logging for all data access (HIPAA readiness)"),
      h3("Non-Development"),
      bullet2("Monitor error rates and user feedback closely"),
      bullet2("Iterate on pricing based on market response"),
      bullet2("Explore partnerships with pharmacies and clinics"),
      bullet2("Hire or contract for ongoing maintenance and feature development"),

      h2("7.4 Medium-Term (3-6 Months)"),
      bullet("Native mobile app (React Native or Flutter) for better push notification reliability"),
      bullet("Apple Health / Google Fit integration for holistic health tracking"),
      bullet("AI-powered insights: predict missed doses, suggest schedule optimizations"),
      bullet("Multi-language support (starting with French and Spanish)"),
      bullet("Offline-first architecture with local-first data sync"),
      bullet("Wearable device integration (Apple Watch, Wear OS)"),

      h2("7.5 Doctor/Clinic Integration (ClinchPro Equivalent)"),
      bullet("Doctor dashboard — separate view for healthcare providers to manage patients, view adherence, send treatment plans"),
      bullet("Patient → Doctor report sharing via secure link (instead of clipboard/WhatsApp)"),
      bullet("Vitals trend reports for doctor review"),
      bullet("Pre-visit assessment forms (structured patient intake)"),
      bullet("Post-visit follow-up messaging and reminders"),

      // ════════════════════════════════════
      // 8. APPENDIX: KEY METRICS
      // ════════════════════════════════════
      h1("8. Appendix: Key Metrics"),
      bullet("Tech Stack: Next.js 16 + Supabase + Vercel"),
      bullet("Deployment: Production at meditrack-delta-pied.vercel.app"),
      bullet("Authentication: Email OTP (6-digit) + Google OAuth"),
      bullet("Database: PostgreSQL via Supabase"),
      bullet("Payments: Paystack (Africa, live subscriptions) + Stripe (global, test mode)"),
      bullet("Email: Resend SMTP (useadhera.com domain verified, noreply@useadhera.com)"),
      bullet("Notifications: Browser Notification API + Service Worker"),
      bullet("PWA: Manifest + service worker + icon set (10 PNG sizes + SVG)"),
      bullet("Storage: Supabase Storage for avatar uploads"),
      bullet("Sharing: Web Share API for doctor report sharing"),
      bullet("Languages: JavaScript (JSX) with minimal TypeScript"),
      bullet("Regulatory: General wellness classification (exempt from FDA/MDR)"),
      bullet("Compliance targets: HIPAA (US), GDPR (EU)"),

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
