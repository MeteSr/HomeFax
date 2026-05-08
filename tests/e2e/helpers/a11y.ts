import { type Page } from "@playwright/test";
import { checkA11y, injectAxe } from "axe-playwright";

/**
 * Run an axe WCAG 2.1 AA scan on the current page.
 * Fails the test if any violations are found.
 * Call this from `afterEach` or at the end of a page-level test.
 */
export async function assertNoA11yViolations(page: Page): Promise<void> {
  await injectAxe(page);
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true },
    axeOptions: { runOnly: ["wcag2a", "wcag2aa"] },
  });
}
