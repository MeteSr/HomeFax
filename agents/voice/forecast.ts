/**
 * §17.2.1 — Instant Forecast computation for the relay server.
 *
 * Inlines the system spec tables and prediction engine from the frontend so
 * the relay can serve GET /api/instant-forecast with no canister dependency.
 * Keep in sync with frontend/src/services/maintenance.ts + systemAgeEstimator.ts
 * if those tables change.
 */

// ── System specs (mirrors SYSTEMS in maintenance.ts) ─────────────────────────

interface SystemSpec {
  name:                string;
  lifespanYears:       number;
  costLowCents:        number;
  costHighCents:       number;
}

const SYSTEMS: SystemSpec[] = [
  { name: "HVAC",         lifespanYears: 18, costLowCents:   800_000, costHighCents: 1_500_000 },
  { name: "Roofing",      lifespanYears: 25, costLowCents: 1_500_000, costHighCents: 3_500_000 },
  { name: "Water Heater", lifespanYears: 12, costLowCents:   120_000, costHighCents:   350_000 },
  { name: "Windows",      lifespanYears: 22, costLowCents:   800_000, costHighCents: 2_400_000 },
  { name: "Electrical",   lifespanYears: 35, costLowCents:   200_000, costHighCents:   600_000 },
  { name: "Plumbing",     lifespanYears: 50, costLowCents:   400_000, costHighCents: 1_500_000 },
  { name: "Flooring",     lifespanYears: 25, costLowCents:   300_000, costHighCents: 2_000_000 },
  { name: "Insulation",   lifespanYears: 30, costLowCents:   150_000, costHighCents:   500_000 },
  { name: "Solar Panels", lifespanYears: 25, costLowCents: 1_500_000, costHighCents: 3_500_000 },
];

// URL key → system name (for query param parsing)
export const SYSTEM_URL_KEYS: Record<string, string> = {
  hvac:         "HVAC",
  roofing:      "Roofing",
  water_heater: "Water Heater",
  plumbing:     "Plumbing",
  electrical:   "Electrical",
  windows:      "Windows",
  flooring:     "Flooring",
  insulation:   "Insulation",
  solar_panels: "Solar Panels",
};

// ── Climate zones (mirrors CLIMATE_ZONES in maintenance.ts) ──────────────────

const CLIMATE_MULTIPLIERS: Record<string, Partial<Record<string, number>>> = {
  hotHumid: { "HVAC": 0.85, "Roofing": 0.88, "Water Heater": 0.90, "Windows": 0.90, "Insulation": 0.85 },
  hotDry:   { "HVAC": 0.90, "Roofing": 0.92, "Windows": 0.90, "Plumbing": 0.90 },
  cold:     { "Roofing": 0.88, "Plumbing": 0.88, "HVAC": 0.88, "Windows": 0.88, "Insulation": 0.90 },
  veryCold: { "Roofing": 0.82, "Plumbing": 0.83, "HVAC": 0.83, "Windows": 0.83, "Insulation": 0.85 },
  mixed:    {},
};

const STATE_TO_ZONE: Record<string, string> = {
  FL: "hotHumid", LA: "hotHumid", MS: "hotHumid", AL: "hotHumid",
  GA: "hotHumid", SC: "hotHumid", HI: "hotHumid",
  AZ: "hotDry",   NM: "hotDry",   NV: "hotDry",   UT: "hotDry",
  MN: "veryCold", ND: "veryCold", SD: "veryCold", WI: "veryCold",
  AK: "veryCold", ME: "veryCold", VT: "veryCold", NH: "veryCold",
  MI: "cold", WY: "cold", MT: "cold", ID: "cold",  CO: "cold",
  IA: "cold", NE: "cold", KS: "cold", MO: "cold",  IL: "cold",
  IN: "cold", OH: "cold", PA: "cold", NY: "cold",  MA: "cold",
  RI: "cold", CT: "cold", NJ: "cold", WV: "cold",
};

/** Pure — returns the climate zone key for a US state abbreviation */
export function climateZoneFor(state: string): string {
  return STATE_TO_ZONE[state.toUpperCase().trim()] ?? "mixed";
}

// ── Prediction engine ─────────────────────────────────────────────────────────

export type Urgency = "Critical" | "Soon" | "Watch" | "Good";

