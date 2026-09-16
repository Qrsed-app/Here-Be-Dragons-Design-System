import { source } from "@/lib/source";

export const dynamic = "force-static";

export async function GET() {
  const pages = await Promise.all(
    source
      .getPages()
      .map(
        async (page) =>
          `# ${page.data.title} (${page.url})\n\n${await page.data.getText("processed")}`,
      ),
  );

  return new Response(pages.join("\n\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
