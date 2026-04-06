/**
 * HomeGentic Admin Metrics Dashboard
 *
 * Queries three canisters directly via @dfinity/agent (anonymous identity,
 * public query methods only — no auth required):
 *   - auth    → getUserStats()
 *   - payment → getSubscriptionStats()
 *   - monitoring → getActiveAlerts(), getAllCanisterMetrics()
 *
 * Canister IDs are injected at build time from .env via vite.config.ts.
 * Run: cd dashboard && npm run dev  (port 3002)
 */

import React, { useEffect, useState, useCallback } from "react";
import { HttpAgent, Actor } from "@dfinity/agent";
import { RefreshCw, AlertTriangle, Users, DollarSign, Activity, Server } from "lucide-react";

// ── Types mirroring canister Motoko types ────────────────────────────────────

interface UserStats {
  total: bigint;
  newToday: bigint;
  newThisWeek: bigint;
  activeThisWeek: bigint;
  homeowners: bigint;
  contractors: bigint;
  realtors: bigint;
  builders: bigint;
}

interface SubscriptionStats {
  total: bigint;
  free: bigint;
  pro: bigint;
  premium: bigint;
  contractorPro: bigint;
  activePaid: bigint;
  estimatedMrrUsd: bigint;
}

interface Alert {
  id: string;
  severity: { Critical?: null } | { Warning?: null } | { Info?: null };
  category: object;
  message: string;
  resolved: boolean;
  createdAt: bigint;
  canisterId: [] | [object];
  resolvedAt: [] | [bigint];
}

interface CanisterMetrics {
  canisterId: object;
  cyclesBalance: bigint;
  cyclesBurned: bigint;
  memoryBytes: bigint;
  requestCount: bigint;
  errorCount: bigint;
  avgResponseTimeMs: bigint;
  updatedAt: bigint;
  memoryCapacity: bigint;
}

// ── Inline IDL factories ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authIdlFactory = ({ IDL: I }: any) => {
  const UserStats = I.Record({
    total:          I.Nat,
    newToday:       I.Nat,
    newThisWeek:    I.Nat,
    activeThisWeek: I.Nat,
    homeowners:     I.Nat,
    contractors:    I.Nat,
    realtors:       I.Nat,
    builders:       I.Nat,
  });
  return I.Service({ getUserStats: I.Func([], [UserStats], ["query"]) });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const paymentIdlFactory = ({ IDL: I }: any) => {
  const SubscriptionStats = I.Record({
    total:           I.Nat,
    free:            I.Nat,
    pro:             I.Nat,
    premium:         I.Nat,
    contractorPro:   I.Nat,
    activePaid:      I.Nat,
    estimatedMrrUsd: I.Nat,
  });
  return I.Service({ getSubscriptionStats: I.Func([], [SubscriptionStats], ["query"]) });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const monitoringIdlFactory = ({ IDL: I }: any) => {
  const AlertSeverity = I.Variant({ Critical: I.Null, Warning: I.Null, Info: I.Null });
  const AlertCategory = I.Variant({
    Cycles: I.Null, ErrorRate: I.Null, ResponseTime: I.Null,
    Memory: I.Null, Milestone: I.Null, TopUp: I.Null,
  });
  const Alert = I.Record({
    id:         I.Text,
    severity:   AlertSeverity,
    category:   AlertCategory,
    canisterId: I.Opt(I.Principal),
    message:    I.Text,
    resolved:   I.Bool,
    createdAt:  I.Int,
    resolvedAt: I.Opt(I.Int),
  });
  const CanisterMetrics = I.Record({
    canisterId:        I.Principal,
    cyclesBalance:     I.Nat,
    cyclesBurned:      I.Nat,
    memoryBytes:       I.Nat,
    memoryCapacity:    I.Nat,
    requestCount:      I.Nat,
    errorCount:        I.Nat,
    avgResponseTimeMs: I.Nat,
    updatedAt:         I.Int,
  });
  return I.Service({
    getActiveAlerts:      I.Func([], [I.Vec(Alert)],          ["query"]),
    getAllCanisterMetrics: I.Func([], [I.Vec(CanisterMetrics)], ["query"]),
  });
};

// ── Agent factory ─────────────────────────────────────────────────────────────

async function makeAgent(): Promise<HttpAgent> {
  const network = process.env.DFX_NETWORK || "local";
  const host = network === "local" ? "http://localhost:4943" : "https://icp-api.io";
  const agent = new HttpAgent({ host });
  if (network === "local") {
    await agent.fetchRootKey().catch(() => {
      console.warn("[dashboard] fetchRootKey failed — is dfx running?");
    });
  }
  return agent;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:       "#0E0E0C",
  surface:  "#1A1A17",
  border:   "#2E2E2A",
  text:     "#F4F1EB",
  muted:    "#7A7268",
  green:    "#4CAF7D",
  rust:     "#C94C2E",
  amber:    "#D97706",
  blue:     "#4A90D9",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color = C.text,
}: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      padding: "20px 24px", flex: "1 1 180px",
    }}>
      <div style={{ fontSize: "0.65rem", fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: "0.65rem", fontFamily: "IBM Plex Mono, monospace",
      letterSpacing: "0.12em", textTransform: "uppercase",
      color: C.muted, marginBottom: 12, paddingBottom: 8,
      borderBottom: `1px solid ${C.border}`,
    }}>
      {children}
    </h2>
  );
}

