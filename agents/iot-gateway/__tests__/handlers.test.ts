import { handleNestEvent, handleEcobeeEvent, handleMoenFloEvent } from "../handlers";
import type {
  NestWebhookEvent,
  EcobeeWebhookEvent,
  MoenFloWebhookEvent,
} from "../types";

const RAW = "{}";

// ── handleNestEvent ───────────────────────────────────────────────────────────

describe("handleNestEvent", () => {
  const DEVICE_NAME = "projects/proj-1/devices/device-abc";

  function nestEvent(traits: NestWebhookEvent["resourceUpdate"]["traits"]): NestWebhookEvent {
    return {
      eventId: "evt-1",
      timestamp: new Date().toISOString(),
      resourceUpdate: { name: DEVICE_NAME, traits },
    };
  }

  describe("device ID extraction", () => {
    it("takes the last path segment as externalDeviceId", () => {
      const reading = handleNestEvent(nestEvent({
        "sdm.devices.traits.Temperature": { ambientTemperatureCelsius: 2 },
      }), RAW);
      expect(reading!.externalDeviceId).toBe("device-abc");
    });

    it("uses the full name when there are no path separators", () => {
      const event: NestWebhookEvent = {
        eventId: "e",
        timestamp: "",
        resourceUpdate: {
          name: "flat-device-id",
          traits: { "sdm.devices.traits.Temperature": { ambientTemperatureCelsius: 2 } },
        },
      };
      expect(handleNestEvent(event, RAW)!.externalDeviceId).toBe("flat-device-id");
    });
  });

  describe("temperature", () => {
    it("returns LowTemperature when celsius is below the freeze threshold", () => {
      const reading = handleNestEvent(nestEvent({
        "sdm.devices.traits.Temperature": { ambientTemperatureCelsius: 2 },
      }), RAW);
      expect(reading!.eventType).toEqual({ LowTemperature: null });
      expect(reading!.value).toBe(2);
      expect(reading!.unit).toBe("°C");
    });

    it("returns LowTemperature at exactly 4 °C (inclusive boundary)", () => {
      const reading = handleNestEvent(nestEvent({
        "sdm.devices.traits.Temperature": { ambientTemperatureCelsius: 4 },
      }), RAW);
      expect(reading!.eventType).toEqual({ LowTemperature: null });
    });

    it("returns HighTemperature when celsius exceeds 35", () => {
      const reading = handleNestEvent(nestEvent({
        "sdm.devices.traits.Temperature": { ambientTemperatureCelsius: 36 },
      }), RAW);
      expect(reading!.eventType).toEqual({ HighTemperature: null });
      expect(reading!.value).toBe(36);
    });

    it("returns null when temperature is in the normal range (5–35 °C)", () => {
      expect(handleNestEvent(nestEvent({
        "sdm.devices.traits.Temperature": { ambientTemperatureCelsius: 21 },
      }), RAW)).toBeNull();
    });

    it("returns null when temperature is exactly 35 °C (exclusive upper boundary)", () => {
      expect(handleNestEvent(nestEvent({
        "sdm.devices.traits.Temperature": { ambientTemperatureCelsius: 35 },
      }), RAW)).toBeNull();
    });
  });

  describe("humidity", () => {
    it("returns HighHumidity when humidity exceeds 70 %", () => {
      const reading = handleNestEvent(nestEvent({
        "sdm.devices.traits.Humidity": { ambientHumidityPercent: 75 },
      }), RAW);
      expect(reading!.eventType).toEqual({ HighHumidity: null });
      expect(reading!.value).toBe(75);
      expect(reading!.unit).toBe("%RH");
    });

    it("returns null when humidity is exactly 70 % (exclusive boundary)", () => {
      expect(handleNestEvent(nestEvent({
        "sdm.devices.traits.Humidity": { ambientHumidityPercent: 70 },
      }), RAW)).toBeNull();
    });

    it("humidity is only checked when temperature trait is absent or in normal range", () => {
      // Temperature is normal — falls through to humidity check
      const reading = handleNestEvent(nestEvent({
        "sdm.devices.traits.Temperature": { ambientTemperatureCelsius: 22 },
        "sdm.devices.traits.Humidity": { ambientHumidityPercent: 80 },
      }), RAW);
      expect(reading!.eventType).toEqual({ HighHumidity: null });
    });
  });

  describe("guard conditions", () => {
    it("returns null when traits is absent", () => {
      const event: NestWebhookEvent = {
        eventId: "e",
        timestamp: "",
        resourceUpdate: { name: DEVICE_NAME },
      };
      expect(handleNestEvent(event, RAW)).toBeNull();
    });

    it("returns null when traits is an empty object", () => {
      expect(handleNestEvent(nestEvent({}), RAW)).toBeNull();
    });
  });
});

// ── handleEcobeeEvent — alert-driven ─────────────────────────────────────────

