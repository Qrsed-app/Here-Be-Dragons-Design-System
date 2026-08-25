import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url)); // apps/docs/scripts
const docsRoot = join(here, ".."); // apps/docs

// Resolve the registry package regardless of pnpm hoisting.
const registryRoot = dirname(require.resolve("@hbd/registry/package.json"));

const pairs = [
  [join(registryRoot, "public", "r"), join(docsRoot, "public", "r")],
  [join(registryRoot, "public", "fonts"), join(docsRoot, "public", "fonts")],
];

for (const [src, dest] of pairs) {
  if (!existsSync(src)) {
    console.warn(`[copy-registry] missing source: ${src} (run registry:build first)`);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[copy-registry] ${src} -> ${dest}`);
}
