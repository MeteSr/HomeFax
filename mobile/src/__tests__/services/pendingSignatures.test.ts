/**
 * @jest-environment node
 */
import {
  formatPendingStatus,
  sortPendingJobs,
  PendingSignatureJob,
} from "../../services/contractorService";

const JOB_AWAITING_HOMEOWNER: PendingSignatureJob = {
  id:              "job_1",
  propertyAddress: "123 Main St, Austin TX",
  serviceType:     "HVAC",
  completedDate:   "2026-03-01",
  amountCents:     185000,
  awaitingRole:    "homeowner",
};

const JOB_AWAITING_CONTRACTOR: PendingSignatureJob = {
  id:              "job_2",
  propertyAddress: "456 Oak Ave, Austin TX",
  serviceType:     "Plumbing",
  completedDate:   "2026-03-05",
  amountCents:     32000,
  awaitingRole:    "contractor",
};

// ── formatPendingStatus ───────────────────────────────────────────────────────

describe("formatPendingStatus", () => {
  it("returns action-required label when contractor must sign", () => {
    expect(formatPendingStatus("contractor")).toBe("Your signature needed");
  });

  it("returns waiting label when homeowner must sign", () => {
    expect(formatPendingStatus("homeowner")).toBe("Awaiting homeowner");
  });
});

// ── sortPendingJobs ───────────────────────────────────────────────────────────

describe("sortPendingJobs", () => {
  it("puts jobs awaiting contractor signature first", () => {
    const sorted = sortPendingJobs([JOB_AWAITING_HOMEOWNER, JOB_AWAITING_CONTRACTOR]);
    expect(sorted[0].awaitingRole).toBe("contractor");
  });

  it("preserves relative order within the same awaitingRole", () => {
    const jobs = [JOB_AWAITING_HOMEOWNER, { ...JOB_AWAITING_HOMEOWNER, id: "job_3", completedDate: "2026-03-10" }];
    const sorted = sortPendingJobs(jobs);
    expect(sorted[0].id).toBe("job_1");
    expect(sorted[1].id).toBe("job_3");
  });

  it("returns empty array for empty input", () => {
    expect(sortPendingJobs([])).toEqual([]);
  });
});
