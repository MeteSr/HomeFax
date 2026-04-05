/**
 * @jest-environment node
 */
// 15.5.4 / 15.5.5 — new_lead (contractor) and bid outcome push events
jest.mock("../dispatcher", () => ({ dispatchToUser: jest.fn() }));

import { pollOnce, fetchNewLeadInTradesEvents, fetchBidOutcomeEvents } from "../poller";
import { dispatchToUser } from "../dispatcher";
import type { NotificationEvent } from "../types";

const mockDispatch = dispatchToUser as jest.MockedFunction<typeof dispatchToUser>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Exported stubs are callable and return arrays ────────────────────────────

describe("fetchNewLeadInTradesEvents stub (15.5.4)", () => {
  it("is exported and callable", async () => {
    const result = await fetchNewLeadInTradesEvents();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty array when replica is unavailable", async () => {
    await expect(fetchNewLeadInTradesEvents()).resolves.toEqual([]);
  });
});

describe("fetchBidOutcomeEvents stub (15.5.5)", () => {
  it("is exported and callable", async () => {
    const result = await fetchBidOutcomeEvents();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty array when replica is unavailable", async () => {
    await expect(fetchBidOutcomeEvents()).resolves.toEqual([]);
  });
});

// ── new_lead events dispatch to contractor principal (15.5.4) ─────────────────

describe("new_lead event dispatch (15.5.4)", () => {
  const leadEvent: NotificationEvent = {
    type:      "new_lead",
    principal: "contractor-xyz",
    payload: {
      title: "New quote request",
      body:  "Plumbing job in 90210 — tap to view",
      route: "leads/req-55",
    },
  };

  it("dispatches new_lead to the contractor principal", async () => {
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [leadEvent]]);
    expect(mockDispatch).toHaveBeenCalledWith(leadEvent.principal, leadEvent.payload);
  });

  it("payload route points to the lead request", async () => {
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [leadEvent]]);
    const [, payload] = mockDispatch.mock.calls[0];
    expect(payload.route).toMatch(/^leads\//);
  });

  it("dispatches multiple leads to different contractors in one poll", async () => {
    const lead2: NotificationEvent = { ...leadEvent, principal: "contractor-aaa" };
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [leadEvent, lead2]]);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it("no dispatch when no matching leads (fetcher returns [])", async () => {
    await pollOnce([async () => []]);
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

// ── bid outcome events dispatch to contractor principal (15.5.5) ──────────────

describe("bid_accepted event dispatch (15.5.5)", () => {
  const acceptedEvent: NotificationEvent = {
    type:      "bid_accepted",
    principal: "contractor-xyz",
    payload: {
      title: "Bid accepted",
      body:  "Your bid for Roof repair was accepted",
      route: "jobs/job-77",
    },
  };

  it("dispatches bid_accepted to the contractor", async () => {
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [acceptedEvent]]);
    expect(mockDispatch).toHaveBeenCalledWith(acceptedEvent.principal, acceptedEvent.payload);
  });

  it("payload route points to the job", async () => {
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [acceptedEvent]]);
    const [, payload] = mockDispatch.mock.calls[0];
    expect(payload.route).toMatch(/^jobs\//);
  });
});

describe("bid_declined event dispatch (15.5.5)", () => {
  const declinedEvent: NotificationEvent = {
    type:      "bid_declined",
    principal: "contractor-xyz",
    payload: {
      title: "Bid not selected",
      body:  "The homeowner chose another contractor for this job",
      route: "leads/req-55",
    },
  };

  it("dispatches bid_declined to the contractor", async () => {
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [declinedEvent]]);
    expect(mockDispatch).toHaveBeenCalledWith(declinedEvent.principal, declinedEvent.payload);
  });

  it("dispatches accepted and declined outcomes in the same poll", async () => {
    const accepted: NotificationEvent = {
      type:      "bid_accepted",
      principal: "contractor-aaa",
      payload:   { title: "Bid accepted", body: "You got the job", route: "jobs/j1" },
    };
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [declinedEvent, accepted]]);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });
});

// ── Default pollOnce includes both new fetchers ───────────────────────────────

describe("default pollOnce includes 15.5.4 and 15.5.5 fetchers", () => {
  it("completes without error when no arguments (stubs return [])", async () => {
    await expect(pollOnce()).resolves.toBeUndefined();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
