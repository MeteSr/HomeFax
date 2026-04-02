/**
 * TDD: 8.2.4 — Dollar value of score change
 *
 * Covers `scoreValueDelta(fromScore, toScore)` in scoreService.ts.
 * The canonical example from the backlog:
 *   "Score went from 74 to 77 — a 3-point increase ≈ $4,200 in home value."
 */

import { describe, it, expect } from "vitest";
import { scoreValueDelta } from "@/services/scoreService";

describe("scoreValueDelta", () => {
  // ── Null cases ───────────────────────────────────────────────────────────

  it("returns null when scores are equal (no change)", () => {
    expect(scoreValueDelta(74, 74)).toBeNull();
  });

  it("returns null when toScore is less than fromScore (decrease)", () => {
    expect(scoreValueDelta(77, 74)).toBeNull();
  });

  it("returns null when toScore is below the signal floor (40)", () => {
    expect(scoreValueDelta(30, 38)).toBeNull();
  });

  it("returns null when fromScore and toScore are both below 40", () => {
    expect(scoreValueDelta(20, 35)).toBeNull();
  });

  // ── Backlog canonical example ─────────────────────────────────────────────

  it("returns 4200 for a 3-point increase from 74 to 77 (backlog example)", () => {
    expect(scoreValueDelta(74, 77)).toBe(4_200);
  });

  // ── Band: score < 55 (~$333/pt) ──────────────────────────────────────────

  it("returns 1000 for a 3-point increase from 42 to 45 (low band)", () => {
    // avg=43.5 < 55 → 3 × $333 = $999 → rounds to $1,000
    expect(scoreValueDelta(42, 45)).toBe(1_000);
  });

  it("returns 300 for a 1-point increase from 40 to 41 (low band)", () => {
    // avg=40.5 < 55 → 1 × $333 = $333 → rounds to $300
    expect(scoreValueDelta(40, 41)).toBe(300);
  });

  // ── Band: 55 ≤ score < 70 (~$467/pt) ─────────────────────────────────────

  it("returns 1400 for a 3-point increase from 57 to 60 (mid band)", () => {
    // avg=58.5 < 70 → 3 × $467 = $1,401 → rounds to $1,400
    expect(scoreValueDelta(57, 60)).toBe(1_400);
  });

  it("returns 500 for a 1-point increase from 65 to 66 (mid band)", () => {
    // avg=65.5 < 70 → 1 × $467 = $467 → rounds to $500
    expect(scoreValueDelta(65, 66)).toBe(500);
  });

  // ── Band: 70 ≤ score < 85 (~$1,400/pt) ───────────────────────────────────

  it("returns 2800 for a 2-point increase from 76 to 78 (upper-mid band)", () => {
    // avg=77 < 85 → 2 × $1,400 = $2,800
    expect(scoreValueDelta(76, 78)).toBe(2_800);
  });

  it("returns 7000 for a 5-point increase from 70 to 75 (upper-mid band)", () => {
    // avg=72.5 < 85 → 5 × $1,400 = $7,000
    expect(scoreValueDelta(70, 75)).toBe(7_000);
  });

  // ── Band: score ≥ 85 (~$1,000/pt) ────────────────────────────────────────

  it("returns 3000 for a 3-point increase from 88 to 91 (high band)", () => {
    // avg=89.5 ≥ 85 → 3 × $1,000 = $3,000
    expect(scoreValueDelta(88, 91)).toBe(3_000);
  });

  it("returns 1000 for a 1-point increase from 95 to 96 (high band)", () => {
    expect(scoreValueDelta(95, 96)).toBe(1_000);
  });

  // ── Rounding ──────────────────────────────────────────────────────────────

  it("rounds to the nearest $100", () => {
    // low band: avg=43.5 → $333/pt → 2 × $333 = $666 → rounds to $700
    expect(scoreValueDelta(42, 44)).toBe(700);
  });
});
