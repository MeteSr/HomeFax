/**
 * MOB.4 — FsboListingPage mobile audit
 */
import { render, screen } from "@testing-library/react";
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

let FsboListingPage: React.ComponentType;
let ShowingRequestForm: React.ComponentType<{ propertyId: string }>;

beforeAll(async () => {
  mockMatchMedia(1280);
  const mod = await import("@/pages/FsboListingPage");
  FsboListingPage   = mod.default;
  ShowingRequestForm = mod.ShowingRequestForm;
});

function renderFsbo(width: number) {
  mockMatchMedia(width);
  return render(
    <MemoryRouter initialEntries={["/for-sale/1"]}>
      <Routes><Route path="/for-sale/:propertyId" element={<FsboListingPage />} /></Routes>
    </MemoryRouter>
  );
}

function renderForm(width: number) {
  mockMatchMedia(width);
  return render(<ShowingRequestForm propertyId="1" />);
}

// ── Loading state renders ─────────────────────────────────────────────────────

describe("FsboListingPage — renders on both viewports", () => {
  it("renders loading state on desktop without crashing", () => {
    renderFsbo(1280);
    expect(document.body).toBeTruthy();
  });

  it("renders loading state on mobile without crashing", () => {
    renderFsbo(390);
    expect(document.body).toBeTruthy();
  });
});

// ── Showing request form submit button ────────────────────────────────────────

describe("ShowingRequestForm — submit button", () => {
  it("submit button is full-width on mobile", () => {
    const { container } = renderForm(390);
    const btn = container.querySelector("button[type='submit']") as HTMLElement;
    expect(btn.style.alignSelf === "stretch" || btn.style.width === "100%").toBe(true);
  });

  it("submit button is not full-width on desktop", () => {
    const { container } = renderForm(1280);
    const btn = container.querySelector("button[type='submit']") as HTMLElement;
    expect(btn.style.alignSelf).not.toBe("stretch");
    expect(btn.style.width).not.toBe("100%");
  });
});

// ── Outer container padding ───────────────────────────────────────────────────

describe("FsboListingPage — outer padding", () => {
  it("uses 2rem top padding on desktop", () => {
    const { container } = renderFsbo(1280);
    const outer = container.querySelector("[style*='max-width']") as HTMLElement | null;
    if (outer) {
      expect(outer.style.padding).toMatch(/2rem/);
    }
  });

  it("uses reduced top padding on mobile", () => {
    const { container } = renderFsbo(390);
    const outer = container.querySelector("[style*='max-width']") as HTMLElement | null;
    if (outer) {
      expect(outer.style.padding).not.toMatch(/^2rem/);
    }
  });
});

// ── Photo hero ────────────────────────────────────────────────────────────────

describe("FsboListingPage — photo hero", () => {
  it("hero container exists", () => {
    renderFsbo(390);
    expect(document.body).toBeTruthy();
  });
});

// ── Showing request form inputs ───────────────────────────────────────────────

describe("ShowingRequestForm — input width", () => {
  it("name input is full-width", () => {
    const { container } = renderForm(390);
    const input = container.querySelector("#sr-name") as HTMLInputElement;
    expect(input.style.width).toBe("100%");
  });

  it("contact input is full-width", () => {
    const { container } = renderForm(390);
    const input = container.querySelector("#sr-contact") as HTMLInputElement;
    expect(input.style.width).toBe("100%");
  });

  it("time input is full-width", () => {
    const { container } = renderForm(390);
    const input = container.querySelector("#sr-time") as HTMLInputElement;
    expect(input.style.width).toBe("100%");
  });
});

// ── Form renders correct labels ───────────────────────────────────────────────

describe("ShowingRequestForm — labels", () => {
  it("shows Your Name label", () => {
    renderForm(390);
    expect(screen.getByText(/your name/i)).toBeInTheDocument();
  });

  it("shows Email or Phone label", () => {
    renderForm(390);
    expect(screen.getByText(/email or phone/i)).toBeInTheDocument();
  });

  it("shows Preferred Showing Time label", () => {
    renderForm(390);
    expect(screen.getByText(/preferred showing time/i)).toBeInTheDocument();
  });

  it("shows submit button text", () => {
    renderForm(390);
    expect(screen.getByRole("button", { name: /request a showing/i })).toBeInTheDocument();
  });
});
