import type { PushSubscription } from "web-push";

// principal → list of browser push subscriptions
const registry = new Map<string, PushSubscription[]>();

export function registerSubscription(principal: string, subscription: PushSubscription): void {
  const existing = registry.get(principal) ?? [];
  const idx = existing.findIndex((s) => s.endpoint === subscription.endpoint);
  if (idx >= 0) {
    existing[idx] = subscription;
  } else {
    existing.push(subscription);
  }
  registry.set(principal, existing);
}

export function getSubscriptionsForPrincipal(principal: string): PushSubscription[] {
  return registry.get(principal) ?? [];
}

export function removeSubscription(endpoint: string): void {
  for (const [principal, subs] of registry.entries()) {
    const filtered = subs.filter((s) => s.endpoint !== endpoint);
    if (filtered.length === 0) {
      registry.delete(principal);
    } else if (filtered.length < subs.length) {
      registry.set(principal, filtered);
    }
  }
}
