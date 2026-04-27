/**
 * Warranty Wallet E2E — /warranties    (#180)
 *
 * WW.1  Free tier → UpgradeGate "Warranty Wallet"
 * WW.2  Pro tier with no warranty jobs → empty state
 * WW.3  Pro tier with warranty jobs → heading + all three sections
 * WW.4  Pro tier → scan-document panel visible
 */

import { test, expect } from "@playwright/test";
import { injectTestAuth } from "./helpers/auth";
import { injectTestProperties, injectSubscription, injectWarrantyJobs } from "./helpers/testData";

// ── WW.1 — Free tier gate ─────────────────────────────────────────────────────

test.describe("WW.1 — /warranties (Free tier)", () => {
  test("shows UpgradeGate for Free tier", async ({ page }) => {
    await injectTestAuth(page);
    await injectTestProperties(page);
    await injectSubscription(page, "Free");
    await page.goto("/warranties");
    await expect(page.getByText(/Warranty Wallet/i)).toBeVisible();
  });
});

// ── WW.2 — Pro tier, no jobs ──────────────────────────────────────────────────

test.describe("WW.2 — /warranties (Pro, no warranties)", () => {
  test("shows empty state when no warranty jobs exist", async ({ page }) => {
    await injectTestAuth(page);
    await page.addInitScript(() => {
      (window as any).__e2e_subscription = { tier: "Pro", expiresAt: null };
      (window as any).__e2e_properties = [
        {
          id: 1, owner: "test-e2e-principal",
          address: "123 Maple Street", city: "Austin", state: "TX", zipCode: "78701",
          propertyType: "SingleFamily", yearBuilt: 2001, squareFeet: 2400,
          verificationLevel: "Unverified", tier: "Pro",
          createdAt: 0, updatedAt: 0, isActive: true,
        },
      ];
      (window as any).__e2e_jobs = [];  // no jobs → no warranties
    });
    await page.goto("/warranties");
    await expect(page.getByText(/no warranties logged yet/i)).toBeVisible();
  });
});

// ── WW.3 / WW.4 — Pro tier with warranty jobs ─────────────────────────────────

test.describe("WW.3 — /warranties (Pro, with warranty jobs)", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestAuth(page);
    await injectWarrantyJobs(page);
    await injectSubscription(page, "Pro");
    await page.goto("/warranties");
    await expect(page.getByRole("heading", { name: /your warranties/i })).toBeVisible();
  });

  test("WW.3 shows 'Your Warranties' heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /your warranties/i })).toBeVisible();
  });

  test("WW.3 shows 'Warranty Wallet' eyebrow label", async ({ page }) => {
    await expect(page.getByText("Warranty Wallet")).toBeVisible();
  });

  test("WW.3 shows Expiring Soon section", async ({ page }) => {
    await expect(page.getByText("Expiring Soon")).toBeVisible();
  });

  test("WW.3 shows Active section", async ({ page }) => {
    await expect(page.getByText("Active")).toBeVisible();
  });

  test("WW.3 shows Expired section", async ({ page }) => {
    await expect(page.getByText("Expired")).toBeVisible();
  });

  test("WW.4 shows scan document panel upload button", async ({ page }) => {
    // ScanDocumentPanel renders an upload trigger
    await expect(page.getByText(/upload.*warranty|scan.*document|save to wallet/i)).toBeVisible();
  });
});
