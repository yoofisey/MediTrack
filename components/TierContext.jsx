"use client";

import { createContext, useContext, useMemo } from "react";
import { getTierConfig, DEFAULT_TIER, TIER_CONFIG } from "@/lib/tiers";

const TierContext = createContext(null);

export function TierProvider({ tier, children }) {
  const value = useMemo(() => {
    const t = TIER_CONFIG[tier] ? tier : DEFAULT_TIER;
    const config = getTierConfig(t);
    const has = (f) => Boolean(config.features?.includes(f) || config[f] === true);
    return { tier: t, config, has, theme: config.theme || {} };
  }, [tier]);
  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

export function useTier() {
  const ctx = useContext(TierContext);
  if (ctx) return ctx;
  const config = getTierConfig();
  return {
    tier: DEFAULT_TIER,
    config,
    has: (f) => Boolean(config.features?.includes(f) || config[f] === true),
    theme: config.theme || {},
  };
}
