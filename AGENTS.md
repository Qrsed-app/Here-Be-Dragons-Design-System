# AGENTS.md — working in the Here Be Dragons monorepo

Guidance for humans and AI agents editing this repo. **`CLAUDE.md` is a symlink to this file**, so
the two cannot differ — edit this one, never a copy. Read it before changing components, tokens
or the docs.

## What this is

A D&D / fantasy **design system** that apps consume exactly like shadcn/ui:

- **`packages/hbd`** (`@hbd/registry`) — a **shadcn custom registry**. Every component keeps the
  **upstream shadcn/ui API** (names, exports, props, `data-slot`s, Radix primitives) and is styled
  with **Tailwind utility classes** in the Here Be Dragons look, plus HBD-only components (spell
  card, stat block, …) built to the same conventions. Two non-component items complete it:
  `@hbd/theme` (the CSS variables, generated from tokens) and `@hbd/fonts` (the typefaces as npm
  packages).
- **`apps/docs`** (`@hbd/docs`) — a **Next.js 16 + Fumadocs** site: one page per component with
  live previews and an API table, plus `/llms.txt` and `/llms-full.txt` for AI assistants.

Stack (one consistent set of versions — do not split it): **React 19, Tailwind v4, Next.js 16,
Fumadocs 16, pnpm + Turborepo, shadcn CLI 4.**

```
packages/hbd/
├── registry.json                       catalog: name, homepage, include[]
├── registry/new-york/<name>/           <name>.tsx + registry.json — one fragment per component
├── registry/theme/registry.json        GENERATED — the @hbd/theme item
├── registry/fonts/registry.json        GENERATED — the @hbd/fonts item
├── theme/theme.css, theme/fonts.css    GENERATED — what the two items write; the docs import them
├── tokens/tokens.css, tokens/themes/   the source of truth for every colour, size and font
├── scripts/build-theme.mjs             tokens → theme + fonts items + the two CSS files
├── scripts/finalize-registry.mjs       absolute dependency URLs, stale-item cleanup, CI guard
└── public/r/*.json                     build output — what consumers fetch
apps/docs/
├── content/docs/components/*.mdx       one page per component
├── components/examples/*-demo.tsx      "use client" demos used by the pages
└── app/global.css                      imports theme/fonts.css and theme/theme.css
```

## Golden rules (the non-negotiables)

1. **The public API is shadcn/ui's.** For anything shadcn ships, the upstream component is the
   contract: same file name, exports, prop names and defaults, `data-slot`s, Radix primitives.
   Read it with `pnpm dlx shadcn@latest view @shadcn/<name>` before editing. HBD may **add** —
   extra variants (`variant="gold"`), sizes, optional props, exports — but never rename, remove or
   re-purpose what upstream has. Document additions as additions.

2. **Styling is Tailwind utilities inside the component.** No BEM classes, no per-component
   stylesheet, no `css` field in a component item. A consumer overriding with `className` must
   win, and `shadcn add --diff` must show the whole component in one file.

3. **Tokens are the source of truth; everything under `theme/` and `registry/{theme,fonts}/` is
   generated.** `tokens/tokens.css` + `tokens/themes/*.css` → `scripts/build-theme.mjs` → the
   `@hbd/theme` and `@hbd/fonts` items and `theme/theme.css` + `theme/fonts.css`. Never hand-edit
   the outputs. Every value is resolved to a literal per theme, because the shadcn CLI only
   registers a `--color-*` utility for a value that looks like a colour.

4. **Colours come from theme variables — and the palette does not follow the theme.** Use the
   semantic utilities (`bg-surface-raised`, `text-foreground-emphasis`, `text-foreground-gold`,
   `border-border-strong`). The palette (`bg-parchment-200`, `text-gold-deep`) resolves to the same
   hex in every theme, so a palette utility keeps its light value on dark surfaces: `text-gold-deep`
   drops to 2.9:1 there, `text-blood` to 1.7:1. Anything that must stay readable across themes
   needs a semantic token. Nothing catches this automatically — the colour is "right", just not for
   that background. Palette borders are fine where they are meant to be dark, e.g. the offset
   shadow under a button.

