import { describe, it, expect, beforeEach, vi } from "vitest";

// Set a non-empty canister ID before the listing service module loads so the
// !LISTING_CANISTER_ID early-return guards don't short-circuit the mock actor.
vi.hoisted(() => {
  (process.env as any).LISTING_CANISTER_ID = "rdmx6-jaaaa-aaaah-test-cai";
});

// ─── Stateful mock actor for panorama methods ─────────────────────────────────

const _panoramas = new Map<string, Array<{ roomLabel: string; photoId: string }>>();
const _photoOwners = new Map<string, string>();

const MAX_PANORAMAS = 10;

function resetPanoramaMock() {
  _panoramas.clear();
  _photoOwners.clear();
}

const mockListingActor = {
  addPanorama: vi.fn(async (propertyId: string, roomLabel: string, photoId: string) => {
    if (!propertyId) return { err: { InvalidInput: "propertyId cannot be empty" } };
    if (!roomLabel)  return { err: { InvalidInput: "roomLabel cannot be empty" } };
    if (!photoId)    return { err: { InvalidInput: "photoId cannot be empty" } };

    const existing = _panoramas.get(propertyId) ?? [];
    if (existing.length >= MAX_PANORAMAS)
      return { err: { InvalidInput: `Panorama limit (${MAX_PANORAMAS}) reached` } };
    if (existing.some((e) => e.roomLabel === roomLabel))
      return { err: { InvalidInput: `Room label "${roomLabel}" already exists` } };

    existing.push({ roomLabel, photoId });
    _panoramas.set(propertyId, existing);
    return { ok: null };
  }),

  getPanoramas: vi.fn(async (propertyId: string) =>
    (_panoramas.get(propertyId) ?? []).map((e) => ({ roomLabel: e.roomLabel, photoId: e.photoId }))
  ),

  removePanorama: vi.fn(async (propertyId: string, roomLabel: string) => {
    const existing = _panoramas.get(propertyId) ?? [];
    const idx = existing.findIndex((e) => e.roomLabel === roomLabel);
    if (idx === -1) return { err: { NotFound: null } };
    existing.splice(idx, 1);
    _panoramas.set(propertyId, existing);
    return { ok: null };
  }),
};

vi.mock("@/services/actor", () => ({ getAgent: vi.fn().mockResolvedValue({}) }));
vi.mock("@icp-sdk/core/agent", () => ({
  Actor: { createActor: vi.fn(() => mockListingActor) },
}));

let _now = 5_000_000_000_000;
vi.spyOn(Date, "now").mockImplementation(() => ++_now);

import { listingService } from "@/services/listing";

// ─── addPanorama ──────────────────────────────────────────────────────────────

describe("listingService.addPanorama", () => {
  beforeEach(() => { resetPanoramaMock(); listingService.reset(); });

  it("stores a panorama entry for a property", async () => {
    await listingService.addPanorama("prop-1", "Living Room", "PHOTO_360_1");
    const entries = await listingService.getPanoramas("prop-1");
    expect(entries).toHaveLength(1);
    expect(entries[0].roomLabel).toBe("Living Room");
    expect(entries[0].photoId).toBe("PHOTO_360_1");
  });

  it("preserves insertion order", async () => {
    await listingService.addPanorama("prop-ord", "Kitchen",  "PH_1");
    await listingService.addPanorama("prop-ord", "Bedroom",  "PH_2");
    await listingService.addPanorama("prop-ord", "Backyard", "PH_3");
    const entries = await listingService.getPanoramas("prop-ord");
    expect(entries.map((e) => e.roomLabel)).toEqual(["Kitchen", "Bedroom", "Backyard"]);
  });

  it("allows up to 10 panoramas", async () => {
    for (let i = 0; i < 10; i++) {
      await listingService.addPanorama("prop-max", `Room ${i}`, `PH_${i}`);
    }
    expect(await listingService.getPanoramas("prop-max")).toHaveLength(10);
  });

  it("enforces the 10-panorama cap", async () => {
    for (let i = 0; i < 10; i++) {
      await listingService.addPanorama("prop-cap", `Room ${i}`, `PH_${i}`);
    }
    await expect(
      listingService.addPanorama("prop-cap", "Overflow Room", "PH_10")
    ).rejects.toThrow("Panorama limit");
  });

  it("rejects duplicate room labels", async () => {
    await listingService.addPanorama("prop-dup", "Kitchen", "PH_A");
    await expect(
      listingService.addPanorama("prop-dup", "Kitchen", "PH_B")
    ).rejects.toThrow("Kitchen");
  });

  it("allows same photoId under different room labels", async () => {
    await expect(
      listingService.addPanorama("prop-shared", "Front Yard", "SHARED_PH")
    ).resolves.not.toThrow();
    await expect(
      listingService.addPanorama("prop-shared", "Back Yard", "SHARED_PH")
    ).resolves.not.toThrow();
  });

  it("panoramas are scoped per property", async () => {
    await listingService.addPanorama("prop-A", "Living Room", "PH_1");
    await listingService.addPanorama("prop-B", "Living Room", "PH_2");
    expect(await listingService.getPanoramas("prop-A")).toHaveLength(1);
    expect(await listingService.getPanoramas("prop-B")).toHaveLength(1);
  });
});

