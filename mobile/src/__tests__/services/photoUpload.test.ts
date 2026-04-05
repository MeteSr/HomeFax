/**
 * @jest-environment node
 */
import {
  validateImageAsset,
  buildPhotoPayload,
  formatFileSize,
  type ImageAsset,
} from "../../services/photoUploadService";

const VALID_ASSET: ImageAsset = {
  uri:      "file:///tmp/photo.jpg",
  base64:   "abc123",
  mimeType: "image/jpeg",
  fileSize: 512_000,   // 512 KB
  width:    1200,
  height:   900,
};

// ── validateImageAsset ────────────────────────────────────────────────────────

describe("validateImageAsset", () => {
  it("returns null for a valid JPEG asset", () => {
    expect(validateImageAsset(VALID_ASSET)).toBeNull();
  });

  it("returns null for a valid PNG asset", () => {
    expect(validateImageAsset({ ...VALID_ASSET, mimeType: "image/png" })).toBeNull();
  });

  it("returns error when base64 is empty", () => {
    expect(validateImageAsset({ ...VALID_ASSET, base64: "" })).toMatch(/image data/i);
  });

  it("returns error when base64 is null", () => {
    expect(validateImageAsset({ ...VALID_ASSET, base64: null })).toMatch(/image data/i);
  });

  it("returns error when file exceeds 10 MB", () => {
    expect(validateImageAsset({ ...VALID_ASSET, fileSize: 11_000_000 })).toMatch(/too large/i);
  });

  it("returns error for unsupported MIME type", () => {
    expect(validateImageAsset({ ...VALID_ASSET, mimeType: "image/gif" })).toMatch(/jpeg or png/i);
  });
});

// ── buildPhotoPayload ─────────────────────────────────────────────────────────

describe("buildPhotoPayload", () => {
  it("includes jobId and base64", () => {
    const p = buildPhotoPayload("job_1", VALID_ASSET);
    expect(p.jobId).toBe("job_1");
    expect(p.base64).toBe("abc123");
  });

  it("includes mimeType", () => {
    expect(buildPhotoPayload("job_1", VALID_ASSET).mimeType).toBe("image/jpeg");
  });
});

// ── formatFileSize ────────────────────────────────────────────────────────────

describe("formatFileSize", () => {
  it("formats bytes below 1 KB", ()  => expect(formatFileSize(512)).toBe("512 B"));
  it("formats kilobytes",         ()  => expect(formatFileSize(512_000)).toBe("500 KB"));
  it("formats megabytes",         ()  => expect(formatFileSize(2_097_152)).toBe("2.0 MB"));
});
