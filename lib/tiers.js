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
    refillReminder: false,
    interactionCheck: false,
    upsell: true,
    upgradeTarget: "pro",
    features: [],
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
    interactionCheck: true,
    upsell: false,
    features: ["vitals", "reports", "interactionCheck", "refillReminder", "barcodeScan", "prescriptionScan", "sideEffects", "healthJournal"],
  },
  family: {
    label: "Family",
    badge: "Family",
    theme: { accent: "var(--teal2)", badgeBg: "var(--ib2)", badgeFg: "var(--teal2)" },
    layout: "stacked",
    maxMeds: 999,
    history: 999,
    caregiving: true,
    reports: false,
    refillReminder: false,
    interactionCheck: false,
    profiles: 5,
    upsell: false,
    features: ["familyMembers", "familyDashboard", "managedProfiles", "perMemberVitals", "perMemberReports", "caregiverAlerts"],
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
    features: ["reports", "refillReminder", "interactionCheck", "apiAccess", "branding", "hipaa", "bulkPatients", "dedicatedSupport"],
  },
};

export function getTierConfig(tier) {
  return TIER_CONFIG[tier] || TIER_CONFIG[DEFAULT_TIER];
}

export function canAddMed(plan, currentMedCount) {
  return currentMedCount < (getTierConfig(plan).maxMeds ?? 2);
}
