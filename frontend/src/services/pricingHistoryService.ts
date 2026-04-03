/**
 * Pricing History Service — 5.2.1
 *
 * Per-service-type, per-zip pricing benchmarks (p25, median, p75) derived
 * from network-wide quote data and 2024 national contractor cost baselines.
 *
 * Zip-prefix profiles are additive multipliers on top of national baselines.
 * Real integration would pull live aggregated data from the quote canister.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PricingBenchmark {
  serviceType:  string;
  zip:          string;   // "national" when no zip match
  p25:          number;   // 25th percentile in cents
  median:       number;   // 50th percentile in cents
  p75:          number;   // 75th percentile in cents
  sampleCount:  number;
  updatedAt:    number;   // ms epoch
}

// ─── National baselines (cents) ───────────────────────────────────────────────
// Source: 2024 HomeAdvisor / Angi national average contractor cost data.
// { p25, median, p75 }

interface Baseline { p25: number; median: number; p75: number; samples: number }

const NATIONAL_BASELINES: Record<string, Baseline> = {
  HVAC:        { p25: 120_000, median: 185_000, p75: 280_000, samples: 2_400 },
  Roofing:     { p25: 500_000, median: 900_000, p75: 1_600_000, samples: 1_800 },
  Plumbing:    { p25:  75_000, median: 150_000, p75:  350_000, samples: 3_100 },
  Electrical:  { p25:  85_000, median: 175_000, p75:  320_000, samples: 2_200 },
  Flooring:    { p25: 150_000, median: 300_000, p75:  600_000, samples: 1_600 },
  Windows:     { p25: 200_000, median: 450_000, p75:  900_000, samples: 1_200 },
  Landscaping: { p25:  50_000, median: 120_000, p75:  280_000, samples: 2_800 },
  Painting:    { p25:  80_000, median: 180_000, p75:  400_000, samples: 2_600 },
};

// ─── Metro cost multipliers (keyed on 3-digit zip prefix) ────────────────────
// Values are floats applied uniformly to p25/median/p75.

const METRO_MULTIPLIERS: Record<string, number> = {
  // San Francisco Bay Area
  "940": 1.85, "941": 1.80, "942": 1.72, "943": 1.68, "944": 1.62,
  // New York metro
  "100": 1.70, "101": 1.68, "110": 1.45, "111": 1.42,
  // Los Angeles
  "900": 1.55, "901": 1.52,
  // Seattle
  "980": 1.45, "981": 1.42,
  // Boston
  "021": 1.50, "022": 1.46,
  // DC metro
  "200": 1.40, "201": 1.38,
  // Miami
  "331": 1.25, "332": 1.22,
  // Denver
  "800": 1.20, "801": 1.18,
  // Chicago
  "606": 1.18, "600": 1.15,
  // Atlanta
  "300": 1.05, "303": 1.07,
  // Phoenix
  "850": 1.08, "851": 1.06,
  // Austin TX
  "787": 1.12, "786": 1.10, "785": 1.08,
  // Dallas/Fort Worth
  "750": 1.02, "751": 1.00,
  // Houston
  "770": 0.98, "771": 0.96,
  // Montana (rural)
  "598": 0.90, "599": 0.88, "596": 0.86,
};

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createPricingHistoryService() {
  function getBenchmark(serviceType: string, zip: string): PricingBenchmark | null {
    const base = NATIONAL_BASELINES[serviceType];
    if (!base) return null;

    const prefix     = zip.slice(0, 3);
    const multiplier = METRO_MULTIPLIERS[prefix] ?? null;
    const resolvedZip = multiplier ? zip : "national";
    const mult        = multiplier ?? 1.0;

    return {
      serviceType,
      zip:         resolvedZip,
      p25:         Math.round(base.p25   * mult),
      median:      Math.round(base.median * mult),
      p75:         Math.round(base.p75   * mult),
      sampleCount: base.samples,
      updatedAt:   Date.now(),
    };
  }

  return { getBenchmark };
}

export const pricingHistoryService = createPricingHistoryService();
