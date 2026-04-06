/**
 * §17.4 — Buyer Report Lookup
 *
 * Lets buyers search for a HomeGentic report by property address without login.
 * Calls the ai_proxy canister which queries the report canister for public links.
 */

import { aiProxyService } from "./aiProxy";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BuyerLookupResult {
  found:              boolean;
  token?:             string;
  address:            string;
  verificationLevel?: string;
  propertyType?:      string;
  yearBuilt?:         number;
}

// ── normalizeAddress ──────────────────────────────────────────────────────────

export function normalizeAddress(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[,.]$/, "")
    .trim();
}

// ── lookupReport ──────────────────────────────────────────────────────────────

export async function lookupReport(address: string): Promise<BuyerLookupResult> {
  const normalized = normalizeAddress(address);
  const result     = await aiProxyService.checkReport(normalized);
  return result as BuyerLookupResult;
}

// ── submitReportRequest ───────────────────────────────────────────────────────

export async function submitReportRequest(
  address:    string,
  buyerEmail: string,
): Promise<boolean> {
  const result = await aiProxyService.requestReport(address, buyerEmail);
  return result.queued;
}
