import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "lib", "i18n.js"), "utf8");

// Split the LANGUAGES object into per-locale blocks and collect key sets.
function localeBlocks() {
  const start = src.indexOf("const LANGUAGES = {");
  assert.ok(start > -1, "LANGUAGES object not found");
  const blocks = new Map();
  const re = /^ {2}(\w+): \{$/gm;
  let m;
  while ((m = re.exec(src))) {
    // find matching close for this locale block (line starting with "  },")
    const openIdx = src.indexOf("{", m.index);
    let depth = 0;
    let i = openIdx;
    for (; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    const body = src.slice(openIdx, i);
    const keys = new Set([...body.matchAll(/"([^"]+)":/g)].map(k => k[1]));
    blocks.set(m[1], keys);
  }
  return blocks;
}

test("every locale defines the same key set as en", () => {
  const blocks = localeBlocks();
  assert.ok(blocks.size >= 2, "expected multiple locales");
  const en = blocks.get("en");
  assert.ok(en && en.size > 0, "en keys not parsed");
  const problems = [];
  for (const [loc, keys] of blocks) {
    if (loc === "en") continue;
    const missing = [...en].filter(k => !keys.has(k));
    const extra = [...keys].filter(k => !en.has(k));
    if (missing.length) problems.push(`${loc} missing: ${missing.join(", ")}`);
    if (extra.length) problems.push(`${loc} extra: ${extra.join(", ")}`);
  }
  assert.equal(problems.length, 0, problems.join("\n"));
});

test("VitalsTab i18n keys exist in en", () => {
  const en = localeBlocks().get("en");
  for (const k of ["vitals.readings", "vitals.lastLogged", "vitals.viewHistory"]) {
    assert.ok(en.has(k), `missing key: ${k}`);
  }
});
