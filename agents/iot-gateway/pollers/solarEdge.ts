/**
 * SolarEdge cloud REST polling script.
 *
 * SolarEdge has no local API — all data is retrieved from their cloud.
 * Rate limit: 300 requests/account/day → poll every 15 min gives ~96/day per site.
 *
 * Required env vars (see .env.example):
 *   SOLAREDGE_API_KEY   — from monitoring.solaredge.com → Admin → API Access
 *   SOLAREDGE_SITE_ID   — numeric site ID visible in the monitoring portal URL
 */

import { handleSolarEdgeEvent } from "../handlers";
import { recordSensorEvent } from "../icp";
import type { SolarEdgeEvent } from "../types";

const SOLAREDGE_API = "https://monitoringapi.solaredge.com";

// ── Config ────────────────────────────────────────────────────────────────────

export interface SolarEdgeConfig {
  apiKey: string;
  siteId: string;
}

export function loadConfig(): SolarEdgeConfig | null {
  const apiKey = process.env.SOLAREDGE_API_KEY;
  const siteId = process.env.SOLAREDGE_SITE_ID;
  if (!apiKey || !siteId) return null;
  return { apiKey, siteId };
}

// ── API response shapes ───────────────────────────────────────────────────────

interface SolarEdgeOverview {
  overview: {
    currentPower: { power: number };
  };
}

interface SolarEdgeAlertsResponse {
  alerts?: Array<{
    severity: string; // "CRITICAL" | "WARNING" | "INFO"
    type:     string;
    message?: string;
  }>;
}

// ── Poll ──────────────────────────────────────────────────────────────────────

function isDaylight(): boolean {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19;
}

export async function pollOnce(config: SolarEdgeConfig): Promise<void> {
  const base   = `${SOLAREDGE_API}/site/${config.siteId}`;
  const apiKey = `api_key=${encodeURIComponent(config.apiKey)}`;

  const [overviewResp, alertsResp] = await Promise.all([
    fetch(`${base}/overview.json?${apiKey}`, { signal: AbortSignal.timeout(10_000) }),
    fetch(`${base}/alerts.json?${apiKey}`,   { signal: AbortSignal.timeout(10_000) }),
  ]);

  if (!overviewResp.ok) {
    console.error(`[solaredge-poller] overview fetch failed (${overviewResp.status}): ${await overviewResp.text()}`);
    return;
  }

  const overview = await overviewResp.json() as SolarEdgeOverview;
  const currentPowerW = overview.overview?.currentPower?.power ?? 0;

  let hasCriticalAlert = false;
  if (alertsResp.ok) {
    const alertsData = await alertsResp.json() as SolarEdgeAlertsResponse;
    hasCriticalAlert = (alertsData.alerts ?? []).some(
      (a) => a.severity?.toUpperCase() === "CRITICAL"
    );
  }

  const event: SolarEdgeEvent = {
    siteId:           config.siteId,
    currentPowerW,
    hasCriticalAlert,
    isDaylight:       isDaylight(),
  };

  const raw     = JSON.stringify({ overview: overview.overview, hasCriticalAlert });
  const reading = handleSolarEdgeEvent(event, raw);
  if (!reading) return;

  const eventName = Object.keys(reading.eventType)[0];
  console.log(`[solaredge-poller] ${eventName} siteId=${config.siteId} power=${currentPowerW}W`);

  const result = await recordSensorEvent(reading);
  if (result.success) {
    console.log(
      `[solaredge-poller] recorded eventId=${result.eventId}` +
      (result.jobId ? ` jobId=${result.jobId}` : "")
    );
  } else {
    console.error(`[solaredge-poller] canister error: ${result.error}`);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Starts the SolarEdge polling loop. Returns a stop function.
 * No-ops when SOLAREDGE_API_KEY or SOLAREDGE_SITE_ID are absent.
 * Polls every 15 min by default to stay comfortably under the 300 req/day limit.
 */
export function startSolarEdgePoller(intervalMs = 15 * 60 * 1000): () => void {
  const config = loadConfig();
  if (!config) {
    console.warn(
      "[solaredge-poller] SOLAREDGE_API_KEY or SOLAREDGE_SITE_ID not set — poller disabled"
    );
    return () => {};
  }

  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function tick(): Promise<void> {
    if (stopped) return;
    try {
      await pollOnce(config);
    } catch (err) {
      console.error("[solaredge-poller] tick error:", err);
    } finally {
      if (!stopped) {
        timer = setTimeout(tick, intervalMs);
      }
    }
  }

  console.log(`[solaredge-poller] starting — siteId=${config.siteId} interval=${intervalMs / 1000}s`);
  tick();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    console.log("[solaredge-poller] stopped");
  };
}
