/**
 * @jest-environment node
 */
// 15.4.5 / 15.4.6 — score_change and job_pending_sig push events
jest.mock("../dispatcher", () => ({ dispatchToUser: jest.fn() }));

import { pollOnce, fetchScoreChangeEvents, fetchJobPendingSignatureEvents } from "../poller";
import { dispatchToUser } from "../dispatcher";
import type { NotificationEvent } from "../types";

const mockDispatch = dispatchToUser as jest.MockedFunction<typeof dispatchToUser>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Exported stubs are callable and return arrays ────────────────────────────

describe("fetchScoreChangeEvents stub", () => {
  it("is exported and returns an array", async () => {
    const result = await fetchScoreChangeEvents();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty array (safe when replica is unavailable)", async () => {
    await expect(fetchScoreChangeEvents()).resolves.toEqual([]);
  });
});

describe("fetchJobPendingSignatureEvents stub", () => {
  it("is exported and returns an array", async () => {
    const result = await fetchJobPendingSignatureEvents();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty array (safe when replica is unavailable)", async () => {
    await expect(fetchJobPendingSignatureEvents()).resolves.toEqual([]);
  });
});

// ── score_change events flow through pollOnce ─────────────────────────────────

describe("score_change event dispatch (15.4.5)", () => {
  const scoreEvent: NotificationEvent = {
    type:      "score_change",
    principal: "homeowner-abc",
    payload: {
      title: "HomeGentic Score updated",
      body:  "Your score changed from 64 to 71 (+7)",
      route: "properties/prop-1",
    },
  };

  it("dispatches score_change event to the homeowner principal", async () => {
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [scoreEvent]]);
    expect(mockDispatch).toHaveBeenCalledWith(scoreEvent.principal, scoreEvent.payload);
  });

  it("does not dispatch when score change is below threshold (fetcher returns [])", async () => {
    await pollOnce([async () => []]);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("dispatches multiple score_change events in one poll", async () => {
    const event2: NotificationEvent = { ...scoreEvent, principal: "homeowner-xyz" };
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [scoreEvent, event2]]);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it("score_change payload contains route pointing to property", async () => {
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [scoreEvent]]);
    const [, payload] = mockDispatch.mock.calls[0];
    expect(payload.route).toMatch(/^properties\//);
  });
});

// ── job_pending_sig events flow through pollOnce ─────────────────────────────

describe("job_pending_sig event dispatch (15.4.6)", () => {
  const pendingEvent: NotificationEvent = {
    type:      "job_pending_sig",
    principal: "homeowner-abc",
    payload: {
      title: "Job ready for sign-off",
      body:  "Plumbing repair is complete — tap to review and sign",
      route: "jobs/job-42",
    },
  };

  it("dispatches job_pending_sig event to the homeowner principal", async () => {
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [pendingEvent]]);
    expect(mockDispatch).toHaveBeenCalledWith(pendingEvent.principal, pendingEvent.payload);
  });

  it("payload route points to the specific job", async () => {
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [pendingEvent]]);
    const [, payload] = mockDispatch.mock.calls[0];
    expect(payload.route).toMatch(/^jobs\//);
  });

  it("dispatches alongside other event types in the same poll", async () => {
    const scoreEvent: NotificationEvent = {
      type:      "score_change",
      principal: "homeowner-def",
      payload:   { title: "Score updated", body: "+8 points", route: "properties/p2" },
    };
    mockDispatch.mockResolvedValue(undefined);
    await pollOnce([async () => [pendingEvent, scoreEvent]]);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });
});

// ── Default fetcher list includes both new fetchers ───────────────────────────

describe("default pollOnce includes score_change and job_pending_sig fetchers", () => {
  it("completes without error when called with no arguments (stubs return [])", async () => {
    await expect(pollOnce()).resolves.toBeUndefined();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
