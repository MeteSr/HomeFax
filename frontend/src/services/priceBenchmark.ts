/**
 * §17.1 — Pre-quote price benchmarking by zip code
 *
 * 17.1.1 — Seed data served by the ai_proxy Motoko canister (pure function, no HTTP).
 * 17.1.2 — getPriceBenchmark → used by the get_price_benchmark agent tool.
 * 17.1.5 — hasSufficientSamples: hide widget when sampleSize < 5.
 */

import { aiProxyService } from "./aiProxy";

export interface PriceBenchmarkResult {
  serviceType:  string;
  zipCode:      string;
  /** Low estimate in cents */
  low:          number;
  /** Median estimate in cents */
  median:       number;
  /** High estimate in cents */
  high:         number;
  /** Number of closed bids used to compute the range */
  sampleSize:   number;
  /** "YYYY-MM" string representing freshness */
  lastUpdated:  string;
}

/** Fetch benchmark data from the ai_proxy canister. Returns null on any error. */
export async function getPriceBenchmark(
  serviceType: string,
  zipCode: string
): Promise<PriceBenchmarkResult | null> {
  if (!serviceType || !zipCode) return null;
  try {
    const json = await aiProxyService.getPriceBenchmark(serviceType, zipCode);
    if (!json) return null;
    return JSON.parse(json) as PriceBenchmarkResult;
  } catch {
    return null;
  }
}

/** §17.1.5 — confidence gate: only show widget when sample is large enough */
export function hasSufficientSamples(result: PriceBenchmarkResult | null): boolean {
  return result !== null && result.sampleSize >= 5;
}

/** Format low–high range as "$X,XXX–$Y,YYY" (dollars, rounded) */
export function formatBenchmarkRange(result: PriceBenchmarkResult): string {
  const fmt = (cents: number) =>
    "$" + Math.round(cents / 100).toLocaleString("en-US");
  return `${fmt(result.low)}–${fmt(result.high)}`;
}

/** Build a shareable /prices?service=...&zip=... URL */
export function buildPriceLookupUrl(serviceType: string, zipCode: string): string {
  const params = new URLSearchParams({ service: serviceType, zip: zipCode });
  return `/prices?${params}`;
}
