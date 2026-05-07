import {
  loadConfig,
  pollOnce,
  startEnphasePoller,
} from "../../pollers/enphase";
import type { EnphaseConfig } from "../../pollers/enphase";

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("../../icp", () => ({
  recordSensorEvent: jest.fn(),
}));

import { recordSensorEvent } from "../../icp";
const mockRecordSensorEvent = recordSensorEvent as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<EnphaseConfig> = {}): EnphaseConfig {
  return {
    token:  "eyJtest-token",
    ip:     "192.168.1.42",
    serial: "123456789012",
    ...overrides,
  };
}

const NOW_SECS = Math.floor(Date.now() / 1000);

// Production response — normal healthy output
const PRODUCTION_OK: object = { wNow: 3200, whLifetime: 1_000_000, readingTime: NOW_SECS };

// Inverter list — all recently reporting (fresh)
const INVERTERS_OK: object[] = [
  { serialNumber: "INV-001", lastReportDate: NOW_SECS - 60, lastReportWatts: 240, maxReportWatts: 295 },
  { serialNumber: "INV-002", lastReportDate: NOW_SECS - 90, lastReportWatts: 235, maxReportWatts: 295 },
];

// Inverter list — one stale (faulted)
const INVERTERS_FAULTED: object[] = [
  { serialNumber: "INV-001", lastReportDate: NOW_SECS - 60,       lastReportWatts: 240, maxReportWatts: 295 },
  { serialNumber: "INV-002", lastReportDate: NOW_SECS - 20 * 60,  lastReportWatts:   0, maxReportWatts: 295 },
];

function mockFetchSequence(responses: Array<{ ok: boolean; status?: number; body: unknown }>): void {
  let call = 0;
  global.fetch = jest.fn().mockImplementation(() => {
    const r = responses[call] ?? responses[responses.length - 1];
    call++;
    return Promise.resolve({
      ok:     r.ok,
      status: r.status ?? 200,
      json:   jest.fn().mockResolvedValue(r.body),
      text:   jest.fn().mockResolvedValue("error"),
    } as unknown as Response);
  });
}

// ── loadConfig ────────────────────────────────────────────────────────────────

describe("loadConfig", () => {
  beforeEach(() => {
    delete process.env.ENPHASE_ENVOY_TOKEN;
    delete process.env.ENPHASE_ENVOY_IP;
    delete process.env.ENPHASE_SERIAL;
  });

  it("returns null when any required env var is missing", () => {
    expect(loadConfig()).toBeNull();
  });

  it("returns null when only some vars are set", () => {
    process.env.ENPHASE_ENVOY_TOKEN = "token";
    process.env.ENPHASE_ENVOY_IP   = "192.168.1.42";
    expect(loadConfig()).toBeNull(); // ENPHASE_SERIAL missing
  });

  it("returns a config when all vars are set", () => {
    process.env.ENPHASE_ENVOY_TOKEN = "mytoken";
    process.env.ENPHASE_ENVOY_IP    = "10.0.0.5";
    process.env.ENPHASE_SERIAL      = "999888777666";

    const cfg = loadConfig();
    expect(cfg).toEqual({ token: "mytoken", ip: "10.0.0.5", serial: "999888777666" });
  });
});

// ── pollOnce ──────────────────────────────────────────────────────────────────

