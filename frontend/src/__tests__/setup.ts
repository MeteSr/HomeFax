import "@testing-library/jest-dom";
import { cleanup, act } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest global setup — runs before each test file.
// Provides a minimal window.location.origin for services that reference it.
Object.defineProperty(window, "location", {
  value: { origin: "http://localhost:3000", href: "http://localhost:3000/" },
  writable: true,
});

// Default matchMedia stub — jsdom doesn't implement matchMedia.
// Individual test files may override this with configurable: true stubs
// that simulate specific viewport widths.
if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Default requestAnimationFrame stub — react-helmet-async defers DOM writes
// via RAF; this makes those writes synchronous in tests.
if (typeof (globalThis as any).requestAnimationFrame !== "function") {
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => { cb(0); return 0; };
  (globalThis as any).cancelAnimationFrame = () => {};
}

// Flush all pending async state updates (useEffect promise chains) before
// cleanup so React doesn't warn "state update should be wrapped in act(...)".
//
// A bare `await act(async () => {})` only drains one microtask layer.
// Components with chained .then() calls (e.g. getContractor → getCredentials)
// enqueue a second microtask after the first resolves — those land outside
// act if we don't yield to the macrotask queue first.
// `setTimeout(r, 0)` is a macrotask; it only fires after the microtask
// queue is fully drained, so act() sees all pending state updates.
afterEach(async () => {
  await act(async () => {
    await new Promise<void>((r) => setTimeout(r, 0));
  });
  cleanup();
});
