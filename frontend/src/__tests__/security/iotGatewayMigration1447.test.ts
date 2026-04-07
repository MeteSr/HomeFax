/**
 * TDD — 14.4.7: Migrate iot-gateway from deprecated @dfinity/* 1.x to 3.x
 *
 * The iot-gateway used @dfinity/* at ^1.0.1. This migration:
 *  1. Updates package.json to ^3.4.3 (matching the frontend)
 *  2. Replaces `new HttpAgent({...})` (1.x) with `await HttpAgent.create({...})` (3.x)
 *  3. Uses shouldFetchRootKey in the create() options instead of agent.fetchRootKey()
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../../../../");

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}

describe("14.4.7: iot-gateway @dfinity/* version migration", () => {
  const pkg = JSON.parse(read("agents/iot-gateway/package.json")) as Record<string, any>;

  it("@icp-sdk/core/agent is at ^3.x, not 1.x", () => {
    expect(pkg.dependencies["@icp-sdk/core/agent"]).toMatch(/^\^3\./);
  });

  it("@icp-sdk/core/candid is at ^3.x", () => {
    expect(pkg.dependencies["@icp-sdk/core/candid"]).toMatch(/^\^3\./);
  });

  it("@icp-sdk/core/identity is at ^3.x", () => {
    expect(pkg.dependencies["@icp-sdk/core/identity"]).toMatch(/^\^3\./);
  });

  it("@icp-sdk/core/principal is at ^3.x", () => {
    expect(pkg.dependencies["@icp-sdk/core/principal"]).toMatch(/^\^3\./);
  });
});

describe("14.4.7: iot-gateway icp.ts uses 3.x HttpAgent API", () => {
  const icp = read("agents/iot-gateway/icp.ts");

  it("uses HttpAgent.create() async factory, not new HttpAgent()", () => {
    expect(icp).toMatch(/HttpAgent\.create\s*\(/);
    expect(icp).not.toMatch(/new HttpAgent\s*\(/);
  });

  it("uses shouldFetchRootKey in create() options (not agent.fetchRootKey())", () => {
    expect(icp).toMatch(/shouldFetchRootKey/);
    // agent.fetchRootKey() should no longer be called as a separate step
    expect(icp).not.toMatch(/agent\.fetchRootKey\s*\(\)/);
  });

  it("shouldFetchRootKey is gated on non-production environment", () => {
    expect(icp).toMatch(/shouldFetchRootKey\s*:\s*process\.env\.NODE_ENV\s*!==\s*["']production["']/);
  });

  it("imports are still from @dfinity/* (not a different package)", () => {
    expect(icp).toMatch(/@dfinity\/agent/);
    expect(icp).toMatch(/@dfinity\/identity/);
    expect(icp).toMatch(/@dfinity\/candid/);
  });

  it("fetchRootKey: true does not appear (must use shouldFetchRootKey option)", () => {
    expect(icp).not.toMatch(/fetchRootKey\s*:\s*true/);
  });
});
