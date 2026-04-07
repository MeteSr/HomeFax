import { HttpAgent } from "@icp-sdk/core/agent";

export type Urgency = "Low" | "Medium" | "High" | "Emergency";

export interface Lead {
  id:          string;
  serviceType: string;
  description: string;
  urgency:     Urgency;
  propertyZip: string;
}

export interface PendingSignatureJob {
  id:            string;
  propertyAddress: string;
  serviceType:   string;
  completedDate: string;
  amountCents:   number;
  awaitingRole:  "homeowner" | "contractor";
}

export interface EarningsSummary {
  verifiedJobCount:  number;
  totalEarnedCents:  number;
  pendingJobCount:   number;
}

const URGENCY_ORDER: Record<Urgency, number> = { Emergency: 0, High: 1, Medium: 2, Low: 3 };

/** Pure — testable with no async/native deps */
export function formatPendingStatus(awaitingRole: "homeowner" | "contractor"): string {
  return awaitingRole === "contractor" ? "Your signature needed" : "Awaiting homeowner";
}

/** Pure — contractor-action jobs float to the top, then stable by completedDate */
export function sortPendingJobs(jobs: PendingSignatureJob[]): PendingSignatureJob[] {
  return [...jobs].sort((a, b) => {
    if (a.awaitingRole === b.awaitingRole) return 0;
    return a.awaitingRole === "contractor" ? -1 : 1;
  });
}

/** Pure — testable with no async/native deps */
export function filterLeadsBySpecialties(leads: Lead[], specialties: string[]): Lead[] {
  const filtered = specialties.length === 0
    ? [...leads]
    : leads.filter((l) => specialties.includes(l.serviceType));
  return filtered.sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);
}

/** Pure — testable with no async/native deps */
export function formatEarnings(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style:                 "currency",
    currency:              "USD",
    maximumFractionDigits: 0,
  });
}

// ── Mock data ────────────────────���─────────────────────────────────────���──────

const MOCK_LEADS: Lead[] = [
  { id: "q1", serviceType: "HVAC",     description: "AC unit not cooling — 2,400 sq ft home", urgency: "High",   propertyZip: "78701" },
  { id: "q2", serviceType: "Plumbing", description: "Kitchen faucet leaking under sink",        urgency: "Low",    propertyZip: "78702" },
  { id: "q3", serviceType: "HVAC",     description: "Furnace annual inspection",                urgency: "Medium", propertyZip: "78701" },
];

const MOCK_PENDING: PendingSignatureJob[] = [
  {
    id:              "job_5",
    propertyAddress: "456 Elm St, Austin TX",
    serviceType:     "HVAC",
    completedDate:   "2026-03-28",
    amountCents:     185000,
    awaitingRole:    "homeowner",
  },
];

const MOCK_EARNINGS: EarningsSummary = {
  verifiedJobCount: 14,
  totalEarnedCents: 2340000,
  pendingJobCount:  2,
};

export async function getLeads(_agent?: HttpAgent): Promise<Lead[]> {
  // TODO: replace with real canister call
  return MOCK_LEADS;
}

export async function getPendingSignatureJobs(_agent?: HttpAgent): Promise<PendingSignatureJob[]> {
  return MOCK_PENDING;
}

export async function getEarningsSummary(_agent?: HttpAgent): Promise<EarningsSummary> {
  return MOCK_EARNINGS;
}
