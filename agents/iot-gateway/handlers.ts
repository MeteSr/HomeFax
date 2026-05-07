/**
 * Webhook payload normalizers for Nest, Ecobee, and Moen Flo.
 *
 * Each handler validates the incoming payload and returns a SensorReading
 * (or null if the event is not actionable for HomeGentic).
 */

import type {
  SensorReading,
  SensorEventType,
  NestWebhookEvent,
  EcobeeWebhookEvent,
  MoenFloWebhookEvent,
  HoneywellDevice,
} from "./types";

// ── Nest ─────────────────────────────────────────────────────────────────────

const PIPE_FREEZE_THRESHOLD_C = 4; // °C — risk of pipe freeze below this

export function handleNestEvent(
  body: NestWebhookEvent,
  raw: string
): SensorReading | null {
  const traits = body.resourceUpdate?.traits;
  if (!traits) return null;

  // Extract device ID from resource name:
  //   "projects/{projectId}/devices/{deviceId}"
  const nameParts = (body.resourceUpdate.name ?? "").split("/");
  const externalDeviceId = nameParts[nameParts.length - 1] || body.resourceUpdate.name;
  if (!externalDeviceId) return null;

  const tempTrait = traits["sdm.devices.traits.Temperature"];
  const humidityTrait = traits["sdm.devices.traits.Humidity"];

  // Low-temperature pipe-freeze alert
  if (tempTrait) {
    const celsius = tempTrait.ambientTemperatureCelsius;
    if (celsius <= PIPE_FREEZE_THRESHOLD_C) {
      return {
        externalDeviceId,
        eventType: { LowTemperature: null } as SensorEventType,
        value: celsius,
        unit: "°C",
        rawPayload: raw,
      };
    }
    if (celsius > 35) {
      return {
        externalDeviceId,
        eventType: { HighTemperature: null } as SensorEventType,
        value: celsius,
        unit: "°C",
        rawPayload: raw,
      };
    }
  }

  // High-humidity alert
  if (humidityTrait && humidityTrait.ambientHumidityPercent > 70) {
    return {
      externalDeviceId,
      eventType: { HighHumidity: null } as SensorEventType,
      value: humidityTrait.ambientHumidityPercent,
      unit: "%RH",
      rawPayload: raw,
    };
  }

  return null; // no actionable reading
}

// ── Ecobee ───────────────────────────────────────────────────────────────────

// Ecobee reports temperature in °F — convert for the canister
function fahrenheitToCelsius(f: number): number {
  return parseFloat(((f - 32) * (5 / 9)).toFixed(1));
}

const HIGH_TEMP_THRESHOLD_C = 35;
const HIGH_HUMIDITY_THRESHOLD = 70;

export function handleEcobeeEvent(
  body: EcobeeWebhookEvent,
  raw: string
): SensorReading | null {
  const { thermostatId, alerts, runtime } = body;
  if (!thermostatId) return null;

  // Alert-driven events take priority — return on first actionable match.
  for (const alert of alerts ?? []) {
    switch (alert.alertType) {
      case "lowTemp": {
        const celsius =
          alert.value !== undefined ? fahrenheitToCelsius(alert.value) : 2;
        if (celsius <= PIPE_FREEZE_THRESHOLD_C) {
          return {
            externalDeviceId: thermostatId,
            eventType: { LowTemperature: null } as SensorEventType,
            value: celsius,
            unit: "°C",
            rawPayload: raw,
          };
        }
        break;
      }
      case "highTemp": {
        const celsius =
          alert.value !== undefined ? fahrenheitToCelsius(alert.value) : 38;
        return {
          externalDeviceId: thermostatId,
          eventType: { HighTemperature: null } as SensorEventType,
          value: celsius,
          unit: "°C",
          rawPayload: raw,
        };
      }
      case "hvacError":
        return {
          externalDeviceId: thermostatId,
          eventType: { HvacAlert: null } as SensorEventType,
          value: 0,
          unit: "",
          rawPayload: raw,
        };
      case "filterChange":
        return {
          externalDeviceId: thermostatId,
          eventType: { HvacFilterDue: null } as SensorEventType,
          value: 0,
          unit: "",
          rawPayload: raw,
        };
      case "humidity":
        if (alert.value !== undefined && alert.value > HIGH_HUMIDITY_THRESHOLD) {
          return {
            externalDeviceId: thermostatId,
            eventType: { HighHumidity: null } as SensorEventType,
            value: alert.value,
            unit: "%RH",
            rawPayload: raw,
          };
        }
        break;
    }
  }

  // Runtime threshold checks — belt-and-suspenders for polls without active alerts.
  // Ecobee reports temperature in 10ths of °F (e.g. 680 = 68.0 °F).
  if (runtime) {
    const celsius = fahrenheitToCelsius(runtime.actualTemperature / 10);
    if (celsius <= PIPE_FREEZE_THRESHOLD_C) {
      return {
        externalDeviceId: thermostatId,
        eventType: { LowTemperature: null } as SensorEventType,
        value: celsius,
        unit: "°C",
        rawPayload: raw,
      };
    }
    if (celsius > HIGH_TEMP_THRESHOLD_C) {
      return {
        externalDeviceId: thermostatId,
        eventType: { HighTemperature: null } as SensorEventType,
        value: celsius,
        unit: "°C",
        rawPayload: raw,
      };
    }
    if (runtime.actualHumidity > HIGH_HUMIDITY_THRESHOLD) {
      return {
        externalDeviceId: thermostatId,
        eventType: { HighHumidity: null } as SensorEventType,
        value: runtime.actualHumidity,
        unit: "%RH",
        rawPayload: raw,
      };
    }
  }

  return null;
}

