/**
 * Offline Write Queue (Issue #53)
 *
 * Persists write operations when the device is offline and replays them on
 * reconnect. Designed with injectable storage/network adapters so the core
 * logic is testable without AsyncStorage or NetInfo being installed.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   import { offlineQueue } from "./offlineQueue";
 *
 *   // Enqueue a write (fire-and-forget from service layer):
 *   await offlineQueue.enqueue({ type: "addBill", payload: { ... } });
 *
 *   // Register the handler once (e.g., in App.tsx):
 *   offlineQueue.registerHandler(async (op) => {
 *     if (op.type === "addBill") await billService.addBill(op.payload as any);
 *   });
 *
 * ── Retry schedule ───────────────────────────────────────────────────────────
 *   Attempt 0 → wait 5 s
 *   Attempt 1 → wait 30 s
 *   Attempt 2 → wait 2 min
 *   Attempt 3 → wait 10 min
 *   Attempt 4+ → mark as "failed" (manual retry or discard)
 *   Items older than 24 h are silently dropped on flush.
 */

export const BACKOFF_SCHEDULE_MS = [5_000, 30_000, 120_000, 600_000] as const;
const MAX_AGE_MS     = 24 * 60 * 60 * 1_000;
const STORAGE_KEY    = "homegentic_offline_queue";

// ─── Public types ─────────────────────────────────────────────────────────────

export type OperationType = "addBill" | "createJob" | "uploadPhoto";

export interface QueuedOperation {
  id:          string;
  type:        OperationType;
  payload:     unknown;
  enqueuedAt:  number;   // Date.now() ms
  retryCount:  number;
  nextRetryAt: number;   // 0 = eligible immediately
  status:      "pending" | "failed";
  failReason?: string;
}

export interface EnqueueInput {
  type:    OperationType;
  payload: unknown;
}

export type OperationHandler = (op: QueuedOperation) => Promise<void>;

// ─── Adapter interfaces ───────────────────────────────────────────────────────

export interface StorageAdapter {
  getItem(key: string):                    Promise<string | null>;
  setItem(key: string, value: string):     Promise<void>;
  removeItem(key: string):                 Promise<void>;
}

export interface NetworkAdapter {
  isConnected():                                            Promise<boolean>;
  onConnectivityChange(handler: (connected: boolean) => void): () => void;
}

// ─── Queue factory ────────────────────────────────────────────────────────────

export function createOfflineQueue(
  storage: StorageAdapter,
  network: NetworkAdapter,
  defaultHandler?: OperationHandler,
) {
  let _handler: OperationHandler | undefined = defaultHandler;

  // ── Storage helpers ─────────────────────────────────────────────────────────

  async function load(): Promise<QueuedOperation[]> {
    try {
      const raw = await storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as QueuedOperation[];
    } catch {
      return [];
    }
  }

  async function save(items: QueuedOperation[]): Promise<void> {
    if (items.length === 0) {
      await storage.removeItem(STORAGE_KEY);
    } else {
      await storage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async function enqueue(input: EnqueueInput): Promise<QueuedOperation> {
    const id = `oq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const op: QueuedOperation = {
      id,
      type:        input.type,
      payload:     input.payload,
      enqueuedAt:  Date.now(),
      retryCount:  0,
      nextRetryAt: 0,
      status:      "pending",
    };
    const items = await load();
    items.push(op);
    await save(items);
    return op;
  }

  async function getQueue(): Promise<QueuedOperation[]> {
    return load();
  }

  async function flush(handler?: OperationHandler): Promise<void> {
    const h = handler ?? _handler;
    if (!h) return;

    const connected = await network.isConnected();
    if (!connected) return;

    const now = Date.now();
    let items = await load();

    // Drop expired items silently
    items = items.filter((op) => now - op.enqueuedAt < MAX_AGE_MS);

    const updated: QueuedOperation[] = [];

    for (const op of items) {
      // Skip items in backoff window
      if (op.nextRetryAt > now) {
        updated.push(op);
        continue;
      }
      // Skip already-failed items (manual retry required)
      if (op.status === "failed") {
        updated.push(op);
        continue;
      }

      try {
        await h(op);
        // Success — drop from queue
      } catch (err: unknown) {
        const nextRetryIndex = op.retryCount; // 0-based index into BACKOFF_SCHEDULE_MS
        if (nextRetryIndex >= BACKOFF_SCHEDULE_MS.length) {
          updated.push({
            ...op,
            status:     "failed",
            failReason: err instanceof Error ? err.message : String(err),
          });
        } else {
          updated.push({
            ...op,
            retryCount:  op.retryCount + 1,
            nextRetryAt: now + BACKOFF_SCHEDULE_MS[nextRetryIndex],
            failReason:  err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    await save(updated);
  }

  async function discard(id: string): Promise<void> {
    const items = await load();
    await save(items.filter((op) => op.id !== id));
  }

  async function retry(id: string): Promise<void> {
    const items = await load();
    const updated = items.map((op) =>
      op.id === id ? { ...op, nextRetryAt: 0, status: "pending" as const, failReason: undefined } : op
    );
    await save(updated);
  }

  function registerHandler(h: OperationHandler): void {
    _handler = h;
  }

  // Listen for reconnect and auto-flush
  network.onConnectivityChange((connected) => {
    if (connected && _handler) {
      flush().catch(() => {});
    }
  });

  return { enqueue, getQueue, flush, discard, retry, registerHandler };
}

// ─── Default singleton (AsyncStorage + NetInfo when available) ────────────────

/**
 * Minimal in-memory fallback used in environments where AsyncStorage / NetInfo
 * are not installed (e.g. Expo Go development or unit tests that import this
 * module without mocking it).  Replace with real adapters in production:
 *
 *   import AsyncStorage from "@react-native-async-storage/async-storage";
 *   import NetInfo from "@react-native-community/netinfo";
 *
 *   const storage: StorageAdapter = AsyncStorage;
 *   const network: NetworkAdapter = {
 *     isConnected: async () => (await NetInfo.fetch()).isConnected ?? true,
 *     onConnectivityChange: (h) => NetInfo.addEventListener((s) => h(s.isConnected ?? true)),
 *   };
 *   export const offlineQueue = createOfflineQueue(storage, network);
 */
const _memStore: Record<string, string> = {};
const _fallbackStorage: StorageAdapter = {
  getItem:    async (k) => _memStore[k] ?? null,
  setItem:    async (k, v) => { _memStore[k] = v; },
  removeItem: async (k) => { delete _memStore[k]; },
};
const _fallbackNetwork: NetworkAdapter = {
  isConnected: async () => true,
  onConnectivityChange: () => () => {},
};

export const offlineQueue = createOfflineQueue(_fallbackStorage, _fallbackNetwork);
