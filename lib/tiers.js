// Single source of truth for subscription tiers. Every tier-specific value —
// label, badge, accent, layout, limits, and the feature list that drives
// rendering — lives here. Components must read from this config (usually via
// the TierProvider context), never hardcode a tier name or feature check.

export const TIERS = ["free", "pro", "family", "enterprise"];
export const DEFAULT_TIER = "free";

export const TIER_CONFIG = {
  free: {
    label: "Free",
    badge: "",
    theme: { accent: "var(--teal)", badgeBg: "var(--ib3)", badgeFg: "var(--orange)" },
    layout: "cards",
    maxMeds: 2,
    history: 7,
    caregiving: false,
    reports: false,
    basicReports: true,
    refillReminder: false,
    interactionCheck: false,
    upsell: true,
    upgradeTarget: "pro",
    features: ["basicReports"],
  },
  pro: {
    label: "Pro",
    badge: "Pro",
    theme: { accent: "var(--teal)", badgeBg: "var(--ib5)", badgeFg: "var(--teal)" },
    layout: "bento",
    maxMeds: 999,
    history: 999,
    caregiving: false,
    reports: true,
    refillReminder: true,
    interactionCheck: false,
    upsell: false,
    features: ["vitals", "reports", "refillReminder", "sideEffects", "healthJournal"],
  },
  family: {
    label: "Family",
    badge: "Family",
    theme: { accent: "var(--teal2)", badgeBg: "var(--ib2)", badgeFg: "var(--teal2)" },
    layout: "stacked",
    maxMeds: 999,
    history: 999,
    caregiving: true,
    reports: true,
    refillReminder: true,
    interactionCheck: true,
    profiles: 5,
    upsell: false,
    features: ["familyMembers", "familyDashboard", "managedProfiles", "perMemberVitals", "perMemberReports", "caregiverAlerts", "interactionCheck", "vitals", "reports", "refillReminder"],
  },
  enterprise: {
    label: "Enterprise",
    badge: "Enterprise",
    theme: { accent: "var(--teal2)", badgeBg: "var(--ib4)", badgeFg: "var(--t1)" },
    layout: "grid",
    maxMeds: 9999,
    history: 9999,
    caregiving: false,
    reports: true,
    refillReminder: true,
    interactionCheck: true,
    profiles: 999,
    api: true,
    branding: true,
    hipaa: true,
    bulkPatients: true,
    dedicatedSupport: true,
    upsell: false,
    features: ["reports", "refillReminder", "interactionCheck", "apiAccess", "branding", "hipaa", "bulkPatients", "dedicatedSupport", "vitals", "sideEffects", "healthJournal"],
  },
};

export function getTierConfig(tier) {
  return TIER_CONFIG[tier] || TIER_CONFIG[DEFAULT_TIER];
}

// i18n key (or plain English) for each feature flag. Used to render tier
// paywall/upsell feature lists from TIER_CONFIG.features so the copy can't
// drift from what each tier actually unlocks. `t` is the i18n lookup; when
// no `t` is passed (e.g. the public /pricing page, which has no provider),
// fall back to English so we never render a raw key string.
const FEATURE_KEYS = {
  basicReports: "profile.adherenceReports",
  reports: "profile.adherenceReports",
  vitals: "profile.vitalsTracking",
  perMemberVitals: "profile.perMemberVitals",
  perMemberReports: "profile.perMemberReports",
  refillReminder: "profile.refillReminders",
  interactionCheck: "profile.drugCheck",
  sideEffects: "profile.sideEffects",
  healthJournal: "profile.healthJournal",
  familyMembers: "profile.upToFiveProfiles",
  familyDashboard: "profile.familyDashboard",
  managedProfiles: "profile.managedProfiles",
  caregiverAlerts: "profile.caregiverAlerts",
  apiAccess: "profile.apiAccess",
  branding: "profile.branding",
  hipaa: "profile.hipaa",
  bulkPatients: "profile.bulkPatients",
  dedicatedSupport: "profile.prioritySupport",
  unlimitedMeds: "profile.unlimitedMeds",
  fullHistory: "profile.fullHistory",
};

const FEATURE_EN = {
  basicReports: "Adherence reports",
  reports: "Adherence reports",
  vitals: "Vitals tracking",
  perMemberVitals: "Per-member vitals & reports",
  perMemberReports: "Per-member adherence reports",
  refillReminder: "Refill reminders",
  interactionCheck: "Drug interaction check",
  sideEffects: "Side effects journal",
  healthJournal: "Health journal",
  familyMembers: "Up to 5 family profiles",
  familyDashboard: "Family dashboard",
  managedProfiles: "Managed profiles (children & parents)",
  caregiverAlerts: "Caregiver alerts for missed doses",
  apiAccess: "API access",
  branding: "Remove Adhera branding",
  hipaa: "HIPAA-compliant hosting",
  bulkPatients: "Bulk patient management",
  dedicatedSupport: "Priority support",
  unlimitedMeds: "Unlimited medications",
  fullHistory: "Full history",
};

export function featureLabels(feature, t) {
  if (t) return t(FEATURE_KEYS[feature] || feature);
  return FEATURE_EN[feature] || feature;
}

/** Feature flags for a tier, in display order. */
export function tierFeatures(tier) {
  return getTierConfig(tier || "free").features || [];
}

export function canAddMed(plan, currentMedCount) {
  return currentMedCount < (getTierConfig(plan).maxMeds ?? 2);
}
