/**
 * Contractor re-engagement service (8.6.4).
 *
 * Scans verified job history and surfaces prompts when the most recent
 * contractor job for a given service type falls in the 10–13 month window —
 * suggesting the homeowner re-book the same contractor.
 *
 * Public API:
 *   getReEngagementPrompts(jobs, nowMs?)  → ReEngagementPrompt[]
 */

import type { Job } from "./job";

export interface ReEngagementPrompt {
  jobId:          string;
  contractorName: string;
  serviceType:    string;
  monthsSince:    number;    // integer months elapsed since job date
  message:        string;    // human-readable suggestion
}

// Window: 10–13 months since the completed job date
const MIN_MONTHS = 10;
const MAX_MONTHS = 13;

/** Months elapsed between a YYYY-MM-DD date string and nowMs (calendar months, integer). */
function monthsElapsed(dateStr: string, nowMs: number): number {
  const then = new Date(dateStr);
  const now  = new Date(nowMs);
  const months =
    (now.getUTCFullYear() - then.getUTCFullYear()) * 12 +
    (now.getUTCMonth()    - then.getUTCMonth());
  // Subtract 1 if the day-of-month hasn't fully rolled over yet
  return now.getUTCDate() >= then.getUTCDate() ? months : months - 1;
}

/**
 * Returns one re-engagement prompt per service type where the most recent
 * verified contractor job falls in the 10–13 month window.
 *
 * @param jobs   All jobs for the property.
 * @param nowMs  Reference timestamp in ms (defaults to Date.now()).
 */
export function getReEngagementPrompts(
  jobs: Job[],
  nowMs: number = Date.now()
): ReEngagementPrompt[] {
  // Eligible: verified, has a contractor name, not DIY
  const eligible = jobs.filter(
    (j) => j.verified && j.contractorName && !j.isDiy
  );

  // Group by service type, keeping track of the most recent job per type
  const latestByType = new Map<string, Job>();
  for (const job of eligible) {
    const existing = latestByType.get(job.serviceType);
    if (!existing || job.date > existing.date) {
      latestByType.set(job.serviceType, job);
    }
  }

  const prompts: ReEngagementPrompt[] = [];

  for (const [, job] of latestByType) {
    const months = monthsElapsed(job.date, nowMs);
    if (months < MIN_MONTHS || months > MAX_MONTHS) continue;

    const name = job.contractorName!;
    prompts.push({
      jobId:          job.id,
      contractorName: name,
      serviceType:    job.serviceType,
      monthsSince:    months,
      message:
        `Book ${name} again — they did your last ${job.serviceType} service ${months} months ago.`,
    });
  }

  return prompts;
}
