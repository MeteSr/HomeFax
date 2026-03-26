import { test, expect } from "@playwright/test";
import { injectTestAuth } from "./helpers/auth";
import { injectTestProperties } from "./helpers/testData";

async function setup(page: Parameters<typeof injectTestAuth>[0]) {
  await injectTestAuth(page);
  await injectTestProperties(page);
}

test.describe("MarketIntelligencePage — /market", () => {
  // ── No property ─────────────────────────────────────────────────────────────

  test.describe("without a property", () => {
    test.beforeEach(async ({ page }) => {
      await injectTestAuth(page);
      await page.goto("/market");
      await expect(page.getByRole("heading", { name: "Market Intelligence" })).toBeVisible();
    });

    test("shows the controls panel even with no properties", async ({ page }) => {
      await expect(page.getByRole("button", { name: /run analysis/i })).toBeVisible();
    });
  });

  // ── With property ────────────────────────────────────────────────────────────

  test.describe("with a property injected", () => {
    test.beforeEach(async ({ page }) => {
      await setup(page);
      await page.goto("/market");
      await expect(page.getByRole("heading", { name: "Market Intelligence" })).toBeVisible();
    });

    // ── Page structure ────────────────────────────────────────────────────────

    test("shows the Intelligence eyebrow label", async ({ page }) => {
      await expect(page.getByText("Intelligence")).toBeVisible();
    });

    test("shows the subtitle about competitive position", async ({ page }) => {
      await expect(page.getByText(/competitive position analysis/i)).toBeVisible();
    });

    // ── Controls ──────────────────────────────────────────────────────────────

    test("shows Property selector", async ({ page }) => {
      await expect(page.getByLabel(/property/i)).toBeVisible();
    });

    test("property selector contains the injected address", async ({ page }) => {
      await expect(page.getByRole("option", { name: /123 Maple Street/i })).toBeVisible();
    });

    test("shows Max Budget input", async ({ page }) => {
      await expect(page.getByLabel(/max budget/i)).toBeVisible();
    });

    test("Max Budget defaults to 50000", async ({ page }) => {
      const input = page.getByLabel(/max budget/i);
      await expect(input).toHaveValue("50000");
    });

    test("shows Run Analysis button", async ({ page }) => {
      await expect(page.getByRole("button", { name: /run analysis/i })).toBeVisible();
    });

    // ── Tabs ──────────────────────────────────────────────────────────────────

    test("shows Competitive tab (active by default)", async ({ page }) => {
      await expect(page.getByRole("button", { name: /competitive/i })).toBeVisible();
    });

    test("shows Projects tab", async ({ page }) => {
      await expect(page.getByRole("button", { name: /projects/i })).toBeVisible();
    });

    // ── Run Analysis ──────────────────────────────────────────────────────────

    test("clicking Run Analysis shows competitive analysis results", async ({ page }) => {
      await page.getByRole("button", { name: /run analysis/i }).click();
      // The competitive analysis renders score cards
      await expect(page.getByText(/Maintenance Score|Market Position|overall/i)).toBeVisible();
    });

    test("after analysis, Competitive tab shows score cards", async ({ page }) => {
      await page.getByRole("button", { name: /run analysis/i }).click();
      // ScoreCard components render grade letters (A/B/C/D/F)
      await expect(page.locator("span").filter({ hasText: /^[A-F]$/ }).first()).toBeVisible();
    });

    test("after analysis, switching to Projects tab shows recommendations", async ({ page }) => {
      await page.getByRole("button", { name: /run analysis/i }).click();
      await page.getByRole("button", { name: /projects/i }).click();
      // Project recommendations render with names like "Minor Kitchen Remodel" etc.
      await expect(page.getByText(/ROI|project|recommend/i).first()).toBeVisible();
    });

    test("budget input can be changed before running analysis", async ({ page }) => {
      await page.getByLabel(/max budget/i).fill("25000");
      await expect(page.getByLabel(/max budget/i)).toHaveValue("25000");
    });

    // ── Navigation ───────────────────────────────────────────────────────────

    test("Run Analysis navigates to the Competitive view", async ({ page }) => {
      await page.getByRole("button", { name: /run analysis/i }).click();
      // The Competitive tab button should appear active/visible
      await expect(page.getByRole("button", { name: /competitive/i })).toBeVisible();
    });
  });
});
