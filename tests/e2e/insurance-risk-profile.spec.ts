/**
 * Insurance Risk Profile E2E tests                              (#278)
 *
 * IR.1  Verified property shows "Insurance Report" button; unverified does not
 * IR.2  Clicking the button opens the InsuranceShareModal
 * IR.3  Modal shows expiry options and helper text
 * IR.4  Generate Risk Profile renders score, grade, and stat chips
 * IR.5  Copy link button appears after generation
 * IR.6  Download JSON button appears after generation
 * IR.7  "Generate new" resets modal back to the generation form
 *
 * All tests use window.__e2e_* injection — no canister required.
 * Mock mode returns maintenanceScore: 78 → grade "B".
 */

import { test, expect } from "@playwright/test";
import { injectTestAuth } from "./helpers/auth";
import { injectSubscription } from "./helpers/testData";

// ─── shared fixtures ──────────────────────────────────────────────────────────

/** Property at verificationLevel "Basic" — Insurance Report button should show. */
async function injectVerifiedProperty(page: any) {
  await page.addInitScript(() => {
    (window as any).__e2e_properties = [
      {
        id: 1,
        owner: "test-e2e-principal",
        address: "123 Maple Street",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
        propertyType: "SingleFamily",
        yearBuilt: 2001,
        squareFeet: 2400,
        verificationLevel: "Basic",
        tier: "Basic",
        createdAt: 0,
        updatedAt: 0,
        isActive: true,
      },
    ];
    (window as any).__e2e_jobs = [];
  });
}

/** Property at verificationLevel "Unverified" — button must be hidden. */
async function injectUnverifiedProperty(page: any) {
  await page.addInitScript(() => {
    (window as any).__e2e_properties = [
      {
        id: 1,
        owner: "test-e2e-principal",
        address: "123 Maple Street",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
        propertyType: "SingleFamily",
        yearBuilt: 2001,
        squareFeet: 2400,
        verificationLevel: "Unverified",
        tier: "Basic",
        createdAt: 0,
        updatedAt: 0,
        isActive: true,
      },
    ];
    (window as any).__e2e_jobs = [];
  });
}

// ── IR.1 — Button visibility by verification level ────────────────────────────

test.describe("IR.1 — Insurance Report button visibility", () => {
  test("button is visible for a verified (Basic) property", async ({ page }) => {
    await injectTestAuth(page);
    await injectSubscription(page, "Basic");
    await injectVerifiedProperty(page);
    await page.goto("/properties/1");
    await expect(page.getByRole("button", { name: /insurance report/i })).toBeVisible();
  });

  test("button is NOT visible for an unverified property", async ({ page }) => {
    await injectTestAuth(page);
    await injectSubscription(page, "Basic");
    await injectUnverifiedProperty(page);
    await page.goto("/properties/1");
    await expect(page.getByRole("button", { name: /insurance report/i })).not.toBeVisible();
  });
});

// ── IR.2 — Modal opens ────────────────────────────────────────────────────────

test.describe("IR.2 — InsuranceShareModal opens", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestAuth(page);
    await injectSubscription(page, "Basic");
    await injectVerifiedProperty(page);
    await page.goto("/properties/1");
    await page.getByRole("button", { name: /insurance report/i }).click();
  });

  test("modal heading 'Insurance Risk Report' is visible", async ({ page }) => {
    await expect(page.getByText(/insurance risk report/i)).toBeVisible();
  });

  test("modal shows the property address", async ({ page }) => {
    await expect(page.getByText("123 Maple Street")).toBeVisible();
  });
});

// ── IR.3 — Modal expiry options and helper text ───────────────────────────────

