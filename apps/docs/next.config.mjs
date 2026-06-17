import { createMDX } from "fumadocs-mdx/next";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // @hbd/registry ships raw .tsx sources (no build step). Next must compile them.
  transpilePackages: ["@hbd/registry"],
  // Monorepo root for output file tracing (silences the multi-lockfile warning).
  outputFileTracingRoot: resolve(here, "../.."),
};

const withMDX = createMDX();

export default withMDX(config);