describe("handleEcobeeEvent — alert-driven events", () => {
  function ecobeeEvent(overrides: Partial<EcobeeWebhookEvent>): EcobeeWebhookEvent {
    return { thermostatId: "411848373746", ...overrides };
  }

  it("returns LowTemperature for lowTemp alert with value in 10ths °F below freeze threshold", () => {
    // 32 °F → 0 °C, well below 4 °C threshold
    const reading = handleEcobeeEvent(ecobeeEvent({
      alerts: [{ alertType: "lowTemp", severity: "high", message: "cold", value: 32 }],
    }), RAW);
    expect(reading!.eventType).toEqual({ LowTemperature: null });
    expect(reading!.unit).toBe("°C");
    expect(reading!.externalDeviceId).toBe("411848373746");
  });

  it("uses default celsius of 2 when lowTemp alert has no value", () => {
    const reading = handleEcobeeEvent(ecobeeEvent({
      alerts: [{ alertType: "lowTemp", severity: "high", message: "cold" }],
    }), RAW);
    expect(reading!.eventType).toEqual({ LowTemperature: null });
    expect(reading!.value).toBe(2);
  });

  it("returns null when lowTemp alert converts to celsius above the freeze threshold", () => {
    // 45 °F → 7.2 °C, above 4 °C threshold
    const reading = handleEcobeeEvent(ecobeeEvent({
      alerts: [{ alertType: "lowTemp", severity: "low", message: "mild", value: 45 }],
    }), RAW);
    expect(reading).toBeNull();
  });

  it("returns HighTemperature for highTemp alert", () => {
    // 100 °F → 37.8 °C
    const reading = handleEcobeeEvent(ecobeeEvent({
      alerts: [{ alertType: "highTemp", severity: "high", message: "hot", value: 100 }],
    }), RAW);
    expect(reading!.eventType).toEqual({ HighTemperature: null });
  });

  it("uses default celsius of 38 when highTemp alert has no value", () => {
    const reading = handleEcobeeEvent(ecobeeEvent({
      alerts: [{ alertType: "highTemp", severity: "high", message: "hot" }],
    }), RAW);
    expect(reading!.eventType).toEqual({ HighTemperature: null });
    expect(reading!.value).toBe(38);
  });

  it("returns HvacAlert for hvacError alert", () => {
    const reading = handleEcobeeEvent(ecobeeEvent({
      alerts: [{ alertType: "hvacError", severity: "high", message: "fault" }],
    }), RAW);
    expect(reading!.eventType).toEqual({ HvacAlert: null });
    expect(reading!.value).toBe(0);
  });

  it("returns HvacFilterDue for filterChange alert", () => {
    const reading = handleEcobeeEvent(ecobeeEvent({
      alerts: [{ alertType: "filterChange", severity: "low", message: "change filter" }],
    }), RAW);
    expect(reading!.eventType).toEqual({ HvacFilterDue: null });
  });

  it("returns HighHumidity for humidity alert above 70 %", () => {
    const reading = handleEcobeeEvent(ecobeeEvent({
      alerts: [{ alertType: "humidity", severity: "medium", message: "humid", value: 80 }],
    }), RAW);
    expect(reading!.eventType).toEqual({ HighHumidity: null });
    expect(reading!.value).toBe(80);
    expect(reading!.unit).toBe("%RH");
  });

  it("returns null for humidity alert at exactly 70 % (exclusive boundary)", () => {
    expect(handleEcobeeEvent(ecobeeEvent({
      alerts: [{ alertType: "humidity", severity: "medium", message: "ok", value: 70 }],
    }), RAW)).toBeNull();
  });

  it("returns on the first matching alert and ignores subsequent ones", () => {
    // hvacError comes first — should return HvacAlert, not process filterChange
    const reading = handleEcobeeEvent(ecobeeEvent({
      alerts: [
        { alertType: "hvacError",    severity: "high", message: "fault" },
        { alertType: "filterChange", severity: "low",  message: "change filter" },
      ],
    }), RAW);
    expect(reading!.eventType).toEqual({ HvacAlert: null });
  });

  it("returns null when thermostatId is absent", () => {
    expect(handleEcobeeEvent({ thermostatId: "" }, RAW)).toBeNull();
  });

  it("returns null when alerts array is empty and no runtime is present", () => {
    expect(handleEcobeeEvent(ecobeeEvent({ alerts: [] }), RAW)).toBeNull();
  });

  it("returns null when alerts is absent and no runtime is present", () => {
    expect(handleEcobeeEvent(ecobeeEvent({}), RAW)).toBeNull();
  });
});

// ── handleEcobeeEvent — runtime fallback ──────────────────────────────────────

