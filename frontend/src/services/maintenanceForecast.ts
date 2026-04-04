/**
 * §16.1 — Predictive Maintenance Intelligence
 *
 * Wraps the existing `predictMaintenance()` pure function and shapes its
 * output into the `MaintenanceForecastContext` that is injected into the
 * voice agent's system prompt and context payload.
 *
 * Extracted as a standalone module so it can be unit-tested independently
 * of the React hook.
 */

import type { Job } from "./job";
import type { Property } from "./property";
import { predictMaintenance } from "./maintenance";

export interface SystemForecast {
  systemName:          string;
  urgency:             "Critical" | "Soon" | "Watch" | "Good";
  yearsRemaining:      number;
  percentLifeUsed:     number;
  replacementCostLow:  number;   // dollars
  replacementCostHigh: number;   // dollars
  serviceCallLow:      number;   // dollars
  serviceCallHigh:     number;   // dollars
  recommendation:      string;
  diyViable:           boolean;
}

export interface MaintenanceForecastContext {
  propertyAddress:  string;
  predictions:      SystemForecast[];
  urgentCount:      number;        // Critical + Soon
  criticalSystems:  string[];      // names of Critical systems — used to generate proactive alerts
  totalBudgetLow:   number;        // dollars, Critical + Soon only
  totalBudgetHigh:  number;        // dollars, Critical + Soon only
  climateZone:      string;
}

/**
 * Builds a `MaintenanceForecastContext` from the user's first registered
 * property and their full job history. Returns null when no properties exist.
 *
 * Uses the first property when multiple are registered — the agent can call
 * the tool with a specific property_id for per-property queries.
 */
export function buildMaintenanceForecast(
  properties: Property[],
  jobs: Job[],
): MaintenanceForecastContext | null {
  if (properties.length === 0) return null;

  const prop = properties[0];
  const report = predictMaintenance(
    Number(prop.yearBuilt),
    jobs,
    {},
    prop.state,
  );

  const predictions: SystemForecast[] = report.systemPredictions.map((p) => ({
    systemName:          p.systemName,
    urgency:             p.urgency,
    yearsRemaining:      p.yearsRemaining,
    percentLifeUsed:     p.percentLifeUsed,
    replacementCostLow:  Math.round(p.estimatedCostLowCents  / 100),
    replacementCostHigh: Math.round(p.estimatedCostHighCents / 100),
    serviceCallLow:      Math.round(p.serviceCallLowCents    / 100),
    serviceCallHigh:     Math.round(p.serviceCallHighCents   / 100),
    recommendation:      p.recommendation,
    diyViable:           p.diyViable,
  }));

  const urgentCount    = predictions.filter((p) => p.urgency === "Critical" || p.urgency === "Soon").length;
  const criticalSystems = predictions.filter((p) => p.urgency === "Critical").map((p) => p.systemName);

  return {
    propertyAddress:  `${prop.address}, ${prop.city}, ${prop.state}`,
    predictions,
    urgentCount,
    criticalSystems,
    totalBudgetLow:   Math.round(report.totalBudgetLowCents  / 100),
    totalBudgetHigh:  Math.round(report.totalBudgetHighCents / 100),
    climateZone:      report.climateZone.name,
  };
}
