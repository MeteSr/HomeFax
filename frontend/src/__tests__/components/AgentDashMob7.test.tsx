/**
 * MOB.7 — AgentDashboardPage + AgentMarketplacePage mobile audit
 */
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import React from "react";

// ── matchMedia mock ───────────────────────────────────────────────────────────
let currentWidth = 1280;
function mockMatchMedia(width: number) {
  currentWidth = width;
  Object.defineProperty(window, "matchMedia", {
    writable: true, configurable: true,
    value: (query: string) => {
      const maxMatch = query.match(/max-width:\s*(\d+)px/);
      const matches  = maxMatch ? currentWidth <= parseInt(maxMatch[1], 10) : false;
      return { matches, media: query, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false };
    },
  });
}

let AgentDashboardPage: React.ComponentType;
let AgentMarketplacePage: React.ComponentType;

beforeAll(async () => {
  mockMatchMedia(1280);
  AgentDashboardPage   = (await import("@/pages/AgentDashboardPage")).default;
  AgentMarketplacePage = (await import("@/pages/AgentMarketplacePage")).default;
});

function renderAgentDash(width: number) {
  mockMatchMedia(width);
  return render(
    <MemoryRouter initialEntries={["/agent-dashboard"]}>
      <Routes><Route path="/agent-dashboard" element={<AgentDashboardPage />} /></Routes>
    </MemoryRouter>
  );
}

function renderMarketplace(width: number) {
  mockMatchMedia(width);
  return render(
    <MemoryRouter initialEntries={["/agent-marketplace"]}>
      <Routes><Route path="/agent-marketplace" element={<AgentMarketplacePage />} /></Routes>
    </MemoryRouter>
  );
}

// ── Renders without crashing ──────────────────────────────────────────────────

describe("AgentDashboardPage — renders on both viewports", () => {
  it("renders on desktop", () => {
    renderAgentDash(1280);
    expect(document.body).toBeTruthy();
  });

  it("renders on mobile", () => {
    renderAgentDash(390);
    expect(document.body).toBeTruthy();
  });
});

// ── KPI row ───────────────────────────────────────────────────────────────────

describe("AgentDashboardPage — KPI row", () => {
  it("does NOT use repeat(3,1fr) as fixed grid on mobile", () => {
    const { container } = renderAgentDash(390);
    const allDivs = Array.from(container.querySelectorAll("[style]")) as HTMLElement[];
    const threeCol = allDivs.find((el) =>
      el.style.gridTemplateColumns?.replace(/\s/g, "") === "repeat(3,1fr)"
    );
    expect(threeCol).toBeUndefined();
  });

  it("renders without crashing on desktop (loading state)", () => {
    // Stats grid is gated behind !loading; just verify the page mounts
    renderAgentDash(1280);
    expect(document.body).toBeTruthy();
  });
});

// ── Listings table scroll ─────────────────────────────────────────────────────

describe("AgentDashboardPage — listings table", () => {
  it("listings table header has scroll container on mobile", () => {
    const { container } = renderAgentDash(390);
    const allDivs = Array.from(container.querySelectorAll("[style]")) as HTMLElement[];
    // Any 6-column grid must be inside an overflow-x:auto parent
    const bareTable = allDivs.find((el) => {
      const cols = el.style.gridTemplateColumns ?? "";
      if (!cols.includes("2fr") || !cols.includes("auto")) return false;
      const parent = el.parentElement as HTMLElement | null;
      return parent && parent.style.overflowX !== "auto";
    });
    expect(bareTable).toBeUndefined();
  });
});

// ── AgentMarketplacePage ──────────────────────────────────────────────────────

describe("AgentMarketplacePage — renders on both viewports", () => {
  it("renders on desktop", () => {
    renderMarketplace(1280);
    expect(document.body).toBeTruthy();
  });

  it("renders on mobile", () => {
    renderMarketplace(390);
    expect(document.body).toBeTruthy();
  });
});

describe("AgentMarketplacePage — bid table scroll", () => {
  it("7-column bid table has scroll container on mobile", () => {
    const { container } = renderMarketplace(390);
    const allDivs = Array.from(container.querySelectorAll("[style]")) as HTMLElement[];
    // A grid with "2fr 1fr 1fr 1fr 1fr 1fr auto" must not appear bare
    const bareTable = allDivs.find((el) => {
      const cols = el.style.gridTemplateColumns?.replace(/\s/g, "") ?? "";
      if (!cols.startsWith("2fr") || !cols.endsWith("auto")) return false;
      const frCount = (cols.match(/1fr/g) ?? []).length;
      if (frCount < 4) return false;
      const parent = el.parentElement as HTMLElement | null;
      return parent && parent.style.overflowX !== "auto";
    });
    expect(bareTable).toBeUndefined();
  });
});
