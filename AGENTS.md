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

7. **`.hbd-<block>` names are a GLOBAL namespace.** Every component stylesheet is folded into
   one `globals.css`, so two files declaring the same block collide and the one folded later
   (alphabetical) wins. Before naming a block, check it is unused:
   `grep -rn "^\.hbd-<block> *{" packages/hbd/registry/new-york/styles/components/`.
   Prefix a sub-component with its parent (`.hbd-stepper-nav`, not `.hbd-stepper`).

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

### Add or change a design token

- **Value used by every theme** → `packages/hbd/tokens/tokens.css` (the `:root` block).
- **Value that differs per theme** → also add it to each of `tokens/themes/{light,dark,high-contrast}.css`,
  which override under `[data-theme="…"]`. A token defined only in `tokens.css` is theme-invariant
  by design — that is a choice, not an oversight, so make it deliberately.
- **Should it become a Tailwind utility** (`bg-*`, `text-*`)? Only then add a mapping to
  `scripts/theme-inline.css` (the `@theme inline` block). Most `--hbd-*` tokens are consumed by
  component CSS via `var()` and need no entry.
- Then regenerate: `build:globals`, then `registry:build`.

There is no `tokens.json` any more — it was dropped in the shadcn migration. `tokens.css` is
the single source of truth.

### Add or edit a component

End-to-end checklist — a component is not done until every box is ticked:

1. **Source** — `packages/hbd/registry/new-york/<name>/<name>.tsx`. Add `"use client"` only if
   it uses hooks or handlers. Import `cn` from `@/lib/utils`; map variants to BEM classes with
   `cva` + `cn()`.
2. **CSS** — `registry/new-york/styles/components/<name>.css`. Unique block name (rule 7); every
   value via `var(--hbd-*)`. No new file is needed if the component reuses another's chrome —
   the stepper, for example, borrows `.hbd-field` from `@hbd/input`.
3. **Registry item** — add to `registry.json`: `type: "registry:ui"`, `title`, `description`
   (consumers see this), `files[]`, npm `dependencies`, and `registryDependencies` as
   `@hbd/<dep>`. Nearly every component needs `@hbd/hbd-theme` and `@hbd/utils`; add
   `@hbd/input` etc. when reusing another component's CSS or code.
4. **Rebuild** — `build:globals` (if you touched CSS), then `registry:build`.
5. **Docs page** — `apps/docs/content/docs/<name>.mdx` (see below).
6. **Nav** — add the page to the right group in `apps/docs/content/docs/meta.json`, or it is
   built but unreachable.
7. **Verify** — the three commands at the bottom of this file, plus _look at the page_.

Adding a `.css` file here ships it to every consumer automatically: `build:globals` globs the
whole directory into `app/globals.css`, which is the single file `@hbd/hbd-theme` installs.
There is no per-component CSS registration step, and equally no way to ship a component's CSS
without shipping it to everyone.

### Document a component (apps/docs)

- One MDX page per component: `apps/docs/content/docs/<name>.mdx` (frontmatter `title` +
  `description`, examples in `<Preview>`, optional `<Tabs items={['Preview','Code']}>`).
- Add it to the grouped nav in `apps/docs/content/docs/meta.json`.
- **Interactive / stateful examples** → a `"use client"` demo component in
  `apps/docs/components/demos/<name>-demo.tsx`, imported into the MDX. **Never** put
  `useState`/handlers directly in `.mdx` (MDX renders on the server).
- **Install snippet** — end the page with the same block every other page uses, written
  against the LOCAL registry:

  ````md
  ## Install

  ```bash
  npx shadcn@latest add http://localhost:3001/r/<name>.json
  ```
  ````

  Write `localhost:3001` literally. A deployed build rewrites it to the published registry
  via the `remarkRegistryUrl` plugin in `source.config.ts`, driven by `NEXT_PUBLIC_SITE_URL`
  (the deploy workflow feeds it from `actions/configure-pages`). Do **not** hardcode the
  public URL — local builds would then advertise a host that has not been deployed yet.

## CSS / theming gotchas (learned the hard way)

- **Porting a web component flips the box model.** The legacy `ds/` components rendered into
  `attachShadow()`, where the host page's `* { box-sizing: border-box }` reset never reached, so
  elements fell back to `content-box`. In the registry the same CSS is light-DOM and Tailwind's
  preflight makes everything `border-box`. An explicit `width`/`height` therefore changes meaning:
  `width: 20px` on a padded element meant _20px of content_ before and _20px total_ after. This
  bit the stepper's `thin` variant — the value clipped to a ~4px sliver. When porting, grep the
  source CSS for explicit sizes on padded or bordered elements and set `box-sizing: content-box`
  on those rules rather than re-tuning the token.
- **Nothing catches a block-name collision** — not typecheck, not lint, not the build. Two files
  declaring the same `.hbd-<block>` both fold into `globals.css` and the later one silently wins.
  Audit with:

  ```bash
  grep -h -oE '^\.hbd-[a-z0-9-]+ *\{' packages/hbd/registry/new-york/styles/components/*.css \
    | sort | uniq -d
  ```

  **Known collision:** `stepper-nav.css` and `stepper.css` both declare `.hbd-stepper`. Because
  `stepper.css` folds later, `StepperNav` inherits the numeric stepper's `display:flex`, border,
  `border-radius` and `overflow:hidden` — a visible stray box around the nav in the docs.
  (`avatar.css` / `avatar-group.css` also share `.hbd-avatar-group`, but the rules are identical,
  so that one is harmless duplication.)

- **Only CSS decides the look.** Typecheck, lint and the docs build all stay green while a
  component renders wrong. Anything that changes CSS needs an actual look at the page.

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
- ❌ Reuse an existing `.hbd-<block>` name for a different component (rule 7).
- ❌ Ship a CSS change without looking at the rendered page — nothing else catches it.

## Verify before you're done

```bash
pnpm typecheck                         # both packages (React 19)
pnpm lint                              # 0 errors (warnings OK)
pnpm --filter @hbd/docs build          # static export must be green (55/55 pages)
```

Green checks do **not** mean the component looks right — they cannot see CSS. If you touched
any styling, serve the export and look:

```bash
pnpm --filter @hbd/docs build && (cd apps/docs/out && python3 -m http.server 8080)
# then open http://localhost:8080/docs/<name>.html
```

To sanity-check a change against the pre-migration look, `git worktree add /tmp/hbd-main main`
gives you the old web-component build to compare side by side.
