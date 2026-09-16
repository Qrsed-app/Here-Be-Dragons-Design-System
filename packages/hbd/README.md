# Here Be Dragons — shadcn Registry

A **custom [shadcn](https://ui.shadcn.com/docs/registry) registry** that ships the Here Be
Dragons design system. Every component keeps the **shadcn/ui API** — same names, exports, props
and Radix primitives — restyled in a D&D / fantasy look, plus HBD-only components (spell card,
stat block, full-page banner, …).

- Installable with `npx shadcn add @hbd/<name>` or by URL.
- Styled with Tailwind utilities; the only CSS shipped is the token theme.
- Targets **React 19 + Tailwind v4** — Next.js, Vite, Electron, anything the shadcn CLI supports.

---

## For consumers

Register the namespace once in `components.json`:

```jsonc
{
  "registries": {
    "@hbd": "https://ds.qrsed.com/r/{name}.json",
  },
}
```

```bash
npx shadcn@latest add @hbd/theme            # the palette, fonts, radii — merged into your CSS
npx shadcn@latest add @hbd/button @hbd/card # components, into components/ui/
```

Every item is also available by URL (`https://ds.qrsed.com/r/button.json`), and the whole
catalog at `/r/registry.json`. Full guide: <https://ds.qrsed.com/docs/installation>.

### The theme

`@hbd/theme` **merges** into the CSS file named in your `components.json` — nothing is
replaced wholesale. It installs the complete shadcn variable set (`--background`, `--primary`,
`--muted`, `--sidebar-*`, `--chart-*`, …) in the HBD palette, the HBD extras (status colours,
spell-school colours, the parchment / ink / crimson / gold palette), sharp radii, offset
shadows, a few animations, and the fonts as npm packages so your bundler serves them offline.

Light is the default; `.dark` and `.high-contrast` on `<html>` switch themes, the same way
shadcn/ui does it.

Components depend on the theme, so adding one fills in variables you are missing — but only an
explicit `add @hbd/theme` overwrites values you already have.

---

## For maintainers

### Build

```bash
pnpm --filter @hbd/registry registry:build
```

which is: `build-theme.mjs` (tokens → theme item + `theme/theme.css`) → `shadcn build`
(`registry.json` + fragments → `public/r/*.json`) → `finalize-registry.mjs` (rewrite
same-registry dependencies to absolute URLs, pack the font tarball).

`NEXT_PUBLIC_SITE_URL` decides the host baked into those URLs (default
`http://localhost:3001`; the deploy sets `https://ds.qrsed.com`).

### Layout

```
.
├── registry.json                     # catalog: `include` list + shared items
├── registry/new-york/<name>/
│   ├── <name>.tsx                    # component (shadcn API, Tailwind utilities)
│   └── registry.json                 # its registry item (must be in the root `include`)
├── registry/theme/registry.json      # GENERATED — the @hbd/theme item
├── theme/theme.css                   # GENERATED — the theme as the CLI writes it
├── tokens/                           # tokens.css + themes/{light,dark,high-contrast}.css
├── scripts/build-theme.mjs           # tokens -> theme item + theme.css
├── scripts/finalize-registry.mjs     # dependency URLs, font tarball, include guard
├── lib/utils.ts                      # cn() — used by the docs app, not shipped as an item
└── public/r/*.json                   # BUILD OUTPUT — what consumers fetch
```

### Conventions

Every component follows the rules in [`../../AGENTS.md`](../../AGENTS.md): upstream shadcn API
first, Tailwind utilities for the look, theme variables for colour, no per-component CSS, no
`utils` registry dependency, and a fragment listed in the root `include`.

The component catalog lives on the docs site — `/docs/components` — and in
`public/r/registry.json` after a build.
