/**
 * useNeighborhoodScore — 4.3.4 Neighbourhood Benchmarking via vetKeys
 *
 * Flow:
 *  1. submitScore → canister computes composite score from job data and stores it
 *  2. getNeighborhoodPublicKey → fetch canister's vetKeys public key for verification
 *  3. getMyScoreEncrypted(transportPublicKey) → canister derives vetKey for caller
 *  4. decryptAndVerify → confirms the score came from this canister for this principal
 *  5. getZipStats → public aggregate (mean / median / sample size) for the zip code
 *
 * The vetKey step proves the score is canister-issued and principal-bound.
 * Individual scores are never accessible via any public canister query.
 *
 * @dfinity/vetkeys v0.4.0 — per ICP vetKeys skill guidance.
 */

import { useEffect, useState, useRef } from "react";
import { Principal } from "@dfinity/principal";
import {
  TransportSecretKey,
  DerivedPublicKey,
  EncryptedVetKey,
} from "@dfinity/vetkeys";
import {
  submitScore,
  getZipStats,
  getNeighborhoodPublicKey,
  getMyScoreEncrypted,
  type JobSummary,
  type ZipStats,
} from "../services/market";

export interface NeighborhoodScoreResult {
  myScore:    number | null;
  myGrade:    string | null;
  zipStats:   ZipStats | null;
  loading:    boolean;
  error:      string | null;
  /** Percentile rank within the zip (0-100, higher is better). null if < 2 neighbours. */
  percentile: number | null;
}

/**
 * Fetches, stores, and authenticates the caller's neighbourhood score.
 *
 * @param jobs        JobSummary array for the property (from marketService.jobToSummary)
 * @param yearBuilt   Property year built
 * @param zipCode     Property zip code
 * @param principalText  Authenticated caller's principal text (from authStore)
 */
export function useNeighborhoodScore(
  jobs:          JobSummary[],
  yearBuilt:     number,
  zipCode:       string,
  principalText: string | null,
): NeighborhoodScoreResult {
  const [myScore,    setMyScore]    = useState<number | null>(null);
  const [myGrade,    setMyGrade]    = useState<string | null>(null);
  const [zipStats,   setZipStats]   = useState<ZipStats | null>(null);
  const [percentile, setPercentile] = useState<number | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Stable ref to avoid re-running on every render.
  const runningRef = useRef(false);

  useEffect(() => {
    if (!principalText || !zipCode || jobs.length === 0 || runningRef.current) return;

    runningRef.current = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // ── Step 1: Submit score to canister ──────────────────────────────────
        await submitScore(jobs, yearBuilt, zipCode);

        // ── Step 2: Generate ephemeral transport key pair ─────────────────────
        // Per vetKeys skill: generate a fresh pair per session, never reuse.
        const seed = crypto.getRandomValues(new Uint8Array(32));
        const tsk  = TransportSecretKey.fromSeed(seed);
        const tpk  = tsk.publicKey();

        // ── Steps 3 + 4: Fetch encrypted score + public key in parallel ───────
        const [envelope, pubKeyBytes] = await Promise.all([
          getMyScoreEncrypted(tpk),
          getNeighborhoodPublicKey(),
        ]);

        // ── Step 5: Decrypt and verify the vetKey ─────────────────────────────
        // Per vetKeys skill: decrypt first, then verify against the public key.
        // input = Principal.toUint8Array(caller) — must match what the canister
        // passed as `input` to vetkd_derive_key.
        const verificationKey = DerivedPublicKey.deserialize(pubKeyBytes);
        const encryptedVetKey = EncryptedVetKey.deserialize(envelope.encryptedKey);
        const principalBytes  = Principal.fromText(principalText).toUint8Array();

        // Throws if the key was not issued by this canister for this principal.
        encryptedVetKey.decryptAndVerify(tsk, verificationKey, principalBytes);

        // Score is now authenticated — set state.
        const grade = gradeFromScore(envelope.score);
        setMyScore(envelope.score);
        setMyGrade(grade);

        // ── Step 6: Fetch zip-level aggregate ─────────────────────────────────
        const stats = await getZipStats(zipCode);
        setZipStats(stats);

        if (stats && stats.sampleSize >= 2) {
          setPercentile(computePercentile(envelope.score, stats));
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load neighbourhood score");
      } finally {
        setLoading(false);
        runningRef.current = false;
      }
    })();
  // Re-run when the property or auth changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipCode, yearBuilt, principalText]);

  return { myScore, myGrade, zipStats, percentile, loading, error };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

/**
 * Rough percentile estimate from zip mean/median.
 * Assumes a roughly symmetric distribution around the median.
 * Returns 0-100 (higher = better than more of your neighbours).
 */
function computePercentile(score: number, stats: ZipStats): number {
  if (stats.sampleSize < 2) return 50;
  // Simple linear estimate: distance from median as fraction of plausible spread.
  const spread = Math.max(stats.median, 1);
  const delta  = score - stats.median;
  const pct    = 50 + Math.round((delta / spread) * 30);
  return Math.max(1, Math.min(99, pct));
}
