# AGENTS.md — working in the Here Be Dragons monorepo

Guidance for AI agents editing this repo. `CLAUDE.md` is a symlink to this
file. Read this before changing components, tokens, or the docs.

## What this is

A D&D / fantasy **design system** shipped two ways:

- **`packages/hbd`** (`@hbd/registry`) — a **shadcn custom registry** of **51 React +
  Tailwind v4 components** with a fantasy / D&D look. Fully token-driven; styled by
  token-backed component CSS keyed on `.hbd-*` BEM classes.
- **`apps/docs`** (`@hbd/docs`) — a **Next.js 16 + Fumadocs** site documenting every
  component with live previews.

Stack (one consistent set of versions — do not split it): **React 19, Tailwind v4,
Next.js 16, Fumadocs 16, pnpm + Turborepo.** `@hbd/registry` declares `react`/`react-dom`
as `peerDependencies: ^18.3 || ^19` (consumers may use either); everything in THIS repo
runs React 19.

## Golden rules (the non-negotiables)

1. **Styling lives in token-backed component CSS, keyed on BEM classes.** Each component
   renders `.hbd-<block>` / `__<el>` / `--<modifier>` / `.is-*` classes that the shipped CSS
   targets — PRESERVE those exact class strings (via cva variant→class maps + `cn()`).
   Tailwind utilities are **additive only** (incidental layout) — never use them to restyle
   a component.

2. **Tokens drive everything; `globals.css` is GENERATED.** Do **not** hand-edit
   `packages/hbd/app/globals.css`. It is built by `scripts/build-globals.mjs` from:
   `tokens/tokens.css` + `tokens/themes/*.css` + `scripts/theme-inline.css` (the
   `@theme inline` block) + every `registry/new-york/styles/components/*.css`. To change a
   colour/size/etc., edit the **token CSS or a component CSS**, then regenerate (below).

3. **Component CSS is plain light-DOM CSS** under `registry/new-york/styles/components/` —
   no `:host` / `::slotted` / `::part`. Keep every `var(--hbd-*)` reference and `@keyframes`
   verbatim; it is all **folded into `globals.css`** (one import loads all styles —
   Vite/Next-safe).

4. **`"use client"` for anything stateful.** A component using React hooks
   (`useState`/`useEffect`/`useRef`/`useContext`/…) or event handlers MUST start with
   `"use client";`. This is required for the shadcn registry (any Next App Router consumer
   breaks otherwise) — not just our docs. Pure presentational components (no hooks) stay
   server-renderable.

5. **Imports use the `@` alias.** Inside components: `@/lib/utils` (the `cn` helper),
   `@/registry/new-york/<dep>/<dep>`. Never deep relative paths — the shadcn CLI rewrites
   `@/*` to the consumer's alias layout on `add`.

6. **The registry catalog is `registry.json`.** Components are items there; `shadcn build`
   compiles them to `public/r/*.json`. After changing component source, rebuild the registry
   (below) so `/r` stays in sync.

## Recipes

### Run the docs locally

```bash
pnpm dev            # http://localhost:3001  (turbo builds the registry first, then next dev)
```

### Regenerate the theme after a token / component-CSS change

```bash
pnpm --filter @hbd/registry build:globals     # tokens + component CSS -> app/globals.css
pnpm --filter @hbd/registry registry:build    # rebuild /r/*.json
```

### Rebuild the registry JSON (after editing component source / registry.json)

```bash
pnpm --filter @hbd/registry registry:build    # shadcn build -> packages/hbd/public/r
```

### Add or edit a component

- Source: `packages/hbd/registry/new-york/<name>/<name>.tsx` (+ `"use client"` if it uses
  hooks). Component CSS: `registry/new-york/styles/components/<name>.css`.
- Add `"use client"` only if needed; preserve BEM classes; import `cn` from `@/lib/utils`.
- Add/adjust the item in `registry.json` (`type: "registry:ui"`, `files[]`,
  `registryDependencies` as `@hbd/<dep>`, npm `dependencies`).
- Run `build:globals` (if you touched CSS) then `registry:build`.

### Document a component (apps/docs)

- One MDX page per component: `apps/docs/content/docs/<name>.mdx` (frontmatter `title` +
  `description`, examples in `<Preview>`, optional `<Tabs items={['Preview','Code']}>`).
- Add it to the grouped nav in `apps/docs/content/docs/meta.json`.
- **Interactive / stateful examples** → a `"use client"` demo component in
  `apps/docs/components/demos/<name>-demo.tsx`, imported into the MDX. **Never** put
  `useState`/handlers directly in `.mdx` (MDX renders on the server).

## Docs / MDX gotchas (learned the hard way)

- **MDX is server-rendered.** A `"use client"` component renders fine inline, but its
  **static `.Member` property is lost across the RSC boundary** — `<List.Item>` fails. Use
  the **direct named sub-component export** instead: `<ListItem>` (import `{ List, ListItem }`).
- **No nested `<p>`.** MDX wraps loose text in `<p>`. A component that wraps `children` in a
  block (e.g. SpellCard's `<p class="…__description">`) then gets `<p><p>…</p></p>`. Pass
  such text via a demo `.tsx` (where the child stays a plain string) or a prop, not as MDX
  children.
- The home page uses a `<meta refresh>` (not `redirect()`, unsupported in static export).
- The Tiamat `@font-face` is re-declared in `app/layout.tsx` with a `basePath`-aware URL so
  it resolves under a GitHub Pages sub-path.

## Build / version gotchas

- **Don't mix Fumadocs versions.** ui/core/mdx must agree (here: ui+core 16, mdx 15) and
  pair with the right Next/React (16 / 19). Version skew → `files.map is not a function`.
- **`@import "tailwindcss"` expands in place**, so the Google-Fonts `@import` must be the
  **first** line of `globals.css` (handled by `build-globals.mjs`) or Turbopack errors.
- `apps/docs` consumes `@hbd/registry` **source** via tsconfig path aliases
  (`@/registry/*`, `@/lib/utils` → `../../packages/hbd/...`) + `transpilePackages`. The
  built `/r/*.json` + fonts are copied in by `scripts/copy-registry.mjs` (a `registry:build`
  step wired through `turbo.json`).

## What NOT to do

- ❌ Hand-edit `packages/hbd/app/globals.css` (it's generated — edit tokens/component CSS).
- ❌ Replace token-backed component CSS with Tailwind utilities to restyle a component.
- ❌ Reformat the component CSS files (Prettier ignores `**/*.css` on purpose — keep them
  stable).
- ❌ Use member-access (`<X.Member>`) on client components inline in MDX.
- ❌ Add `react`/`react-dom` as hard `dependencies` of `@hbd/registry` (keep them
  `peerDependencies`).

## Verify before you're done

```bash
pnpm typecheck                         # both packages (React 19)
pnpm lint                              # 0 errors (warnings OK)
pnpm --filter @hbd/docs build          # static export must be green (55/55 pages)
```
