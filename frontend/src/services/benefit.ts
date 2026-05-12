import { Actor } from "@icp-sdk/core/agent";
import { getAgent } from "@/services/actor";

// Quorum benefit canister — set VITE_QUORUM_BENEFIT_CANISTER_ID in .env
const QUORUM_BENEFIT_CANISTER_ID =
  (import.meta as any).env?.VITE_QUORUM_BENEFIT_CANISTER_ID ?? "";

/* eslint-disable @typescript-eslint/no-explicit-any */
function idlFactory({ IDL }: { IDL: any }) {
  const CouponRecord = IDL.Record({
    code:       IDL.Text,
    issuedAt:   IDL.Int,
    redeemedAt: IDL.Opt(IDL.Int),
  });

  const Error = IDL.Variant({
    NotAuthorized:   IDL.Null,
    NotFound:        IDL.Null,
    AlreadyRedeemed: IDL.Null,
  });

  const ResultCoupon = IDL.Variant({ ok: CouponRecord, err: Error });

  return IDL.Service({
    redeemCoupon: IDL.Func([IDL.Text], [ResultCoupon], []),
  });
}

export type RedeemResult =
  | { ok: { code: string; issuedAt: bigint; redeemedAt: [] | [bigint] } }
  | { err: { NotAuthorized: null } | { NotFound: null } | { AlreadyRedeemed: null } };

async function createActor() {
  if (!QUORUM_BENEFIT_CANISTER_ID) return null;
  const agent = await getAgent();
  return Actor.createActor(idlFactory, { agent, canisterId: QUORUM_BENEFIT_CANISTER_ID });
}

/** Called by HomeGentic after a successful checkout to mark the Quorum coupon as one-use. */
export async function redeemQuorumCoupon(code: string): Promise<RedeemResult> {
  const actor = await createActor() as any;
  if (!actor) return { err: { NotFound: null } };
  return actor.redeemCoupon(code);
}
