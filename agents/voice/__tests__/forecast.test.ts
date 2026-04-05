/**
 * @jest-environment node
 */
import {
  parseForecastQueryParams,
  estimateSystems,
  computeTenYearBudget,
  urgencyFor,
  climateZoneFor,
  type SystemEstimate,
} from "../forecast";

const CURRENT_YEAR = new Date().getFullYear();

// ── urgencyFor ────────────────────────────────────────────────────────────────

describe("urgencyFor", () => {
  it("Critical at 100%",  () => expect(urgencyFor(100)).toBe("Critical"));
  it("Critical above 100%", () => expect(urgencyFor(130)).toBe("Critical"));
  it("Soon at 75%",       () => expect(urgencyFor(75)).toBe("Soon"));
  it("Soon at 99%",       () => expect(urgencyFor(99)).toBe("Soon"));
  it("Watch at 50%",      () => expect(urgencyFor(50)).toBe("Watch"));
  it("Watch at 74%",      () => expect(urgencyFor(74)).toBe("Watch"));
  it("Good at 0%",        () => expect(urgencyFor(0)).toBe("Good"));
  it("Good at 49%",       () => expect(urgencyFor(49)).toBe("Good"));
});

// ── climateZoneFor ────────────────────────────────────────────────────────────

describe("climateZoneFor", () => {
  it("maps FL to hotHumid", ()   => expect(climateZoneFor("FL")).toBe("hotHumid"));
  it("maps AZ to hotDry", ()     => expect(climateZoneFor("AZ")).toBe("hotDry"));
  it("maps MN to veryCold", ()   => expect(climateZoneFor("MN")).toBe("veryCold"));
  it("maps NY to cold", ()       => expect(climateZoneFor("NY")).toBe("cold"));
  it("maps TX to mixed", ()      => expect(climateZoneFor("TX")).toBe("mixed"));
  it("is case-insensitive", ()   => expect(climateZoneFor("fl")).toBe("hotHumid"));
  it("unknown state → mixed", () => expect(climateZoneFor("ZZ")).toBe("mixed"));
});

// ── computeTenYearBudget ──────────────────────────────────────────────────────

describe("computeTenYearBudget", () => {
  it("returns 0 for empty array", () => {
    expect(computeTenYearBudget([])).toBe(0);
  });

  it("sums replacementCostLow for systems with yearsRemaining <= 10", () => {
    const estimates: SystemEstimate[] = [
      { systemName: "HVAC", installYear: 2000, ageYears: 5, lifespanYears: 18,
        percentLifeUsed: 50, yearsRemaining: 5, urgency: "Watch",
        replacementCostLow: 8000, replacementCostHigh: 15000 },
      { systemName: "Roofing", installYear: 2000, ageYears: 5, lifespanYears: 25,
        percentLifeUsed: 20, yearsRemaining: 10, urgency: "Good",
        replacementCostLow: 15000, replacementCostHigh: 35000 },
    ];
    expect(computeTenYearBudget(estimates)).toBe(23000);
  });

  it("excludes systems with yearsRemaining > 10", () => {
    const estimates: SystemEstimate[] = [
      { systemName: "Plumbing", installYear: 2010, ageYears: 15, lifespanYears: 50,
        percentLifeUsed: 30, yearsRemaining: 35, urgency: "Good",
        replacementCostLow: 4000, replacementCostHigh: 15000 },
    ];
    expect(computeTenYearBudget(estimates)).toBe(0);
  });
});

// ── estimateSystems ───────────────────────────────────────────────────────────

describe("estimateSystems", () => {
  it("returns 9 systems", () => {
    expect(estimateSystems(2000).length).toBe(9);
  });

  it("returns systems sorted Critical → Soon → Watch → Good", () => {
    const estimates = estimateSystems(1950);
    const RANK = { Critical: 0, Soon: 1, Watch: 2, Good: 3 };
    for (let i = 1; i < estimates.length; i++) {
      expect(RANK[estimates[i].urgency]).toBeGreaterThanOrEqual(RANK[estimates[i - 1].urgency]);
    }
  });

  it("marks HVAC as Critical for a 1950 house (age > 18-year lifespan)", () => {
    const estimates = estimateSystems(1950);
    const hvac = estimates.find((e) => e.systemName === "HVAC");
    expect(hvac?.urgency).toBe("Critical");
  });

  it("applies a system override — installYear updated", () => {
    const recentYear = CURRENT_YEAR - 3;
    const estimates  = estimateSystems(1970, undefined, { "HVAC": recentYear });
    const hvac = estimates.find((e) => e.systemName === "HVAC");
    expect(hvac?.installYear).toBe(recentYear);
    expect(hvac?.ageYears).toBe(3);
  });

  it("ignores override earlier than yearBuilt", () => {
    const estimates = estimateSystems(2000, undefined, { "HVAC": 1990 });
    const hvac = estimates.find((e) => e.systemName === "HVAC");
    expect(hvac?.installYear).toBe(2000);  // override ignored
  });

  it("ignores override in the future", () => {
    const estimates = estimateSystems(2000, undefined, { "HVAC": CURRENT_YEAR + 1 });
    const hvac = estimates.find((e) => e.systemName === "HVAC");
    expect(hvac?.installYear).toBe(2000);
  });

  it("applies climate multiplier — FL HVAC lifespan shorter than TX", () => {
    const fl = estimateSystems(2010, "FL").find((e) => e.systemName === "HVAC")!;
    const tx = estimateSystems(2010, "TX").find((e) => e.systemName === "HVAC")!;
    expect(fl.lifespanYears).toBeLessThan(tx.lifespanYears);
  });
});

// ── parseForecastQueryParams ──────────────────────────────────────────────────

describe("parseForecastQueryParams", () => {
  it("returns input for valid params", () => {
    const result = parseForecastQueryParams({ address: "123 Main St", yearBuilt: "1998" });
    expect("input" in result).toBe(true);
    if ("input" in result) {
      expect(result.input.address).toBe("123 Main St");
      expect(result.input.yearBuilt).toBe(1998);
    }
  });

  it("returns error when address is missing", () => {
    const result = parseForecastQueryParams({ yearBuilt: "1998" });
    expect("error" in result).toBe(true);
  });

  it("returns error when yearBuilt is missing", () => {
    const result = parseForecastQueryParams({ address: "123 Main St" });
    expect("error" in result).toBe(true);
  });

  it("returns error for non-numeric yearBuilt", () => {
    const result = parseForecastQueryParams({ address: "123 Main", yearBuilt: "abc" });
    expect("error" in result).toBe(true);
  });

  it("returns error for yearBuilt < 1800", () => {
    const result = parseForecastQueryParams({ address: "123 Main", yearBuilt: "1799" });
    expect("error" in result).toBe(true);
  });

  it("returns error for future yearBuilt", () => {
    const result = parseForecastQueryParams({ address: "123 Main", yearBuilt: String(CURRENT_YEAR + 1) });
    expect("error" in result).toBe(true);
  });

  it("parses state param", () => {
    const result = parseForecastQueryParams({ address: "123 Main", yearBuilt: "1998", state: "tx" });
    expect("input" in result && result.input.state).toBe("TX");
  });

  it("parses per-system override params", () => {
    const result = parseForecastQueryParams({ address: "123 Main", yearBuilt: "1970", hvac: "2010" });
    expect("input" in result && result.input.overrides["HVAC"]).toBe(2010);
  });

  it("trims whitespace from address", () => {
    const result = parseForecastQueryParams({ address: "  123 Main  ", yearBuilt: "1990" });
    expect("input" in result && result.input.address).toBe("123 Main");
  });
});
