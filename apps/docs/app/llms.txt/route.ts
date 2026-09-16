import { llms } from "fumadocs-core/source";
import { source } from "@/lib/source";

export const dynamic = "force-static";

const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(/\/+$/, "");

export function GET() {
  const body = `# Here Be Dragons

> A D&D / fantasy design system distributed as a shadcn registry. Components keep the shadcn/ui API (same names, props and Radix primitives) and are installed with the shadcn CLI.

Install: add \`"registries": { "@hbd": "${site}/r/{name}.json" }\` to components.json, then run \`npx shadcn@latest add @hbd/theme @hbd/<component>\`. Every item is also available by URL at ${site}/r/<name>.json, and the full catalog at ${site}/r/registry.json.

Full documentation as Markdown: ${site}/llms-full.txt

${llms(source)
  .index()
  // The index repeats the site title as its own heading, and llms.txt readers want absolute links.
  .replace(/^# .*\n+/, "## Pages\n\n")
  .replace(/\]\(\//g, `](${site}/`)}`;

  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
