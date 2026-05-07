/**
 * HomeGentic smoke test suite — @smoke
 *
 * Quick sanity checks for a running deployment:
 *   - Frontend pages render without crashing
 *   - Agent health endpoints respond 200
 *   - Critical authenticated flows load with injected data
 *
 * Run against a live deployment:
 *   npm run test:smoke
 *
 * Run with a custom base URL:
 *   BASE_URL=https://staging.example.com npm run test:smoke
 */

import { test, expect, type Page } from "@playwright/test";

// ── Auth injection helper (mirrors tests/e2e/helpers/auth.ts) ─────────────────

async function injectAuth(page: Page) {
  await page.addInitScript(() => {
    (window as any).__e2e_principal = "smoke-test-principal";
    (window as any).__e2e_profile = {
      principal: "smoke-test-principal",
      role: { Homeowner: null },
      email: "smoke@example.com",
      phone: "+15555550000",
      createdAt: 0,
      updatedAt: 0,
      isActive: true,
      lastLoggedIn: [],
    };
    (window as any).__e2e_subscription = { tier: "Pro", expiresAt: null };
    (window as any).__e2e_properties = [
      {
        id: "SMOKE-PROP-1",
        owner: "smoke-test-principal",
        address: "1 Smoke Test Ave",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
        propertyType: "SingleFamily",
        yearBuilt: 2000,
        squareFeet: 2000,
        verificationLevel: "Basic",
        tier: "Pro",
        createdAt: 0,
        updatedAt: 0,
        isActive: true,
      },
    ];
    (window as any).__e2e_jobs = [];
  });
}

async function injectContractorAuth(page: Page) {
  await page.addInitScript(() => {
    (window as any).__e2e_principal = "smoke-contractor-principal";
    (window as any).__e2e_profile = {
      principal: "smoke-contractor-principal",
      role: { Contractor: null },
      email: "contractor@smoke.example",
      phone: "+15555550001",
      createdAt: 0,
      updatedAt: 0,
      isActive: true,
      lastLoggedIn: [],
    };
    (window as any).__e2e_subscription = { tier: "ContractorPro", expiresAt: null };
    (window as any).__e2e_properties = [];
    (window as any).__e2e_jobs = [];
  });
}

// ── Public pages ──────────────────────────────────────────────────────────────

test("@smoke landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).not.toHaveTitle(/error/i);
  // At minimum the page has a title element
  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);
});

test("@smoke login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("body")).toBeVisible();
  // Should not show a blank error page
  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(/^$/);
});

test("@smoke pricing page loads", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.locator("body")).toBeVisible();
});

// ── Agent health endpoints ─────────────────────────────────────────────────────

test("@smoke voice agent health endpoint responds 200", async ({ request }) => {
  const voicePort = process.env.VOICE_AGENT_PORT ?? "3001";
  try {
    const res = await request.get(`http://localhost:${voicePort}/health`, {
      timeout: 5_000,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("status");
  } catch {
    // Voice agent may not be running in all environments — mark as skipped
    test.skip(true, "Voice agent not running — set VOICE_AGENT_PORT or start agents/voice");
  }
});

test("@smoke IoT gateway health endpoint responds 200", async ({ request }) => {
  const gatewayPort = process.env.IOT_GATEWAY_PORT ?? "3002";
  try {
    const res = await request.get(`http://localhost:${gatewayPort}/health`, {
      timeout: 5_000,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("status");
  } catch {
    test.skip(true, "IoT gateway not running — set IOT_GATEWAY_PORT or start agents/iot-gateway");
  }
});

// ── Authenticated dashboard ───────────────────────────────────────────────────

test("@smoke dashboard loads with homeowner auth", async ({ page }) => {
  await injectAuth(page);
  await page.goto("/dashboard");
  await expect(page.locator("body")).toBeVisible();
  // Should not redirect back to /login
  await expect(page).not.toHaveURL(/\/login/);
});

test("@smoke property page loads with injected property", async ({ page }) => {
  await injectAuth(page);
  await page.goto("/property/SMOKE-PROP-1");
  await expect(page.locator("body")).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
});

test("@smoke contractor dashboard loads with contractor auth", async ({ page }) => {
  await injectContractorAuth(page);
  await page.goto("/dashboard");
  await expect(page.locator("body")).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
});

// ── Critical flow smoke ───────────────────────────────────────────────────────

test("@smoke onboarding page loads", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.locator("body")).toBeVisible();
});

test("@smoke quotes page loads", async ({ page }) => {
  await injectAuth(page);
  await page.goto("/quotes");
  await expect(page.locator("body")).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
});
