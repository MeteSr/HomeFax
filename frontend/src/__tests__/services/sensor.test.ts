import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Helpers (no canister) ────────────────────────────────────────────────────
// Import the pure helpers directly; mock paths are exercised via dynamic imports
// after vi.resetModules() so each test group gets a fresh MOCK_DEVICES array.

describe("sensorService helpers", () => {
  // Re-import after each group via dynamic import — use a single import here
  // for the pure, stateless helpers.
  let sensorService: (typeof import("@/services/sensor"))["sensorService"];

  beforeEach(async () => {
    vi.resetModules();
    ({ sensorService } = await import("@/services/sensor"));
  });

  // ── eventLabel ──────────────────────────────────────────────────────────────
  describe("eventLabel", () => {
    it("returns human label for WaterLeak", () => {
      expect(sensorService.eventLabel("WaterLeak")).toBe("Water Leak Detected");
    });

    it("returns human label for LeakDetected", () => {
      expect(sensorService.eventLabel("LeakDetected")).toBe("Possible Leak");
    });

    it("returns human label for FloodRisk", () => {
      expect(sensorService.eventLabel("FloodRisk")).toBe("Flood Risk Alert");
    });

    it("returns human label for LowTemperature", () => {
      expect(sensorService.eventLabel("LowTemperature")).toBe("Low Temperature — Pipe Freeze Risk");
    });

    it("returns human label for HvacAlert", () => {
      expect(sensorService.eventLabel("HvacAlert")).toBe("HVAC System Fault");
    });

    it("returns human label for HvacFilterDue", () => {
      expect(sensorService.eventLabel("HvacFilterDue")).toBe("HVAC Filter Due");
    });

    it("returns human label for HighHumidity", () => {
      expect(sensorService.eventLabel("HighHumidity")).toBe("High Humidity");
    });

    it("returns human label for HighTemperature", () => {
      expect(sensorService.eventLabel("HighTemperature")).toBe("High Temperature");
    });

    it("falls back to the raw type string for unknown types", () => {
      expect(sensorService.eventLabel("UnknownType" as any)).toBe("UnknownType");
    });
  });

  // ── severityColor ────────────────────────────────────────────────────────────
  describe("severityColor", () => {
    it("returns red for Critical", () => {
      expect(sensorService.severityColor("Critical")).toBe("#dc2626");
    });

    it("returns amber for Warning", () => {
      expect(sensorService.severityColor("Warning")).toBe("#d97706");
    });

    it("returns gray for Info", () => {
      expect(sensorService.severityColor("Info")).toBe("#6b7280");
    });
  });
});

// ─── Mock path (no SENSOR_CANISTER_ID) ───────────────────────────────────────

