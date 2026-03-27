export interface PropertyContext {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  yearBuilt: number;
  squareFeet: number;
  verificationLevel: string;
}

export interface JobContext {
  id: string;
  serviceType: string;
  description: string;
  contractorName?: string;
  amount: number; // cents
  status: string;
  date: string;
  warrantyMonths?: number;
}

export interface WarrantyAlert {
  jobId: string;
  serviceType: string;
  daysRemaining: number;
  expiryDate: string; // YYYY-MM-DD
}

export interface AgentContext {
  properties: PropertyContext[];
  recentJobs: JobContext[];
  expiringWarranties: WarrantyAlert[];
  pendingSignatureJobIds: string[];
  openQuoteCount: number;
}

export interface ChatRequest {
  message: string;
  context: AgentContext;
}