describe("handleEcobeeEvent — runtime fallback", () => {
  // 350 = 35 °F → (35-32)*5/9 = 1.7 °C ≤ 4 → LowTemperature
  const COLD_RUNTIME = { actualTemperature: 350, actualHumidity: 45 };
  // 1000 = 100 °F → (100-32)*5/9 = 37.8 °C > 35 → HighTemperature
  const HOT_RUNTIME  = { actualTemperature: 1000, actualHumidity: 45 };
  // 680 = 68 °F → 20 °C — normal range
  const NORMAL_RUNTIME = { actualTemperature: 680, actualHumidity: 45 };

  function ecobeeWithRuntime(runtime: typeof COLD_RUNTIME): EcobeeWebhookEvent {
    return { thermostatId: "411848373746", alerts: [], runtime };
  }

  it("returns LowTemperature when runtime temperature converts to ≤ 4 °C", () => {
    const reading = handleEcobeeEvent(ecobeeWithRuntime(COLD_RUNTIME), RAW);
    expect(reading!.eventType).toEqual({ LowTemperature: null });
    expect(reading!.unit).toBe("°C");
  });

  it("returns HighTemperature when runtime temperature converts to > 35 °C", () => {
    const reading = handleEcobeeEvent(ecobeeWithRuntime(HOT_RUNTIME), RAW);
    expect(reading!.eventType).toEqual({ HighTemperature: null });
  });

  it("returns HighHumidity when runtime humidity exceeds 70 % with normal temperature", () => {
    const reading = handleEcobeeEvent(ecobeeWithRuntime({
      actualTemperature: 680, // 20 °C — normal
      actualHumidity: 75,
    }), RAW);
    expect(reading!.eventType).toEqual({ HighHumidity: null });
    expect(reading!.value).toBe(75);
  });

  it("returns null when runtime is within all thresholds", () => {
    expect(handleEcobeeEvent(ecobeeWithRuntime(NORMAL_RUNTIME), RAW)).toBeNull();
  });

  it("alert takes priority: filterChange alert wins over cold runtime", () => {
    const event: EcobeeWebhookEvent = {
      thermostatId: "411848373746",
      alerts: [{ alertType: "filterChange", severity: "low", message: "change" }],
      runtime: COLD_RUNTIME,
    };
    const reading = handleEcobeeEvent(event, RAW);
    // Must be HvacFilterDue (alert), not LowTemperature (runtime)
    expect(reading!.eventType).toEqual({ HvacFilterDue: null });
  });

  it("runtime check is skipped when runtime is absent", () => {
    expect(handleEcobeeEvent({ thermostatId: "411848373746", alerts: [] }, RAW)).toBeNull();
  });
});

// ── handleMoenFloEvent ────────────────────────────────────────────────────────

describe("handleMoenFloEvent", () => {
  function moenEvent(overrides: Partial<MoenFloWebhookEvent>): MoenFloWebhookEvent {
    return {
      deviceId: "device-moen-1",
      alertType: "LEAK",
      severity: "critical",
      timestamp: new Date().toISOString(),
      ...overrides,
    };
  }

  it("returns WaterLeak for LEAK alert", () => {
    const reading = handleMoenFloEvent(moenEvent({ alertType: "LEAK" }), RAW);
    expect(reading!.eventType).toEqual({ WaterLeak: null });
    expect(reading!.externalDeviceId).toBe("device-moen-1");
  });

  it("returns FloodRisk for FLOOD_RISK alert", () => {
    expect(handleMoenFloEvent(moenEvent({ alertType: "FLOOD_RISK" }), RAW)!.eventType)
      .toEqual({ FloodRisk: null });
  });

  it("returns LeakDetected for SHUTOFF alert", () => {
    expect(handleMoenFloEvent(moenEvent({ alertType: "SHUTOFF" }), RAW)!.eventType)
      .toEqual({ LeakDetected: null });
  });

  it("returns LeakDetected for HIGH_FLOW alert", () => {
    expect(handleMoenFloEvent(moenEvent({ alertType: "HIGH_FLOW" }), RAW)!.eventType)
      .toEqual({ LeakDetected: null });
  });

  it("returns LeakDetected for LOW_PRESSURE alert", () => {
    expect(handleMoenFloEvent(moenEvent({ alertType: "LOW_PRESSURE" }), RAW)!.eventType)
      .toEqual({ LeakDetected: null });
  });

  it("uses flowRateLpm as the reading value", () => {
    const reading = handleMoenFloEvent(moenEvent({ alertType: "LEAK", flowRateLpm: 3.5 }), RAW);
    expect(reading!.value).toBe(3.5);
    expect(reading!.unit).toBe("L/min");
  });

  it("defaults value to 0 when flowRateLpm is absent", () => {
    const reading = handleMoenFloEvent(moenEvent({ alertType: "LEAK" }), RAW);
    expect(reading!.value).toBe(0);
  });

  it("returns null for an unknown alert type", () => {
    expect(handleMoenFloEvent(moenEvent({ alertType: "UNKNOWN_TYPE" }), RAW)).toBeNull();
  });

  it("returns null when deviceId is absent", () => {
    expect(handleMoenFloEvent(moenEvent({ deviceId: "" }), RAW)).toBeNull();
  });

  it("returns null when alertType is absent", () => {
    expect(handleMoenFloEvent(moenEvent({ alertType: "" }), RAW)).toBeNull();
  });
});
