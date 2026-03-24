import { useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Identity } from "@dfinity/agent";

const II_URL = process.env.II_URL || "https://identity.ic0.app";
const SESSION_DURATION = BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000); // 7 days in nanoseconds

export interface AuthState {
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: string | null;
  authClient: AuthClient | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    identity: null,
    principal: null,
    authClient: null,
    isLoading: true,
  });

  useEffect(() => {
    AuthClient.create().then(async (client) => {
      const isAuthenticated = await client.isAuthenticated();
      if (isAuthenticated) {
        const identity = client.getIdentity();
        setState({
          isAuthenticated: true,
          identity,
          principal: identity.getPrincipal().toText(),
          authClient: client,
          isLoading: false,
        });
      } else {
        setState((s) => ({ ...s, authClient: client, isLoading: false }));
      }
    });
  }, []);

  const login = async () => {
    if (!state.authClient) return;
    await state.authClient.login({
      identityProvider: II_URL,
      maxTimeToLive: SESSION_DURATION,
      onSuccess: () => {
        const identity = state.authClient!.getIdentity();
        setState((s) => ({
          ...s,
          isAuthenticated: true,
          identity,
          principal: identity.getPrincipal().toText(),
        }));
      },
    });
  };

  const logout = async () => {
    if (!state.authClient) return;
    await state.authClient.logout();
    setState((s) => ({
      ...s,
      isAuthenticated: false,
      identity: null,
      principal: null,
    }));
  };

  return { ...state, login, logout };
}
