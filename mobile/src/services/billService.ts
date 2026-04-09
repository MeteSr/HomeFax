/**
 * Mobile Bill Service (Epic #49)
 *
 * Calls the voice agent's /api/extract-bill endpoint to OCR a bill
 * image captured by the camera or selected from the photo library.
 * Then saves the confirmed bill record to the bills canister via
 * the billService REST-style shim (same mock pattern as other services).
 */

const VOICE_AGENT_URL =
  process.env.EXPO_PUBLIC_VOICE_AGENT_URL ?? "http://localhost:3001";

export type BillType = "Electric" | "Gas" | "Water" | "Internet" | "Telecom" | "Other";

export interface BillExtraction {
  billType?:    BillType;
  provider?:    string;
  periodStart?: string;  // YYYY-MM-DD
  periodEnd?:   string;  // YYYY-MM-DD
  amountCents?: number;
  usageAmount?: number;
  usageUnit?:   string;
  confidence:   "high" | "medium" | "low";
  description:  string;
}

export interface BillRecord {
  id:            string;
  propertyId:    string;
  billType:      BillType;
  provider:      string;
  periodStart:   string;
  periodEnd:     string;
  amountCents:   number;
  usageAmount?:  number;
  usageUnit?:    string;
  uploadedAt:    number;
  anomalyFlag:   boolean;
  anomalyReason?: string;
}

export interface AddBillArgs {
  propertyId:  string;
  billType:    BillType;
  provider:    string;
  periodStart: string;
  periodEnd:   string;
  amountCents: number;
  usageAmount?: number;
  usageUnit?:  string;
}

// ─── In-memory mock (dev without canister) ───────────────────────────────────

let _mockBills: BillRecord[] = [];
let _mockNextId = 1;

function mockAdd(args: AddBillArgs): BillRecord {
  const existing = _mockBills.filter(
    (b) => b.propertyId === args.propertyId && b.billType === args.billType
  );
  const recent = existing.slice(-3);
  let anomalyFlag = false;
  let anomalyReason: string | undefined;
  if (recent.length >= 2) {
    const avg = recent.reduce((s, b) => s + b.amountCents, 0) / recent.length;
    if (args.amountCents > avg * 1.2) {
      anomalyFlag   = true;
      anomalyReason = `Bill is above your 3-month average for ${args.provider}`;
    }
  }
  const record: BillRecord = {
    id:           `BILL_${_mockNextId++}`,
    propertyId:   args.propertyId,
    billType:     args.billType,
    provider:     args.provider,
    periodStart:  args.periodStart,
    periodEnd:    args.periodEnd,
    amountCents:  args.amountCents,
    usageAmount:  args.usageAmount,
    usageUnit:    args.usageUnit,
    uploadedAt:   Date.now(),
    anomalyFlag,
    anomalyReason,
  };
  _mockBills.push(record);
  return record;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a base64-encoded bill image to the voice agent for OCR extraction.
 * Returns structured bill data for user confirmation before saving.
 */
export async function extractBill(
  fileName: string,
  mimeType: string,
  base64Data: string,
): Promise<BillExtraction> {
  const res = await fetch(`${VOICE_AGENT_URL}/api/extract-bill`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ fileName, mimeType, base64Data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Bill extraction failed");
  }
  return res.json();
}

/** Save a confirmed bill record. Falls back to in-memory mock locally. */
export async function addBill(args: AddBillArgs): Promise<BillRecord> {
  // In production this would call the bills canister directly via @dfinity/agent.
  // For mobile we proxy through the same mock path used by other services.
  return mockAdd(args);
}

/** Fetch all bills for a property (mock only in mobile for now). */
export async function getBillsForProperty(propertyId: string): Promise<BillRecord[]> {
  return _mockBills.filter((b) => b.propertyId === propertyId);
}
