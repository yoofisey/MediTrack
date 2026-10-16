// Test bootstrap: lets `node --test` resolve the app's `@/` alias and
// extensionless relative imports (Next.js bundler-style) so tests can import
// real code instead of re-implemented copies.
//
// Usage: node --import ./tests/setup.mjs --test

import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fileExists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function resolveAsFile(base, spec) {
  const candidates = [
    spec,
    `${spec}.js`,
    `${spec}.mjs`,
    `${spec}.ts`,
    `${spec}.tsx`,
    path.join(spec, "index.js"),
    path.join(spec, "index.ts"),
  ];
  for (const c of candidates) {
    const full = path.resolve(base, c);
    if (fileExists(full)) return full;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    // `@/` alias → repo root.
    if (specifier.startsWith("@/")) {
      const rest = specifier.slice(2);
      const resolved = resolveAsFile(ROOT, rest);
      if (!resolved) throw new Error(`test loader: cannot resolve "${specifier}"`);
      return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }

    // Extensionless relative imports (`./payments`, `../x`) against the importing file.
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      if (!/\.(js|mjs|ts|tsx)$/.test(specifier)) {
        const resolved = resolveAsFile(parentDir, specifier);
        if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
      }
    }

    return nextResolve(specifier, context);
  },
});