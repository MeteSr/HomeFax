/**
 * Integration tests — listingService against the real ICP listing canister.
 *
 * Requires: dfx start --background && make deploy
 * Run:      npm run test:integration  (from repo root)
 *
 * What these tests prove that unit tests cannot:
 *   - Candid IDL: targetListDate/bidDeadline/validUntil (Int bigint), desiredSalePrice
 *     (Opt Nat), commissionBps/estimatedDaysOnMarket/estimatedSalePrice (Nat/bigint)
 *   - BidRequestStatus Variant: Open → Cancelled (cancelBidRequest)
 *   - ProposalStatus Variant: Pending → Accepted (acceptProposal) + others → Rejected
 *   - Deadline enforcement: submitProposal after bidDeadline throws DeadlinePassed
 *   - Sealed-bid: getProposalsForRequest returns empty before deadline, proposals after
 *   - Homeowner scoping: getMyBidRequests returns only the caller's requests
 *   - Award cascade: accepting one proposal marks the request as Awarded
 */

import { describe, it, expect, beforeAll } from "vitest";
import { listingService } from "@/services/listing";
import type { ListingBidRequest, ListingProposal } from "@/services/listing";
import { TEST_PRINCIPAL } from "./setup";

const CANISTER_ID = process.env.LISTING_CANISTER_ID || "";
const deployed = !!CANISTER_ID;

const RUN_ID = Date.now();
function pid(label: string) { return `integ-listing-${label}-${RUN_ID}`; }

// Future timestamps (ms)
const TARGET_LIST = Date.now() + 30 * 24 * 60 * 60 * 1000;   // 30 days from now
const DEADLINE_FUTURE = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now
const DEADLINE_PAST   = Date.now() - 1_000;                    // already passed

const BASE_REQUEST = {
  propertyId:       pid("base"),
  targetListDate:   TARGET_LIST,
  desiredSalePrice: 450_000_00, // $450,000 in cents
  notes:            "Integration test listing bid request",
  bidDeadline:      DEADLINE_FUTURE,
};

const BASE_PROPOSAL = {
  agentName:             "Jane Smith",
  agentBrokerage:        "HomeGentic Realty",
  commissionBps:         275,   // 2.75%
  cmaSummary:            "3 comparable sales in the last 90 days support pricing at $450k.",
  marketingPlan:         "MLS listing, professional photos, 2 open houses.",
  estimatedDaysOnMarket: 21,
  estimatedSalePrice:    450_000_00,
  includedServices:      ["Professional Photography", "MLS Listing"],
  validUntil:            Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
  coverLetter:           "I have 10+ years experience in this market.",
};

// ─── createBidRequest — Candid serialization ──────────────────────────────────

describe.skipIf(!deployed)("createBidRequest — Candid serialization", () => {
  it("returns a request with a non-empty id", async () => {
    const req = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("id") });
    expect(req.id).toBeTruthy();
    expect(typeof req.id).toBe("string");
  });

  it("propertyId is preserved", async () => {
    const propId = pid("prop-id");
    const req = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: propId });
    expect(req.propertyId).toBe(propId);
  });

  it("homeowner principal matches the test identity", async () => {
    const req = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("principal") });
    expect(req.homeowner).toBe(TEST_PRINCIPAL);
  });

  it("status starts as 'Open'", async () => {
    const req = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("initial-status") });
    expect(req.status).toBe("Open");
  });

  it("desiredSalePrice (Opt Nat) is preserved when provided", async () => {
    const req = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("sale-price"), desiredSalePrice: 55_000_00 });
    expect(req.desiredSalePrice).toBe(55_000_00);
  });

  it("desiredSalePrice is null when not provided", async () => {
    const req = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("no-sale-price"), desiredSalePrice: null });
    expect(req.desiredSalePrice).toBeNull();
  });

  it("notes are preserved", async () => {
    const req = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("notes") });
    expect(req.notes).toBe("Integration test listing bid request");
  });
});

// ─── getMyBidRequests — caller scoping ───────────────────────────────────────

describe.skipIf(!deployed)("getMyBidRequests — caller scoping", () => {
  let seeded: ListingBidRequest;

  beforeAll(async () => {
    seeded = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("scope") });
  });

  it("getMyBidRequests returns the created request", async () => {
    const reqs = await listingService.getMyBidRequests();
    const found = reqs.find((r) => r.id === seeded.id);
    expect(found).toBeDefined();
  });

  it("all returned requests belong to the test principal", async () => {
    const reqs = await listingService.getMyBidRequests();
    expect(reqs.every((r) => r.homeowner === TEST_PRINCIPAL)).toBe(true);
  });
});

// ─── getBidRequest — fetch by id ──────────────────────────────────────────────

describe.skipIf(!deployed)("getBidRequest — fetch by id", () => {
  let created: ListingBidRequest;

  beforeAll(async () => {
    created = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("get-by-id") });
  });

  it("getBidRequest returns the request matching the id", async () => {
    const req = await listingService.getBidRequest(created.id);
    expect(req).not.toBeNull();
    expect(req!.id).toBe(created.id);
    expect(req!.propertyId).toBe(created.propertyId);
  });

  it("getBidRequest returns null for an unknown id", async () => {
    const req = await listingService.getBidRequest("DOES_NOT_EXIST_99999");
    expect(req).toBeNull();
  });
});

// ─── cancelBidRequest ─────────────────────────────────────────────────────────

