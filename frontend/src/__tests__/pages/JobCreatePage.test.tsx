/**
 * JobCreatePage — behavioral tests (Issue #182)
 *
 * JC.1  Submit with valid fields → jobService.create receives correct args
 * JC.2  Photo attached → photoService.upload called once per file after creation
 * JC.3  Photo upload failure → success screen still shown, error toast fired
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import JobCreatePage from "@/pages/JobCreatePage";

// ─── Hoisted mock functions ───────────────────────────────────────────────────
// vi.hoisted() ensures these are initialised before vi.mock() factories run,
// avoiding the TDZ "Cannot access before initialization" error that occurs when
// vi.mock() (which is hoisted) tries to reference a module-level const.

const mockNavigate  = vi.hoisted(() => vi.fn());
const mockCreate    = vi.hoisted(() => vi.fn());
const mockUpload    = vi.hoisted(() => vi.fn());
const mockToastErr  = vi.hoisted(() => vi.fn());

// ─── Layout mock ──────────────────────────────────────────────────────────────
// Prevents loading VoiceAgent / quoteService / billService / fsboService /
// AuthContext — all of which touch @icp-sdk/auth → IndexedDB and hang jsdom.
// Pattern matches WarrantyOcr.test.tsx and ListingPages.test.tsx.

vi.mock("@/components/Layout", () => ({
  Layout: ({ children }: any) => <div>{children}</div>,
}));

// ─── Service / store mocks ────────────────────────────────────────────────────

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/jobs/new", search: "", hash: "", state: null }),
  };
});

vi.mock("@/services/job", () => ({
  jobService: {
    create:         mockCreate,
    getByProperty:  vi.fn().mockResolvedValue([]),
    reset:          vi.fn(),
    updateJob:      vi.fn().mockRejectedValue(new Error("not supported")),
  },
  isInsuranceRelevant: vi.fn().mockReturnValue(false),
}));

vi.mock("@/services/photo", () => ({
  photoService: {
    upload:   mockUpload,
    getQuota: vi.fn().mockResolvedValue({ used: 0, limit: 10, tier: "Basic" }),
  },
}));

vi.mock("@/services/payment", () => ({
  paymentService: {
    getMySubscription:  vi.fn().mockResolvedValue({ tier: "Basic", expiresAt: null }),
    getMyAgentCredits:  vi.fn().mockResolvedValue(5),
  },
}));

vi.mock("@/services/property", () => ({
  propertyService: {
    getMyProperties: vi.fn().mockResolvedValue([]),
  },
}));

// Pre-populate the store so the property <select> renders and form.propertyId is set.
vi.mock("@/store/propertyStore", () => ({
  usePropertyStore: () => ({
    properties: [{ id: 1, address: "123 Test St", city: "Austin", state: "TX", zipCode: "78701" }],
    setProperties: vi.fn(),
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: mockToastErr },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ConstructionPhotoUpload calls URL.createObjectURL when a file is selected.
// jsdom doesn't implement it, so stub it for tests that simulate file uploads.
function stubObjectURL() {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn().mockReturnValue("blob:fake"),
    revokeObjectURL: vi.fn(),
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <JobCreatePage />
    </MemoryRouter>
  );
}

function fillRequiredFields() {
  // Contractor name is required when isDiy is false (the default)
  fireEvent.change(screen.getByLabelText(/contractor \/ company name/i), {
    target: { value: "Cool Air Inc" },
  });
  // Amount
  fireEvent.change(screen.getByLabelText(/amount paid/i), {
    target: { value: "1500" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── JC.1 — Submit passes correct args to jobService.create ──────────────────

describe("JC.1 — form submit", () => {
  it("calls jobService.create with the correct fields on submit", async () => {
    mockCreate.mockResolvedValueOnce({
      id: "job-123", propertyId: "1", status: "pending", photos: [],
    });

    renderPage();

    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /log job to blockchain/i }));

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId:     "1",
          serviceType:    "HVAC",   // default first option
          contractorName: "Cool Air Inc",
          amount:         150_000,  // $1500 × 100 cents
          isDiy:          false,
        })
      )
    );
  });

  it("shows an error toast and does not call create when amount is missing", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/contractor \/ company name/i), {
      target: { value: "Some Co" },
    });
    // intentionally skip filling amount

    fireEvent.click(screen.getByRole("button", { name: /log job to blockchain/i }));

    await waitFor(() => expect(mockToastErr).toHaveBeenCalled());
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

// ─── JC.2 — Photo upload wiring ──────────────────────────────────────────────

describe("JC.2 — photo upload after job creation", () => {
  it("calls photoService.upload once per file with the new job id", async () => {
    stubObjectURL();
    mockCreate.mockResolvedValueOnce({
      id: "job-photo-test", propertyId: "1", status: "pending", photos: [],
    });
    mockUpload.mockResolvedValue({ id: "photo-1" });

    renderPage();
    fillRequiredFields();

    // Simulate a file selection via ConstructionPhotoUpload's hidden <input type="file">
    // The component is NOT globally mocked — we interact with its real file input.
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile  = new File(["img"], "roof.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    fireEvent.click(screen.getByRole("button", { name: /log job to blockchain/i }));

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledTimes(1);
      expect(mockUpload).toHaveBeenCalledWith(
        mockFile,
        "job-photo-test",   // job id returned by create
        "1",                // propertyId
        expect.any(String), // phase / docType chosen in the upload widget
        ""                  // description (empty string)
      );
    });
  });

  it("calls photoService.upload N times for N files", async () => {
    stubObjectURL();
    mockCreate.mockResolvedValueOnce({
      id: "job-multi", propertyId: "1", status: "pending", photos: [],
    });
    mockUpload.mockResolvedValue({ id: "photo-x" });

    renderPage();
    fillRequiredFields();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(["a"], "before.jpg", { type: "image/jpeg" });
    const file2 = new File(["b"], "after.jpg",  { type: "image/jpeg" });
    // ConstructionPhotoUpload processes each file individually via forEach(handleFile).
    // fireEvent.change with a FileList triggers onChange which calls forEach.
    Object.defineProperty(fileInput, "files", { value: [file1, file2], configurable: true });
    fireEvent.change(fileInput);

    fireEvent.click(screen.getByRole("button", { name: /log job to blockchain/i }));

    await waitFor(() => expect(mockUpload).toHaveBeenCalledTimes(2));
  });
});

// ─── JC.3 — Photo upload failure does not block navigation ───────────────────

describe("JC.3 — photo upload failure", () => {
  it("shows success screen and an error toast when an upload rejects", async () => {
    stubObjectURL();
    mockCreate.mockResolvedValueOnce({
      id: "job-fail-upload", propertyId: "1", status: "pending", photos: [],
    });
    mockUpload.mockRejectedValue(new Error("canister error"));

    renderPage();
    fillRequiredFields();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(["x"], "receipt.pdf", { type: "application/pdf" })] },
    });

    fireEvent.click(screen.getByRole("button", { name: /log job to blockchain/i }));

    await waitFor(() => {
      // Success screen rendered (job was saved)
      expect(screen.getByText(/hvac logged/i)).toBeInTheDocument();
      // Error toast shown for the failed photo
      expect(mockToastErr).toHaveBeenCalledWith(expect.stringMatching(/photo.*failed/i));
    });
  });
});
