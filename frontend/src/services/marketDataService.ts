/**
 * Market Data Service — 5.3.1
 *
 * Provides local real estate inventory, days-on-market, and price data
 * by zip code. Shaped after the Zillow Bridge API / ATTOM Data contract
 * so the real integration is a credential + endpoint swap.
 *
 * Mock data is derived from 2024 NAR / Redfin metro-level statistics.
 */

import { getMedianHomeValue } from "@/services/scoreService";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InventoryTrend = "rising" | "falling" | "stable";

export interface MarketSnapshot {
  zip:               string;
  medianListPrice:   number;    // dollars
  activeListings:    number;    // count
  daysOnMarket:      number;    // median days
  pricePerSqft:      number;    // dollars
  listToSaleRatio:   number;    // 0.95 = sold at 95% of list
  inventoryTrend:    InventoryTrend;
  fetchedAt:         number;    // ms epoch
}

export interface InventoryTrendResult {
  zip:                string;
  direction:          InventoryTrend;
  monthOverMonthPct:  number;   // +5.2 = 5.2% more listings than last month
}

// ─── Metro-level market profiles ─────────────────────────────────────────────
// Keyed on 3-digit zip prefix. Values are offsets/multipliers from the
// national baseline. Real integration would replace this with API calls.

interface MetroProfile {
  domFactor:      number;   // × national DOM (lower = faster market)
  listSaleRatio:  number;   // list-to-sale ratio
  pricePerSqft:   number;   // $/sqft
  activeListings: number;   // approximate count per prefix area
  momPct:         number;   // month-over-month inventory change %
}

const NATIONAL: MetroProfile = {
  domFactor: 1.0, listSaleRatio: 0.97, pricePerSqft: 185, activeListings: 320, momPct: 0,
};

