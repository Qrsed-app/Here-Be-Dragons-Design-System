import { defineDocs, defineConfig } from "fumadocs-mdx/config";

export const docs = defineDocs({
  dir: "content/docs",
});

// The install snippets in content/docs are authored against the local dev
// registry: `pnpm dev` serves the built /r/*.json from apps/docs/public, so
// http://localhost:3001/r/<name>.json is a working URL while writing docs.
//
// A deployed build has to advertise the published registry instead. Next's
// basePath cannot do this — it rewrites <Link>/asset URLs, never text inside a
// code fence — and doing it in a React component would lose the build-time
// Shiki highlighting and the copy button. So rewrite it in the AST, before the
// code blocks are highlighted.
//
// Set NEXT_PUBLIC_SITE_URL to the published base (the deploy workflow takes it
// from actions/configure-pages). Unset — i.e. every local build — leaves the
// localhost URLs untouched, which is what a local reader wants.
const DEV_REGISTRY_ORIGIN = "http://localhost:3001";

// Structural, so this needs no mdast/unist types (neither is a declared
// dependency of this app) — every node carrying text has a string `value`.
type Node = { value?: string; children?: Node[] };

function remarkRegistryUrl() {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

  return (tree: Node) => {
    if (!site || site === DEV_REGISTRY_ORIGIN) return;

    const walk = (node: Node) => {
      if (typeof node.value === "string" && node.value.includes(DEV_REGISTRY_ORIGIN)) {
        node.value = node.value.split(DEV_REGISTRY_ORIGIN).join(site);
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };

    walk(tree);
  };
}

export default defineConfig({
  mdxOptions: {
    providerImportSource: "@/mdx-components",
    remarkPlugins: (plugins) => [remarkRegistryUrl, ...plugins],
  },
});
