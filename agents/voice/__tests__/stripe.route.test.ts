/**
 * Stripe Express Route — static + compile checks
 *
 * STRIPE.1  Route POST /api/stripe/create-checkout exists in server.ts
 * STRIPE.2  Route does not reference undefined identifiers (requireApiKey etc.)
 * STRIPE.3  Route reads STRIPE_SECRET_KEY from env, not a hardcoded literal
 * STRIPE.4  Route reads price IDs from env vars, not hardcoded values
 * STRIPE.5  server.ts compiles without TypeScript errors
 *
 * No real Stripe API calls — source analysis only.
 * STRIPE.5 uses the TypeScript compiler API to catch errors like the
 * `requireApiKey` undefined reference that broke local startup.
 */

import { describe, it, expect } from "@jest/globals";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import * as ts from "typescript";

const SERVER_PATH = resolve(__dirname, "../server.ts");
const src = readFileSync(SERVER_PATH, "utf8");

describe("STRIPE.1 — route registration", () => {
  it("registers POST /api/stripe/create-checkout", () => {
    expect(src).toMatch(/app\.post\(\s*["'`]\/api\/stripe\/create-checkout["'`]/);
  });
});

describe("STRIPE.2 — no undefined middleware references in route", () => {
  it("does not reference requireApiKey (undefined in this file)", () => {
    // requireApiKey is not defined — auth is handled at app.use('/api/') level
    const routeBlock = src.slice(src.indexOf("/api/stripe/create-checkout"));
    const firstHandler = routeBlock.slice(0, routeBlock.indexOf("});") + 3);
    expect(firstHandler).not.toMatch(/\brequireApiKey\b/);
  });

  it("uses only defined middleware in the route", () => {
    // The route should have exactly 2 args: path + async handler
    expect(src).toMatch(
      /app\.post\(\s*["'`]\/api\/stripe\/create-checkout["'`],\s*async\s*\(/
    );
  });
});

describe("STRIPE.3 — secret key sourced from env", () => {
  it("reads STRIPE_SECRET_KEY from process.env, not hardcoded", () => {
    expect(src).toMatch(/process\.env\.STRIPE_SECRET_KEY/);
    // Must not contain a hardcoded sk_live_ or sk_test_ key
    expect(src).not.toMatch(/["'`]sk_(?:live|test)_[A-Za-z0-9]+["'`]/);
  });
});

describe("STRIPE.4 — price IDs sourced from env", () => {
  it("reads price IDs from process.env", () => {
    expect(src).toMatch(/process\.env\.STRIPE_PRICE_PRO_MONTHLY/);
    expect(src).toMatch(/process\.env\.STRIPE_PRICE_PREMIUM_MONTHLY/);
    expect(src).toMatch(/process\.env\.STRIPE_PRICE_CONTRACTOR_PRO_MONTHLY/);
  });

  it("does not hardcode price_* IDs", () => {
    expect(src).not.toMatch(/["'`]price_[A-Za-z0-9]{10,}["'`]/);
  });
});

describe("STRIPE.5 — TypeScript compilation", () => {
  it("server.ts compiles without errors", () => {
    const configPath = ts.findConfigFile(
      resolve(__dirname, ".."),
      ts.sys.fileExists,
      "tsconfig.json"
    );

    const config = configPath
      ? ts.readConfigFile(configPath, ts.sys.readFile).config
      : {};

    const { options } = ts.convertCompilerOptionsFromJson(
      { ...config.compilerOptions, noEmit: true, skipLibCheck: true },
      resolve(__dirname, "..")
    );

    const program = ts.createProgram([SERVER_PATH], options);
    const diagnostics = ts.getPreEmitDiagnostics(program, program.getSourceFile(SERVER_PATH));
    const errors = Array.from(diagnostics).filter(d => d.category === ts.DiagnosticCategory.Error);

    if (errors.length > 0) {
      const messages = errors.map(d =>
        `Line ${d.file?.getLineAndCharacterOfPosition(d.start!).line! + 1}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`
      );
      throw new Error(`TypeScript errors in server.ts:\n${messages.join("\n")}`);
    }

    expect(errors).toHaveLength(0);
  });
});
