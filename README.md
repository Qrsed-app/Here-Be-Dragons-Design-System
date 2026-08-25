# Here Be Dragons

A **D&D / fantasy design system** — token-driven React components distributed as a
[shadcn](https://ui.shadcn.com/docs/registry) **custom registry**, with a live
[Fumadocs](https://fumadocs.dev) documentation site.

```
React 19 · Tailwind v4 · Next.js 16 · Fumadocs 16 · pnpm + Turborepo
```

---

## Repository layout

```
.                              # pnpm + Turborepo monorepo
├── packages/
│   └── hbd/                   # @hbd/registry — the shadcn registry (51 components)
│       ├── registry/new-york/
│       │   ├── <name>/<name>.tsx        # component source (React + Tailwind v4)
│       │   ├── styles/components/*.css   # light-DOM component CSS (folded into the theme)
│       │   └── fonts/                    # Tiamat Condensed SC (woff2/woff/ttf)
│       ├── app/globals.css   # GENERATED theme: tokens + @theme + all component CSS
│       ├── tokens/           # design-token CSS source (tokens.css + themes/*.css)
│       ├── scripts/build-globals.mjs     # regenerates app/globals.css
│       ├── components.json · registry.json
│       └── public/r/*.json   # shadcn build output — what consumers fetch
└── apps/
    └── docs/                 # @hbd/docs — Next.js 16 + Fumadocs site
        ├── content/docs/*.mdx            # one page per component (+ index)
        ├── components/demos/*.tsx        # interactive "use client" example components
        ├── content/docs/meta.json        # grouped sidebar nav
        └── scripts/copy-registry.mjs     # copies /r + fonts from @hbd/registry
```

---

## Quick start

```bash
pnpm install        # root — installs the whole workspace
pnpm dev            # turbo: build registry → copy /r → next dev → http://localhost:3001
```

Open <http://localhost:3001> — grouped sidebar (Primitives / Forms / Feedback & display /
Navigation / Overlays / Pickers / Domain), live previews on every page, and a
**light / dark / high-contrast** switcher (top-right).

### Common commands

| Command                                        | What it does                                             |
| ---------------------------------------------- | -------------------------------------------------------- |
| `pnpm dev`                                     | Run the docs site (builds + serves the registry too)     |
| `pnpm --filter @hbd/registry registry:build`   | `shadcn build` → `packages/hbd/public/r/*.json`          |
| `pnpm --filter @hbd/registry build:globals`    | Regenerate `app/globals.css` from tokens + component CSS |
| `pnpm --filter @hbd/docs build`                | Static export of the docs → `apps/docs/out/`             |
| `pnpm typecheck` · `pnpm lint` · `pnpm format` | Workspace checks (Turborepo / Prettier)                  |

---

## Using the components (consumers)

The registry ships React + Tailwind v4 components installable with the shadcn CLI. In a
Tailwind-v4 shadcn project, register the namespace once in `components.json`:

```jsonc
{ "registries": { "@hbd": "https://YOUR_HOST/r/{name}.json" } }
```

Then add components — dependencies and the token theme are pulled automatically:

```bash
npx shadcn@latest add @hbd/button
npx shadcn@latest add @hbd/date-picker   # also pulls time-picker, input, theme, utils
```

The first install writes the complete **HBD theme** into your `app/globals.css` (palette,
semantic tokens, light/dark/high-contrast, every component's styles, the Tailwind v4
`@theme inline` utilities) and copies the local font to `public/fonts/`. Dark / high
contrast are attribute-driven (and respond to the `.dark` class):

```text
<html data-theme="dark">             — or class="dark"
<html data-theme="high-contrast">
```

See `packages/hbd/README.md` for full registry/maintenance details.

---

## Deploying the docs

`apps/docs` builds a **fully static export** (`output: 'export'` → `apps/docs/out/`), so it
hosts anywhere static.

- **GitHub Pages:** the included workflow (`.github/workflows/deploy-docs.yml`) builds and
  publishes on push to `main`. One-time: repo **Settings → Pages → Source: GitHub Actions**.
  The base path is derived from the repo name automatically.
- **Any static host (S3 / Netlify / Cloudflare Pages / root domain):** upload `apps/docs/out/`.
- **Vercel (server):** remove `output: 'export'` from `apps/docs/next.config.mjs` and point
  Vercel at the repo (build via `turbo run build --filter=@hbd/docs`).

The built `/r/*.json` are served as static files too, so `npx shadcn add https://host/r/<name>.json`
works from the deployed site.

---

## Contributing / working in this repo

See **[AGENTS.md](./AGENTS.md)** — the conventions and "how to work here" guide (shared by
humans and AI agents; `CLAUDE.md` is a symlink to it).
