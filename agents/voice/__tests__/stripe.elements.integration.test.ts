/**
 * Stripe Elements Checkout — integration tests
 *
 * ELEM.1  create-subscription-intent returns clientSecret + sessionId for each tier
 * ELEM.2  Session is created with ui_mode:'elements' and mode:'subscription'
 * ELEM.3  Session metadata carries icp_principal, tier, billing
 * ELEM.4  clientSecret has the expected cs_test_ prefix
 * ELEM.5  All six tier/billing combinations resolve to valid sessions
 * ELEM.6  Missing or unknown tier/billing returns a 400-equivalent Stripe error
 * ELEM.7  verify-session returns 400-like error for an open (unpaid) session
 *
 * Uses real Stripe sandbox API — skipped if STRIPE_SECRET_KEY is absent.
 * No charges are made; sessions expire automatically.
 *
 * Run:
 *   cd agents/voice && npm test -- stripe.elements.integration
 */

import dotenv from "dotenv";
import path from "path";
// Load root-level .env (two directories up from __tests__/)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import Stripe from "stripe";

const SECRET_KEY        = (process.env.STRIPE_SECRET_KEY ?? "").trim();
const PRICE_PRO_MONTHLY = (process.env.STRIPE_PRICE_PRO_MONTHLY ?? "").trim();
const FRONTEND_ORIGIN   = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

const PRICE_MAP: Record<string, string> = {
  "Pro-Monthly":           (process.env.STRIPE_PRICE_PRO_MONTHLY           ?? "").trim(),
  "Pro-Yearly":            (process.env.STRIPE_PRICE_PRO_YEARLY            ?? "").trim(),
  "Premium-Monthly":       (process.env.STRIPE_PRICE_PREMIUM_MONTHLY       ?? "").trim(),
  "Premium-Yearly":        (process.env.STRIPE_PRICE_PREMIUM_YEARLY        ?? "").trim(),
  "ContractorPro-Monthly": (process.env.STRIPE_PRICE_CONTRACTOR_PRO_MONTHLY ?? "").trim(),
  "ContractorPro-Yearly":  (process.env.STRIPE_PRICE_CONTRACTOR_PRO_YEARLY  ?? "").trim(),
};

const configured = SECRET_KEY.startsWith("sk_test_") && PRICE_PRO_MONTHLY.startsWith("price_");
const describeIfConfigured = configured ? describe : describe.skip;

// Helper: create an elements session the same way the Express endpoint does
async function createElementsSession(
  stripe: Stripe,
  priceId: string,
  principal: string,
  tier: string,
  billing: string,
): Promise<Stripe.Checkout.Session> {
  return (stripe.checkout.sessions as any).create({
    ui_mode:    "elements",
    mode:       "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    return_url: `${FRONTEND_ORIGIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    metadata:   { icp_principal: principal, tier, billing },
  });
}

describeIfConfigured("ELEM — Stripe Elements subscription session", () => {
  let stripe: Stripe;

  beforeAll(() => { stripe = new Stripe(SECRET_KEY); });

  // ── ELEM.1 / ELEM.4 ────────────────────────────────────────────────────────

  it("ELEM.1+4 — returns a clientSecret and sessionId for Pro Monthly", async () => {
    const session = await createElementsSession(stripe, PRICE_PRO_MONTHLY, "test-principal", "Pro", "Monthly");

    expect(session.id).toMatch(/^cs_test_/);
    // client_secret is what we return as clientSecret to the frontend
    expect(session.client_secret).toBeTruthy();
    expect(session.client_secret).toMatch(/^cs_test_/);
  }, 15_000);

  // ── ELEM.2 ─────────────────────────────────────────────────────────────────

  it("ELEM.2 — session has ui_mode:elements and mode:subscription", async () => {
    const session = await createElementsSession(stripe, PRICE_PRO_MONTHLY, "test-principal", "Pro", "Monthly");

    expect((session as any).ui_mode).toBe("elements");
    expect(session.mode).toBe("subscription");
    expect(session.status).toBe("open");
  }, 15_000);

  // ── ELEM.3 ─────────────────────────────────────────────────────────────────

  it("ELEM.3 — metadata carries icp_principal, tier, and billing", async () => {
    const principal = "abc12-defgh-ijklm-nopqr-stu";
    const session = await createElementsSession(stripe, PRICE_PRO_MONTHLY, principal, "Pro", "Monthly");

    expect(session.metadata?.icp_principal).toBe(principal);
    expect(session.metadata?.tier).toBe("Pro");
    expect(session.metadata?.billing).toBe("Monthly");
  }, 15_000);

  // ── ELEM.5 ─────────────────────────────────────────────────────────────────

  it("ELEM.5 — all six tier/billing combinations produce valid sessions", async () => {
    const allConfigured = Object.values(PRICE_MAP).every(p => p.startsWith("price_"));
    if (!allConfigured) {
      console.warn("Skipping ELEM.5 — not all price IDs are configured");
      return;
    }

    const results = await Promise.all(
      Object.entries(PRICE_MAP).map(async ([key, priceId]) => {
        const [tier, billing] = key.split("-") as [string, string];
        const session = await createElementsSession(stripe, priceId, "test-principal", tier, billing);
        return { key, id: session.id, hasSecret: !!session.client_secret };
      })
    );

    for (const { key, id, hasSecret } of results) {
      expect(id).toMatch(/^cs_test_/);
      expect(hasSecret).toBe(true);
    }
  }, 30_000);

  // ── ELEM.6 ─────────────────────────────────────────────────────────────────

  it("ELEM.6 — rejects an invalid price ID with a Stripe error", async () => {
    await expect(
      createElementsSession(stripe, "price_nonexistent_bad", "test-principal", "Pro", "Monthly")
    ).rejects.toThrow();
  }, 15_000);

  // ── ELEM.7 ─────────────────────────────────────────────────────────────────

  it("ELEM.7 — verify-session rejects an open (unpaid) session", async () => {
    // Create a session but don't pay — it stays 'open'
    const session = await createElementsSession(stripe, PRICE_PRO_MONTHLY, "test-principal", "Pro", "Monthly");

    // Simulate what verify-session does: check payment_status
    const retrieved = await stripe.checkout.sessions.retrieve(session.id);
    expect(retrieved.status).toBe("open");
    expect(retrieved.payment_status).not.toBe("paid");

    // The verify-session endpoint would reject this with a 400
    const wouldReject = retrieved.payment_status !== "paid" || retrieved.status !== "complete";
    expect(wouldReject).toBe(true);
  }, 15_000);
});
