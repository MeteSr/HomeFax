import { HttpAgent } from "@dfinity/agent";
import type { Urgency } from "./quoteFormService";

export type QuoteRequestStatus = "open" | "quoted" | "accepted" | "closed";

export interface QuoteRequest {
  id:          string;
  propertyId:  string;
  serviceType: string;
  urgency:     Urgency;
  description: string;
  status:      QuoteRequestStatus;
  createdAt:   number;  // ms
}

export interface CreateQuoteInput {
  propertyId:  string;
  serviceType: string;
  urgency:     Urgency;
  description: string;
}

// Mutable so createQuoteRequest can append
const MOCK_REQUESTS: QuoteRequest[] = [
  {
    id:          "req_1",
    propertyId:  "prop_1",
    serviceType: "HVAC",
    urgency:     "high",
    description: "AC unit not cooling — 12-year-old unit needs diagnosis.",
    status:      "quoted",
    createdAt:   Date.now() - 86400000 * 3,
  },
  {
    id:          "req_2",
    propertyId:  "prop_1",
    serviceType: "Roofing",
    urgency:     "medium",
    description: "Several shingles missing after last storm. Small attic leak.",
    status:      "open",
    createdAt:   Date.now() - 86400000 * 8,
  },
];

export async function getMyQuoteRequests(
  propertyId: string,
  _agent?: HttpAgent,
): Promise<QuoteRequest[]> {
  // TODO: replace with real canister call — quote.getMyQuoteRequests()
  return MOCK_REQUESTS.filter((r) => r.propertyId === propertyId);
}

export async function createQuoteRequest(
  input: CreateQuoteInput,
  _agent?: HttpAgent,
): Promise<QuoteRequest> {
  // TODO: replace with real canister call — quote.createQuoteRequest(propertyId, serviceType, description, urgency)
  const req: QuoteRequest = {
    id:          `req_${Date.now()}`,
    propertyId:  input.propertyId,
    serviceType: input.serviceType,
    urgency:     input.urgency,
    description: input.description,
    status:      "open",
    createdAt:   Date.now(),
  };
  MOCK_REQUESTS.push(req);
  return req;
}
