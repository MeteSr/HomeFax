/**
 * errorReporting — sends frontend error events to the voice agent relay for
 * structured logging and monitoring.
 *
 * Fire-and-forget: network failures are silently swallowed so the reporting
 * call never interferes with the user's recovery flow.
 *
 * Only active in production (import.meta.env.PROD). In dev the error is
 * already visible in the console via ErrorBoundary.
 */

const AGENT_URL =
  typeof import.meta !== "undefined"
    ? (import.meta.env?.VITE_VOICE_AGENT_URL ?? "http://localhost:3001")
    : "http://localhost:3001";

export interface FrontendError {
  message:        string;
  componentStack: string | null;
  url:            string;
  ts:             string;
}

/**
 * Report a caught render error to the voice agent relay.
 * Must never throw — call sites do not wrap this in try/catch.
 */
export async function reportFrontendError(
  error: Error,
  componentStack: string | null,
): Promise<void> {
  if (!import.meta.env.PROD) return;

  const payload: FrontendError = {
    message:        error.message,
    componentStack: componentStack ?? null,
    url:            window.location.href,
    ts:             new Date().toISOString(),
  };

  try {
    const { voiceAgentHeaders } = await import("./voiceAgentHeaders");
    await fetch(`${AGENT_URL}/api/errors`, {
      method:  "POST",
      headers: voiceAgentHeaders(),
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(4_000),
      // keepalive so the request outlives a page unload
      keepalive: true,
    });
  } catch {
    // Intentionally silent — error reporting must never cause secondary errors.
  }
}
