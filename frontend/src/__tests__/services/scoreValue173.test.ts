/**
 * §17.3 — Score → Dollar Value Translation
 *
 * Tests:
 *   17.3.1 — scoreToValueByHomePrice: user-entered home value model
 *   17.3.1 — getDocumentedValueEstimate: best-available estimate (homeValue > zip > flat)
 *   17.3.3 — estimateJobValueDelta: dollar delta shown on job success screen
 *   formatting helpers
 */

import { describe, it, expect } from "vitest";
import {
  scoreToValueByHomePrice,
  getDocumentedValueEstimate,
  estimateJobValueDelta,
  formatValueRange,
} from "@/services/scoreToValue";

// ── scoreToValueByHomePrice ───────────────────────────────────────────────────

describe("scoreToValueByHomePrice", () => {
  it("returns null when score is below 40", () => {
    expect(scoreToValueByHomePrice(39, 400_000)).toBeNull();
    expect(scoreToValueByHomePrice(0, 400_000)).toBeNull();
  });

  it("returns null when homeValue is 0 or negative", () => {
    expect(scoreToValueByHomePrice(70, 0)).toBeNull();
    expect(scoreToValueByHomePrice(70, -1)).toBeNull();
  });

  it("score 40–54: 0.5%–1.5% of home value", () => {
    // homeValue $400k → low = $2,000 (0.5%), high = $6,000 (1.5%)
    const result = scoreToValueByHomePrice(50, 400_000);
    expect(result).not.toBeNull();
    expect(result!.low).toBe(2_000);
    expect(result!.high).toBe(6_000);
  });

  it("score 55–69: 1.5%–3.0% of home value", () => {
    // homeValue $400k → low = $6,000 (1.5%), high = $12,000 (3%)
    const result = scoreToValueByHomePrice(60, 400_000);
    expect(result).not.toBeNull();
    expect(result!.low).toBe(6_000);
    expect(result!.high).toBe(12_000);
  });

  it("score 70–84: 3.0%–6.0% of home value", () => {
    // homeValue $400k → low = $12,000 (3%), high = $24,000 (6%)
    const result = scoreToValueByHomePrice(74, 400_000);
    expect(result).not.toBeNull();
    expect(result!.low).toBe(12_000);
    expect(result!.high).toBe(24_000);
  });

  it("score 85–100: 5.0%–9.0% of home value", () => {
    // homeValue $500k → low = $25,000 (5%), high = $45,000 (9%)
    const result = scoreToValueByHomePrice(90, 500_000);
    expect(result).not.toBeNull();
    expect(result!.low).toBe(25_000);
    expect(result!.high).toBe(45_000);
  });

  it("rounds to the nearest $500", () => {
    // homeValue $375k at score 74: 3% = $11,250 → $11,500; 6% = $22,500 → $22,500
    const result = scoreToValueByHomePrice(74, 375_000);
    expect(result).not.toBeNull();
    // 3% of 375k = 11,250 → 11,500 (nearest 500); 6% of 375k = 22,500 → 22,500
    expect(result!.low % 500).toBe(0);
    expect(result!.high % 500).toBe(0);
  });
});

// ── getDocumentedValueEstimate ────────────────────────────────────────────────

describe("getDocumentedValueEstimate", () => {
  it("prefers user-entered homeValue over zip lookup", () => {
    // User entered $600k; zip 32114 median is ~$350k — should use 600k
    const byHome = scoreToValueByHomePrice(74, 600_000)!;
    const result  = getDocumentedValueEstimate(74, { zip: "32114", homeValueDollars: 600_000 });
    expect(result).not.toBeNull();
    expect(result!.low).toBe(byHome.low);
    expect(result!.high).toBe(byHome.high);
  });

  it("falls back to zip median when no homeValue provided", () => {
    const withZip    = getDocumentedValueEstimate(74, { zip: "32114" });
    const withoutZip = getDocumentedValueEstimate(74, {});
    // Zip-based estimate differs from flat estimate only when zip prefix is in the map
    expect(withZip).not.toBeNull();
    expect(withoutZip).not.toBeNull();
  });

  it("falls back to flat bands when neither homeValue nor zip provided", () => {
    const result = getDocumentedValueEstimate(74, {});
    expect(result).not.toBeNull();
    // flat bands at score 74: $15k–$25k
    expect(result!.low).toBe(15_000);
    expect(result!.high).toBe(25_000);
  });

  it("returns null when score is below 40 regardless of inputs", () => {
    expect(getDocumentedValueEstimate(30, { zip: "90210", homeValueDollars: 800_000 })).toBeNull();
  });
});

// ── estimateJobValueDelta ─────────────────────────────────────────────────────

describe("estimateJobValueDelta", () => {
  it("returns a positive dollar amount for a typical new job at score 60", () => {
    const delta = estimateJobValueDelta("Roofing", 60);
    expect(delta).not.toBeNull();
    expect(delta!).toBeGreaterThan(0);
  });

  it("returns null for score below 40", () => {
    expect(estimateJobValueDelta("HVAC", 35)).toBeNull();
  });

  it("returns higher delta for higher score bands (more $/pt)", () => {
    const low  = estimateJobValueDelta("HVAC", 50); // score 40–54 band
    const high = estimateJobValueDelta("HVAC", 80); // score 70–84 band
    expect(low).not.toBeNull();
    expect(high).not.toBeNull();
    expect(high!).toBeGreaterThan(low!);
  });

  it("rounds to the nearest $100", () => {
    const delta = estimateJobValueDelta("Roofing", 74);
    expect(delta).not.toBeNull();
    expect(delta! % 100).toBe(0);
  });
});

// ── formatValueRange ──────────────────────────────────────────────────────────

describe("formatValueRange", () => {
  it("formats low and high as $X–$Y with thousands separator", () => {
    expect(formatValueRange({ low: 12_000, high: 24_000 })).toBe("$12,000–$24,000");
  });

  it("handles values under $1,000", () => {
    expect(formatValueRange({ low: 500, high: 900 })).toBe("$500–$900");
  });

  it("handles large values", () => {
    expect(formatValueRange({ low: 25_000, high: 45_000 })).toBe("$25,000–$45,000");
  });
});
