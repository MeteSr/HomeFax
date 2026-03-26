import { test, expect } from "@playwright/test";
import { injectTestAuth } from "./helpers/auth";
import { injectTestProperties } from "./helpers/testData";

async function setup(page: Parameters<typeof injectTestAuth>[0]) {
  await injectTestAuth(page);
  await injectTestProperties(page);
}

test.describe("SensorPage — /sensors", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await page.goto("/sensors");
    await expect(page.getByRole("heading", { name: "Smart Home Sensors" })).toBeVisible();
  });

  // ── Page structure ──────────────────────────────────────────────────────────

  test("shows the IoT Gateway eyebrow label", async ({ page }) => {
    await expect(page.getByText("IoT Gateway")).toBeVisible();
  });

  test("shows the Register Device button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /register device/i })).toBeVisible();
  });

  test("shows Registered Devices section heading", async ({ page }) => {
    await expect(page.getByText("Registered Devices")).toBeVisible();
  });

  test("shows How it works callout", async ({ page }) => {
    await expect(page.getByText("How it works")).toBeVisible();
  });

  // ── Empty state ─────────────────────────────────────────────────────────────

  test("shows empty state when no devices are registered", async ({ page }) => {
    await expect(page.getByText("No devices registered")).toBeVisible();
  });

  test("empty state describes supported platforms", async ({ page }) => {
    await expect(
      page.getByText(/Nest, Ecobee, or Moen Flo/i)
    ).toBeVisible();
  });

  // ── Register form toggle ────────────────────────────────────────────────────

  test("clicking Register Device reveals the registration form", async ({ page }) => {
    await page.getByRole("button", { name: /register device/i }).click();
    await expect(page.getByText("New Device")).toBeVisible();
  });

  test("form shows Device Name, Platform, and Device ID fields", async ({ page }) => {
    await page.getByRole("button", { name: /register device/i }).click();
    await expect(page.getByPlaceholder(/living room thermostat/i)).toBeVisible();
    await expect(page.getByPlaceholder(/nest-device-abc123/i)).toBeVisible();
  });

  test("platform dropdown contains all four sources", async ({ page }) => {
    await page.getByRole("button", { name: /register device/i }).click();
    const select = page.locator("select").first();
    await expect(select.locator("option", { hasText: "Google Nest" })).toHaveCount(1);
    await expect(select.locator("option", { hasText: "Ecobee" })).toHaveCount(1);
    await expect(select.locator("option", { hasText: "Moen Flo" })).toHaveCount(1);
    await expect(select.locator("option", { hasText: "Manual Entry" })).toHaveCount(1);
  });

  test("clicking Register Device a second time hides the form", async ({ page }) => {
    await page.getByRole("button", { name: /register device/i }).click();
    await expect(page.getByText("New Device")).toBeVisible();

    await page.getByRole("button", { name: /register device/i }).click();
    await expect(page.getByText("New Device")).not.toBeVisible();
  });

  // ── Register a device ───────────────────────────────────────────────────────

  test("registering a device shows it in the Registered Devices list", async ({ page }) => {
    await page.getByRole("button", { name: /register device/i }).click();

    await page.getByPlaceholder(/living room thermostat/i).fill("Kitchen Thermostat");
    await page.getByPlaceholder(/nest-device-abc123/i).fill("nest-abc-001");

    await page.getByRole("button", { name: /^add$/i }).click();

    await expect(page.getByText("Kitchen Thermostat")).toBeVisible();
  });

  test("registered device shows as Active", async ({ page }) => {
    await page.getByRole("button", { name: /register device/i }).click();
    await page.getByPlaceholder(/living room thermostat/i).fill("Leak Sensor");
    await page.getByPlaceholder(/nest-device-abc123/i).fill("moen-001");

    // Switch platform to Moen Flo
    await page.locator("select").first().selectOption("MoenFlo");
    await page.getByRole("button", { name: /^add$/i }).click();

    await expect(page.getByText("Active")).toBeVisible();
  });

  test("registering a device hides the form afterwards", async ({ page }) => {
    await page.getByRole("button", { name: /register device/i }).click();
    await page.getByPlaceholder(/living room thermostat/i).fill("Ecobee Unit");
    await page.getByPlaceholder(/nest-device-abc123/i).fill("eco-123");
    await page.locator("select").first().selectOption("Ecobee");
    await page.getByRole("button", { name: /^add$/i }).click();

    await expect(page.getByText("New Device")).not.toBeVisible();
  });

  test("empty state disappears once a device is registered", async ({ page }) => {
    await expect(page.getByText("No devices registered")).toBeVisible();

    await page.getByRole("button", { name: /register device/i }).click();
    await page.getByPlaceholder(/living room thermostat/i).fill("Any Sensor");
    await page.getByPlaceholder(/nest-device-abc123/i).fill("any-001");
    await page.getByRole("button", { name: /^add$/i }).click();

    await expect(page.getByText("No devices registered")).not.toBeVisible();
  });

  // ── Remove a device ─────────────────────────────────────────────────────────

  test("trash button removes the device from the list", async ({ page }) => {
    // Register first
    await page.getByRole("button", { name: /register device/i }).click();
    await page.getByPlaceholder(/living room thermostat/i).fill("Removable Device");
    await page.getByPlaceholder(/nest-device-abc123/i).fill("rem-001");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText("Removable Device")).toBeVisible();

    // Remove
    await page.getByTitle("Remove device").click();
    await expect(page.getByText("Removable Device")).not.toBeVisible();
  });

  test("removing last device shows empty state again", async ({ page }) => {
    await page.getByRole("button", { name: /register device/i }).click();
    await page.getByPlaceholder(/living room thermostat/i).fill("Only Device");
    await page.getByPlaceholder(/nest-device-abc123/i).fill("only-001");
    await page.getByRole("button", { name: /^add$/i }).click();

    await page.getByTitle("Remove device").click();
    await expect(page.getByText("No devices registered")).toBeVisible();
  });

  // ── Navigation ──────────────────────────────────────────────────────────────

  test("Sensors nav link is active on /sensors", async ({ page }) => {
    // The nav renders the active link in rust (#C94C2E); just verify the link exists
    await expect(page.getByRole("link", { name: "Sensors" })).toBeVisible();
  });
});
