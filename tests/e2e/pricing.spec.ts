import { test, expect } from "@playwright/test";

// Pricing page is public — no auth injection needed

test.describe("PricingPage — /pricing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  // ── Page structure ────────────────────────────────────────────────────────

  test("shows HomeGentic logo in nav", async ({ page }) => {
    await expect(page.getByText(/HomeGentic/)).toBeVisible();
  });

  test("shows 'Pricing' eyebrow badge", async ({ page }) => {
    await expect(page.getByText("Pricing")).toBeVisible();
  });

  test("shows 'Simple, transparent pricing' heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /simple, transparent pricing/i })).toBeVisible();
  });

  test("shows 'Choose your plan. Cancel anytime.' subtext", async ({ page }) => {
    await expect(page.getByText(/Choose your plan/)).toBeVisible();
  });

  // ── Plan cards ────────────────────────────────────────────────────────────

  test("does not show a Free homeowner plan card", async ({ page }) => {
    // The homeowner tab should not have a $0 Free card (Free is internal only)
    // ContractorFree still exists on the contractor tab
    await expect(page.getByText(/\$0/).first()).not.toBeVisible();
  });

  test("shows Pro plan card", async ({ page }) => {
    await expect(page.getByText("Pro")).toBeVisible();
  });

  test("shows Premium plan card", async ({ page }) => {
    await expect(page.getByText("Premium")).toBeVisible();
  });

  test("shows $10 price for Pro tier", async ({ page }) => {
    await expect(page.getByText(/\$10/)).toBeVisible();
  });

  test("shows $20 price for Premium tier", async ({ page }) => {
    await expect(page.getByText(/\$20/)).toBeVisible();
  });

  // ── Feature comparison table ──────────────────────────────────────────────

  test("shows feature comparison table with Properties row", async ({ page }) => {
    await expect(page.getByText("Properties")).toBeVisible();
  });

  test("shows Warranty Wallet feature row", async ({ page }) => {
    await expect(page.getByText("Warranty Wallet")).toBeVisible();
  });

  test("shows Recurring Services feature row", async ({ page }) => {
    await expect(page.getByText("Recurring Services")).toBeVisible();
  });

  test("shows Market Intelligence feature row", async ({ page }) => {
    await expect(page.getByText("Market Intelligence")).toBeVisible();
  });

  test("shows Insurance Defense Mode feature row", async ({ page }) => {
    await expect(page.getByText("Insurance Defense Mode")).toBeVisible();
  });

  // ── FAQs ──────────────────────────────────────────────────────────────────

  test("shows FAQ section", async ({ page }) => {
    await expect(page.getByText(/How does blockchain verification work/i)).toBeVisible();
  });

  test("shows ICP FAQ question", async ({ page }) => {
    await expect(page.getByText(/What is ICP/i)).toBeVisible();
  });

  test("shows cancel anytime FAQ", async ({ page }) => {
    await expect(page.getByText(/Can I cancel anytime/i)).toBeVisible();
  });

  // ── ContractorFree still exists on contractor tab ─────────────────────────

  test("contractor tab shows ContractorFree (free for contractors)", async ({ page }) => {
    await page.getByRole("button", { name: /contractor/i }).click();
    await expect(page.getByText("Contractor Free")).toBeVisible();
  });
});
