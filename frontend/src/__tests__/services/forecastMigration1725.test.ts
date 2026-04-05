/**
 * §17.2.5 — Forecast → Account Migration
 *
 * forecastParamsToRegistration() parses the URL that the "Save your forecast"
 * CTA produces and returns the data needed to:
 *   1. Pre-populate the PropertyRegisterPage form (address, yearBuilt, state)
 *   2. Seed systemAgesService after registration (systemAges)
 */

import { describe, it, expect } from "vitest";
import { forecastParamsToRegistration } from "@/services/instantForecast";

// ── Returns null for invalid / incomplete params ──────────────────────────────

describe("forecastParamsToRegistration — invalid params", () => {
  it("returns null when address is missing", () => {
    const p = new URLSearchParams({ yearBuilt: "1990" });
    expect(forecastParamsToRegistration(p)).toBeNull();
  });

  it("returns null when yearBuilt is missing", () => {
    const p = new URLSearchParams({ address: "123 Main St" });
    expect(forecastParamsToRegistration(p)).toBeNull();
  });

  it("returns null when yearBuilt is not a number", () => {
    const p = new URLSearchParams({ address: "123 Main St", yearBuilt: "abc" });
    expect(forecastParamsToRegistration(p)).toBeNull();
  });

  it("returns null when yearBuilt is out of range (future)", () => {
    const p = new URLSearchParams({ address: "123 Main St", yearBuilt: "2999" });
    expect(forecastParamsToRegistration(p)).toBeNull();
  });

  it("returns null when yearBuilt is out of range (before 1800)", () => {
    const p = new URLSearchParams({ address: "123 Main St", yearBuilt: "1799" });
    expect(forecastParamsToRegistration(p)).toBeNull();
  });
});

// ── Pre-populates form fields ─────────────────────────────────────────────────

describe("forecastParamsToRegistration — form pre-population", () => {
  it("returns address and yearBuilt as string", () => {
    const p = new URLSearchParams({ address: "456 Oak Ave", yearBuilt: "1985" });
    const result = forecastParamsToRegistration(p);
    expect(result?.address).toBe("456 Oak Ave");
    expect(result?.yearBuilt).toBe("1985");
  });

  it("includes state when present", () => {
    const p = new URLSearchParams({ address: "456 Oak Ave", yearBuilt: "1985", state: "FL" });
    expect(forecastParamsToRegistration(p)?.state).toBe("FL");
  });

  it("returns empty string for state when absent", () => {
    const p = new URLSearchParams({ address: "456 Oak Ave", yearBuilt: "1985" });
    expect(forecastParamsToRegistration(p)?.state).toBe("");
  });
});

// ── System overrides → SystemAges ─────────────────────────────────────────────

describe("forecastParamsToRegistration — systemAges", () => {
  it("returns empty systemAges when no overrides are present", () => {
    const p = new URLSearchParams({ address: "456 Oak Ave", yearBuilt: "1985" });
    expect(forecastParamsToRegistration(p)?.systemAges).toEqual({});
  });

  it("maps hvac URL key to HVAC system name", () => {
    const p = new URLSearchParams({ address: "456 Oak Ave", yearBuilt: "1985", hvac: "2018" });
    expect(forecastParamsToRegistration(p)?.systemAges).toEqual({ HVAC: 2018 });
  });

  it("maps roofing URL key to Roofing system name", () => {
    const p = new URLSearchParams({ address: "456 Oak Ave", yearBuilt: "1985", roofing: "2012" });
    expect(forecastParamsToRegistration(p)?.systemAges).toEqual({ Roofing: 2012 });
  });

  it("maps all known URL keys correctly", () => {
    const p = new URLSearchParams({
      address: "456 Oak Ave", yearBuilt: "1985",
      hvac:         "2018",
      roofing:      "2012",
      water_heater: "2020",
      plumbing:     "2005",
      electrical:   "2010",
      windows:      "2016",
      flooring:     "2019",
      insulation:   "2008",
      solar_panels: "2022",
    });
    expect(forecastParamsToRegistration(p)?.systemAges).toEqual({
      "HVAC":         2018,
      "Roofing":      2012,
      "Water Heater": 2020,
      "Plumbing":     2005,
      "Electrical":   2010,
      "Windows":      2016,
      "Flooring":     2019,
      "Insulation":   2008,
      "Solar Panels": 2022,
    });
  });

  it("ignores unknown URL params", () => {
    const p = new URLSearchParams({ address: "456 Oak Ave", yearBuilt: "1985", mystery_system: "2020" });
    expect(forecastParamsToRegistration(p)?.systemAges).toEqual({});
  });

  it("ignores non-numeric override values", () => {
    const p = new URLSearchParams({ address: "456 Oak Ave", yearBuilt: "1985", hvac: "recently" });
    expect(forecastParamsToRegistration(p)?.systemAges).toEqual({});
  });

  it("handles a mix of valid and invalid overrides", () => {
    const p = new URLSearchParams({ address: "456 Oak Ave", yearBuilt: "1985", hvac: "2018", roofing: "bad" });
    expect(forecastParamsToRegistration(p)?.systemAges).toEqual({ HVAC: 2018 });
  });
});

// ── Round-trip with buildForecastUrl ──────────────────────────────────────────

describe("forecastParamsToRegistration — round-trip", () => {
  it("recovers all fields from a buildForecastUrl-generated URL", async () => {
    const { buildForecastUrl } = await import("@/services/instantForecast");

    const url = buildForecastUrl({
      address:   "789 Pine Rd",
      yearBuilt: 1972,
      state:     "TX",
      systemOverrides: { HVAC: 2015, Roofing: 2011 },
    });

    const params = new URLSearchParams(url.split("?")[1]);
    const result = forecastParamsToRegistration(params);

    expect(result?.address).toBe("789 Pine Rd");
    expect(result?.yearBuilt).toBe("1972");
    expect(result?.state).toBe("TX");
    expect(result?.systemAges).toEqual({ HVAC: 2015, Roofing: 2011 });
  });
});
