/**
 * TDD — Issue #53: Offline write queue
 *
 * Tests cover:
 *  - enqueue: persists operations with unique IDs, retry count 0, status "pending"
 *  - getQueue: returns current in-memory queue
 *  - flush: skips when offline; drains successfully on reconnect; removes completed items
 *  - flush: leaves failed items with incremented retryCount and updated nextRetryAt
 *  - flush: marks items as "failed" and stops retrying after 24 h
 *  - flush: skips items whose nextRetryAt is in the future (backoff)
 *  - onConnectivityChange: calls flush when network comes back online
 *  - discard: removes a specific item by ID
 *  - retry: resets nextRetryAt to 0 so item is eligible on next flush
 */

import {
  createOfflineQueue,
  type QueuedOperation,
  type StorageAdapter,
  type NetworkAdapter,
  BACKOFF_SCHEDULE_MS,
} from "../../services/offlineQueue";

// ─── In-memory storage adapter ────────────────────────────────────────────────

function makeMemoryStorage(): StorageAdapter {
  const store: Record<string, string> = {};
  return {
    getItem:    async (k) => store[k] ?? null,
    setItem:    async (k, v) => { store[k] = v; },
    removeItem: async (k) => { delete store[k]; },
  };
}

// ─── Controllable network adapter ─────────────────────────────────────────────

function makeNetworkAdapter(initiallyConnected = true): NetworkAdapter & { setConnected(v: boolean): void } {
  let connected = initiallyConnected;
  const handlers: Array<(c: boolean) => void> = [];
  return {
    isConnected: async () => connected,
    onConnectivityChange(handler) {
      handlers.push(handler);
      return () => { const i = handlers.indexOf(handler); if (i !== -1) handlers.splice(i, 1); };
    },
    setConnected(v: boolean) {
      connected = v;
      handlers.forEach((h) => h(v));
    },
  };
}

// ─── enqueue ──────────────────────────────────────────────────────────────────