function severityColor(sev: Alert["severity"]): string {
  if ("Critical" in sev) return C.rust;
  if ("Warning"  in sev) return C.amber;
  return C.blue;
}

function severityLabel(sev: Alert["severity"]): string {
  if ("Critical" in sev) return "CRIT";
  if ("Warning"  in sev) return "WARN";
  return "INFO";
}

function n(v: bigint): number { return Number(v); }
function fmt(v: bigint): string { return Number(v).toLocaleString(); }

// ── Main component ────────────────────────────────────────────────────────────

interface DashData {
  users: UserStats;
  subs: SubscriptionStats;
  alerts: Alert[];
  canisters: CanisterMetrics[];
}

export default function MonitoringDashboard() {
  const [data, setData]         = useState<DashData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [refreshed, setRefreshed] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const agent = await makeAgent();

      const authId       = process.env.AUTH_CANISTER_ID;
      const paymentId    = process.env.PAYMENT_CANISTER_ID;
      const monitoringId = process.env.MONITORING_CANISTER_ID;

      if (!authId || !paymentId || !monitoringId) {
        throw new Error(
          "Canister IDs not configured. Copy .env.example → .env and run dfx deploy."
        );
      }

      const authActor       = Actor.createActor(authIdlFactory,       { agent, canisterId: authId });
      const paymentActor    = Actor.createActor(paymentIdlFactory,    { agent, canisterId: paymentId });
      const monitoringActor = Actor.createActor(monitoringIdlFactory, { agent, canisterId: monitoringId });

      // Cast via unknown — IDL factory types don't line up with generated TS types
      type AuthActor       = { getUserStats:         () => Promise<UserStats> };
      type PaymentActor    = { getSubscriptionStats: () => Promise<SubscriptionStats> };
      type MonitoringActor = { getActiveAlerts: () => Promise<Alert[]>; getAllCanisterMetrics: () => Promise<CanisterMetrics[]> };

      const [users, subs, alerts, canisters] = await Promise.all([
        (authActor       as unknown as AuthActor).getUserStats(),
        (paymentActor    as unknown as PaymentActor).getSubscriptionStats(),
        (monitoringActor as unknown as MonitoringActor).getActiveAlerts(),
        (monitoringActor as unknown as MonitoringActor).getAllCanisterMetrics(),
      ]);

      setData({ users, subs, alerts, canisters });
      setRefreshed(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "IBM Plex Mono, monospace" }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
            Home<span style={{ color: C.green }}>Gentic</span>
          </span>
          <span style={{ marginLeft: 16, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: C.muted }}>
            Admin Dashboard
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: "0.7rem", color: C.muted }}>
            {loading ? "Refreshing…" : `Updated ${refreshed.toLocaleTimeString()}`}
          </span>
          <button
            onClick={() => void load()}
            disabled={loading}
            style={{
              background: "none", border: `1px solid ${C.border}`, color: C.text,
              padding: "6px 12px", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6, fontSize: "0.7rem",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ padding: "32px" }}>
        {/* Error state */}
        {error && (
          <div style={{
            background: "#2D1A17", border: `1px solid ${C.rust}`,
            padding: "16px 20px", marginBottom: 32, display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <AlertTriangle size={16} color={C.rust} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: C.rust, marginBottom: 4 }}>Failed to load data</div>
              <div style={{ fontSize: "0.75rem", color: C.muted }}>{error}</div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !data && (
          <div style={{ color: C.muted, fontSize: "0.75rem", textAlign: "center", paddingTop: 80 }}>
            Querying canisters…
          </div>
        )}

        {data && (
          <>
            {/* ── Users ─────────────────────────────────────────────────────── */}
            <div style={{ marginBottom: 40 }}>
              <SectionHeader><Users size={10} style={{ marginRight: 6 }} />Users</SectionHeader>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <StatCard label="Total Users"    value={fmt(data.users.total)} />
                <StatCard label="New Today"      value={fmt(data.users.newToday)}     color={n(data.users.newToday) > 0 ? C.green : C.text} />
                <StatCard label="New This Week"  value={fmt(data.users.newThisWeek)}  color={n(data.users.newThisWeek) > 0 ? C.green : C.text} />
                <StatCard label="Active (7d)"    value={fmt(data.users.activeThisWeek)}
                  sub={`${data.users.total > 0n ? Math.round(n(data.users.activeThisWeek) / n(data.users.total) * 100) : 0}% engagement`}
                />
              </div>
            </div>

            {/* ── Role breakdown ─────────────────────────────────────────────── */}
            <div style={{ marginBottom: 40 }}>
              <SectionHeader>Roles</SectionHeader>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <StatCard label="Homeowners"    value={fmt(data.users.homeowners)} />
                <StatCard label="Contractors"   value={fmt(data.users.contractors)} />
                <StatCard label="Realtors"      value={fmt(data.users.realtors)} />
                <StatCard label="Builders"      value={fmt(data.users.builders)} />
              </div>
            </div>

            {/* ── Revenue ────────────────────────────────────────────────────── */}
            <div style={{ marginBottom: 40 }}>
              <SectionHeader><DollarSign size={10} style={{ marginRight: 6 }} />Revenue</SectionHeader>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <StatCard label="Est. MRR"       value={`$${fmt(data.subs.estimatedMrrUsd)}`} color={C.green} />
                <StatCard label="Active Paid"    value={fmt(data.subs.activePaid)} sub="non-free, not expired" />
                <StatCard label="Pro"            value={fmt(data.subs.pro)}            sub="$10/mo" />
                <StatCard label="Premium"        value={fmt(data.subs.premium)}        sub="$49/mo" />
                <StatCard label="ContractorPro"  value={fmt(data.subs.contractorPro)}  sub="$49/mo" />
                <StatCard label="Free Tier"      value={fmt(data.subs.free)}           color={C.muted} />
              </div>
            </div>

            {/* ── Active Alerts ──────────────────────────────────────────────── */}
            <div style={{ marginBottom: 40 }}>
              <SectionHeader>
                <AlertTriangle size={10} style={{ marginRight: 6 }} />
                Active Alerts ({data.alerts.length})
              </SectionHeader>
              {data.alerts.length === 0 ? (
                <div style={{ fontSize: "0.75rem", color: C.muted, padding: "16px 0" }}>No active alerts.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {data.alerts.map((a) => (
                    <div key={a.id} style={{
                      background: C.surface, border: `1px solid ${C.border}`,
                      padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12,
                    }}>
                      <span style={{
                        fontSize: "0.6rem", fontWeight: 700, color: severityColor(a.severity),
                        border: `1px solid ${severityColor(a.severity)}`,
                        padding: "2px 6px", flexShrink: 0, marginTop: 1,
                      }}>
                        {severityLabel(a.severity)}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: C.text }}>{a.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Canister Health ────────────────────────────────────────────── */}
            <div style={{ marginBottom: 40 }}>
              <SectionHeader>
                <Server size={10} style={{ marginRight: 6 }} />
                Canister Health ({data.canisters.length} reporting)
              </SectionHeader>
              {data.canisters.length === 0 ? (
                <div style={{ fontSize: "0.75rem", color: C.muted, padding: "16px 0" }}>
                  No canister metrics recorded yet. Canisters push metrics via recordCanisterMetrics().
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.7rem" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
                      <th style={{ textAlign: "left", padding: "6px 12px 6px 0", fontWeight: 400 }}>Canister</th>
                      <th style={{ textAlign: "right", padding: "6px 12px", fontWeight: 400 }}>Cycles (B)</th>
                      <th style={{ textAlign: "right", padding: "6px 12px", fontWeight: 400 }}>Requests</th>
                      <th style={{ textAlign: "right", padding: "6px 12px", fontWeight: 400 }}>Errors</th>
                      <th style={{ textAlign: "right", padding: "6px 12px", fontWeight: 400 }}>Avg ms</th>
                      <th style={{ textAlign: "right", padding: "6px 12px", fontWeight: 400 }}>Memory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.canisters.map((m, i) => {
                      const errRate = n(m.requestCount) > 0 ? n(m.errorCount) / n(m.requestCount) : 0;
                      const cyclesB = Math.round(n(m.cyclesBalance) / 1e9);
                      const memMB   = Math.round(n(m.memoryBytes) / 1e6);
                      const cidStr  = String(m.canisterId).slice(0, 20);
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "8px 12px 8px 0", color: C.muted, fontFamily: "monospace" }}>{cidStr}</td>
                          <td style={{ textAlign: "right", padding: "8px 12px", color: cyclesB < 5000 ? C.rust : cyclesB < 10000 ? C.amber : C.text }}>
                            {cyclesB.toLocaleString()}
                          </td>
                          <td style={{ textAlign: "right", padding: "8px 12px" }}>{fmt(m.requestCount)}</td>
                          <td style={{ textAlign: "right", padding: "8px 12px", color: errRate > 0.05 ? C.rust : errRate > 0.02 ? C.amber : C.text }}>
                            {fmt(m.errorCount)}
                          </td>
                          <td style={{ textAlign: "right", padding: "8px 12px", color: n(m.avgResponseTimeMs) > 2000 ? C.amber : C.text }}>
                            {fmt(m.avgResponseTimeMs)}
                          </td>
                          <td style={{ textAlign: "right", padding: "8px 12px", color: C.muted }}>{memMB} MB</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