// ─── getPanoramas ─────────────────────────────────────────────────────────────

describe("listingService.getPanoramas", () => {
  beforeEach(() => { resetPanoramaMock(); listingService.reset(); });

  it("returns [] for an unknown property", async () => {
    expect(await listingService.getPanoramas("nonexistent")).toEqual([]);
  });

  it("returns the full entry list after multiple adds", async () => {
    await listingService.addPanorama("prop-1", "Kitchen",  "PH_K");
    await listingService.addPanorama("prop-1", "Bedroom",  "PH_B");
    const entries = await listingService.getPanoramas("prop-1");
    expect(entries).toHaveLength(2);
    expect(entries.some((e) => e.roomLabel === "Kitchen")).toBe(true);
    expect(entries.some((e) => e.roomLabel === "Bedroom")).toBe(true);
  });

  it("each entry has roomLabel and photoId fields", async () => {
    await listingService.addPanorama("prop-1", "Garage", "PH_G");
    const [entry] = await listingService.getPanoramas("prop-1");
    expect(entry).toHaveProperty("roomLabel");
    expect(entry).toHaveProperty("photoId");
  });
});

// ─── removePanorama ───────────────────────────────────────────────────────────

describe("listingService.removePanorama", () => {
  beforeEach(() => { resetPanoramaMock(); listingService.reset(); });

  it("removes a panorama by room label, leaving others intact", async () => {
    await listingService.addPanorama("prop-rm", "Kitchen", "PH_K");
    await listingService.addPanorama("prop-rm", "Bedroom", "PH_B");
    await listingService.addPanorama("prop-rm", "Garage",  "PH_G");
    await listingService.removePanorama("prop-rm", "Bedroom");
    const entries = await listingService.getPanoramas("prop-rm");
    expect(entries.some((e) => e.roomLabel === "Bedroom")).toBe(false);
    expect(entries.some((e) => e.roomLabel === "Kitchen")).toBe(true);
    expect(entries.some((e) => e.roomLabel === "Garage")).toBe(true);
  });

  it("allows re-adding a room label after removal", async () => {
    await listingService.addPanorama("prop-readd", "Kitchen", "PH_1");
    await listingService.removePanorama("prop-readd", "Kitchen");
    await expect(
      listingService.addPanorama("prop-readd", "Kitchen", "PH_2")
    ).resolves.not.toThrow();
  });

  it("throws when removing a non-existent room label", async () => {
    await listingService.addPanorama("prop-bad", "Kitchen", "PH_K");
    await expect(
      listingService.removePanorama("prop-bad", "Dungeon")
    ).rejects.toThrow();
  });

  it("throws when removing from a property with no panoramas", async () => {
    await expect(
      listingService.removePanorama("ghost-prop", "Kitchen")
    ).rejects.toThrow();
  });
});

// ─── reset() ─────────────────────────────────────────────────────────────────

describe("listingService.reset() clears panoramas", () => {
  it("panoramas are empty after reset", async () => {
    await listingService.addPanorama("prop-rst", "Kitchen", "PH_K");
    resetPanoramaMock();
    listingService.reset();
    expect(await listingService.getPanoramas("prop-rst")).toEqual([]);
  });
});
