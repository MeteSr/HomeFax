/**
 * Shared helper — builds the fetch headers required by the voice agent relay.
 *
 * Adds:
 *   x-api-key       — shared secret (VITE_VOICE_AGENT_API_KEY), when set
 *   x-icp-principal — caller's ICP principal for structured log attribution,
 *                     when the user is authenticated
 *   x-trace-id      — session-scoped UUID that correlates all requests and
 *                     error reports from this browser session in the log stream
 */

import { useAuthStore } from "@/store/authStore";

const VOICE_API_KEY =
  (import.meta as any).env?.VITE_VOICE_AGENT_API_KEY ?? "";

const TRACE_KEY = "hg-trace";

/** Returns a stable UUID for this browser session (persists across page reloads). */
function getTraceId(): string {
  try {
    const existing = sessionStorage.getItem(TRACE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(TRACE_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID(); // sessionStorage blocked (private mode, etc.)
  }
}

export function voiceAgentHeaders(): Record<string, string> {
  const { principal } = useAuthStore.getState();
  return {
    "Content-Type":    "application/json",
    "x-trace-id":      getTraceId(),
    ...(VOICE_API_KEY ? { "x-api-key":      VOICE_API_KEY } : {}),
    ...(principal     ? { "x-icp-principal": principal    } : {}),
  };
}