describe("pollOnce", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockRecordSensorEvent.mockResolvedValue({ success: true, eventId: "evt-1" });
  });

  it("requests the production endpoint with Bearer token", async () => {
    mockFetchSequence([
      { ok: true, body: PRODUCTION_OK },
      { ok: true, body: INVERTERS_OK },
    ]);

    await pollOnce(makeConfig({ token: "my-token", ip: "192.168.1.42" }));

    const [prodUrl, prodInit] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(prodUrl).toContain("192.168.1.42");
    expect(prodUrl).toContain("/api/v1/production");
    expect((prodInit.headers as Record<string, string>)["Authorization"]).toBe("Bearer my-token");
  });

  it("requests the inverters endpoint after production", async () => {
    mockFetchSequence([
      { ok: true, body: PRODUCTION_OK },
      { ok: true, body: INVERTERS_OK },
    ]);

    await pollOnce(makeConfig());

    const [invUrl] = (global.fetch as jest.Mock).mock.calls[1] as [string];
    expect(invUrl).toContain("/api/v1/production/inverters");
  });

  it("does not call recordSensorEvent when production is normal and inverters are healthy", async () => {
    mockFetchSequence([
      { ok: true, body: PRODUCTION_OK },
      { ok: true, body: INVERTERS_OK },
    ]);

    await pollOnce(makeConfig());
    expect(mockRecordSensorEvent).not.toHaveBeenCalled();
  });

  it("calls recordSensorEvent with SolarFault when an inverter has a stale reading", async () => {
    mockFetchSequence([
      { ok: true, body: PRODUCTION_OK },
      { ok: true, body: INVERTERS_FAULTED },
    ]);

    // Simulate daylight hours so fault detection is active
    jest.spyOn(Date.prototype, "getHours").mockReturnValue(12);

    await pollOnce(makeConfig());

    expect(mockRecordSensorEvent).toHaveBeenCalledTimes(1);
    expect(mockRecordSensorEvent.mock.calls[0][0].eventType).toEqual({ SolarFault: null });
    expect(mockRecordSensorEvent.mock.calls[0][0].externalDeviceId).toBe("123456789012");

    jest.restoreAllMocks();
  });

  it("does not flag faulted inverters outside daylight hours", async () => {
    mockFetchSequence([
      { ok: true, body: { wNow: 100, whLifetime: 1_000_000, readingTime: NOW_SECS } },
      { ok: true, body: INVERTERS_FAULTED },
    ]);

    jest.spyOn(Date.prototype, "getHours").mockReturnValue(2); // 2am

    await pollOnce(makeConfig());
    expect(mockRecordSensorEvent).not.toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  it("calls recordSensorEvent with LowProduction when wNow is near zero during daylight", async () => {
    mockFetchSequence([
      { ok: true, body: { wNow: 0, whLifetime: 1_000_000, readingTime: NOW_SECS } },
      { ok: true, body: INVERTERS_OK },
    ]);

    jest.spyOn(Date.prototype, "getHours").mockReturnValue(12);

    await pollOnce(makeConfig());

    expect(mockRecordSensorEvent).toHaveBeenCalledTimes(1);
    expect(mockRecordSensorEvent.mock.calls[0][0].eventType).toEqual({ LowProduction: null });

    jest.restoreAllMocks();
  });

  it("stops after production fetch fails and does not call recordSensorEvent", async () => {
    mockFetchSequence([{ ok: false, status: 500, body: "error" }]);

    await expect(pollOnce(makeConfig())).resolves.toBeUndefined();
    expect(mockRecordSensorEvent).not.toHaveBeenCalled();
    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(1); // no inverter call
  });

  it("stops after inverters fetch fails and does not call recordSensorEvent", async () => {
    mockFetchSequence([
      { ok: true,  body: PRODUCTION_OK },
      { ok: false, status: 429, body: "rate limited" },
    ]);

    await expect(pollOnce(makeConfig())).resolves.toBeUndefined();
    expect(mockRecordSensorEvent).not.toHaveBeenCalled();
  });

  it("logs canister error but does not throw when recordSensorEvent fails", async () => {
    mockFetchSequence([
      { ok: true, body: { wNow: 0, whLifetime: 0, readingTime: NOW_SECS } },
      { ok: true, body: INVERTERS_OK },
    ]);
    jest.spyOn(Date.prototype, "getHours").mockReturnValue(12);
    mockRecordSensorEvent.mockResolvedValue({ success: false, error: "Unauthorized" });

    await expect(pollOnce(makeConfig())).resolves.toBeUndefined();

    jest.restoreAllMocks();
  });
});

// ── startEnphasePoller ────────────────────────────────────────────────────────

describe("startEnphasePoller", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.ENPHASE_ENVOY_TOKEN;
    delete process.env.ENPHASE_ENVOY_IP;
    delete process.env.ENPHASE_SERIAL;
  });

  it("returns a no-op stop function when config is absent", () => {
    const stop = startEnphasePoller();
    expect(typeof stop).toBe("function");
    expect(() => stop()).not.toThrow();
  });

  it("the no-op stop function is idempotent", () => {
    const stop = startEnphasePoller();
    expect(() => { stop(); stop(); }).not.toThrow();
  });

  it("starts polling and returns a stop function when config is present", async () => {
    process.env.ENPHASE_ENVOY_TOKEN = "eyJtest";
    process.env.ENPHASE_ENVOY_IP    = "192.168.1.42";
    process.env.ENPHASE_SERIAL      = "123456789012";

    mockFetchSequence([
      { ok: true, body: PRODUCTION_OK },
      { ok: true, body: INVERTERS_OK },
    ]);

    jest.useFakeTimers();
    const stop = startEnphasePoller(60_000);
    expect(typeof stop).toBe("function");

    await Promise.resolve();
    await Promise.resolve();

    stop();
    jest.useRealTimers();
  });
});
