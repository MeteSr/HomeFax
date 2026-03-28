/**
 * Post-build security checks (14.4.5, 14.4.6)
 * Run automatically after `vite build` via package.json "build" script.
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const DIST = new URL("../dist", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

let failed = false;

function err(msg) {
  console.error(`[security-check] FAIL: ${msg}`);
  failed = true;
}

function allFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...allFiles(full));
    else results.push(full);
  }
  return results;
}

const jsFiles = allFiles(DIST).filter((f) => f.endsWith(".js") || f.endsWith(".mjs"));

// 14.4.5 — fetchRootKey must never be true in production bundle
for (const file of jsFiles) {
  const src = readFileSync(file, "utf8");
  if (/fetchRootKey\s*:\s*true/.test(src)) {
    err(`fetchRootKey:true found in production bundle: ${file}`);
  }
}

// 14.4.6 — Anthropic API key must not appear in production bundle
// Matches sk-ant-... patterns
for (const file of jsFiles) {
  const src = readFileSync(file, "utf8");
  if (/sk-ant-[A-Za-z0-9_-]{10,}/.test(src)) {
    err(`Anthropic API key pattern found in production bundle: ${file}`);
  }
  if (/VITE_ANTHROPIC/.test(src)) {
    err(`VITE_ANTHROPIC variable reference found in production bundle: ${file}`);
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log("[security-check] All checks passed.");
}
