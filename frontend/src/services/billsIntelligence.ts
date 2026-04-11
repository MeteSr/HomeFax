/**
 * Bills Intelligence Service (Epic #49 Stories 3–6)
 *
 * Pure analysis functions layered on top of billService. Talks to the voice
 * agent proxy for AI-enhanced features (rebate finder, telecom negotiation).
 * Calls the bills canister's getUsageTrend query directly for usage trend data.
 */

import { Actor } from "@icp-sdk/core/agent";
import { getAgent } from "./actor";
import type { BillType } from "./billService";

const BILLS_CANISTER_ID = (process.env as any).BILLS_CANISTER_ID || "";
const VOICE_AGENT_URL   = (import.meta as any).env?.VITE_VOICE_AGENT_URL || "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UsagePeriod {
  periodStart: string;   // YYYY-MM-DD
  usageAmount: number;
  usageUnit:   string;
}

export interface EfficiencyAnalysisResult {
  degradationDetected:  boolean;
  estimatedAnnualWaste?: number;  // cents
  recommendation?:      string;
  trendPct?:            number;   // % change from early to late half
}

export interface RebateFindParams {
  state:           string;
  zipCode:         string;
  utilityProvider: string;
  billType:        BillType;
}

export interface RebateResult {
  name:            string;
  description:     string;
  estimatedAmount: string;
  provider:        string;
  url?:            string;
}

export interface TelecomNegotiateParams {
  provider:    string;
  amountCents: number;
  mbps:        number;
  zipCode:     string;
}

export interface TelecomNegotiationResult {
  verdict:                  "overpaying" | "fair" | "good_deal";
  medianCents:              number;
  savingsOpportunityCents:  number;
  negotiationScript:        string;
}

// ─── Story 3: System Efficiency Degradation ───────────────────────────────────

/**
 * Fetch usage trend data from the bills canister.
 * Calls the getUsageTrend Motoko query which filters to usage-tracked bills,
 * scoped to the calling principal, sorted chronologically.
 */
export async function getUsageTrend(
  propertyId: string,
  billType:   BillType,
  months:     number,
): Promise<UsagePeriod[]> {
  if (!BILLS_CANISTER_ID) {
    // Mock fallback for local dev without deployed canister
    return [];
  }

  const agent = await getAgent();
  const UsagePeriodIDL = ({ IDL }: any) => {
    const BillTypeVariant = IDL.Variant({
      Electric: IDL.Null, Gas: IDL.Null, Water: IDL.Null,
      Internet: IDL.Null, Telecom: IDL.Null, Other: IDL.Null,
    });
    const UsagePeriod = IDL.Record({
      periodStart: IDL.Text,
      usageAmount: IDL.Float64,
      usageUnit:   IDL.Text,
    });
    const Error = IDL.Variant({
      NotFound: IDL.Null, Unauthorized: IDL.Null,
      InvalidInput: IDL.Text, TierLimitReached: IDL.Text,
    });
    return IDL.Service({
      getUsageTrend: IDL.Func(
        [IDL.Text, BillTypeVariant, IDL.Nat],
        [IDL.Variant({ ok: IDL.Vec(UsagePeriod), err: Error })],
        ["query"]
      ),
    });
  };

  const actor: any = Actor.createActor(UsagePeriodIDL, {
    agent,
    canisterId: BILLS_CANISTER_ID,
  });

  const result = await actor.getUsageTrend(
    propertyId,
    { [billType]: null },
    BigInt(months)
  );

  if ("err" in result) {
    const key = Object.keys(result.err)[0];
    const val = (result.err as any)[key];
    throw new Error(typeof val === "string" ? val : key);
  }

  return (result.ok as any[]).map((r: any) => ({
    periodStart: r.periodStart as string,
    usageAmount: Number(r.usageAmount),
    usageUnit:   r.usageUnit as string,
  }));
}

/**
 * Detect system efficiency degradation by comparing first-half vs second-half
 * average usage in the trend window. A >15% rise signals degradation.
 */
export function analyzeEfficiencyTrend(trend: UsagePeriod[]): EfficiencyAnalysisResult {
  if (trend.length < 4) {
    return { degradationDetected: false };
  }

  const mid      = Math.floor(trend.length / 2);
  const earlyAvg = trend.slice(0, mid).reduce((s, p) => s + p.usageAmount, 0) / mid;
  const lateAvg  = trend.slice(mid).reduce((s, p) => s + p.usageAmount, 0) / (trend.length - mid);

  if (earlyAvg === 0) return { degradationDetected: false };

  const trendPct = ((lateAvg - earlyAvg) / earlyAvg) * 100;

  if (trendPct <= 15) {
    return { degradationDetected: false, trendPct };
  }

  const estimatedAnnualWaste = Math.round((lateAvg - earlyAvg) * 12);
  const recommendation = `Usage has risen ${trendPct.toFixed(1)}% over this period. ` +
    `Consider scheduling an HVAC tune-up or home energy audit.`;

  return { degradationDetected: true, estimatedAnnualWaste, recommendation, trendPct };
}

// ─── Story 4: Rebate Finder ───────────────────────────────────────────────────

/**
 * Find available rebates for a utility type via the voice agent.
 * Only Electric bills are supported (federal/state/utility rebate programs).
 */
export async function findRebates(params: RebateFindParams): Promise<RebateResult[]> {
  if (params.billType !== "Electric") {
    throw new Error(`Rebate finder only supports Electric bills (got: ${params.billType})`);
  }

  const response = await fetch(`${VOICE_AGENT_URL}/api/rebate-finder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Rebate finder request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.rebates as RebateResult[];
}

// ─── Story 6: Telecom Negotiation ────────────────────────────────────────────

/**
 * Analyze a telecom bill and generate a negotiation script via the voice agent.
 */
export async function negotiateTelecom(params: TelecomNegotiateParams): Promise<TelecomNegotiationResult> {
  if (!params.provider || params.provider.trim() === "") {
    throw new Error("Provider name is required");
  }
  if (!Number.isInteger(params.amountCents) || params.amountCents <= 0) {
    throw new Error("amountCents must be a positive integer");
  }

  const response = await fetch(`${VOICE_AGENT_URL}/api/telecom-negotiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Telecom negotiate request failed: ${response.status}`);
  }

  return response.json() as Promise<TelecomNegotiationResult>;
}
