/**
 * Comparable Sales Service — Epic 10.2.1
 *
 * Mock-fallback interface for comparable sales data.
 * In production this will be backed by ATTOM / Zillow / Redfin via the market canister.
 * Until the API partnership is in place, seedComps() provides test/demo data.
 */

export interface CompSale {
  address: string;
  zipCode: string;
  /** Sale price in cents */
  salePriceCents: number;
  /** Square footage */
  sqFt: number;
  /** Days on market before sale */
  daysOnMarket: number;
  /** Sale price ÷ original list price (e.g. 0.98 = 98% of ask) */
  saleToListRatio: number;
  /** Unix ms timestamp of sale */
  soldAt: number;
}

export interface CompSummary {
  zipCode: string;
  /** Median price per square foot in cents */
  medianPricePerSqFtCents: number;
  medianDaysOnMarket: number;
  medianSaleToListRatio: number;
  compCount: number;
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function createCompService() {
  const _data = new Map<string, CompSale[]>();

  return {
    __reset() {
      _data.clear();
    },

    /** Load mock or pre-fetched comp data for a zip code */
    seedComps(zipCode: string, comps: CompSale[]): void {
      _data.set(zipCode, comps);
    },

    /** Returns comps for a zip code (empty array when none seeded / API not available) */
    async getComps(zipCode: string): Promise<CompSale[]> {
      return [...(_data.get(zipCode) ?? [])];
    },

    /** Compute median stats for a zip code; null if no data */
    summarizeComps(zipCode: string): CompSummary | null {
      const comps = _data.get(zipCode);
      if (!comps || comps.length === 0) return null;

      const pricesPerSqFt = comps
        .map((c) => Math.round(c.salePriceCents / c.sqFt))
        .sort((a, b) => a - b);

      const doms = comps.map((c) => c.daysOnMarket).sort((a, b) => a - b);

      const ratios = comps
        .map((c) => c.saleToListRatio)
        .sort((a, b) => a - b);

      return {
        zipCode,
        medianPricePerSqFtCents: median(pricesPerSqFt),
        medianDaysOnMarket: median(doms),
        medianSaleToListRatio: median(ratios),
        compCount: comps.length,
      };
    },
  };
}

export const compService = createCompService();