5. **Sizes, tracking and shadows do not get names.** Never invent a `text-*`, `leading-*`,
   `tracking-*` or `shadow-*` utility: tailwind-merge treats an unknown `text-label` as a text
   _colour_ and silently drops it next to a real colour class. Use Tailwind's scale where the value
   matches, arbitrary values otherwise (`text-[0.8125rem]`, `leading-[1.7]`,
   `shadow-[3px_3px_0_var(--ink-900)]`). Order matters: a font size overrides line height, so write
   `text-… leading-…`, never the reverse.

6. **The focus ring needs `outline-solid`.**
   `outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring`.
   Without it Tailwind 4 keeps `--tw-outline-style: none` and no ring is drawn — and nothing
   catches that automatically either.

7. **`"use client"` exactly where upstream has it.** Anything with hooks, handlers or Radix
   context needs it, or Next App Router consumers break.

8. **Imports use the `@` alias:** `@/lib/utils` for `cn`, `@/registry/new-york/<dep>/<dep>` for
   sibling components. The CLI rewrites both for the consumer. Do **not** add a `utils` registry
   dependency: every shadcn project already has `@/lib/utils`, and shipping our own makes `add`
   stop to ask about overwriting it.

9. **Every component owns a registry fragment** at `registry/new-york/<name>/registry.json`, and it
   must be listed in the root `registry.json` `include`. `shadcn build` silently skips anything not
   included; `scripts/finalize-registry.mjs` fails the build in CI if a fragment is missing
   (locally it only warns, so `pnpm dev` keeps working while you author).

## The shadcn CLI and the `shadcn` skill

The registry is authored, built and verified with the shadcn CLI, and the repo ships the official
**`shadcn` skill** at `.agents/skills/shadcn/` (symlinked as `.claude/skills/shadcn`). It is not a
slash command: it applies automatically whenever a task touches shadcn, a registry or a
`components.json`. Treat it as the authority on registry authoring and read the relevant file
before working from memory:

- **`registry.md`** — the root `registry.json`, `include`, item definitions and types
  (`registry:ui`, `registry:theme`, …), `dependencies` vs `registryDependencies`, address schemes
  (`@hbd/button` vs a URL), build and verify commands.
- **`cli.md`** — every command and flag.
- **`rules/*.md`** — the composition and styling rules the components themselves follow
  (`asChild` for custom triggers, `data-icon` on icons, `Field` for forms, …).

Use the CLI at each step rather than guessing:

| When                                                 | Run                                                                                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Before writing or changing a shadcn component        | `pnpm dlx shadcn@latest view @shadcn/<name>` — the upstream source is the contract. Never fetch files from GitHub by hand. |
| Checking an item field or a dependency address       | `registry.md` → _Item Definitions_, _Registry Dependencies_                                                                |
| After editing a fragment or `registry.json`          | `pnpm --filter @hbd/registry registry:build` — runs `shadcn build`, then `finalize-registry.mjs`                           |
| Seeing the registry the way a consumer does          | in a project with `"@hbd"` in `components.json`: `list @hbd`, `view @hbd/<name>`, `add @hbd/<name> --dry-run`              |
| Checking what a consumer gets against what they have | `pnpm dlx shadcn@latest add @hbd/<name> --diff`                                                                            |

## Recipes

### Run the docs locally

```bash
pnpm dev            # http://localhost:3001 (turbo builds the theme + registry, then next dev)
```

Next's dev server grows and can exhaust its heap after a long editing session; restart it.

### Regenerate the theme after a token change

```bash
pnpm --filter @hbd/registry build:theme       # tokens -> theme + fonts items, theme/*.css
pnpm --filter @hbd/registry registry:build    # build:theme + shadcn build + finalize -> public/r
```

### Add or change a design token

- **Same in every theme** → `tokens/tokens.css`.
- **Differs per theme** → also `tokens/themes/{light,dark,high-contrast}.css`. A token defined only
  in `tokens.css` is theme-invariant by design — make that choice deliberately, and remember that
  `high-contrast` targets AAA (7:1), not AA.