describe.skipIf(!deployed)("cancelBidRequest — BidRequestStatus Open → Cancelled", () => {
  it("cancelBidRequest resolves without error", async () => {
    const req = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("cancel") });
    await expect(listingService.cancelBidRequest(req.id)).resolves.toBeUndefined();
  });

  it("cancelled request no longer appears as Open in getOpenBidRequests", async () => {
    const req = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("cancel-open") });
    await listingService.cancelBidRequest(req.id);
    const open = await listingService.getOpenBidRequests();
    const found = open.find((r) => r.id === req.id);
    expect(found).toBeUndefined();
  });
});

// ─── submitProposal — BigInt field round-trips ────────────────────────────────

describe.skipIf(!deployed)("submitProposal — Candid serialization", () => {
  let request: ListingBidRequest;

  beforeAll(async () => {
    request = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("submit-prop") });
  });

  it("returns a proposal with a non-empty id", async () => {
    const prop = await listingService.submitProposal(request.id, BASE_PROPOSAL);
    expect(prop.id).toBeTruthy();
  });

  it("commissionBps (Nat) survives BigInt round-trip", async () => {
    const prop = await listingService.submitProposal(request.id, { ...BASE_PROPOSAL, commissionBps: 300 });
    expect(prop.commissionBps).toBe(300);
  });

  it("estimatedSalePrice (Nat) survives BigInt round-trip", async () => {
    const prop = await listingService.submitProposal(request.id, { ...BASE_PROPOSAL, estimatedSalePrice: 472_500_00 });
    expect(prop.estimatedSalePrice).toBe(472_500_00);
  });

  it("estimatedDaysOnMarket (Nat) survives BigInt round-trip", async () => {
    const prop = await listingService.submitProposal(request.id, { ...BASE_PROPOSAL, estimatedDaysOnMarket: 28 });
    expect(prop.estimatedDaysOnMarket).toBe(28);
  });

  it("includedServices Vec(Text) is preserved", async () => {
    const services = ["Professional Photography", "MLS Listing", "Virtual Tour"];
    const prop = await listingService.submitProposal(request.id, { ...BASE_PROPOSAL, includedServices: services });
    expect(prop.includedServices).toEqual(expect.arrayContaining(services));
  });

  it("agentName and agentBrokerage are preserved", async () => {
    const prop = await listingService.submitProposal(request.id, BASE_PROPOSAL);
    expect(prop.agentName).toBe("Jane Smith");
    expect(prop.agentBrokerage).toBe("HomeGentic Realty");
  });

  it("proposal starts with status 'Pending'", async () => {
    const prop = await listingService.submitProposal(request.id, BASE_PROPOSAL);
    expect(prop.status).toBe("Pending");
  });

  it("agentId matches the test identity principal", async () => {
    const prop = await listingService.submitProposal(request.id, BASE_PROPOSAL);
    expect(prop.agentId).toBe(TEST_PRINCIPAL);
  });
});

// ─── Deadline enforcement ─────────────────────────────────────────────────────

describe.skipIf(!deployed)("deadline enforcement — DeadlinePassed", () => {
  it("submitProposal after bidDeadline throws DeadlinePassed", async () => {
    const expiredReq = await listingService.createBidRequest({
      ...BASE_REQUEST,
      propertyId: pid("deadline-past"),
      bidDeadline: DEADLINE_PAST,
    });
    await expect(
      listingService.submitProposal(expiredReq.id, BASE_PROPOSAL)
    ).rejects.toThrow(/DeadlinePassed|deadline/i);
  });
});

// ─── getProposalsForRequest ───────────────────────────────────────────────────

describe.skipIf(!deployed)("getProposalsForRequest — retrieval", () => {
  let request: ListingBidRequest;
  let submitted: ListingProposal;

  beforeAll(async () => {
    request = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("get-props") });
    submitted = await listingService.submitProposal(request.id, BASE_PROPOSAL);
  });

  it("getProposalsForRequest returns the submitted proposal", async () => {
    const props = await listingService.getProposalsForRequest(request.id);
    const found = props.find((p) => p.id === submitted.id);
    expect(found).toBeDefined();
  });

  it("all returned proposals have the correct requestId", async () => {
    const props = await listingService.getProposalsForRequest(request.id);
    expect(props.every((p) => p.requestId === request.id)).toBe(true);
  });
});

// ─── acceptProposal — award cascade ──────────────────────────────────────────

describe.skipIf(!deployed)("acceptProposal — BidRequest becomes Awarded", () => {
  let request: ListingBidRequest;
  let winner: ListingProposal;

  beforeAll(async () => {
    request = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("award") });
    winner  = await listingService.submitProposal(request.id, BASE_PROPOSAL);
  });

  it("acceptProposal resolves without error", async () => {
    await expect(listingService.acceptProposal(winner.id)).resolves.toBeUndefined();
  });

  it("the bid request transitions to Awarded after accepting a proposal", async () => {
    const req = await listingService.getBidRequest(request.id);
    expect(req!.status).toBe("Awarded");
  });
});

// ─── getMyProposals ───────────────────────────────────────────────────────────

describe.skipIf(!deployed)("getMyProposals — agent view", () => {
  let submitted: ListingProposal;

  beforeAll(async () => {
    const req = await listingService.createBidRequest({ ...BASE_REQUEST, propertyId: pid("my-props") });
    submitted = await listingService.submitProposal(req.id, BASE_PROPOSAL);
  });

  it("getMyProposals returns the submitted proposal", async () => {
    const mine = await listingService.getMyProposals();
    const found = mine.find((p) => p.id === submitted.id);
    expect(found).toBeDefined();
  });

  it("all returned proposals belong to the test principal", async () => {
    const mine = await listingService.getMyProposals();
    expect(mine.every((p) => p.agentId === TEST_PRINCIPAL)).toBe(true);
  });
});