describe("offlineQueue — enqueue", () => {
  it("adds an item with a unique ID, retryCount 0, status pending", async () => {
    const q = createOfflineQueue(makeMemoryStorage(), makeNetworkAdapter());
    await q.enqueue({ type: "addBill", payload: { propertyId: "p1", amountCents: 100 } });
    const items = await q.getQueue();
    expect(items).toHaveLength(1);
    expect(items[0].id).toMatch(/^oq_/);
    expect(items[0].retryCount).toBe(0);
    expect(items[0].status).toBe("pending");
    expect(items[0].type).toBe("addBill");
  });

  it("generates unique IDs for multiple operations", async () => {
    const q = createOfflineQueue(makeMemoryStorage(), makeNetworkAdapter());
    await q.enqueue({ type: "addBill",    payload: {} });
    await q.enqueue({ type: "createJob",  payload: {} });
    await q.enqueue({ type: "uploadPhoto", payload: {} });
    const items = await q.getQueue();
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("persists to storage so items survive across queue instances", async () => {
    const storage = makeMemoryStorage();
    const q1 = createOfflineQueue(storage, makeNetworkAdapter());
    await q1.enqueue({ type: "createJob", payload: { propertyId: "p2" } });

    // New instance, same storage
    const q2 = createOfflineQueue(storage, makeNetworkAdapter());
    const items = await q2.getQueue();
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("createJob");
  });
});

// ─── flush — offline ──────────────────────────────────────────────────────────

describe("offlineQueue — flush while offline", () => {
  it("does not call the handler when device is offline", async () => {
    const network = makeNetworkAdapter(false);
    const q = createOfflineQueue(makeMemoryStorage(), network);
    await q.enqueue({ type: "addBill", payload: {} });
    const handler = jest.fn().mockResolvedValue(undefined);
    await q.flush(handler);
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── flush — online, success ──────────────────────────────────────────────────

describe("offlineQueue — flush while online, operations succeed", () => {
  it("calls the handler for each pending item and removes them", async () => {
    const q = createOfflineQueue(makeMemoryStorage(), makeNetworkAdapter(true));
    await q.enqueue({ type: "addBill",   payload: { a: 1 } });
    await q.enqueue({ type: "createJob", payload: { b: 2 } });
    const handler = jest.fn().mockResolvedValue(undefined);
    await q.flush(handler);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(await q.getQueue()).toHaveLength(0);
  });

  it("passes the full operation object to the handler", async () => {
    const q = createOfflineQueue(makeMemoryStorage(), makeNetworkAdapter(true));
    await q.enqueue({ type: "uploadPhoto", payload: { uri: "file://x.jpg" } });
    const handler = jest.fn().mockResolvedValue(undefined);
    await q.flush(handler);
    const arg: QueuedOperation = handler.mock.calls[0][0];
    expect(arg.type).toBe("uploadPhoto");
    expect((arg.payload as any).uri).toBe("file://x.jpg");
  });
});

// ─── flush — online, failure ──────────────────────────────────────────────────

describe("offlineQueue — flush while online, operation fails", () => {
  it("increments retryCount and sets nextRetryAt on failure", async () => {
    const q = createOfflineQueue(makeMemoryStorage(), makeNetworkAdapter(true));
    await q.enqueue({ type: "addBill", payload: {} });
    const handler = jest.fn().mockRejectedValue(new Error("network error"));
    await q.flush(handler);
    const items = await q.getQueue();
    expect(items).toHaveLength(1);
    expect(items[0].retryCount).toBe(1);
    expect(items[0].nextRetryAt).toBeGreaterThan(Date.now());
  });

  it("uses the correct backoff interval for each retry attempt", async () => {
    const q = createOfflineQueue(makeMemoryStorage(), makeNetworkAdapter(true));
    await q.enqueue({ type: "addBill", payload: {} });
    const handler = jest.fn().mockRejectedValue(new Error("fail"));

    for (let attempt = 0; attempt < BACKOFF_SCHEDULE_MS.length; attempt++) {
      // Reset nextRetryAt to 0 so item is eligible
      await q.retry((await q.getQueue())[0].id);
      await q.flush(handler);
      const [item] = await q.getQueue();
      const expectedDelay = BACKOFF_SCHEDULE_MS[attempt];
      expect(item.nextRetryAt).toBeGreaterThanOrEqual(Date.now() + expectedDelay - 50);
    }
  });

  it("marks item as 'failed' after all backoff slots are exhausted", async () => {
    const q = createOfflineQueue(makeMemoryStorage(), makeNetworkAdapter(true));
    await q.enqueue({ type: "addBill", payload: {} });
    const handler = jest.fn().mockRejectedValue(new Error("fail"));

    // Exhaust all retries
    for (let i = 0; i <= BACKOFF_SCHEDULE_MS.length; i++) {
      await q.retry((await q.getQueue())[0].id);
      await q.flush(handler);
    }
    const [item] = await q.getQueue();
    expect(item.status).toBe("failed");
  });

  it("skips items older than 24 h", async () => {
    const q = createOfflineQueue(makeMemoryStorage(), makeNetworkAdapter(true));
    await q.enqueue({ type: "addBill", payload: {} });
    // Manually age the item
    const items = await q.getQueue();
    const old: QueuedOperation = { ...items[0], enqueuedAt: Date.now() - 25 * 60 * 60 * 1000 };
    const storage = makeMemoryStorage();
    await storage.setItem("homegentic_offline_queue", JSON.stringify([old]));
    const q2 = createOfflineQueue(storage, makeNetworkAdapter(true));
    const handler = jest.fn().mockResolvedValue(undefined);
    await q2.flush(handler);
    expect(handler).not.toHaveBeenCalled();
    // Aged items are removed
    expect(await q2.getQueue()).toHaveLength(0);
  });

  it("skips items whose nextRetryAt is in the future", async () => {
    const q = createOfflineQueue(makeMemoryStorage(), makeNetworkAdapter(true));
    await q.enqueue({ type: "createJob", payload: {} });
    const handler = jest.fn().mockRejectedValue(new Error("fail"));
    // First attempt — fails, sets nextRetryAt to 5 s from now
    await q.flush(handler);
    handler.mockResolvedValue(undefined); // now succeeds
    // Second attempt without advancing time — should be skipped
    await q.flush(handler);
    expect(handler).toHaveBeenCalledTimes(1); // only the first failed call
  });
});

// ─── auto-flush on reconnect ──────────────────────────────────────────────────

describe("offlineQueue — auto-flush on reconnect", () => {
  it("calls flush automatically when network comes back online", async () => {
    const network = makeNetworkAdapter(false);
    const handler = jest.fn().mockResolvedValue(undefined);
    const q = createOfflineQueue(makeMemoryStorage(), network, handler);
    await q.enqueue({ type: "addBill", payload: {} });
    expect(handler).not.toHaveBeenCalled();
    network.setConnected(true);
    // Allow microtasks to drain
    await new Promise((r) => setTimeout(r, 0));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─── discard & retry ─────────────────────────────────────────────────────────

describe("offlineQueue — discard and retry", () => {
  it("discard removes the item from the queue", async () => {
    const q = createOfflineQueue(makeMemoryStorage(), makeNetworkAdapter());
    await q.enqueue({ type: "addBill", payload: {} });
    const [item] = await q.getQueue();
    await q.discard(item.id);
    expect(await q.getQueue()).toHaveLength(0);
  });

  it("retry resets nextRetryAt to 0 so item is eligible on next flush", async () => {
    const storage = makeMemoryStorage();
    const q = createOfflineQueue(storage, makeNetworkAdapter(true));
    await q.enqueue({ type: "addBill", payload: {} });
    // Fail once to set nextRetryAt
    const handler = jest.fn().mockRejectedValue(new Error("fail"));
    await q.flush(handler);
    const [failed] = await q.getQueue();
    expect(failed.nextRetryAt).toBeGreaterThan(0);

    await q.retry(failed.id);
    const [retried] = await q.getQueue();
    expect(retried.nextRetryAt).toBe(0);
    expect(retried.status).toBe("pending");
  });
});
