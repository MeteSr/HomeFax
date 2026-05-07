import { test, expect } from "@playwright/test";
import { injectTestAuth } from "./helpers/auth";
import { injectSensorDevices } from "./helpers/testData";
import { assertNoA11yViolations } from "./helpers/a11y";

async function setup(page: Parameters<typeof injectTestAuth>[0]) {
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
  });
}

test.describe("SensorPage — /sensor", () => {
  test.beforeEach(async ({ page }) => {
    await injectSensorDevices(page, { "1": [] });
    await setup(page);
    await page.goto("/sensors");
    await expect(page.getByRole("heading", { name: /smart home sensors/i })).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await assertNoA11yViolations(page);
  });

  // ── Page structure ───────────────────────────────────────────────────────────

  test("shows 'IoT Gateway' eyebrow label", async ({ page }) => {
    await expect(page.getByText("IoT Gateway", { exact: true })).toBeVisible();
  });

  test("shows 'Register Device' button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /register device/i }).first()).toBeVisible();
  });

  test("shows empty state when no devices registered", async ({ page }) => {
    await expect(page.getByText(/no devices registered/i)).toBeVisible();
  });

  // ── Register Device modal — source dropdown ──────────────────────────────────

  test.describe("Register Device modal", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("button", { name: /register device/i }).first().click();
      await expect(page.getByRole("heading", { name: /register device/i })).toBeVisible();
    });

    test("shows Device Type selector", async ({ page }) => {
      await expect(page.getByLabel(/device type/i)).toBeVisible();
    });

    test("dropdown includes Google Nest", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /google nest/i })).toHaveCount(1);
    });

    test("dropdown includes Ecobee", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /ecobee/i })).toHaveCount(1);
    });

    test("dropdown includes Moen Flo", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /moen flo/i })).toHaveCount(1);
    });

    test("dropdown includes Ring Alarm", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /ring alarm/i })).toHaveCount(1);
    });

    test("dropdown includes Honeywell Home", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /honeywell home/i })).toHaveCount(1);
    });

    // Tier D sources are in Connected Accounts, not the modal dropdown
    test("dropdown does NOT include Rheem EcoNet (moved to Connected Accounts)", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /rheem econet/i })).toHaveCount(0);
    });

    test("dropdown does NOT include Sense Energy Monitor (moved to Connected Accounts)", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /sense energy/i })).toHaveCount(0);
    });

    test("dropdown does NOT include Emporia Vue (moved to Connected Accounts)", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /emporia vue/i })).toHaveCount(0);
    });

    test("dropdown includes SolarEdge Solar", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /solaredge/i })).toHaveCount(1);
    });

    test("dropdown includes Enphase IQ Gateway", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /enphase/i })).toHaveCount(1);
    });

    test("dropdown includes Tesla Powerwall", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /tesla powerwall/i })).toHaveCount(1);
    });

    test("dropdown includes LG ThinQ", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /lg thinq/i })).toHaveCount(1);
    });

    test("dropdown includes GE SmartHQ", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /ge smarthq/i })).toHaveCount(1);
    });

    test("dropdown includes Rachio Smart Sprinkler", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /rachio/i })).toHaveCount(1);
    });

    test("dropdown includes Samsung SmartThings", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /smartthings/i })).toHaveCount(1);
    });

    test("dropdown includes Home Assistant", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /home assistant/i })).toHaveCount(1);
    });

    test("dropdown includes Manual Entry", async ({ page }) => {
      await expect(page.getByLabel(/device type/i).locator("option", { hasText: /manual entry/i })).toHaveCount(1);
    });

    test("dropdown has 14 source options in total", async ({ page }) => {
      const options = page.getByLabel(/device type/i).locator("option");
      await expect(options).toHaveCount(14);
    });

    test("Cancel button closes the modal", async ({ page }) => {
      await page.getByRole("button", { name: /cancel/i }).click();
      await expect(page.getByRole("heading", { name: /register device/i })).not.toBeVisible();
    });
  });

  // ── Connected Accounts section (Tier D — credential-based platforms) ─────────

  test.describe("Connected Accounts section", () => {
    test("shows 'Connected Accounts' heading", async ({ page }) => {
      const section = page.locator("[data-testid='connected-accounts']");
      await expect(section.getByText(/connected accounts/i)).toBeVisible();
    });

    test("shows Rheem EcoNet entry", async ({ page }) => {
      const section = page.locator("[data-testid='connected-accounts']");
      await expect(section.getByText(/rheem econet/i)).toBeVisible();
    });

    test("shows Sense Energy Monitor entry", async ({ page }) => {
      const section = page.locator("[data-testid='connected-accounts']");
      await expect(section.getByText(/sense energy monitor/i)).toBeVisible();
    });

    test("shows Emporia Vue entry", async ({ page }) => {
      const section = page.locator("[data-testid='connected-accounts']");
      await expect(section.getByText(/emporia vue/i)).toBeVisible();
    });
  });

  // ── Pre-registered devices with new sources ──────────────────────────────────

  test.describe("device list — new source labels", () => {
    test.beforeEach(async ({ page }) => {
      await injectSensorDevices(page, {
        "1": [
          { id: "d1", externalDeviceId: "RING-001", source: "RingAlarm",     name: "Front Door Sensor", isActive: true  },
          { id: "d2", externalDeviceId: "HW-002",   source: "HoneywellHome", name: "Thermostat",        isActive: true  },
          { id: "d3", externalDeviceId: "HA-003",   source: "HomeAssistant", name: "Hub",               isActive: false },
        ],
      });
      await setup(page);
      await page.goto("/sensors");
      await expect(page.getByRole("heading", { name: /smart home sensors/i })).toBeVisible();
    });

    test("shows device name for RingAlarm device", async ({ page }) => {
      await expect(page.getByText("Front Door Sensor")).toBeVisible();
    });

    test("shows 'Ring Alarm' source label for RingAlarm device", async ({ page }) => {
      // Source label rendered as "Ring Alarm · RING-001"
      await expect(page.getByText(/ring alarm.*ring-001/i)).toBeVisible();
    });

    test("shows device name for HoneywellHome device", async ({ page }) => {
      await expect(page.getByText("Thermostat")).toBeVisible();
    });

    test("shows 'Honeywell Home' source label for HoneywellHome device", async ({ page }) => {
      await expect(page.getByText(/honeywell home.*hw-002/i)).toBeVisible();
    });

    test("shows device name for HomeAssistant device", async ({ page }) => {
      await expect(page.getByText("Hub")).toBeVisible();
    });

    test("shows 'Home Assistant' source label for HomeAssistant device", async ({ page }) => {
      await expect(page.getByText(/home assistant.*ha-003/i)).toBeVisible();
    });

    test("shows Active badge for active devices", async ({ page }) => {
      await expect(page.getByText("Active").first()).toBeVisible();
    });

    test("shows Inactive badge for deactivated device", async ({ page }) => {
      await expect(page.getByText("Inactive")).toBeVisible();
    });
  });
});
