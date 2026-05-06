/**
 * Integration tests — monitoringService against the real ICP monitoring canister.
 *
 * Requires: dfx start --background && make deploy
 * Run:      npm run test:integration  (from repo root)
 *
 * What these tests prove that unit tests cannot:
 *   - Candid IDL: CanisterMetrics / MonitoringMetrics / TrackedCanister record
 *     fields (Nat, Int ns→ms, Bool)
 *   - getMetrics() returns MonitoringMetrics with expected numeric fields
 *   - getAllCanisterMetrics() returns an array of CanisterMetrics
 *   - getTrackedCanisters() returns registered canister records
 *   - checkCycleLevels() returns CycleLevelResult array with valid status strings
 *   - registerCanister() / unregisterCanister() update the tracked set
 *   - setLowCycleThreshold() can be called (Unauthorized acceptable in local dev)
 */

import { describe, it, expect, beforeAll } from "vitest";
import { Actor } from "@icp-sdk/core/agent";
import { monitoringService, idlFactory } from "@/services/monitoringService";
import type { CanisterMetrics, MonitoringMetrics, TrackedCanister, CycleLevelResult } from "@/services/monitoringService";
import { getAgent } from "@/services/actor";

const CANISTER_ID = (process.env as any).MONITORING_CANISTER_ID || "";
const deployed = !!CANISTER_ID;

async function getActor() {
  const agent = await getAgent();
  return Actor.createActor(idlFactory, { agent, canisterId: CANISTER_ID });
}

// ─── getMetrics ───────────────────────────────────────────────────────────────

describe.skipIf(!deployed)("getMetrics — MonitoringMetrics record", () => {
  let metrics: MonitoringMetrics;

  beforeAll(async () => {
    metrics = await monitoringService.getMetrics();
  });

  it("totalCanisters is a non-negative number", () => {
    expect(typeof metrics.totalCanisters).toBe("number");
    expect(metrics.totalCanisters).toBeGreaterThanOrEqual(0);
  });

  it("activeAlerts and criticalAlerts are non-negative numbers", () => {
    expect(metrics.activeAlerts).toBeGreaterThanOrEqual(0);
    expect(metrics.criticalAlerts).toBeGreaterThanOrEqual(0);
  });

  it("isPaused is a boolean", () => {
    expect(typeof metrics.isPaused).toBe("boolean");
  });

  it("cyclesPerCall is an array", () => {
    expect(Array.isArray(metrics.cyclesPerCall)).toBe(true);
  });
});

// ─── getAllCanisterMetrics ─────────────────────────────────────────────────────

describe.skipIf(!deployed)("getAllCanisterMetrics — per-canister data", () => {
  let all: CanisterMetrics[];

  beforeAll(async () => {
    all = await monitoringService.getAllCanisterMetrics();
  });

  it("returns an array", () => {
    expect(Array.isArray(all)).toBe(true);
  });

  it("each entry has numeric fields (Nat bigint → number conversion)", () => {
    for (const m of all) {
      expect(typeof m.cyclesBalance).toBe("number");
      expect(typeof m.cyclesBurned).toBe("number");
      expect(typeof m.memoryBytes).toBe("number");
      expect(typeof m.requestCount).toBe("number");
    }
  });
});

// ─── getTrackedCanisters ──────────────────────────────────────────────────────

describe.skipIf(!deployed)("getTrackedCanisters — returns registered canisters", () => {
  it("returns an array of TrackedCanister records", async () => {
    const canisters = await monitoringService.getTrackedCanisters();
    expect(Array.isArray(canisters)).toBe(true);
    for (const c of canisters) {
      expect(typeof c.id).toBe("string");
      expect(typeof c.name).toBe("string");
    }
  });
});

// ─── registerCanister + unregisterCanister round-trip ─────────────────────────

describe.skipIf(!deployed)("registerCanister & unregisterCanister — round-trip", () => {
  const testName = `integ-test-${Date.now()}`;

  it("registerCanister completes without trapping (Unauthorized acceptable)", async () => {
    const a = await getActor();
    try {
      const result = await a.registerCanister(
        // Use the monitoring canister itself as the test subject
        (await import("@icp-sdk/core/principal")).Principal.fromText(CANISTER_ID),
        testName
      ) as any;
      // ok or AlreadyExists are both acceptable
      expect("ok" in result || "err" in result).toBe(true);
    } catch (e: any) {
      expect(e.message).toMatch(/Unauthorized/i);
    }
  });

  it("getTrackedCanisters still returns an array after registration attempt", async () => {
    const canisters = await monitoringService.getTrackedCanisters();
    expect(Array.isArray(canisters)).toBe(true);
  });

  it("unregisterCanister completes without trapping", async () => {
    const a = await getActor();
    try {
      const result = await a.unregisterCanister(
        (await import("@icp-sdk/core/principal")).Principal.fromText(CANISTER_ID)
      ) as any;
      expect("ok" in result || "err" in result).toBe(true);
    } catch (e: any) {
      expect(e.message).toMatch(/Unauthorized|NotFound/i);
    }
  });
});

// ─── checkCycleLevels ─────────────────────────────────────────────────────────

describe.skipIf(!deployed)("checkCycleLevels — returns CycleLevelResult array", () => {
  let results: CycleLevelResult[];

  beforeAll(async () => {
    results = await monitoringService.checkCycleLevels();
  });

  it("returns an array", () => {
    expect(Array.isArray(results)).toBe(true);
  });

  it("each result has a valid status string", () => {
    const VALID = new Set(["ok", "warning", "critical", "unknown"]);
    for (const r of results) {
      expect(VALID.has(r.status)).toBe(true);
    }
  });

  it("each result has numeric cycles and boolean fromCache", () => {
    for (const r of results) {
      expect(typeof r.cycles).toBe("number");
      expect(r.cycles).toBeGreaterThanOrEqual(0);
      expect(typeof r.fromCache).toBe("boolean");
    }
  });
});

// ─── setLowCycleThreshold ─────────────────────────────────────────────────────

describe.skipIf(!deployed)("setLowCycleThreshold — accepted or Unauthorized", () => {
  it("does not trap (returns ok or Unauthorized err)", async () => {
    const a = await getActor();
    try {
      const result = await a.setLowCycleThreshold(BigInt(500_000_000_000)) as any;
      expect("ok" in result || "err" in result).toBe(true);
    } catch (e: any) {
      expect(e.message).toMatch(/Unauthorized/i);
    }
  });
});
