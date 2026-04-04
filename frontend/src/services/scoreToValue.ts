/**
 * §17.3 — Score → Dollar Value Translation
 *
 * 17.3.1 — `scoreToValueByHomePrice`: maps score + user-entered home value to a
 *           resale premium range (low/high). Basis: NAR/NerdWallet research showing
 *           documented maintenance lifts sale price 0.5%–9% depending on score band.
 *
 * 17.3.2 — `getDocumentedValueEstimate`: selects the best available estimate using
 *           priority: user-entered homeValue → zip-code median → flat heuristic bands.
 *
 * 17.3.3 — `estimateJobValueDelta`: dollar uplift shown on job-log success screen,
 *           computed as: typical score points a new job adds × $/pt for current band.
 */

import { premiumEstimate, premiumEstimateByZip } from "./scoreService";

export interface ValueRange {
  low:  number;
  high: number;
}

/** Score band → [lowPct, highPct] of home value (same bands as premiumEstimateByZip) */
const BANDS: Array<{ minScore: number; lowPct: number; highPct: number }> = [
  { minScore: 85, lowPct: 0.050, highPct: 0.090 },
  { minScore: 70, lowPct: 0.030, highPct: 0.060 },
  { minScore: 55, lowPct: 0.015, highPct: 0.030 },
  { minScore: 40, lowPct: 0.005, highPct: 0.015 },
];

/**
 * §17.3.1 — Personalized premium estimate using user-entered home value.
 * Rounds to nearest $500. Returns null when score < 40 or homeValue ≤ 0.
 */
export function scoreToValueByHomePrice(
  score: number,
  homeValueDollars: number
): ValueRange | null {
  if (score < 40 || homeValueDollars <= 0) return null;

  const band = BANDS.find((b) => score >= b.minScore);
  if (!band) return null;

  const round500 = (n: number) => Math.round(n / 500) * 500;
  return {
    low:  round500(homeValueDollars * band.lowPct),
    high: round500(homeValueDollars * band.highPct),
  };
}

/**
 * §17.3.2 — Best-available documented value estimate.
 * Priority: user-entered homeValue → zip-code median → flat heuristic bands.
 */
export function getDocumentedValueEstimate(
  score: number,
  options: { zip?: string; homeValueDollars?: number } = {}
): ValueRange | null {
  if (score < 40) return null;

  const { homeValueDollars, zip } = options;

  // 1st priority: user-entered home value
  if (homeValueDollars && homeValueDollars > 0) {
    return scoreToValueByHomePrice(score, homeValueDollars);
  }

  // 2nd priority: zip-code median lookup
  if (zip) {
    const zipResult = premiumEstimateByZip(score, zip);
    if (zipResult) return zipResult;
  }

  // 3rd priority: flat heuristic bands
  return premiumEstimate(score);
}

/**
 * §17.3.3 — Estimate the dollar value added by logging one new job.
 * Uses the $/pt rate for the current score band and assumes a typical
 * new job adds 2 score points (conservative estimate to avoid over-promising).
 * Rounds to nearest $100. Returns null for score < 40.
 */
export function estimateJobValueDelta(
  _serviceType: string,
  currentScore: number
): number | null {
  if (currentScore < 40) return null;

  // Typical new job adds ~2 score points
  const TYPICAL_PTS = 2;

  // $/pt by band — same calibration as scoreValueDelta in scoreService.ts
  let dollarPerPt: number;
  if (currentScore < 55)      dollarPerPt = 333;
  else if (currentScore < 70) dollarPerPt = 467;
  else if (currentScore < 85) dollarPerPt = 1_400;
  else                        dollarPerPt = 1_000;

  return Math.round((TYPICAL_PTS * dollarPerPt) / 100) * 100;
}

/** Format a ValueRange as "$X–$Y" with thousands separators. */
export function formatValueRange(result: ValueRange): string {
  const fmt = (n: number) => "$" + n.toLocaleString("en-US");
  return `${fmt(result.low)}–${fmt(result.high)}`;
}
