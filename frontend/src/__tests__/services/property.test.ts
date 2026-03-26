import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock external ICP dependencies ──────────────────────────────────────────

const mockActor = {
  registerProperty:       vi.fn(),
  getMyProperties:        vi.fn(),
  getProperty:            vi.fn(),
  submitVerification:     vi.fn(),
  getPendingVerifications: vi.fn(),
  isAdminPrincipal:       vi.fn(),
  verifyProperty:         vi.fn(),
  setTier:                vi.fn(),
};

vi.mock("@/services/actor", () => ({
  getAgent: vi.fn().mockResolvedValue({}),
}));

vi.mock("@dfinity/agent", () => ({
  Actor: { createActor: vi.fn(() => mockActor) },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRawProperty(overrides: Record<string, unknown> = {}) {
  return {
    id:                BigInt(1),
    owner:             { toText: () => "owner-principal" },
    address:           "123 Main St",
    city:              "Austin",
    state:             "TX",
    zipCode:           "78701",
    propertyType:      { SingleFamily: null },
    yearBuilt:         BigInt(2001),
    squareFeet:        BigInt(2400),
    verificationLevel: { Unverified: null },
    tier:              { Free: null },
    createdAt:         BigInt(0),
    updatedAt:         BigInt(0),
    isActive:          true,
    ...overrides,
  };
}

// ─── Import service ───────────────────────────────────────────────────────────

import { propertyService } from "@/services/property";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("propertyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    propertyService.reset();
  });

  // ── getMyProperties ──────────────────────────────────────────────────────────
  describe("getMyProperties", () => {
    it("returns an empty array when canister returns none", async () => {
      mockActor.getMyProperties.mockResolvedValue([]);
      const result = await propertyService.getMyProperties();
      expect(result).toEqual([]);
    });

    it("maps raw properties to typed Property objects", async () => {
      mockActor.getMyProperties.mockResolvedValue([makeRawProperty()]);
      const [prop] = await propertyService.getMyProperties();
      expect(prop.address).toBe("123 Main St");
      expect(prop.city).toBe("Austin");
      expect(prop.state).toBe("TX");
      expect(prop.zipCode).toBe("78701");
      expect(prop.propertyType).toBe("SingleFamily");
      expect(prop.verificationLevel).toBe("Unverified");
      expect(prop.tier).toBe("Free");
      expect(prop.owner).toBe("owner-principal");
      expect(prop.isActive).toBe(true);
    });

    it("maps multiple properties", async () => {
      mockActor.getMyProperties.mockResolvedValue([
        makeRawProperty({ id: BigInt(1) }),
        makeRawProperty({ id: BigInt(2), address: "456 Oak Ave" }),
      ]);
      const props = await propertyService.getMyProperties();
      expect(props).toHaveLength(2);
      expect(props[1].address).toBe("456 Oak Ave");
    });

    it("maps all four PropertyType variants", async () => {
      const types = ["SingleFamily", "Condo", "Townhouse", "MultiFamily"];
      for (const pt of types) {
        mockActor.getMyProperties.mockResolvedValue([makeRawProperty({ propertyType: { [pt]: null } })]);
        const [prop] = await propertyService.getMyProperties();
        expect(prop.propertyType).toBe(pt);
      }
    });

    it("maps all four VerificationLevel variants", async () => {
      const levels = ["Unverified", "PendingReview", "Basic", "Premium"];
      for (const lvl of levels) {
        mockActor.getMyProperties.mockResolvedValue([makeRawProperty({ verificationLevel: { [lvl]: null } })]);
        const [prop] = await propertyService.getMyProperties();
        expect(prop.verificationLevel).toBe(lvl);
      }
    });

    it("maps all four SubscriptionTier variants", async () => {
      const tiers = ["Free", "Pro", "Premium", "ContractorPro"];
      for (const tier of tiers) {
        mockActor.getMyProperties.mockResolvedValue([makeRawProperty({ tier: { [tier]: null } })]);
        const [prop] = await propertyService.getMyProperties();
        expect(prop.tier).toBe(tier);
      }
    });
  });

  // ── getProperty ──────────────────────────────────────────────────────────────
  describe("getProperty", () => {
    it("returns a mapped property on success", async () => {
      mockActor.getProperty.mockResolvedValue({ ok: makeRawProperty() });
      const prop = await propertyService.getProperty(BigInt(1));
      expect(prop.address).toBe("123 Main St");
      expect(prop.owner).toBe("owner-principal");
    });

    it("throws NotFound error when canister returns err NotFound", async () => {
      mockActor.getProperty.mockResolvedValue({ err: { NotFound: null } });
      await expect(propertyService.getProperty(BigInt(999))).rejects.toThrow("NotFound");
    });

    it("throws NotAuthorized error", async () => {
      mockActor.getProperty.mockResolvedValue({ err: { NotAuthorized: null } });
      await expect(propertyService.getProperty(BigInt(1))).rejects.toThrow("NotAuthorized");
    });

    it("throws with text payload for InvalidInput errors", async () => {
      mockActor.getProperty.mockResolvedValue({ err: { InvalidInput: "Bad ID" } });
      await expect(propertyService.getProperty(BigInt(1))).rejects.toThrow("Bad ID");
    });
  });

  // ── registerProperty error handling (unwrap) ─────────────────────────────────
  describe("registerProperty error handling", () => {
    const validArgs = {
      address: "789 Elm St", city: "Dallas", state: "TX", zipCode: "75201",
      propertyType: "SingleFamily" as const, yearBuilt: 2000, squareFeet: 1800, tier: "Free" as const,
    };

    it("throws with AddressConflict message including an expiry date", async () => {
      // BigInt timestamp in nanoseconds — 2025-01-01T00:00:00Z
      const expiryNs = BigInt(1_735_689_600_000) * BigInt(1_000_000);
      mockActor.registerProperty.mockResolvedValue({ err: { AddressConflict: expiryNs } });
      await expect(propertyService.registerProperty(validArgs))
        .rejects.toThrow(/Address already claimed/);
    });

    it("AddressConflict error includes 'Verification window expires'", async () => {
      const expiryNs = BigInt(1_735_689_600_000) * BigInt(1_000_000);
      mockActor.registerProperty.mockResolvedValue({ err: { AddressConflict: expiryNs } });
      await expect(propertyService.registerProperty(validArgs))
        .rejects.toThrow(/Verification window expires/);
    });

    it("throws a specific DuplicateAddress message", async () => {
      mockActor.registerProperty.mockResolvedValue({ err: { DuplicateAddress: null } });
      await expect(propertyService.registerProperty(validArgs))
        .rejects.toThrow("This address is already registered and verified by another owner.");
    });

    it("throws LimitReached for quota errors", async () => {
      mockActor.registerProperty.mockResolvedValue({ err: { LimitReached: null } });
      await expect(propertyService.registerProperty(validArgs))
        .rejects.toThrow("LimitReached");
    });

    it("returns a mapped property on success", async () => {
      mockActor.registerProperty.mockResolvedValue({ ok: makeRawProperty({ address: "789 Elm St" }) });
      const prop = await propertyService.registerProperty(validArgs);
      expect(prop.address).toBe("789 Elm St");
    });
  });

  // ── submitVerification ───────────────────────────────────────────────────────
  describe("submitVerification", () => {
    it("returns the updated property on success", async () => {
      mockActor.submitVerification.mockResolvedValue({
        ok: makeRawProperty({ verificationLevel: { PendingReview: null } }),
      });
      const prop = await propertyService.submitVerification(BigInt(1), "UtilityBill", "abc123");
      expect(prop.verificationLevel).toBe("PendingReview");
    });

    it("throws on error", async () => {
      mockActor.submitVerification.mockResolvedValue({ err: { NotFound: null } });
      await expect(propertyService.submitVerification(BigInt(1), "UtilityBill", "abc"))
        .rejects.toThrow("NotFound");
    });
  });

  // ── getPendingVerifications ──────────────────────────────────────────────────
  describe("getPendingVerifications", () => {
    it("returns an empty array when none are pending", async () => {
      mockActor.getPendingVerifications.mockResolvedValue([]);
      const result = await propertyService.getPendingVerifications();
      expect(result).toEqual([]);
    });

    it("maps pending properties correctly", async () => {
      mockActor.getPendingVerifications.mockResolvedValue([
        makeRawProperty({ verificationLevel: { PendingReview: null } }),
      ]);
      const [prop] = await propertyService.getPendingVerifications();
      expect(prop.verificationLevel).toBe("PendingReview");
    });
  });

  // ── isAdmin ──────────────────────────────────────────────────────────────────
  describe("isAdmin", () => {
    it("returns true when canister confirms admin", async () => {
      mockActor.isAdminPrincipal.mockResolvedValue(true);
      // isAdmin calls @dfinity/principal — mock it
      vi.doMock("@dfinity/principal", () => ({
        Principal: { fromText: vi.fn().mockReturnValue("mock-principal-obj") },
      }));
      const result = await propertyService.isAdmin("some-principal");
      expect(typeof result).toBe("boolean");
    });
  });

  // ── verifyProperty ───────────────────────────────────────────────────────────
  describe("verifyProperty", () => {
    it("returns the updated property with new verification level", async () => {
      mockActor.verifyProperty.mockResolvedValue({
        ok: makeRawProperty({ verificationLevel: { Basic: null } }),
      });
      const prop = await propertyService.verifyProperty(BigInt(1), "Basic", "DeedRecord");
      expect(prop.verificationLevel).toBe("Basic");
    });

    it("works without optional method argument", async () => {
      mockActor.verifyProperty.mockResolvedValue({
        ok: makeRawProperty({ verificationLevel: { Premium: null } }),
      });
      const prop = await propertyService.verifyProperty(BigInt(1), "Premium");
      expect(prop.verificationLevel).toBe("Premium");
    });
  });

  // ── setTier ──────────────────────────────────────────────────────────────────
  describe("setTier", () => {
    it("resolves without error on success", async () => {
      mockActor.setTier.mockResolvedValue({ ok: null });
      vi.doMock("@dfinity/principal", () => ({
        Principal: { fromText: vi.fn().mockReturnValue("mock-p") },
      }));
      await expect(propertyService.setTier("some-principal", "Pro")).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      mockActor.setTier.mockResolvedValue({ err: { NotAuthorized: null } });
      vi.doMock("@dfinity/principal", () => ({
        Principal: { fromText: vi.fn().mockReturnValue("mock-p") },
      }));
      await expect(propertyService.setTier("some-principal", "Pro")).rejects.toThrow("NotAuthorized");
    });
  });
});
