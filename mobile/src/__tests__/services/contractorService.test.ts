/**
 * @jest-environment node
 */
import {
  filterLeadsBySpecialties,
  formatEarnings,
  Lead,
} from "../../services/contractorService";

const LEADS: Lead[] = [
  { id: "q1", serviceType: "HVAC",     description: "AC not cooling",    urgency: "High",   propertyZip: "78701" },
  { id: "q2", serviceType: "Plumbing", description: "Leaking faucet",    urgency: "Low",    propertyZip: "78702" },
  { id: "q3", serviceType: "Roofing",  description: "Storm damage",      urgency: "High",   propertyZip: "78703" },
  { id: "q4", serviceType: "HVAC",     description: "Furnace inspection", urgency: "Medium", propertyZip: "78701" },
];

// ── filterLeadsBySpecialties ──────────────────────────────────────────────────

describe("filterLeadsBySpecialties", () => {
  it("returns only leads matching the given specialties", () => {
    const result = filterLeadsBySpecialties(LEADS, ["HVAC"]);
    expect(result).toHaveLength(2);
    expect(result.every((l) => l.serviceType === "HVAC")).toBe(true);
  });

  it("returns all matching leads for multiple specialties", () => {
    const result = filterLeadsBySpecialties(LEADS, ["HVAC", "Plumbing"]);
    expect(result).toHaveLength(3);
  });

  it("returns empty array when no leads match", () => {
    expect(filterLeadsBySpecialties(LEADS, ["Electrical"])).toHaveLength(0);
  });

  it("returns all leads when specialties array is empty (show everything)", () => {
    expect(filterLeadsBySpecialties(LEADS, [])).toHaveLength(4);
  });

  it("sorts High urgency leads before Medium and Low", () => {
    const result = filterLeadsBySpecialties(LEADS, ["HVAC"]);
    expect(result[0].urgency).toBe("High");
  });
});

// ── formatEarnings ────────────────────────────────────────────────────────────

describe("formatEarnings", () => {
  it("formats cents as USD currency string", () => {
    expect(formatEarnings(250000)).toBe("$2,500");
  });

  it("returns $0 for zero cents", () => {
    expect(formatEarnings(0)).toBe("$0");
  });

  it("rounds to nearest dollar (no cents shown)", () => {
    expect(formatEarnings(199999)).toBe("$2,000");
  });

  it("handles large amounts", () => {
    expect(formatEarnings(1500000)).toBe("$15,000");
  });
});