const METRO_PROFILES: Record<string, MetroProfile> = {
  // San Francisco Bay Area — very low DOM, over-ask, high $/sqft
  "940": { domFactor: 0.5, listSaleRatio: 1.05, pricePerSqft: 780, activeListings: 180, momPct: -3.2 },
  "941": { domFactor: 0.5, listSaleRatio: 1.04, pricePerSqft: 750, activeListings: 190, momPct: -2.8 },
  "942": { domFactor: 0.6, listSaleRatio: 1.03, pricePerSqft: 680, activeListings: 210, momPct: -1.5 },
  "943": { domFactor: 0.6, listSaleRatio: 1.02, pricePerSqft: 640, activeListings: 230, momPct: -1.0 },
  "944": { domFactor: 0.65, listSaleRatio: 1.01, pricePerSqft: 610, activeListings: 240, momPct: -0.5 },
  // New York metro
  "100": { domFactor: 0.7, listSaleRatio: 1.02, pricePerSqft: 620, activeListings: 850, momPct: 1.2 },
  "101": { domFactor: 0.7, listSaleRatio: 1.01, pricePerSqft: 590, activeListings: 820, momPct: 1.0 },
  "110": { domFactor: 0.8, listSaleRatio: 0.99, pricePerSqft: 430, activeListings: 690, momPct: 2.1 },
  "111": { domFactor: 0.8, listSaleRatio: 0.98, pricePerSqft: 400, activeListings: 720, momPct: 2.3 },
  // Los Angeles
  "900": { domFactor: 0.75, listSaleRatio: 1.01, pricePerSqft: 520, activeListings: 620, momPct: 0.8 },
  "901": { domFactor: 0.75, listSaleRatio: 1.00, pricePerSqft: 500, activeListings: 640, momPct: 1.0 },
  // Seattle
  "980": { domFactor: 0.6, listSaleRatio: 1.03, pricePerSqft: 420, activeListings: 280, momPct: -2.0 },
  "981": { domFactor: 0.65, listSaleRatio: 1.02, pricePerSqft: 400, activeListings: 300, momPct: -1.5 },
  // Austin TX
  "787": { domFactor: 1.1, listSaleRatio: 0.98, pricePerSqft: 290, activeListings: 1_100, momPct: 8.2 },
  "786": { domFactor: 1.1, listSaleRatio: 0.97, pricePerSqft: 280, activeListings: 1_050, momPct: 7.8 },
  "785": { domFactor: 1.2, listSaleRatio: 0.96, pricePerSqft: 265, activeListings: 980,   momPct: 6.5 },
  // Dallas/Fort Worth
  "750": { domFactor: 1.0, listSaleRatio: 0.98, pricePerSqft: 195, activeListings: 1_400, momPct: 5.5 },
  "751": { domFactor: 1.0, listSaleRatio: 0.97, pricePerSqft: 190, activeListings: 1_350, momPct: 5.0 },
  // Houston
  "770": { domFactor: 1.1, listSaleRatio: 0.97, pricePerSqft: 155, activeListings: 1_600, momPct: 4.2 },
  "771": { domFactor: 1.1, listSaleRatio: 0.96, pricePerSqft: 150, activeListings: 1_550, momPct: 4.0 },
  // Chicago
  "606": { domFactor: 1.3, listSaleRatio: 0.97, pricePerSqft: 200, activeListings: 1_200, momPct: 1.8 },
  "600": { domFactor: 1.2, listSaleRatio: 0.97, pricePerSqft: 195, activeListings: 1_150, momPct: 1.5 },
  // Miami
  "331": { domFactor: 0.9, listSaleRatio: 0.99, pricePerSqft: 380, activeListings: 880,   momPct: 3.5 },
  "332": { domFactor: 0.9, listSaleRatio: 0.98, pricePerSqft: 360, activeListings: 850,   momPct: 3.2 },
  // Denver
  "800": { domFactor: 0.8, listSaleRatio: 1.00, pricePerSqft: 320, activeListings: 480,   momPct: 2.0 },
  "801": { domFactor: 0.85, listSaleRatio: 0.99, pricePerSqft: 305, activeListings: 510,  momPct: 2.2 },
  // Phoenix
  "850": { domFactor: 1.0, listSaleRatio: 0.98, pricePerSqft: 250, activeListings: 1_300, momPct: 6.0 },
  "851": { domFactor: 1.0, listSaleRatio: 0.97, pricePerSqft: 240, activeListings: 1_250, momPct: 5.8 },
  // Atlanta
  "300": { domFactor: 1.0, listSaleRatio: 0.98, pricePerSqft: 210, activeListings: 920,   momPct: 3.8 },
  "303": { domFactor: 0.9, listSaleRatio: 0.99, pricePerSqft: 230, activeListings: 870,   momPct: 2.5 },
  // Boston
  "021": { domFactor: 0.65, listSaleRatio: 1.03, pricePerSqft: 450, activeListings: 320,  momPct: -1.8 },
  "022": { domFactor: 0.7,  listSaleRatio: 1.02, pricePerSqft: 420, activeListings: 340,  momPct: -1.2 },
  // DC metro
  "200": { domFactor: 0.75, listSaleRatio: 1.01, pricePerSqft: 380, activeListings: 410,  momPct: 0.5 },
  "201": { domFactor: 0.8,  listSaleRatio: 1.00, pricePerSqft: 360, activeListings: 430,  momPct: 0.8 },
  // Montana (rural)
  "598": { domFactor: 1.8, listSaleRatio: 0.95, pricePerSqft: 210, activeListings: 85,    momPct: 0.2 },
  "599": { domFactor: 1.9, listSaleRatio: 0.94, pricePerSqft: 200, activeListings: 75,    momPct: 0.1 },
  "596": { domFactor: 2.0, listSaleRatio: 0.94, pricePerSqft: 190, activeListings: 65,    momPct: 0.0 },
};

const NATIONAL_DOM = 35; // days

function profile(zip: string): MetroProfile {
  const prefix = zip.slice(0, 3);
  return METRO_PROFILES[prefix] ?? NATIONAL;
}

function trendFromPct(pct: number): InventoryTrend {
  if (pct > 1)  return "rising";
  if (pct < -1) return "falling";
  return "stable";
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createMarketDataService() {
  const cache = new Map<string, MarketSnapshot>();

  async function getSnapshot(zip: string): Promise<MarketSnapshot> {
    if (cache.has(zip)) return cache.get(zip)!;

    // In production: call Zillow Bridge API / ATTOM here
    const p             = profile(zip);
    const medianListPrice = getMedianHomeValue(zip);
    const snap: MarketSnapshot = {
      zip,
      medianListPrice,
      activeListings:  p.activeListings,
      daysOnMarket:    Math.round(NATIONAL_DOM * p.domFactor),
      pricePerSqft:    p.pricePerSqft,
      listToSaleRatio: p.listSaleRatio,
      inventoryTrend:  trendFromPct(p.momPct),
      fetchedAt:       Date.now(),
    };
    cache.set(zip, snap);
    return snap;
  }

  async function getInventoryTrend(zip: string): Promise<InventoryTrendResult> {
    const p = profile(zip);
    return {
      zip,
      direction:         trendFromPct(p.momPct),
      monthOverMonthPct: p.momPct,
    };
  }

  function getCached(zip: string): MarketSnapshot | null {
    return cache.get(zip) ?? null;
  }

  return { getSnapshot, getInventoryTrend, getCached };
}

export const marketDataService = createMarketDataService();