test.describe("IR.3 — Modal form content", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestAuth(page);
    await injectSubscription(page, "Basic");
    await injectVerifiedProperty(page);
    await page.goto("/properties/1");
    await page.getByRole("button", { name: /insurance report/i }).click();
  });

  test("shows 'Link expiry' label", async ({ page }) => {
    await expect(page.getByText(/link expiry/i)).toBeVisible();
  });

  test("shows expiry option '90 days'", async ({ page }) => {
    await expect(page.getByRole("button", { name: "90 days" })).toBeVisible();
  });

  test("shows expiry option '1 year'", async ({ page }) => {
    await expect(page.getByRole("button", { name: "1 year" })).toBeVisible();
  });

  test("shows helper text about insurance carrier", async ({ page }) => {
    await expect(page.getByText(/insurance carrier/i)).toBeVisible();
  });

  test("shows 'Generate Risk Profile' button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /generate risk profile/i })).toBeVisible();
  });
});

// ── IR.4 — Score and grade display after generation ───────────────────────────

test.describe("IR.4 — Score and grade after generating", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestAuth(page);
    await injectSubscription(page, "Basic");
    await injectVerifiedProperty(page);
    await page.goto("/properties/1");
    await page.getByRole("button", { name: /insurance report/i }).click();
    await page.getByRole("button", { name: /generate risk profile/i }).click();
    // Wait for the score to render (mock returns immediately)
    await expect(page.getByText(/maintenance score/i)).toBeVisible();
  });

  test("shows 'Maintenance Score' label", async ({ page }) => {
    await expect(page.getByText(/maintenance score/i)).toBeVisible();
  });

  test("shows score value with /100 suffix", async ({ page }) => {
    await expect(page.getByText(/\/100/)).toBeVisible();
  });

  test("shows 'Grade' label", async ({ page }) => {
    await expect(page.getByText("Grade")).toBeVisible();
  });

  test("shows stat chip 'Sensors'", async ({ page }) => {
    await expect(page.getByText("Sensors")).toBeVisible();
  });

  test("shows stat chip 'Open jobs'", async ({ page }) => {
    await expect(page.getByText("Open jobs")).toBeVisible();
  });

  test("shows stat chip 'Verified'", async ({ page }) => {
    await expect(page.getByText("Verified")).toBeVisible();
  });

  test("shows stat chip 'Permits'", async ({ page }) => {
    await expect(page.getByText("Permits")).toBeVisible();
  });
});

// ── IR.5 — Copy link ──────────────────────────────────────────────────────────

test.describe("IR.5 — Verification link section", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestAuth(page);
    await injectSubscription(page, "Basic");
    await injectVerifiedProperty(page);
    await page.goto("/properties/1");
    await page.getByRole("button", { name: /insurance report/i }).click();
    await page.getByRole("button", { name: /generate risk profile/i }).click();
    await expect(page.getByText(/maintenance score/i)).toBeVisible();
  });

  test("shows 'Verification link' label", async ({ page }) => {
    await expect(page.getByText(/verification link/i)).toBeVisible();
  });

  test("shows 'Copy' button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /copy/i })).toBeVisible();
  });
});

// ── IR.6 — Download JSON ──────────────────────────────────────────────────────

test.describe("IR.6 — Download JSON button", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestAuth(page);
    await injectSubscription(page, "Basic");
    await injectVerifiedProperty(page);
    await page.goto("/properties/1");
    await page.getByRole("button", { name: /insurance report/i }).click();
    await page.getByRole("button", { name: /generate risk profile/i }).click();
    await expect(page.getByText(/maintenance score/i)).toBeVisible();
  });

  test("shows 'Download JSON' button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /download json/i })).toBeVisible();
  });
});

// ── IR.7 — "Generate new" resets form ────────────────────────────────────────

test.describe("IR.7 — Generate new resets modal", () => {
  test("'Generate new' button returns to the generation form", async ({ page }) => {
    await injectTestAuth(page);
    await injectSubscription(page, "Basic");
    await injectVerifiedProperty(page);
    await page.goto("/properties/1");
    await page.getByRole("button", { name: /insurance report/i }).click();
    await page.getByRole("button", { name: /generate risk profile/i }).click();
    await expect(page.getByText(/maintenance score/i)).toBeVisible();
    await page.getByRole("button", { name: /generate new/i }).click();
    // Back to the generation form
    await expect(page.getByRole("button", { name: /generate risk profile/i })).toBeVisible();
    await expect(page.getByText(/maintenance score/i)).not.toBeVisible();
  });
});
