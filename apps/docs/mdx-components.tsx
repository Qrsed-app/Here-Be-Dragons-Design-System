import defaultMdxComponents from "fumadocs-ui/mdx";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import type { MDXComponents } from "mdx/types";
import { Preview } from "@/components/preview";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    TypeTable,
    Preview,
    ...components,
  };
}

// Used by source.config.ts providerImportSource so JSX in .mdx picks these up.
export const useMDXComponents = getMDXComponents;