- **Should it reach apps?** Map it in `scripts/build-theme.mjs`: `SEMANTIC` (shadcn's own
  variables), `HBD` (our semantic layer), `PALETTE`, `SHADOWS`, `THEME` (`@theme` entries: fonts,
  radii, easings) or `KEYFRAMES` / `ANIMATIONS`. The names in those tables are the utility names
  consumers get, and a token without a mapping is invisible to them.
- Then `registry:build`, and check the generated values per theme in
  `registry/theme/registry.json` before trusting the utility.

### Add or edit a component

1. **Upstream first** — `pnpm dlx shadcn@latest view @shadcn/<name>` (rule 1).
2. **Source** — `registry/new-york/<name>/<name>.tsx`, restyled with utilities (rules 2, 4, 5, 6).
3. **Fragment** — `registry/new-york/<name>/registry.json`: `type: "registry:ui"`, `title`,
   `description` (consumers read it — name the typefaces and colours it actually uses),
   `dependencies` (npm packages the file imports), `registryDependencies` (`@hbd/theme` plus every
   `@hbd/<sibling>` it imports), `files[]`. HBD-only components add `"categories": ["hbd"]`.
4. **Include** — add the fragment path to `include` in `registry.json` (rule 9).
5. **Docs page** — `apps/docs/content/docs/components/<name>.mdx` (below).
6. **Rebuild** — `pnpm --filter @hbd/registry registry:build`.
7. **Verify** — the commands at the bottom of this file, and _look at the rendered page_.

### Document a component

Model every page on `apps/docs/content/docs/components/button.mdx`: hero Preview/Code tabs,
`## Installation` (`npx shadcn@latest add @hbd/<name>` + the URL form), `## Usage`, `## Examples`
(one `###` per variant or state, HBD additions marked), `## API Reference` with `<TypeTable>`
(globally available) for props beyond the underlying element or Radix primitive.

- Stateful examples go in `apps/docs/components/examples/<name>-demo.tsx` (`"use client"`); MDX
  renders on the server.
- Write `http://localhost:3001` literally in install snippets — `remarkRegistryUrl` in
  `source.config.ts` rewrites it to `NEXT_PUBLIC_SITE_URL` for a deployed build.
- Use direct named sub-component exports (`<DialogTrigger>`), never `<Dialog.Trigger>`: the static
  `.Member` property is lost across the RSC boundary.
- **MDX wraps loose text in `<p>`.** Text on its own line inside a component that renders a `<p>`
  or a `<button>` produces `<p><p>` or `<button><p>` — invalid HTML and a hydration error in the
  browser. Write the child as an expression, `<SpellCardDescription>{"…"}</SpellCardDescription>`.
  A single long line does **not** hold: Prettier splits it back onto its own line and the bug
  returns. This applies to Radix-based components too (`TabsTrigger`, `Toggle`, `ToggleGroupItem`),
  whose props are typed as the primitive, so grepping for `ComponentProps<"button">` misses them.
  Only live JSX needs it — a fenced code sample is plain text, and in a real `.tsx` file loose text
  is fine, so keep the samples idiomatic.
- A real `<p>` component (`ItemDescription`, `FieldDescription`, …) can never sit inside a
  `<button>`, whoever wrote it. Inside an `<Item asChild><button>` use a `span`, or drop `asChild`
  and let `Item` render its `div`.

## How the registry reaches a consumer

- **Same-registry dependencies are rewritten to absolute URLs** by `scripts/finalize-registry.mjs`
  from `NEXT_PUBLIC_SITE_URL` (default `http://localhost:3001`; the deploy sets
  `https://ds.qrsed.com`). A namespaced `@hbd/…` dependency would otherwise fail with _Unknown
  registry "@hbd"_ unless the consumer declared the namespace. Both install routes work:
  `npx shadcn add @hbd/button` after adding `"registries": { "@hbd": "https://ds.qrsed.com/r/{name}.json" }`,
  or the plain URL.
- **The theme merges, it never overwrites a file.** `cssVars` + `css` are merged into the CSS file
  the consumer's `components.json` points at. Adding a component only fills in variables it is
  missing; only an explicit `add @hbd/theme` replaces existing values.
