import defaultMdxComponents from "fumadocs-ui/mdx";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import type { MDXComponents } from "mdx/types";
import { Preview } from "@/components/preview";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    Preview,
    ...components,
  };
}

// Used by source.config.ts providerImportSource so JSX in .mdx picks these up.
export const useMDXComponents = getMDXComponents;
