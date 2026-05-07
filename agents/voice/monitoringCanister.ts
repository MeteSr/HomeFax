/**
 * Lightweight ICP client for the monitoring canister.
 * Used by the /admin/cycle-status endpoint to surface real-time cycle health.
 */

import { HttpAgent, Actor } from "@icp-sdk/core/agent";
import { identityFromPem } from "./paymentCanister";

const MONITORING_CANISTER_ID =
  process.env.CANISTER_ID_MONITORING ?? "";

const IC_HOST = process.env.DFX_NETWORK === "local"
  ? "http://localhost:4943"
  : "https://ic0.app";

const idlFactory = ({ IDL }: any) => {
  const AlertSeverity  = IDL.Variant({ Critical: IDL.Null, Warning: IDL.Null, Info: IDL.Null });
  const AlertCategory  = IDL.Variant({
    Cycles: IDL.Null, ErrorRate: IDL.Null, ResponseTime: IDL.Null,
    Memory: IDL.Null, Milestone: IDL.Null, TopUp: IDL.Null, Stale: IDL.Null,
  });
  const Alert = IDL.Record({
    id:         IDL.Text,
    severity:   AlertSeverity,
    category:   AlertCategory,
    canisterId: IDL.Opt(IDL.Principal),
    message:    IDL.Text,
    resolved:   IDL.Bool,
    createdAt:  IDL.Int,
    resolvedAt: IDL.Opt(IDL.Int),
  });
  const CycleLevelResult = IDL.Record({
    id:        IDL.Principal,
    name:      IDL.Text,
    cycles:    IDL.Nat,
    status:    IDL.Text,
    fromCache: IDL.Bool,
  });
  const ErrorSummaryInput = IDL.Record({
    fingerprint : IDL.Text,
    message     : IDL.Text,
    errorType   : IDL.Text,
    count       : IDL.Nat,
    firstSeen   : IDL.Int,
    lastSeen    : IDL.Int,
    tierCounts  : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
    release     : IDL.Opt(IDL.Text),
  });
  return IDL.Service({
    getCriticalCycleAlerts: IDL.Func([], [IDL.Vec(Alert)], ["query"]),
    checkCycleLevels:       IDL.Func([], [IDL.Vec(CycleLevelResult)], []),
    recordFrontendError:    IDL.Func([ErrorSummaryInput], [], []),
  });
};

let _actor: any = null;

async function getActor(): Promise<any> {
  if (_actor) return _actor;
  const pem = process.env.DFX_IDENTITY_PEM;
  if (!pem || !MONITORING_CANISTER_ID) return null;
  const agent = new HttpAgent({ host: IC_HOST, identity: identityFromPem(pem) });
  if (process.env.DFX_NETWORK === "local") await agent.fetchRootKey();
  _actor = Actor.createActor(idlFactory, { agent, canisterId: MONITORING_CANISTER_ID });
  return _actor;
}

export interface ErrorSummaryInput {
  fingerprint : string;
  message     : string;
  errorType   : string;
  count       : number;
  firstSeen   : bigint;  // nanoseconds
  lastSeen    : bigint;  // nanoseconds
  tierCounts  : [string, number][];
  release?    : string;
}

export interface CycleAlert {
  id:        string;
  severity:  string;
  canister:  string | null;
  message:   string;
  createdAt: number;
}

export interface CycleLevelStatus {
  name:      string;
  cycles:    bigint;
  status:    string;
  fromCache: boolean;
}

export async function getCriticalCycleAlerts(): Promise<CycleAlert[]> {
  const actor = await getActor();
  if (!actor) return [];
  const raw: any[] = await actor.getCriticalCycleAlerts();
  return raw.map((a) => ({
    id:        a.id,
    severity:  Object.keys(a.severity)[0],
    canister:  a.canisterId[0]?.toText() ?? null,
    message:   a.message,
    createdAt: Number(a.createdAt) / 1_000_000,
  }));
}

export async function checkCycleLevels(): Promise<CycleLevelStatus[]> {
  const actor = await getActor();
  if (!actor) return [];
  const raw: any[] = await actor.checkCycleLevels();
  return raw.map((r) => ({
    name:      r.name,
    cycles:    r.cycles,
    status:    r.status,
    fromCache: r.fromCache,
  }));
}

export async function recordFrontendError(input: ErrorSummaryInput): Promise<void> {
  const actor = await getActor();
  if (!actor) return;
  const candid = {
    fingerprint : input.fingerprint,
    message     : input.message,
    errorType   : input.errorType,
    count       : BigInt(input.count),
    firstSeen   : input.firstSeen,
    lastSeen    : input.lastSeen,
    tierCounts  : input.tierCounts.map(([tier, count]) => [tier, BigInt(count)] as [string, bigint]),
    release     : input.release ? [input.release] : [],
  };
  await actor.recordFrontendError(candid);
}
