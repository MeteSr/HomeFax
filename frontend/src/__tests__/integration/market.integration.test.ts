/**
 * Integration tests — market canister (neighbourhood score) against the real
 * ICP market canister.
 *
 * Requires: dfx start --background && make deploy
 * Run:      npm run test:integration  (from repo root)
 *
 * What these tests prove that unit tests cannot:
 *   - Candid IDL: JobSummary record, StoredScore / ZipStats / ScoreEnvelope records,
 *     updatedAt (Int bigint)
 *   - submitScore() stores score and returns StoredScore with numeric fields
 *   - getZipStats(zipCode) returns aggregated stats after score submission
 *   - getNeighborhoodPublicKey() returns non-empty Uint8Array
 *   - getMyScoreEncrypted() round-trip: submitted score is retrievable with key
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  submitScore,
  getZipStats,
  getNeighborhoodPublicKey,
  getMyScoreEncrypted,
} from "@/services/market";
import type { StoredScore, ZipStats } from "@/services/market";

const CANISTER_ID = (process.env as any).MARKET_CANISTER_ID || "";
const deployed = !!CANISTER_ID;

const RUN_ID = Date.now();
const ZIP    = "78701";

const SAMPLE_JOBS = [
  { serviceType: "HVAC",    completedYear: 2023, amountCents: 250_000, isDiy: false, isVerified: true  },
  { serviceType: "Roofing", completedYear: 2022, amountCents: 800_000, isDiy: false, isVerified: true  },
  { serviceType: "Painting",completedYear: 2024, amountCents: 50_000,  isDiy: true,  isVerified: false },
];

// ─── submitScore ──────────────────────────────────────────────────────────────

describe.skipIf(!deployed)("submitScore — Candid serialization", () => {
  let stored: StoredScore;

  beforeAll(async () => {
    stored = await submitScore(SAMPLE_JOBS, 2005, ZIP);
  });

  it("returns a numeric score", () => {
    expect(typeof stored.score).toBe("number");
    expect(stored.score).toBeGreaterThanOrEqual(0);
  });

  it("zipCode is preserved", () => {
    expect(stored.zipCode).toBe(ZIP);
  });

  it("updatedAt is a positive bigint", () => {
    expect(typeof stored.updatedAt).toBe("bigint");
    expect(stored.updatedAt).toBeGreaterThan(0n);
  });
});

// ─── getZipStats — aggregated stats ──────────────────────────────────────────

describe.skipIf(!deployed)("getZipStats — returns aggregated stats after submission", () => {
  let stats: ZipStats | null;

  beforeAll(async () => {
    // Submit a score first to ensure the zip exists
    await submitScore(SAMPLE_JOBS, 2005, ZIP);
    stats = await getZipStats(ZIP);
  });

  it("returns non-null stats for a submitted zip", () => {
    expect(stats).not.toBeNull();
  });

  it("zipCode matches the queried zip", () => {
    expect(stats!.zipCode).toBe(ZIP);
  });

  it("mean and median are non-negative numbers", () => {
    expect(stats!.mean).toBeGreaterThanOrEqual(0);
    expect(stats!.median).toBeGreaterThanOrEqual(0);
  });

  it("sampleSize is positive", () => {
    expect(stats!.sampleSize).toBeGreaterThan(0);
  });

  it("grade is a non-empty string", () => {
    expect(typeof stats!.grade).toBe("string");
    expect(stats!.grade.length).toBeGreaterThan(0);
  });
});

// ─── getZipStats — unknown zip returns null ───────────────────────────────────

describe.skipIf(!deployed)("getZipStats — returns null for unknown zip", () => {
  it("returns null for a zip that has no submissions", async () => {
    const result = await getZipStats(`00000`);
    expect(result).toBeNull();
  });
});

// ─── getNeighborhoodPublicKey ─────────────────────────────────────────────────

describe.skipIf(!deployed)("getNeighborhoodPublicKey — returns non-empty key bytes", () => {
  it("returns a Uint8Array with bytes", async () => {
    const key = await getNeighborhoodPublicKey();
    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBeGreaterThan(0);
  });
});

// ─── getMyScoreEncrypted — round-trip ─────────────────────────────────────────

describe.skipIf(!deployed)("getMyScoreEncrypted — score survives canister storage", () => {
  it("returns an envelope with the correct zipCode after submission", async () => {
    await submitScore(SAMPLE_JOBS, 2005, ZIP);
    const publicKey = await getNeighborhoodPublicKey();
    const envelope = await getMyScoreEncrypted(publicKey);
    expect(envelope.zipCode).toBe(ZIP);
    expect(typeof envelope.score).toBe("number");
    expect(envelope.score).toBeGreaterThanOrEqual(0);
    expect(envelope.encryptedKey).toBeInstanceOf(Uint8Array);
  });
});
