import { useMemo } from "react";
import { Actor, HttpAgent, Identity } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/homefax_backend";

const BACKEND_CANISTER_ID = process.env.HOMEFAX_BACKEND_CANISTER_ID || "";
const isDev = process.env.DFX_NETWORK !== "ic";

export function useBackend(identity: Identity | null) {
  return useMemo(() => {
    if (!identity) return null;

    const agent = new HttpAgent({
      identity,
      host: isDev ? "http://localhost:4943" : "https://ic0.app",
    });

    if (isDev) {
      agent.fetchRootKey().catch(console.error);
    }

    return Actor.createActor(idlFactory, {
      agent,
      canisterId: BACKEND_CANISTER_ID,
    }) as any;
  }, [identity]);
}