- **Fonts are their own item.** `@hbd/fonts` carries the four `@fontsource/*` packages and their
  `@import`s. `@hbd/theme` only sets the font-family variables and deliberately does **not** depend
  on it, so a consumer can install the theme alone and point `--font-display` / `--font-sans` at
  their own typefaces. Never fetch a font at runtime — a Google Fonts URL breaks offline use and
  Electron.

## Gotchas (learned the hard way)

- **The CLI cannot write `@font-face`.** Any form of it in an item's `css` field either throws or
  emits invalid CSS. That is why fonts ship as npm packages.
- **`cssVars` values must be literal colours** (`#…`, `rgb…`, `oklch…`) to get a `--color-*`
  utility; `var(--x)` silently produces a non-colour mapping. Keys under `css` are written
  verbatim, so they need their own `--` prefix; keys under `cssVars` must not have one.
- **`@keyframes` in an item's `css` land inside `@theme inline`**, so they are only emitted when a
  matching `--animate-*` variable is used. Add both.
- **Registry JSON is text.** Binary files (fonts, images) are corrupted if shipped as
  `registry:file` — the pre-migration registry did exactly that.
- **A component description that names a typeface or colour goes stale** when the token behind it
  changes. Grep `registry/new-york/*/registry.json` after changing `font-display` or a colour token.
- **Fumadocs imports every compiled MDX page eagerly**, so one broken page breaks the whole docs
  route until it is fixed.
- **The docs build does not catch invalid HTML nesting.** `next build` and the static export stay
  green; a `<p>` inside a `<p>` or a `<button>` only fails in the browser. Scan the export (below).
- **Only pixels decide the look.** Typecheck, lint and the docs build stay green while a component
  renders wrong; a focus ring, a hover state or a 1.7:1 label is invisible to all of them.
- **macOS tooling differs from Linux.** BSD `sed` has no `\b`; use `perl -pe`. zsh does not
  word-split an unquoted `$var`; use an array or `bash -c`. Both fail silently — verify the result,
  never the exit code.

## What NOT to do

- ❌ Reintroduce BEM classes or per-component CSS files.
- ❌ Hand-edit anything under `theme/` or `registry/{theme,fonts}/` (generated from tokens).
- ❌ Rename, remove or re-purpose an upstream shadcn prop, export or `data-slot`.
- ❌ Reach for a palette utility (`text-gold-deep`, `text-blood`) for text that must read in dark.
- ❌ Invent named `text-*`, `leading-*`, `tracking-*` or `shadow-*` utilities (rule 5).
- ❌ Add a `@hbd/utils` registry dependency (rule 8).
- ❌ Add a fragment without adding it to `include` (rule 9).
- ❌ Add `react` / `react-dom` as hard `dependencies` of `@hbd/registry` (keep them peers).
- ❌ Put loose text on its own line inside a `<p>`- or `<button>`-rendering component in MDX.
- ❌ Ship a visual change without looking at the rendered component.

## Verify before you're done

```bash
pnpm typecheck                                # both packages
pnpm lint                                     # 0 errors (warnings OK)
pnpm format:check                             # Prettier, incl. MDX and this file
pnpm --filter @hbd/registry registry:build    # 63 items, no orphan-fragment warning
pnpm --filter @hbd/docs build                 # static export must be green
```

Then scan the export for the nesting the build cannot see — it must print `ok`:

```bash
node -e 'const fs=require("fs"),p=require("path");const re=/<(p|button)(?![a-zA-Z-])[^>]*>(?:(?!<\/\1>)[\s\S])*?<p(?![a-zA-Z-])[^>]*>/;const w=d=>fs.readdirSync(d).flatMap(f=>{const q=p.join(d,f);return fs.statSync(q).isDirectory()?w(q):q.endsWith(".html")?[q]:[]});const bad=w("apps/docs/out").filter(f=>re.test(fs.readFileSync(f,"utf8")));console.log(bad.length?bad.join("\n"):"ok")'
```

(The `(?![a-zA-Z-])` matters: a plain `<p[^>]*>` also matches the `<path>` of every icon.)

Finally look at the pages you touched — serve the export and open them:

```bash
(cd apps/docs/out && python3 -m http.server 8080)   # http://localhost:8080/docs/components/<name>.html
```
