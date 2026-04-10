/**
 * useOfflineQueue
 *
 * React hook that exposes the offline queue state and actions.
 * Provides `isOnline`, `pendingCount`, `failedCount`, `items`,
 * `flush`, `retry`, `discard`.
 *
 * In production, swap the fallback adapters for real AsyncStorage /
 * NetInfo implementations (see offlineQueue.ts for instructions).
 */

import { useState, useEffect, useCallback } from "react";
import { offlineQueue, type QueuedOperation } from "../services/offlineQueue";

export function useOfflineQueue() {
  const [items,    setItems]    = useState<QueuedOperation[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const refresh = useCallback(async () => {
    setItems(await offlineQueue.getQueue());
  }, []);

  useEffect(() => {
    refresh();
    // Re-check queue on mount only (no NetInfo subscription in fallback mode)
  }, [refresh]);

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const failedCount  = items.filter((i) => i.status === "failed").length;

  async function retry(id: string) {
    await offlineQueue.retry(id);
    await refresh();
  }

  async function discard(id: string) {
    await offlineQueue.discard(id);
    await refresh();
  }

  return { items, isOnline, pendingCount, failedCount, retry, discard, refresh };
}
