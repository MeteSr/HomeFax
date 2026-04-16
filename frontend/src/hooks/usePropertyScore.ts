import { useState, useEffect } from "react";
import { computeScore, recordSnapshot, loadHistory, type ScoreSnapshot } from "@/services/scoreService";
import { type Property } from "@/services/property";
import { type Job } from "@/services/job";

export interface PropertyScore {
  scoreHistory: ScoreSnapshot[];
}

export function usePropertyScore(
  propertyId: string | undefined,
  property: Property | null,
  jobs: Job[],
  loading: boolean
): PropertyScore {
  const [scoreHistory, setScoreHistory] = useState<ScoreSnapshot[]>(() =>
    propertyId ? loadHistory(propertyId) : []
  );

  // Reload history when propertyId changes
  useEffect(() => {
    if (!propertyId) return;
    setScoreHistory(loadHistory(propertyId));
  }, [propertyId]);

  // Record snapshot once property + jobs are resolved
  useEffect(() => {
    if (!loading && property) {
      const rawScore = computeScore(jobs, [property]);
      const history = recordSnapshot(rawScore, String(property.id));
      setScoreHistory(history);
    }
  }, [loading, property, jobs]);

  return { scoreHistory };
}
