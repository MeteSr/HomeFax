import * as SecureStore from "expo-secure-store";

const DELEGATION_KEY = "hf_delegation_chain";
const PUBKEY_KEY     = "hf_user_pubkey";

export interface StoredAuth {
  delegationChainJSON: string;
  userPublicKey: string;
}

export async function saveAuth(auth: StoredAuth): Promise<void> {
  await SecureStore.setItemAsync(DELEGATION_KEY, auth.delegationChainJSON);
  await SecureStore.setItemAsync(PUBKEY_KEY, auth.userPublicKey);
}

export async function loadAuth(): Promise<StoredAuth | null> {
  const delegationChainJSON = await SecureStore.getItemAsync(DELEGATION_KEY);
  const userPublicKey        = await SecureStore.getItemAsync(PUBKEY_KEY);
  if (!delegationChainJSON || !userPublicKey) return null;
  return { delegationChainJSON, userPublicKey };
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(DELEGATION_KEY);
  await SecureStore.deleteItemAsync(PUBKEY_KEY);
}
