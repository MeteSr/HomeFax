/**
 * TDD — 6.1.2: Score-to-dollar premium model (zip-aware)
 *
 * premiumEstimateByZip(score, zip) returns a { low, high } dollar range
 * based on score band × regional median home value for the zip code.
 *
 * getMedianHomeValue(zip) maps zip prefix to a regional median home value,
 * falling back to the national default (~$330K) for unknown zips.
 *
 * Existing premiumEstimate(score) is preserved unchanged (backwards compat).
 */

import { describe, it, expect } from "vitest";
import {
  premiumEstimate,
  premiumEstimateByZip,
  getMedianHomeValue,
} from "@/services/scoreService";

// ─── getMedianHomeValue — regional lookup ─────────────────────────────────────

describe("getMedianHomeValue — regional median lookup (6.1.2)", () => {
  it("returns a number for any zip", () => {
    expect(typeof getMedianHomeValue("10001")).toBe("number");
    expect(getMedianHomeValue("10001")).toBeGreaterThan(0);
  });

  it("NYC zip (100xx) → high-value market (≥ $600K)", () => {
    expect(getMedianHomeValue("10001")).toBeGreaterThanOrEqual(600_000);
  });

  it("LA zip (900xx) → high-value market (≥ $550K)", () => {
    expect(getMedianHomeValue("90001")).toBeGreaterThanOrEqual(550_000);
  });

  it("Seattle zip (980xx) → high-value market (≥ $500K)", () => {
    expect(getMedianHomeValue("98001")).toBeGreaterThanOrEqual(500_000);
  });

  it("Boston zip (021xx) → high-value market (≥ $480K)", () => {
    expect(getMedianHomeValue("02101")).toBeGreaterThanOrEqual(480_000);
  });

  it("Miami zip (331xx) → mid-high market (≥ $400K)", () => {
    expect(getMedianHomeValue("33101")).toBeGreaterThanOrEqual(400_000);
  });

  it("DC zip (200xx) → high-value market (≥ $480K)", () => {
    expect(getMedianHomeValue("20001")).toBeGreaterThanOrEqual(480_000);
  });

  it("Chicago zip (606xx) → mid market (≥ $280K)", () => {
    expect(getMedianHomeValue("60601")).toBeGreaterThanOrEqual(280_000);
  });

  it("Houston zip (770xx) → mid market (≥ $240K)", () => {
    expect(getMedianHomeValue("77001")).toBeGreaterThanOrEqual(240_000);
  });

  it("Phoenix zip (850xx) → mid market (≥ $300K)", () => {
    expect(getMedianHomeValue("85001")).toBeGreaterThanOrEqual(300_000);
  });

  it("unknown zip falls back to national default (≥ $250K)", () => {
    const defaultVal = getMedianHomeValue("00001");
    expect(defaultVal).toBeGreaterThanOrEqual(250_000);
  });

  it("all returned values are ≤ $2M (sanity upper bound)", () => {
    const zips = ["10001", "90001", "98001", "02101", "60601", "77001", "73001", "00001"];
    for (const zip of zips) {
      expect(getMedianHomeValue(zip)).toBeLessThanOrEqual(2_000_000);
    }
  });

  it("high-value zip returns strictly more than low-value zip", () => {
    const nyc = getMedianHomeValue("10001");
    const rural = getMedianHomeValue("73001"); // Oklahoma
    expect(nyc).toBeGreaterThan(rural);
  });
});

// ─── premiumEstimateByZip — core model ────────────────────────────────────────

describe("premiumEstimateByZip — score × zip (6.1.2)", () => {
  it("returns null for score below 40 regardless of zip", () => {
    expect(premiumEstimateByZip(0,  "10001")).toBeNull();
    expect(premiumEstimateByZip(39, "98001")).toBeNull();
  });

  it("returns { low, high } with low < high for valid input", () => {
    const r = premiumEstimateByZip(75, "10001")!;
    expect(r).not.toBeNull();
    expect(r.low).toBeGreaterThan(0);
    expect(r.high).toBeGreaterThan(r.low);
  });

  it("high-value zip (NYC) → higher premium than low-value zip at same score", () => {
    const nyc   = premiumEstimateByZip(75, "10001")!;
    const rural = premiumEstimateByZip(75, "73001")!;
    expect(nyc.high).toBeGreaterThan(rural.high);
    expect(nyc.low).toBeGreaterThan(rural.low);
  });

  it("higher score → higher premium in same zip", () => {
    const lo = premiumEstimateByZip(50, "77001")!;
    const hi = premiumEstimateByZip(90, "77001")!;
    expect(hi.low).toBeGreaterThan(lo.low);
    expect(hi.high).toBeGreaterThan(lo.high);
  });

  it("score 85+ in NYC zip produces premium ≥ $30K", () => {
    const r = premiumEstimateByZip(90, "10001")!;
    expect(r.low).toBeGreaterThanOrEqual(30_000);
  });

  it("score 40–54 in any zip produces a non-null small-but-positive range", () => {
    const r = premiumEstimateByZip(47, "60601")!;
    expect(r.low).toBeGreaterThan(0);
    expect(r.high).toBeGreaterThan(r.low);
  });

  it("unknown zip uses national default — still returns valid range", () => {
    const r = premiumEstimateByZip(70, "00001")!;
    expect(r).not.toBeNull();
    expect(r.low).toBeGreaterThan(0);
    expect(r.high).toBeGreaterThan(r.low);
  });

  it("returns rounded values (multiples of $500)", () => {
    const r = premiumEstimateByZip(75, "10001")!;
    expect(r.low  % 500).toBe(0);
    expect(r.high % 500).toBe(0);
  });

  it("score band boundaries produce distinct premium tiers in the same zip", () => {
    // Each score-band step up must produce a higher or equal premium
    const zip = "98001";
    const s40 = premiumEstimateByZip(40,  zip)!;
    const s55 = premiumEstimateByZip(55,  zip)!;
    const s70 = premiumEstimateByZip(70,  zip)!;
    const s85 = premiumEstimateByZip(85,  zip)!;
    expect(s55.high).toBeGreaterThan(s40.high);
    expect(s70.high).toBeGreaterThan(s55.high);
    expect(s85.high).toBeGreaterThan(s70.high);
  });
});

// ─── Backward compat: premiumEstimate(score) unchanged ───────────────────────

describe("premiumEstimate — backwards compat (6.1.2)", () => {
  it("still returns null below 40", () => {
    expect(premiumEstimate(39)).toBeNull();
  });

  it("still returns $3K–$8K for score 40–54", () => {
    expect(premiumEstimate(40)).toEqual({ low: 3_000, high: 8_000 });
  });

  it("still returns $20K–$35K for score 85+", () => {
    expect(premiumEstimate(90)).toEqual({ low: 20_000, high: 35_000 });
  });
});
