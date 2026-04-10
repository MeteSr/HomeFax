import { describe, it, expect } from "vitest";
import { referralService } from "@/services/referralService";

// ─── referralService unit tests ───────────────────────────────────────────────
// These run in mock mode (no canister deployed in test env).

describe("referralService.isReferralJob", () => {
  it("returns true when sourceQuoteId is a non-empty string", () => {
    expect(referralService.isReferralJob({ sourceQuoteId: "q-123" })).toBe(true);
  });

  it("returns false when sourceQuoteId is null", () => {
    expect(referralService.isReferralJob({ sourceQuoteId: null })).toBe(false);
  });

  it("returns false when sourceQuoteId is undefined", () => {
    expect(referralService.isReferralJob({})).toBe(false);
  });

  it("returns false when sourceQuoteId is empty string", () => {
    expect(referralService.isReferralJob({ sourceQuoteId: "" })).toBe(false);
  });
});

describe("referralService.calculateFee", () => {
  it("returns a positive number for a given job amount", () => {
    const fee = referralService.calculateFee(50000); // $500 job in cents
    expect(fee).toBeGreaterThan(0);
  });

  it("returns REFERRAL_FEE_CENTS flat fee (not a percentage)", () => {
    // Business model: flat fee per verified referral job
    const fee1 = referralService.calculateFee(10000);  // $100 job
    const fee2 = referralService.calculateFee(100000); // $1000 job
    expect(fee1).toBe(fee2); // flat, not percentage
  });

  it("flat fee is between $10 and $50 (competitive with Angi)", () => {
    const fee = referralService.calculateFee(50000);
    expect(fee).toBeGreaterThanOrEqual(1000); // $10 in cents
    expect(fee).toBeLessThanOrEqual(5000);    // $50 in cents
  });
});

describe("referralService.getPendingFees (mock)", () => {
  it("is a function", () => {
    expect(typeof referralService.getPendingFees).toBe("function");
  });

  it("returns an array in mock mode", async () => {
    const fees = await referralService.getPendingFees();
    expect(Array.isArray(fees)).toBe(true);
  });
});

describe("referralService.REFERRAL_FEE_CENTS", () => {
  it("is exported as a constant", () => {
    expect(typeof referralService.REFERRAL_FEE_CENTS).toBe("number");
  });

  it("is a round dollar amount in cents", () => {
    expect(referralService.REFERRAL_FEE_CENTS % 100).toBe(0);
  });
});
