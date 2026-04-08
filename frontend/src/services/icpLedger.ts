import { Actor } from "@icp-sdk/core/agent";
import { getAgent } from "./actor";

const ICP_LEDGER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";

export const idlFactory = ({ IDL }: any) => {
  const Account = IDL.Record({
    owner:      IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const ApproveArgs = IDL.Record({
    from_subaccount:    IDL.Opt(IDL.Vec(IDL.Nat8)),
    spender:            Account,
    amount:             IDL.Nat,
    expected_allowance: IDL.Opt(IDL.Nat),
    expires_at:         IDL.Opt(IDL.Nat64),
    fee:                IDL.Opt(IDL.Nat),
    memo:               IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time:    IDL.Opt(IDL.Nat64),
  });
  const ApproveError = IDL.Variant({
    BadFee:               IDL.Record({ expected_fee: IDL.Nat }),
    InsufficientFunds:    IDL.Record({ balance: IDL.Nat }),
    AllowanceChanged:     IDL.Record({ current_allowance: IDL.Nat }),
    Expired:              IDL.Record({ ledger_time: IDL.Nat64 }),
    TooOld:               IDL.Null,
    CreatedInFuture:      IDL.Record({ ledger_time: IDL.Nat64 }),
    Duplicate:            IDL.Record({ duplicate_of: IDL.Nat }),
    TemporarilyUnavailable: IDL.Null,
    GenericError:         IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
  });
  return IDL.Service({
    icrc2_approve:    IDL.Func(
      [ApproveArgs],
      [IDL.Variant({ Ok: IDL.Nat, Err: ApproveError })],
      []
    ),
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ["query"]),
  });
};

let _actor: any = null;

async function getActor() {
  if (!_actor) {
    const ag = await getAgent();
    _actor = Actor.createActor(idlFactory, { agent: ag, canisterId: ICP_LEDGER_ID });
  }
  return _actor;
}

export const icpLedgerService = {
  /**
   * Approve the payment canister to spend amountE8s on behalf of the caller.
   * Sets a short expiry (10 minutes) to limit exposure if subscribe fails.
   * Triggers an Internet Identity popup for user confirmation.
   */
  async approve(spenderCanisterId: string, amountE8s: bigint): Promise<void> {
    const { Principal } = await import("@icp-sdk/core/principal");
    const a = await getActor();
    const expiresAtNs = BigInt(Date.now()) * BigInt(1_000_000) + BigInt(10 * 60 * 1_000_000_000);
    const result = await a.icrc2_approve({
      from_subaccount:    [],
      spender:            { owner: Principal.fromText(spenderCanisterId), subaccount: [] },
      amount:             amountE8s,
      expected_allowance: [],
      expires_at:         [expiresAtNs],
      fee:                [BigInt(10_000)],
      memo:               [],
      created_at_time:    [],
    });
    if ("Err" in result) {
      const key = Object.keys(result.Err)[0];
      const detail = result.Err[key];
      if (key === "InsufficientFunds") {
        throw new Error(`Insufficient ICP balance (have ${detail.balance} e8s)`);
      }
      throw new Error(`Approve failed: ${key}`);
    }
  },

  /** Returns the caller's ICP balance in e8s. */
  async getBalance(principalText: string): Promise<bigint> {
    const { Principal } = await import("@icp-sdk/core/principal");
    const a = await getActor();
    return a.icrc1_balance_of({ owner: Principal.fromText(principalText), subaccount: [] });
  },

  reset() { _actor = null; },
};
