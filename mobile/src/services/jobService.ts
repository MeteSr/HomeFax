import { HttpAgent } from "@icp-sdk/core/agent";

export type JobStatus = "pending" | "awaiting_contractor" | "verified";

export interface CreateJobInput {
  propertyId:     string;
  serviceType:    string;
  description:    string;
  amountCents:    number;
  completedDate:  string;  // YYYY-MM-DD
  isDiy:          boolean;
  contractorName: string | null;
  permitNumber:   string | null;
}

export interface Job {
  id:           string;
  propertyId:   string;
  serviceType:  string;
  description:  string;
  amountCents:  number;
  completedDate: string;
  status:       JobStatus;
  isDiy:        boolean;
  contractorName?: string;
}

const MOCK_JOBS: Job[] = [
  {
    id:            "job_1",
    propertyId:    "prop_1",
    serviceType:   "HVAC",
    description:   "Annual HVAC service and filter replacement",
    amountCents:   18000,
    completedDate: "2025-10-15",
    status:        "verified",
    isDiy:         false,
    contractorName: "Cool Air Services",
  },
  {
    id:            "job_2",
    propertyId:    "prop_1",
    serviceType:   "Plumbing",
    description:   "Fixed leaking kitchen faucet",
    amountCents:   32000,
    completedDate: "2025-08-03",
    status:        "verified",
    isDiy:         true,
  },
];

export async function getJobs(propertyId: string, _agent?: HttpAgent): Promise<Job[]> {
  // TODO: replace with real canister call
  return MOCK_JOBS.filter((j) => j.propertyId === propertyId);
}

export async function createJob(input: CreateJobInput, _agent?: HttpAgent): Promise<Job> {
  // TODO: replace with real canister call
  const newJob: Job = {
    id:             `job_${Date.now()}`,
    propertyId:     input.propertyId,
    serviceType:    input.serviceType,
    description:    input.description,
    amountCents:    input.amountCents,
    completedDate:  input.completedDate,
    status:         input.isDiy ? "verified" : "awaiting_contractor",
    isDiy:          input.isDiy,
    contractorName: input.contractorName ?? undefined,
  };
  MOCK_JOBS.push(newJob);
  return newJob;
}

export async function uploadJobPhoto(
  jobId: string,
  base64: string,
  _agent?: HttpAgent,
): Promise<void> {
  // TODO: replace with real photo canister call
  // Canister: photo.addPhoto(jobId, { data: base64, mimeType: "image/jpeg" })
  console.log(`[uploadJobPhoto] job=${jobId} size=${base64.length} chars`);
}
