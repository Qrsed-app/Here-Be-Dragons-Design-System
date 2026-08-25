# Here Be Dragons — shadcn Registry

A **custom [shadcn](https://ui.shadcn.com/docs/registry) registry** that ships the entire Here Be Dragons design system as React + Tailwind v4 components — a D&D / fantasy look, fully token-driven.

- **51 components** + a token **theme** + the `cn` util — installable with `npx shadcn add @hbd/<name>`.
- Token-driven: every colour / size / radius / motion comes from the design tokens in `tokens/`; component CSS is plain light-DOM CSS folded into the theme.
- Targets **React / Next.js / Vite** (and anything Tailwind v4 + shadcn).

---

## For consumers

In your shadcn project (Tailwind v4, `components.json` present), register the namespace once:

```jsonc
// components.json
{
  "registries": {
    "@hbd": "https://YOUR_HOST/r/{name}.json",
  },
}
```

Then add components — dependencies (and the theme) are pulled automatically:

```bash
npx shadcn@latest add @hbd/button
npx shadcn@latest add @hbd/date-picker   # also pulls time-picker, input, theme, utils
```

Or add directly by URL without registering:

```bash
npx shadcn@latest add https://YOUR_HOST/r/button.json
```

Use them like any shadcn component:

```tsx
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

<Button variant="primary" size="lg">
  Cast Spell
</Button>;
```

### Theme & dark mode

The first `@hbd/*` install pulls **`@hbd/hbd-theme`**, which writes the complete HBD token system into your `app/globals.css` (full palette, semantic layer, spell-school accents, **every component's styles**, and the Tailwind v4 `@theme inline` utilities) and copies the Tiamat Condensed SC font to `public/fonts/`.

Dark / high-contrast themes are attribute-driven and also respond to the `.dark` class:

```text
<html data-theme="dark">            <!-- or class="dark" -->
<html data-theme="high-contrast">
```

> All component styles ship **inside `globals.css`** (one import, loaded by your app root) rather than as per-component files — this is Vite/Next-safe (Next forbids global-CSS imports outside the root layout) and lets one import pull in the whole DS.

---

## For maintainers

### Build

```bash
# from the repo root (this package is packages/hbd)
pnpm --filter @hbd/registry registry:build   # shadcn build: registry.json -> public/r/*.json
```

`public/r/*.json` are the only artifacts a consumer needs — serve them as static files over HTTP.

### Host

Serve `public/` from any static host (Vercel, GitHub Pages, `npx serve public`, `python3 -m http.server`). Set the real URL in `registry.json` → `homepage`, and tell consumers to map `@hbd` to `https://YOUR_HOST/r/{name}.json`.

### Regenerate the theme `globals.css`

`app/globals.css` is **generated, not hand-edited**. After changing a token
(`tokens/tokens.css` / `tokens/themes/*.css`) or any component CSS:

```bash
pnpm --filter @hbd/registry build:globals    # tokens + themes + @theme + all component CSS -> app/globals.css
pnpm --filter @hbd/registry registry:build   # then rebuild the registry (= shadcn build)
```

`scripts/build-globals.mjs` is self-contained (reads `tokens/*`,
`scripts/theme-inline.css`, and `registry/new-york/styles/components/*.css`).
The component CSS sources live in `registry/new-york/styles/components/`.

### Layout

```
.
├── registry.json                 # the catalog (53 items)
├── components.json               # Tailwind v4 + new-york
├── package.json · tsconfig.json · eslint.config.mjs · .prettierrc.json
├── app/globals.css               # the shipped theme (generated: tokens + themes + all component CSS)
├── lib/utils.ts                  # cn()
├── tokens/                       # token CSS source (tokens.css + themes/) for build:globals
├── scripts/build-globals.mjs     # regenerates app/globals.css
├── registry/new-york/
│   ├── <component>/<component>.tsx
│   ├── styles/components/*.css    # light-DOM CSS sources (folded into globals on build)
│   └── fonts/                     # Tiamat Condensed SC (woff2/woff/ttf)
└── public/r/*.json               # BUILD OUTPUT — what consumers fetch
```

### Conventions (every component follows)

- **BEM classes preserved verbatim** (`.hbd-button--primary`, `.is-loading`, …) so the component CSS targets them; Tailwind utilities are additive (layout) only.
- kebab attributes → camelCase props; `hbd:*` events → `on*` callbacks; slots → children / compound members.
- Controlled-first stateful/overlay components (`value`/`onValueChange`, `open`/`onOpenChange`, with `defaultX`).
- Radix used only where it preserves the exact look (switch, radio-group, slider, tabs, tooltip, popover, dialog for drawer/modal); everything else hand-ported. `@floating-ui/react` for combobox.

---

## Components (51)

**Primitives** · aspect-ratio · avatar · avatar-group · badge · chip · divider · portal · progress · skeleton · skeleton-group · spacer · spinner

**Domain (TTRPG)** · codeblock · empty · full-banner · spell-card · stat-block

**Forms** · button · checkbox · combobox · file-upload · input · otp-input · radio-group · select · slider · stepper · switch · textarea · toggle-group

**Feedback / display** · accordion · alert · callout · card · list · table · tabs · toast · tooltip

**Navigation** · breadcrumbs · navbar · pagination · stepper-nav

**Overlays** · context-menu · drawer · dropdown · modal · popover · split-button

**Pickers** · date-picker · time-picker

Plus `hbd-theme` (token theme) and `utils` (`cn`).
