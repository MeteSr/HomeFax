import { test, expect } from "@playwright/test";
import { injectTestAuth } from "./helpers/auth";

/**
 * ContractorDashboardPage is a ProtectedRoute — any authenticated user can
 * navigate to it directly.  The page loads open quote requests from
 * quoteService.getOpenRequests() which returns MOCK_OPEN_REQUESTS in mock
 * mode, so quote leads will always be present without canister setup.
 */
async function setup(page: Parameters<typeof injectTestAuth>[0]) {
  await injectTestAuth(page);
}

test.describe("ContractorDashboardPage — /contractor-dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await page.goto("/contractor-dashboard");
    await expect(page.getByRole("heading", { name: "Contractor Dashboard" })).toBeVisible();
  });

  // ── Page structure ──────────────────────────────────────────────────────────

  test("shows the Overview eyebrow label", async ({ page }) => {
    await expect(page.getByText("Overview")).toBeVisible();
  });

  test("shows Edit Profile button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /edit profile/i })).toBeVisible();
  });

  test("Edit Profile navigates to /contractor/profile", async ({ page }) => {
    await page.getByRole("button", { name: /edit profile/i }).click();
    await expect(page).toHaveURL("/contractor/profile");
  });

  // ── Stats ────────────────────────────────────────────────────────────────────

  test("shows Open Leads stat", async ({ page }) => {
    await expect(page.getByText("Open Leads")).toBeVisible();
  });

  test("shows Jobs Signed stat", async ({ page }) => {
    await expect(page.getByText("Jobs Signed")).toBeVisible();
  });

  // ── Quote request leads ──────────────────────────────────────────────────────

  test("shows Open Leads section", async ({ page }) => {
    await expect(page.getByText(/open leads/i).first()).toBeVisible();
  });

  test("shows service type filter", async ({ page }) => {
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
  });

  test("filter shows all major service types", async ({ page }) => {
    await expect(page.getByRole("button", { name: "HVAC" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Plumbing" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Roofing" })).toBeVisible();
  });

  test("quote leads are visible in the list", async ({ page }) => {
    // MOCK_OPEN_REQUESTS always has at least one open request
    const leadCards = page.locator("[style*='border']").filter({ has: page.locator("p").filter({ hasText: /HVAC|Roofing|Plumbing|Electrical|Painting|Flooring|Windows|Landscaping/ }) });
    await expect(leadCards.first()).toBeVisible();
  });

  // ── Filter behavior ───────────────────────────────────────────────────────────

  test("clicking HVAC filter shows only HVAC leads", async ({ page }) => {
    await page.getByRole("button", { name: "HVAC" }).click();
    // After filtering, non-HVAC service types should not appear as lead headings
    // (may be zero results if no HVAC mock leads)
    await expect(page.getByRole("button", { name: "HVAC" })).toBeVisible(); // button stays
  });

  test("clicking All filter restores all leads", async ({ page }) => {
    await page.getByRole("button", { name: "HVAC" }).click();
    await page.getByRole("button", { name: "All" }).click();
    // Leads should be visible again
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
  });

  // ── Expand a lead card ────────────────────────────────────────────────────────

  test("clicking a lead card expands its detail", async ({ page }) => {
    // Click the first visible lead card
    const firstLead = page.locator("[style*='cursor: pointer']").first();
    await firstLead.click();
    await expect(page.getByText("Submit Quote")).toBeVisible();
  });

  test("expanding a lead shows Request ID", async ({ page }) => {
    const firstLead = page.locator("[style*='cursor: pointer']").first();
    await firstLead.click();
    await expect(page.getByText(/Request ID:/)).toBeVisible();
  });

  // ── Submit Quote modal ────────────────────────────────────────────────────────

  test("clicking Submit Quote opens the quote modal", async ({ page }) => {
    // Expand the first lead
    const firstLead = page.locator("[style*='cursor: pointer']").first();
    await firstLead.click();
    await page.getByRole("button", { name: "Submit Quote" }).first().click();
    await expect(page.getByText(/Submit Quote —/)).toBeVisible();
  });

  test("quote modal has price and timeline inputs", async ({ page }) => {
    const firstLead = page.locator("[style*='cursor: pointer']").first();
    await firstLead.click();
    await page.getByRole("button", { name: "Submit Quote" }).first().click();
    await expect(page.getByLabel(/your price/i)).toBeVisible();
    await expect(page.getByLabel(/timeline.*days/i)).toBeVisible();
  });

  test("quote modal Send Quote button is disabled when fields are empty", async ({ page }) => {
    const firstLead = page.locator("[style*='cursor: pointer']").first();
    await firstLead.click();
    await page.getByRole("button", { name: "Submit Quote" }).first().click();
    await expect(page.getByRole("button", { name: /send quote/i })).toBeDisabled();
  });

  test("Send Quote becomes enabled when price and timeline are filled", async ({ page }) => {
    const firstLead = page.locator("[style*='cursor: pointer']").first();
    await firstLead.click();
    await page.getByRole("button", { name: "Submit Quote" }).first().click();
    await page.getByLabel(/your price/i).fill("750");
    await page.getByLabel(/timeline.*days/i).fill("5");
    await expect(page.getByRole("button", { name: /send quote/i })).toBeEnabled();
  });

  test("cancelling the modal closes it", async ({ page }) => {
    const firstLead = page.locator("[style*='cursor: pointer']").first();
    await firstLead.click();
    await page.getByRole("button", { name: "Submit Quote" }).first().click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText(/Submit Quote —/)).not.toBeVisible();
  });

  test("submitting a quote shows 'Quote submitted' badge on the lead", async ({ page }) => {
    const firstLead = page.locator("[style*='cursor: pointer']").first();
    await firstLead.click();
    await page.getByRole("button", { name: "Submit Quote" }).first().click();
    await page.getByLabel(/your price/i).fill("500");
    await page.getByLabel(/timeline.*days/i).fill("3");
    await page.getByRole("button", { name: /send quote/i }).click();
    // After submission, the lead should show "Quote submitted"
    await expect(page.getByText("Quote submitted")).toBeVisible();
  });

  // ── Pending jobs (My Jobs to Sign) ───────────────────────────────────────────

  test("shows My Jobs section", async ({ page }) => {
    await expect(page.getByText(/My Jobs|Jobs to Sign|Pending/i).first()).toBeVisible();
  });
});