// ── Honeywell Home / Resideo ─────────────────────────────────────────────────

export function handleHoneywellHomeEvent(
  device: HoneywellDevice,
  raw: string
): SensorReading | null {
  if (!device.deviceID) return null;

  const externalDeviceId = device.deviceID;

  // WLD — highest priority; a water presence report is always actionable.
  if (device.waterPresent === true) {
    return {
      externalDeviceId,
      eventType: { WaterLeak: null } as SensorEventType,
      value: 0,
      unit: "",
      rawPayload: raw,
    };
  }

  // Temperature checks (Honeywell reports °F directly, not 10ths).
  if (device.indoorTemperature !== undefined) {
    const celsius = fahrenheitToCelsius(device.indoorTemperature);
    if (celsius <= PIPE_FREEZE_THRESHOLD_C) {
      return {
        externalDeviceId,
        eventType: { LowTemperature: null } as SensorEventType,
        value: celsius,
        unit: "°C",
        rawPayload: raw,
      };
    }
    if (celsius > HIGH_TEMP_THRESHOLD_C) {
      return {
        externalDeviceId,
        eventType: { HighTemperature: null } as SensorEventType,
        value: celsius,
        unit: "°C",
        rawPayload: raw,
      };
    }
  }

  // HVAC fault — "Fault" is a hard error; "Off" means the system is completely disabled.
  const equipStatus = device.operationStatus?.equipmentStatus;
  if (equipStatus === "Fault" || equipStatus === "Off") {
    return {
      externalDeviceId,
      eventType: { HvacAlert: null } as SensorEventType,
      value: 0,
      unit: "",
      rawPayload: raw,
    };
  }

  // High humidity (only checked when temperature is in normal range).
  if (device.indoorHumidity !== undefined && device.indoorHumidity > HIGH_HUMIDITY_THRESHOLD) {
    return {
      externalDeviceId,
      eventType: { HighHumidity: null } as SensorEventType,
      value: device.indoorHumidity,
      unit: "%RH",
      rawPayload: raw,
    };
  }

  return null;
}

// ── Moen Flo ─────────────────────────────────────────────────────────────────

export function handleMoenFloEvent(
  body: MoenFloWebhookEvent,
  raw: string
): SensorReading | null {
  const { deviceId, alertType } = body;
  if (!deviceId || !alertType) return null;

  const flowValue = body.flowRateLpm ?? 0;

  switch (alertType) {
    case "LEAK":
      return {
        externalDeviceId: deviceId,
        eventType: { WaterLeak: null } as SensorEventType,
        value: flowValue,
        unit: "L/min",
        rawPayload: raw,
      };
    case "FLOOD_RISK":
      return {
        externalDeviceId: deviceId,
        eventType: { FloodRisk: null } as SensorEventType,
        value: flowValue,
        unit: "L/min",
        rawPayload: raw,
      };
    case "SHUTOFF":
    case "HIGH_FLOW":
    case "LOW_PRESSURE":
      return {
        externalDeviceId: deviceId,
        eventType: { LeakDetected: null } as SensorEventType,
        value: flowValue,
        unit: "L/min",
        rawPayload: raw,
      };
  }

  return null;
}