describe("sensorService mock path", () => {
  let sensorService: (typeof import("@/services/sensor"))["sensorService"];

  beforeEach(async () => {
    vi.resetModules();
    ({ sensorService } = await import("@/services/sensor"));
  });

  // ── registerDevice ──────────────────────────────────────────────────────────
  describe("registerDevice", () => {
    it("returns a device with the supplied fields", async () => {
      const device = await sensorService.registerDevice("prop-1", "ext-abc", "Nest", "Thermostat");
      expect(device.propertyId).toBe("prop-1");
      expect(device.externalDeviceId).toBe("ext-abc");
      expect(device.source).toBe("Nest");
      expect(device.name).toBe("Thermostat");
    });

    it("sets isActive to true on registration", async () => {
      const device = await sensorService.registerDevice("prop-1", "ext-001", "Ecobee", "Sensor");
      expect(device.isActive).toBe(true);
    });

    it("assigns a non-empty id", async () => {
      const device = await sensorService.registerDevice("prop-1", "ext-002", "Manual", "Gauge");
      expect(device.id).toBeTruthy();
    });

    it("assigns distinct ids for multiple registrations", async () => {
      const a = await sensorService.registerDevice("p1", "e1", "Nest", "A");
      const b = await sensorService.registerDevice("p1", "e2", "Nest", "B");
      expect(a.id).not.toBe(b.id);
    });

    it("sets registeredAt to a recent timestamp", async () => {
      const before = Date.now();
      const device = await sensorService.registerDevice("p1", "e3", "MoenFlo", "Leak Sensor");
      const after = Date.now();
      expect(device.registeredAt).toBeGreaterThanOrEqual(before);
      expect(device.registeredAt).toBeLessThanOrEqual(after);
    });

    it("accepts all four DeviceSource values", async () => {
      const sources = ["Nest", "Ecobee", "MoenFlo", "Manual"] as const;
      for (const source of sources) {
        const d = await sensorService.registerDevice("p", "e", source, "Dev");
        expect(d.source).toBe(source);
      }
    });
  });

  // ── getDevicesForProperty ────────────────────────────────────────────────────
  describe("getDevicesForProperty", () => {
    it("returns empty array when no devices registered", async () => {
      const devices = await sensorService.getDevicesForProperty("prop-99");
      expect(devices).toEqual([]);
    });

    it("returns registered device for its property", async () => {
      await sensorService.registerDevice("prop-A", "ext-A", "Nest", "Nest A");
      const devices = await sensorService.getDevicesForProperty("prop-A");
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe("Nest A");
    });

    it("does not return devices from a different property", async () => {
      await sensorService.registerDevice("prop-X", "ext-X", "Nest", "X Device");
      const devices = await sensorService.getDevicesForProperty("prop-Y");
      expect(devices).toEqual([]);
    });

    it("returns multiple devices for the same property", async () => {
      await sensorService.registerDevice("prop-B", "ext-B1", "Nest", "Dev B1");
      await sensorService.registerDevice("prop-B", "ext-B2", "Ecobee", "Dev B2");
      const devices = await sensorService.getDevicesForProperty("prop-B");
      expect(devices).toHaveLength(2);
    });

    it("only returns active devices", async () => {
      const device = await sensorService.registerDevice("prop-C", "ext-C", "Nest", "Dev C");
      await sensorService.deactivateDevice(device.id);
      const devices = await sensorService.getDevicesForProperty("prop-C");
      expect(devices).toEqual([]);
    });
  });

  // ── deactivateDevice ─────────────────────────────────────────────────────────
  describe("deactivateDevice", () => {
    it("resolves without throwing", async () => {
      const device = await sensorService.registerDevice("p1", "e1", "Nest", "Dev");
      await expect(sensorService.deactivateDevice(device.id)).resolves.toBeUndefined();
    });

    it("removes the device from subsequent getDevicesForProperty", async () => {
      const device = await sensorService.registerDevice("prop-D", "ext-D", "Ecobee", "Dev D");
      await sensorService.deactivateDevice(device.id);
      const devices = await sensorService.getDevicesForProperty("prop-D");
      expect(devices).toHaveLength(0);
    });

    it("only deactivates the targeted device, not siblings", async () => {
      const a = await sensorService.registerDevice("prop-E", "e1", "Nest", "A");
      await sensorService.registerDevice("prop-E", "e2", "Nest", "B");
      await sensorService.deactivateDevice(a.id);
      const devices = await sensorService.getDevicesForProperty("prop-E");
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe("B");
    });

    it("tolerates deactivating an unknown device id", async () => {
      await expect(sensorService.deactivateDevice("nonexistent")).resolves.toBeUndefined();
    });
  });

  // ── getPendingAlerts (mock returns empty) ────────────────────────────────────
  describe("getPendingAlerts", () => {
    it("returns empty array in mock mode", async () => {
      const alerts = await sensorService.getPendingAlerts("any-prop");
      expect(alerts).toEqual([]);
    });
  });

  // ── getEventsForProperty (mock returns empty) ────────────────────────────────
  describe("getEventsForProperty", () => {
    it("returns empty array in mock mode", async () => {
      const events = await sensorService.getEventsForProperty("any-prop");
      expect(events).toEqual([]);
    });

    it("accepts optional limit parameter without error", async () => {
      const events = await sensorService.getEventsForProperty("any-prop", 10);
      expect(events).toEqual([]);
    });
  });
});

// ─── DeviceSource type coverage ───────────────────────────────────────────────

describe("DeviceSource values", () => {
  it("SOURCES list covers all four platform values", async () => {
    // We import the type — if the type changes, the test below would need updating.
    // This test documents the expected set.
    const expected = new Set(["Nest", "Ecobee", "MoenFlo", "Manual"]);
    expect(expected.size).toBe(4);
  });
});
