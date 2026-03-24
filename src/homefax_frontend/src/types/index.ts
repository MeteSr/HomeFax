export type MaintenanceCategory =
  | { Plumbing: null }
  | { HVAC: null }
  | { Electrical: null }
  | { Roofing: null }
  | { Foundation: null }
  | { Appliances: null }
  | { Landscaping: null }
  | { Pest: null }
  | { Inspection: null }
  | { Renovation: null }
  | { Other: null };

export interface Property {
  id: bigint;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  yearBuilt: bigint;
  squareFeet: bigint;
  owner: import("@dfinity/principal").Principal;
  createdAt: bigint;
  isPublic: boolean;
}

export interface MaintenanceRecord {
  id: bigint;
  propertyId: bigint;
  category: MaintenanceCategory;
  title: string;
  description: string;
  contractor: [] | [string];
  cost: [] | [bigint];
  datePerformed: bigint;
  addedBy: import("@dfinity/principal").Principal;
  createdAt: bigint;
  receiptHash: [] | [string];
  verified: boolean;
}

export interface HomeFaxReport {
  property: Property;
  records: MaintenanceRecord[];
  totalCost: bigint;
  recordCount: bigint;
}

export interface CreatePropertyArgs {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  yearBuilt: bigint;
  squareFeet: bigint;
  isPublic: boolean;
}

export interface CreateRecordArgs {
  propertyId: bigint;
  category: MaintenanceCategory;
  title: string;
  description: string;
  contractor: [] | [string];
  cost: [] | [bigint];
  datePerformed: bigint;
  receiptHash: [] | [string];
}

export const CATEGORY_LABELS: Record<string, string> = {
  Plumbing: "Plumbing",
  HVAC: "HVAC",
  Electrical: "Electrical",
  Roofing: "Roofing",
  Foundation: "Foundation",
  Appliances: "Appliances",
  Landscaping: "Landscaping",
  Pest: "Pest Control",
  Inspection: "Inspection",
  Renovation: "Renovation",
  Other: "Other",
};

export const CATEGORY_ICONS: Record<string, string> = {
  Plumbing: "🔧",
  HVAC: "❄️",
  Electrical: "⚡",
  Roofing: "🏠",
  Foundation: "🏗️",
  Appliances: "🍳",
  Landscaping: "🌿",
  Pest: "🐛",
  Inspection: "🔍",
  Renovation: "🔨",
  Other: "📋",
};

export function getCategoryKey(cat: MaintenanceCategory): string {
  return Object.keys(cat)[0];
}

export function formatCost(cents: bigint): string {
  const dollars = Number(cents) / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dollars);
}

export function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
