#!/usr/bin/env node
// Runs after `shadcn build`. Makes the built registry installable with zero config:
//
// - `@hbd/<name>` registry dependencies become absolute URLs. The CLI refuses a
//   namespaced dependency unless the consumer has declared that namespace in
//   components.json ("Unknown registry @hbd"); a URL resolves everywhere, and
//   still works for consumers who did register `@hbd`.
//
// The host comes from NEXT_PUBLIC_SITE_URL — the same variable that rewrites the
// docs' install snippets — so a local build advertises localhost:3001 and the
// deploy advertises https://ds.qrsed.com.

import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/r");
const REGISTRY_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(
  /\/+$/,
  "",
);
const NAMESPACE = "@hbd/";

// `shadcn build` silently skips a component whose registry.json is not listed in the
// root `include`, which would publish a registry with the component missing. Fatal in
// CI (the deploy); only a warning locally, so `pnpm dev` keeps working mid-authoring.
const included = new Set(
  JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8")).include ?? [],
);
const COMPONENTS = "registry/new-york";
const orphans = readdirSync(join(ROOT, COMPONENTS))
  .map((dir) => `${COMPONENTS}/${dir}/registry.json`)
  .filter((fragment) => existsSync(join(ROOT, fragment)) && !included.has(fragment));
if (orphans.length) {
  console.error(`registry.json does not include:\n  ${orphans.join("\n  ")}`);
  if (process.env.CI) process.exit(1);
}

const rewriteItem = (item) => {
  if (item.registryDependencies) {
    item.registryDependencies = item.registryDependencies.map((dep) =>
      dep.startsWith(NAMESPACE) ? `${REGISTRY_URL}/r/${dep.slice(NAMESPACE.length)}.json` : dep,
    );
  }
  return item;
};

// `shadcn build` only writes; a renamed or dropped component would otherwise keep
// serving its old JSON from a previous build.
const current = new Set([
  "registry.json",
  ...JSON.parse(readFileSync(join(OUT, "registry.json"), "utf8")).items.map(
    (i) => `${i.name}.json`,
  ),
]);
const stale = readdirSync(OUT).filter((f) => f.endsWith(".json") && !current.has(f));
for (const file of stale) rmSync(join(OUT, file));
if (stale.length) console.log(`removed ${stale.length} stale item(s): ${stale.join(", ")}`);

let count = 0;
for (const file of readdirSync(OUT).filter((f) => f.endsWith(".json"))) {
  const path = join(OUT, file);
  const json = JSON.parse(readFileSync(path, "utf8"));
  if (Array.isArray(json.items)) json.items.forEach(rewriteItem);
  else rewriteItem(json);
  writeFileSync(path, JSON.stringify(json, null, 2) + "\n");
  count++;
}

console.log(`finalized ${count} registry files for ${REGISTRY_URL}`);