const URGENCY_RANK: Record<Urgency, number> = { Critical: 0, Soon: 1, Watch: 2, Good: 3 };

/** Pure — converts percent-of-lifespan-used to urgency label */
export function urgencyFor(pctUsed: number): Urgency {
  if (pctUsed >= 100) return "Critical";
  if (pctUsed >= 75)  return "Soon";
  if (pctUsed >= 50)  return "Watch";
  return "Good";
}

export interface SystemEstimate {
  systemName:          string;
  installYear:         number;
  ageYears:            number;
  lifespanYears:       number;
  percentLifeUsed:     number;
  yearsRemaining:      number;
  urgency:             Urgency;
  replacementCostLow:  number;  // dollars
  replacementCostHigh: number;  // dollars
}

/**
 * Pure — estimates all 9 systems from year built + optional per-system
 * replacement-year overrides. Climate multipliers applied when state is given.
 */
export function estimateSystems(
  yearBuilt: number,
  state?: string,
  overrides?: Partial<Record<string, number>>,
): SystemEstimate[] {
  const year        = new Date().getFullYear();
  const zoneKey     = state ? climateZoneFor(state) : "mixed";
  const multipliers = CLIMATE_MULTIPLIERS[zoneKey] ?? {};

  const estimates: SystemEstimate[] = SYSTEMS.map((sys) => {
    const rawOverride = overrides?.[sys.name];
    const useOverride =
      rawOverride !== undefined &&
      rawOverride >= yearBuilt &&
      rawOverride <= year;

    const installYear      = useOverride ? rawOverride! : yearBuilt;
    const climateMult      = multipliers[sys.name] ?? 1.0;
    const effectiveLifespan = Math.round(sys.lifespanYears * climateMult);
    const ageYears          = Math.max(0, year - installYear);
    const percentLifeUsed   = Math.round((ageYears / effectiveLifespan) * 100);
    const yearsRemaining    = effectiveLifespan - ageYears;

    return {
      systemName:         sys.name,
      installYear,
      ageYears,
      lifespanYears:      effectiveLifespan,
      percentLifeUsed,
      yearsRemaining,
      urgency:            urgencyFor(percentLifeUsed),
      replacementCostLow:  Math.round(sys.costLowCents  / 100),
      replacementCostHigh: Math.round(sys.costHighCents / 100),
    };
  });

  // Sort Critical → Soon → Watch → Good
  return estimates.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]);
}

/** Pure — sum replacement costs for systems due within 10 years (dollars) */
export function computeTenYearBudget(estimates: SystemEstimate[]): number {
  return estimates
    .filter((e) => e.yearsRemaining <= 10)
    .reduce((sum, e) => sum + e.replacementCostLow, 0);
}

// ── Query param parsing ───────────────────────────────────────────────────────

export interface ForecastInput {
  address:   string;
  yearBuilt: number;
  state?:    string;
  overrides: Partial<Record<string, number>>;
}

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Pure — parses and validates query params for the /api/instant-forecast endpoint.
 * Returns null with an error message on validation failure.
 */
export function parseForecastQueryParams(
  query: Record<string, string | string[] | undefined>,
): { input: ForecastInput } | { error: string } {
  const address = typeof query.address === "string" ? query.address.trim() : "";
  if (!address) return { error: "address query param is required" };

  const rawYear = typeof query.yearBuilt === "string" ? query.yearBuilt : "";
  if (!rawYear) return { error: "yearBuilt query param is required" };

  const yearBuilt = parseInt(rawYear, 10);
  if (isNaN(yearBuilt) || yearBuilt < 1800 || yearBuilt > CURRENT_YEAR) {
    return { error: `yearBuilt must be a year between 1800 and ${CURRENT_YEAR}` };
  }

  const state = typeof query.state === "string" ? query.state.toUpperCase().trim() : undefined;

  const overrides: Partial<Record<string, number>> = {};
  for (const [urlKey, systemName] of Object.entries(SYSTEM_URL_KEYS)) {
    const raw = typeof query[urlKey] === "string" ? query[urlKey] as string : "";
    if (!raw) continue;
    const yr = parseInt(raw, 10);
    if (!isNaN(yr)) overrides[systemName] = yr;
  }

  return { input: { address, yearBuilt, state, overrides } };
}
