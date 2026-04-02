/**
 * fsboOfferService — Epic 10.5
 *
 * In-memory store for buyer offers received on a FSBO listing.
 * Handles intake, comparison data, counter-offer threading, and acceptance.
 */

export type FsboContingency = "inspection" | "financing" | "appraisal" | "saleOfHome";
export type FsboOfferStatus = "Active" | "Countered" | "Accepted" | "Rejected";

export interface FsboCounter {
  id:          string;
  offerId:     string;
  fromSeller:  boolean;
  amountCents: number;
  notes:       string;
  createdAt:   number;
}

export interface FsboOffer {
  id:                  string;
  propertyId:          string;
  buyerName:           string;
  offerAmountCents:    number;
  earnestMoneyCents:   number;
  contingencies:       string[];
  closeDateMs:         number;
  hasEscalationClause: boolean;
  status:              FsboOfferStatus;
  loggedAt:            number;
  counters:            FsboCounter[];
}

export interface LogFsboOfferInput {
  buyerName:           string;
  offerAmountCents:    number;
  earnestMoneyCents:   number;
  contingencies:       string[];
  closeDateMs:         number;
  hasEscalationClause: boolean;
}

export interface AddCounterInput {
  amountCents: number;
  notes:       string;
  fromSeller:  boolean;
}

// ─── Pure helpers ──────────────────────────────────────────────────────────────

/** Net proceeds = offer − 2% closing costs − seller concessions */
export function computeFsboNetProceeds(
  offerAmountCents: number,
  concessionsCents: number = 0
): number {
  const closingCostsCents = Math.round(offerAmountCents * 0.02);
  return offerAmountCents - closingCostsCents - concessionsCents;
}

/** Simple risk score: number of contingencies */
export function computeContingencyRisk(contingencies: string[]): number {
  return contingencies.length;
}

// ─── Service ──────────────────────────────────────────────────────────────────

function createFsboOfferService() {
  let _store: FsboOffer[] = [];
  let _seq = 0;

  function _update(id: string, patch: Partial<FsboOffer>): FsboOffer {
    _store = _store.map((o) => (o.id === id ? { ...o, ...patch } : o));
    return _store.find((o) => o.id === id)!;
  }

  return {
    async logOffer(propertyId: string, input: LogFsboOfferInput): Promise<FsboOffer> {
      const offer: FsboOffer = {
        id:                  `fo-${++_seq}`,
        propertyId,
        ...input,
        contingencies:       [...input.contingencies],
        status:              "Active",
        loggedAt:            Date.now(),
        counters:            [],
      };
      _store = [..._store, offer];
      return offer;
    },

    getByProperty(propertyId: string): FsboOffer[] {
      return _store.filter((o) => o.propertyId === propertyId);
    },

    async accept(id: string): Promise<FsboOffer> {
      return _update(id, { status: "Accepted" });
    },

    async reject(id: string): Promise<FsboOffer> {
      return _update(id, { status: "Rejected" });
    },

    async addCounter(id: string, input: AddCounterInput): Promise<FsboOffer> {
      const counter: FsboCounter = {
        id:          `ctr-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        offerId:     id,
        ...input,
        createdAt:   Date.now(),
      };
      const offer = _store.find((o) => o.id === id)!;
      return _update(id, {
        status:   "Countered",
        counters: [...offer.counters, counter],
      });
    },

    __reset() {
      _store = [];
      _seq   = 0;
    },
  };
}

export const fsboOfferService = createFsboOfferService();
