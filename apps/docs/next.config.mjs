import { createMDX } from "fumadocs-mdx/next";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// GitHub Pages project sites are served under /<repo>. The deploy workflow sets
// NEXT_PUBLIC_BASE_PATH to the repo name; empty = root-domain / local hosting.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),
  // @hbd/registry ships raw .tsx sources (no build step). Next must compile them.
  transpilePackages: ["@hbd/registry"],
  // Monorepo root for output file tracing (silences the multi-lockfile warning).
  outputFileTracingRoot: resolve(here, "../.."),
};

const withMDX = createMDX();

export default withMDX(config);
