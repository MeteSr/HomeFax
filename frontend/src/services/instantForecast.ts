/**
 * §17.2 — Zero-Effort Onboarding: Instant Forecast
 *
 * Pure functions for the public /instant-forecast page:
 *   - computeTenYearBudget: sum replacement costs for systems due ≤10 yrs
 *   - parseForecastParams / buildForecastUrl: URL helpers
 *   - lookupYearBuilt: relay stub (ATTOM Data deferred)
 */

import { type SystemEstimate, SYSTEM_URL_KEYS } from "./systemAgeEstimator";

export interface ForecastInput {
  address:          string;
  yearBuilt:        number;
  state?:           string;
  systemOverrides?: Partial<Record<string, number>>;
}

export interface InstantForecastResult {
  address:          string;
  yearBuilt:        number;
  state?:           string;
  systemOverrides?: Partial<Record<string, number>>;
  tenYearBudget:    number;
}

const CURRENT_YEAR = new Date().getFullYear();

// Reverse map: systemName → URL key (shared with systemAgeEstimator logic)
const SYSTEM_NAME_TO_URL_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(SYSTEM_URL_KEYS).map(([k, v]) => [v, k])
);

/** Sum replacementCostLow for all systems with yearsRemaining <= 10. */
export function computeTenYearBudget(estimates: SystemEstimate[]): number {
  return estimates
    .filter((e) => e.yearsRemaining <= 10)
    .reduce((sum, e) => sum + e.replacementCostLow, 0);
}

/** Parse URL params for the instant forecast page.
 *  Returns null if address or yearBuilt are missing/invalid. */
export function parseForecastParams(params: URLSearchParams): ForecastInput | null {
  const address = params.get("address");
  if (!address) return null;

  const rawYear = params.get("yearBuilt");
  if (!rawYear) return null;
  const yearBuilt = parseInt(rawYear, 10);
  if (isNaN(yearBuilt) || yearBuilt < 1800 || yearBuilt > CURRENT_YEAR) return null;

  const state = params.get("state") ?? undefined;

  // Parse per-system override params
  const systemOverrides: Partial<Record<string, number>> = {};
  for (const [urlKey, systemName] of Object.entries(SYSTEM_URL_KEYS)) {
    const raw = params.get(urlKey);
    if (!raw) continue;
    const year = parseInt(raw, 10);
    if (!isNaN(year)) systemOverrides[systemName] = year;
  }

  return { address, yearBuilt, state, systemOverrides };
}

/** Build a shareable /instant-forecast URL. */
export function buildForecastUrl(input: ForecastInput): string {
  const p = new URLSearchParams({
    address:   input.address,
    yearBuilt: String(input.yearBuilt),
  });
  if (input.state) p.set("state", input.state);
  if (input.systemOverrides) {
    for (const [systemName, year] of Object.entries(input.systemOverrides)) {
      const urlKey = SYSTEM_NAME_TO_URL_KEY[systemName];
      if (urlKey && year !== undefined) p.set(urlKey, String(year));
    }
  }
  return `/instant-forecast?${p.toString()}`;
}

/** Relay stub: look up year built from address via backend proxy.
 *  Returns null on any error or when data is unavailable (ATTOM deferred). */
export async function lookupYearBuilt(address: string): Promise<number | null> {
  try {
    const p = new URLSearchParams({ address });
    const res = await fetch(`/api/lookup-year-built?${p.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.yearBuilt === "number" ? data.yearBuilt : null;
  } catch {
    return null;
  }
}
