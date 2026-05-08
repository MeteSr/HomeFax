/**
 * k6 load test — IoT Gateway (agents/iot-gateway, port 3002)
 *
 * Three scenarios (run sequentially, staggered via startTime):
 *   webhook_burst   — ramp 0→100 VU in 30 s, hold 1 min  (alert storm simulation)
 *   polling_steady  — 10 VU constant for 10 min             (Ecobee-style background polling)
 *   spike           — 0→500 VU in 10 s, hold 30 s          (worst-case flood alert broadcast)
 *
 * HMAC signature verification is skipped when *_WEBHOOK_SECRET env vars are
 * absent — no secrets needed for load testing.  Set SENSOR_CANISTER_ID to any
 * dummy value so the gateway exercises the full request path without reaching
 * the ICP network.
 *
 * Usage:
 *   cd agents/iot-gateway && SENSOR_CANISTER_ID=dummy npm run dev
 *   k6 run tests/k6/iot-gateway-load.js
 *   k6 run --env IOT_GATEWAY_URL=http://staging:3002 tests/k6/iot-gateway-load.js
 *
 * CI mode (set automatically by GitHub Actions):
 *   CI=true k6 run tests/k6/iot-gateway-load.js
 *   polling_steady duration is reduced to 2 min; spike is capped at 100 VU.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";

// ── Configuration ─────────────────────────────────────────────────────────────

const BASE_URL = __ENV.IOT_GATEWAY_URL || "http://localhost:3002";
const IS_CI    = !!__ENV.CI;

// ── Custom metrics ─────────────────────────────────────────────────────────────

const nestDuration    = new Trend("nest_duration_ms",    true);
const ecobeeDuration  = new Trend("ecobee_duration_ms",  true);
const moenFloDuration = new Trend("moen_flo_duration_ms", true);
const healthDuration  = new Trend("health_duration_ms",  true);
const rateLimited429  = new Counter("rate_limit_429");

// ── Scenarios ─────────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    // Many devices firing simultaneously — e.g. Nest motion events after a power restore.
    webhook_burst: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 100 },
        { duration: "1m",  target: 100 },
        { duration: "15s", target: 0   },
      ],
      gracefulRampDown: "15s",
      tags: { scenario: "webhook_burst" },
    },

    // Background polling from many properties.  Each VU represents one property
    // whose hub periodically pushes thermostat state to the gateway.
    polling_steady: {
      executor:  "constant-vus",
      vus:       10,
      duration:  IS_CI ? "2m" : "10m",
      startTime: "2m",
      tags: { scenario: "polling_steady" },
    },

    // Worst-case flood alert broadcast — all Moen Flo devices trigger LEAK simultaneously.
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: IS_CI ? 100 : 500 },
        { duration: "30s", target: IS_CI ? 100 : 500 },
        { duration: "10s", target: 0 },
      ],
      startTime: IS_CI ? "5m" : "13m",
      tags: { scenario: "spike" },
    },
  },

  thresholds: {
    // Overall request latency and failure rate
    "http_req_duration": ["p(95)<500"],
    "http_req_failed":   ["rate<0.01"],

    // Per-endpoint latency (webhook handlers must be fast — no blocking ICP calls)
    "nest_duration_ms":     ["p(95)<300"],
    "ecobee_duration_ms":   ["p(95)<300"],
    "moen_flo_duration_ms": ["p(95)<300"],
    "health_duration_ms":   ["p(99)<50"],

    // 429s are expected under spike (rate limiter working correctly).
    // No threshold here — the count is logged for review, not failed.
  },
};

// ── Minimal valid payloads ─────────────────────────────────────────────────────
//
// These mirror the shapes expected by handlers.ts.  Fields are present but
// minimal — the goal is exercising parsing, HMAC skip, and handler dispatch.

const JSON_HEADERS = { "Content-Type": "application/json" };

function nestPayload() {
  return JSON.stringify({
    eventId:  `load-${__VU}-${__ITER}`,
    timestamp: new Date().toISOString(),
    resourceUpdate: {
      name: `enterprises/load-test-project/devices/load-device-${__VU}`,
    },
    events: {
      "sdm.devices.events.DoorbellChime.Chime": {
        eventSessionId: `session-${__VU}`,
        eventId:        `load-${__VU}-${__ITER}`,
      },
    },
  });
}

function ecobeePayload() {
  return JSON.stringify({
    thermostatId: `load-thermo-${__VU}`,
    alerts: [
      {
        alertType: "hvacServiceAlert",
        severity:  "WARNING",
        message:   "Load test maintenance alert",
        value:     "1",
      },
    ],
    runtime: {
      actualTemperature: 720, // 72.0 °F stored in 10ths of a degree
      actualHumidity:    45,
    },
  });
}

function moenFloPayload() {
  return JSON.stringify({
    deviceId:  `load-device-${__VU}`,
    alertType: "LEAK",
    severity:  "CRITICAL",
    timestamp: new Date().toISOString(),
  });
}

// ── Virtual user logic ─────────────────────────────────────────────────────────

export default function () {
  const r = Math.random();

  // ~10 % of requests probe /health (baseline latency reference)
  if (r < 0.1) {
    const res = http.get(`${BASE_URL}/health`, { tags: { endpoint: "health" } });
    healthDuration.add(res.timings.duration);
    check(res, { "health 200": (r) => r.status === 200 });
    sleep(0.1);
    return;
  }

  // Remaining 90 %: distribute evenly across the three webhook endpoints
  let res;
  if (r < 0.4) {
    res = http.post(
      `${BASE_URL}/webhooks/nest`,
      nestPayload(),
      { headers: JSON_HEADERS, tags: { endpoint: "nest" } }
    );
    nestDuration.add(res.timings.duration);
  } else if (r < 0.7) {
    res = http.post(
      `${BASE_URL}/webhooks/ecobee`,
      ecobeePayload(),
      { headers: JSON_HEADERS, tags: { endpoint: "ecobee" } }
    );
    ecobeeDuration.add(res.timings.duration);
  } else {
    res = http.post(
      `${BASE_URL}/webhooks/moen-flo`,
      moenFloPayload(),
      { headers: JSON_HEADERS, tags: { endpoint: "moen-flo" } }
    );
    moenFloDuration.add(res.timings.duration);
  }

  if (res.status === 429) rateLimited429.add(1);

  check(res, {
    // 200 = processed; 202 = queued; 429 = rate limited (all correct gateway responses)
    "gateway accepted": (r) => r.status === 200 || r.status === 202 || r.status === 429,
  });

  // Small random think time — keeps request rate realistic and avoids thundering-herd
  // artefacts from all VUs firing simultaneously at scenario start.
  sleep(Math.random() * 0.3);
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

export function setup() {
  console.log("[iot-gateway-load] k6 IoT gateway load test");
  console.log(`  Target:  ${BASE_URL}`);
  console.log(`  CI mode: ${IS_CI}`);

  const res = http.get(`${BASE_URL}/health`);
  if (res.status !== 200) {
    console.warn(
      `  ⚠ Health check returned ${res.status} — is the gateway running at ${BASE_URL}?`
    );
  }
  return { startTime: Date.now() };
}

export function teardown(data) {
  const elapsed = ((Date.now() - data.startTime) / 1000).toFixed(0);
  console.log(`[iot-gateway-load] test complete in ${elapsed}s`);
}
