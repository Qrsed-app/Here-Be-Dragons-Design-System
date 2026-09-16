import { createMDX } from "fumadocs-mdx/next";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Only for hosting under a sub-path (e.g. a GitHub Pages project site at /<repo>).
// Production at ds.qrsed.com is root-hosted, so the deploy leaves this empty.
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
