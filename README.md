# Here Be Dragons

A **D&D / fantasy design system** distributed as a
[shadcn](https://ui.shadcn.com/docs/registry) **custom registry**: the components you already
know from shadcn/ui — same names, same props, same Radix primitives — in parchment, ink and
blood. Documented on a live [Fumadocs](https://fumadocs.dev) site.

```
React 19 · Tailwind v4 · Next.js 16 · Fumadocs 16 · pnpm + Turborepo
```

---

## Repository layout

```
.                              # pnpm + Turborepo monorepo
├── packages/
│   ├── hbd/                   # @hbd/registry — the shadcn registry
│   │   ├── registry/new-york/
│   │   │   ├── <name>/<name>.tsx        # component source (React + Tailwind utilities)
│   │   │   └── <name>/registry.json     # the item, included from the root registry.json
│   │   ├── registry/theme/registry.json # GENERATED @hbd/theme item
│   │   ├── theme/theme.css              # GENERATED theme, imported by the docs
│   │   ├── tokens/                      # design tokens (tokens.css + themes/*.css)
│   │   ├── scripts/build-theme.mjs      # tokens -> theme item + theme.css
│   │   ├── scripts/finalize-registry.mjs# absolute dependency URLs
│   │   ├── registry.json                # catalog: include list + shared items
│   │   └── public/r/*.json              # build output — what consumers fetch
└── apps/
    └── docs/                  # @hbd/docs — Next.js 16 + Fumadocs site
        ├── content/docs/components/*.mdx   # one page per component
        ├── components/examples/*.tsx       # "use client" demos used by the pages
        └── app/llms.txt, llms-full.txt     # the docs as Markdown, for AI assistants
```

---

## Quick start

```bash
pnpm install        # root — installs the whole workspace
pnpm dev            # turbo: theme + registry build → next dev → http://localhost:3001
```

### Common commands

| Command                                        | What it does                                               |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `pnpm dev`                                     | Run the docs site (builds the theme and registry first)    |
| `pnpm --filter @hbd/registry build:theme`      | Tokens → `@hbd/theme` item + `theme/theme.css`             |
| `pnpm --filter @hbd/registry registry:build`   | Theme + `shadcn build` + URL rewriting → `public/r/*.json` |
| `pnpm --filter @hbd/docs build`                | Static export of the docs → `apps/docs/out/`               |
| `pnpm typecheck` · `pnpm lint` · `pnpm format` | Workspace checks (Turborepo / Prettier)                    |

---

## Using the components (consumers)

In a shadcn project on Tailwind v4 and React 19, register the namespace once:

```jsonc
// components.json
{
  "registries": {
    "@hbd": "https://ds.qrsed.com/r/{name}.json",
  },
}
```

Then install the theme and whatever you need:

```bash
npx shadcn@latest add @hbd/theme @hbd/fonts
npx shadcn@latest add @hbd/button @hbd/card @hbd/dialog
```

Or skip the namespace entirely and install by URL:

```bash
npx shadcn@latest add https://ds.qrsed.com/r/button.json
```

Components arrive in `components/ui/` and are used exactly like shadcn/ui's:

```tsx
import { Button } from "@/components/ui/button";

<Button variant="outline">Cast Spell</Button>;
```

The theme is **merged** into your CSS file — your own rules stay. It installs the full shadcn
variable set in the HBD palette plus the HBD extras, for light, `.dark` and `.high-contrast`,
Fonts are a separate item, `@hbd/fonts`, so you can take ours or point the font-family variables
at your own.
Full details: <https://ds.qrsed.com/docs/installation> and `packages/hbd/README.md`.

---

## Deploying the docs

`apps/docs` builds a **fully static export** (`output: 'export'` → `apps/docs/out/`). Production
is **https://ds.qrsed.com**: a Cloudflare Worker serving only static assets, configured in
`apps/docs/wrangler.jsonc`.

- **Cloudflare (CI):** `.github/workflows/deploy-docs.yml` builds and runs `wrangler deploy` on
  every push to `main`. It needs two repo secrets, `CLOUDFLARE_ACCOUNT_ID` and
  `CLOUDFLARE_API_TOKEN`. Create the token from the **Edit Cloudflare Workers** template, with
  its zone set to `qrsed.com`. Because `wrangler.jsonc` declares the `ds.qrsed.com` custom
  domain, the deploy creates the DNS record and certificate.
- **Cloudflare (manual):** after `wrangler login`:

  ```bash
  NEXT_PUBLIC_SITE_URL=https://ds.qrsed.com pnpm --filter @hbd/registry registry:build
  pnpm --filter @hbd/docs registry:build
  NEXT_PUBLIC_SITE_URL=https://ds.qrsed.com pnpm --filter @hbd/docs build
  pnpm --filter @hbd/docs exec wrangler deploy
  ```

  `NEXT_PUBLIC_SITE_URL` matters twice: the registry bakes it into every dependency URL and the
  font tarball, and the docs bake it into each page's install snippet.

- **Any other static host:** upload `apps/docs/out/`. If it is served under a sub-path, also set
  `NEXT_PUBLIC_BASE_PATH=/<path>` at build time.
- **Vercel (server):** remove `output: 'export'` from `apps/docs/next.config.mjs` and point
  Vercel at the repo (build via `turbo run build --filter=@hbd/docs`).

The built `/r/*.json` are served as static files, so `npx shadcn add https://ds.qrsed.com/r/<name>.json`
works from the deployed site — which is exactly what each component page shows under **Installation**.

---

## Contributing / working in this repo

See **[AGENTS.md](./AGENTS.md)** — the conventions and "how to work here" guide (shared by
humans and AI agents; `CLAUDE.md` is a symlink to it).
