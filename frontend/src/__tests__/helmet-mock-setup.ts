/**
 * Global mock for react-helmet-async — applied to every test file via
 * vitest setupFiles. Makes <Helmet> safe when rendered without a
 * <HelmetProvider> in the tree (the common case in component unit tests).
 *
 * When a test explicitly wraps with <HelmetProvider> (e.g. SEO test files),
 * the real HelmetProvider context is used and Helmet operates normally —
 * meta tags, og: tags, and document.title are all updated as expected.
 *
 * Without this mock, components that include <Helmet> throw:
 *   TypeError: Cannot read properties of undefined (reading 'add')
 * because HelmetDispatcher.init() calls context.helmetInstances.add(this)
 * and the default context is an empty object.
 */
import { vi } from "vitest";
import React from "react";

vi.mock("react-helmet-async", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-helmet-async")>();

  const { HelmetProvider: RealHelmetProvider, Helmet: RealHelmet } = actual;

  // Wrap every <Helmet> in its own <HelmetProvider> so it is always safe,
  // whether or not the test provides a provider in the render tree.
  // When the test DOES provide its own <HelmetProvider> (e.g. SEO tests),
  // the inner provider takes precedence for this Helmet instance — the real
  // Helmet still runs and updates document.title / meta tags as expected.
  function SafeHelmet(props: React.ComponentProps<typeof RealHelmet>) {
    return React.createElement(
      RealHelmetProvider,
      null,
      React.createElement(RealHelmet, props)
    );
  }
  SafeHelmet.displayName = "Helmet";

  return {
    ...actual,
    Helmet: SafeHelmet,
  };
});
