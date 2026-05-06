/**
 * Integration test global setup.
 *
 * Runs once before any integration test file. Creates a deterministic
 * Ed25519 identity (same seed as loginWithLocalIdentity) and injects it
 * into the ICP agent singleton so all service calls use a consistent principal
 * without requiring a browser or Internet Identity round-trip.
 *
 * If the local replica is not reachable, a clear error is thrown rather than
 * letting tests fail with cryptic network errors.
 */

import { beforeAll, afterAll } from "vitest";
import { HttpAgent } from "@icp-sdk/core/agent";
import { Ed25519KeyIdentity } from "@icp-sdk/core/identity";
import { setAgentForTesting } from "@/services/actor";

// ─── Deterministic test identity ──────────────────────────────────────────────
// Fixed seed → same principal every run → canister ownership checks are stable.
// This matches the seed used by loginWithLocalIdentity() in dev.
const TEST_SEED = new Uint8Array(32);
TEST_SEED[0] = 42;
export const testIdentity = Ed25519KeyIdentity.generate(TEST_SEED);
export const TEST_PRINCIPAL = testIdentity.getPrincipal().toText();

// ─── Replica health check ─────────────────────────────────────────────────────

async function assertReplicaRunning(): Promise<void> {
  try {
    const res = await fetch("http://localhost:4943/api/v2/status", {
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) throw new Error(`Replica returned ${res.status}`);
  } catch (err) {
    throw new Error(
      `Local ICP replica is not running or not reachable at http://localhost:4943.\n` +
      `Start it with: dfx start --background\n` +
      `Then deploy with: make deploy\n` +
      `Original error: ${err}`
    );
  }
}

// ─── Global setup ─────────────────────────────────────────────────────────────

let agent: HttpAgent;

beforeAll(async () => {
  await assertReplicaRunning();

  agent = await HttpAgent.create({
    identity:          testIdentity,
    host:              "http://localhost:4943",
    shouldFetchRootKey: true,   // required for local replica (non-production)
  });

  // @icp-sdk/core v5.x defaults to /api/v4/ for update calls (synchronous mode).
  // dfx 0.24.x pocket-ic returns HTTP 400 (not 404) for unknown v4 endpoints,
  // which prevents the SDK's built-in v4→v2 fallback (which only triggers on 404).
  // Force v2 by setting callSync: false on every call so the agent always uses
  // /api/v2/canister/{id}/call, which dfx 0.24.x supports.
  const _origCall = agent.call.bind(agent);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (agent as any).call = (canisterId: any, options: any, identity: any) =>
    _origCall(canisterId, { ...options, callSync: false }, identity);

  // Inject the agent so all services use this identity instead of AuthClient
  setAgentForTesting(agent);
});

afterAll(() => {
  // Reset so the agent doesn't bleed into unit tests if somehow run together
  setAgentForTesting(null as any);
});
