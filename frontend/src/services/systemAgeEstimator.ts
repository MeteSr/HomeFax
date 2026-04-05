/**
 * §17.7 — Public System Age Estimator
 *
 * Pure functions that power the unauthenticated /home-systems page.
 * Wraps predictMaintenance() with no-job-history to give a year-built
 * baseline estimate of each home system's current age and urgency.
 */

import { predictMaintenance } from "./maintenance";

// URL key → systemName mapping for per-system override params
export const SYSTEM_URL_KEYS: Record<string, string> = {
  hvac:          "HVAC",
  roofing:       "Roofing",
  water_heater:  "Water Heater",
  plumbing:      "Plumbing",
  electrical:    "Electrical",
  windows:       "Windows",
  flooring:      "Flooring",
  insulation:    "Insulation",
  solar_panels:  "Solar Panels",
};

// Reverse: systemName → URL key
const SYSTEM_NAME_TO_URL_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(SYSTEM_URL_KEYS).map(([k, v]) => [v, k])
);

export interface EstimatorInput {
  yearBuilt:       number;
  propertyType:    string;
  state?:          string;
  systemOverrides?: Partial<Record<string, number>>;
}

export interface SystemEstimate {
  systemName:          string;
  installYear:         number;
  ageYears:            number;
  lifespanYears:       number;
  percentLifeUsed:     number;
  yearsRemaining:      number;
  urgency:             "Critical" | "Soon" | "Watch" | "Good";
  replacementCostLow:  number;  // dollars
  replacementCostHigh: number;  // dollars
}

const CURRENT_YEAR = new Date().getFullYear();

/** Parse + validate URL search params for the estimator page.
 *  Returns null if yearBuilt is absent or invalid. */
export function parseEstimatorParams(params: URLSearchParams): EstimatorInput | null {
  const rawYear = params.get("yearBuilt");
  if (!rawYear) return null;

  const yearBuilt = parseInt(rawYear, 10);
  if (isNaN(yearBuilt) || yearBuilt < 1800 || yearBuilt > CURRENT_YEAR) return null;

  const propertyType = params.get("type") ?? "single-family";
  const state        = params.get("state") ?? undefined;

  // Parse per-system override params (e.g. hvac=2000, roofing=2015)
  const systemOverrides: Partial<Record<string, number>> = {};
  for (const [urlKey, systemName] of Object.entries(SYSTEM_URL_KEYS)) {
    const raw = params.get(urlKey);
    if (!raw) continue;
    const year = parseInt(raw, 10);
    if (!isNaN(year)) systemOverrides[systemName] = year;
  }

  return { yearBuilt, propertyType, state, systemOverrides };
}

/** Build a shareable /home-systems URL from estimator inputs. */
export function buildEstimatorUrl(input: EstimatorInput): string {
  const p = new URLSearchParams({
    yearBuilt: String(input.yearBuilt),
    type:      input.propertyType,
  });
  if (input.state) p.set("state", input.state);
  if (input.systemOverrides) {
    for (const [systemName, year] of Object.entries(input.systemOverrides)) {
      const urlKey = SYSTEM_NAME_TO_URL_KEY[systemName];
      if (urlKey && year !== undefined) p.set(urlKey, String(year));
    }
  }
  return `/home-systems?${p.toString()}`;
}

/** Compute age estimates for all 9 tracked systems from year built alone.
 *  Per-system overrides let callers substitute a known replacement year for
 *  specific systems (e.g. HVAC replaced in 2000 in a 1976 house).
 *  Override validation: ignored if > CURRENT_YEAR or < yearBuilt. */
export function estimateSystems(
  yearBuilt: number,
  state?: string,
  overrides?: Partial<Record<string, number>>,
): SystemEstimate[] {
  const baseReport = predictMaintenance(yearBuilt, [], {}, state);

  return baseReport.systemPredictions.map((p) => {
    const rawOverride = overrides?.[p.systemName];
    // Validate: must be >= yearBuilt and <= CURRENT_YEAR
    const useOverride =
      rawOverride !== undefined &&
      rawOverride >= yearBuilt &&
      rawOverride <= CURRENT_YEAR;

    if (useOverride) {
      const overrideYear = rawOverride!;
      const overrideReport = predictMaintenance(overrideYear, [], {}, state);
      const op = overrideReport.systemPredictions.find(
        (s) => s.systemName === p.systemName
      ) ?? p;
      return {
        systemName:          p.systemName,
        installYear:         overrideYear,
        ageYears:            Math.max(0, CURRENT_YEAR - overrideYear),
        lifespanYears:       op.yearsRemaining + Math.max(0, CURRENT_YEAR - overrideYear),
        percentLifeUsed:     op.percentLifeUsed,
        yearsRemaining:      op.yearsRemaining,
        urgency:             op.urgency,
        replacementCostLow:  Math.round(op.estimatedCostLowCents  / 100),
        replacementCostHigh: Math.round(op.estimatedCostHighCents / 100),
      };
    }

    return {
      systemName:          p.systemName,
      installYear:         yearBuilt,
      ageYears:            Math.max(0, CURRENT_YEAR - yearBuilt),
      lifespanYears:       p.yearsRemaining + Math.max(0, CURRENT_YEAR - yearBuilt),
      percentLifeUsed:     p.percentLifeUsed,
      yearsRemaining:      p.yearsRemaining,
      urgency:             p.urgency,
      replacementCostLow:  Math.round(p.estimatedCostLowCents  / 100),
      replacementCostHigh: Math.round(p.estimatedCostHighCents / 100),
    };
  });
}
