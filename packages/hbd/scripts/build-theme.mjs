#!/usr/bin/env node
// Generates the `theme` registry item and theme/theme.css from the design tokens.
//
//   node scripts/build-theme.mjs
//
// tokens/tokens.css + tokens/themes/*.css stay the single source of truth. Every
// value is resolved to a literal per theme before it is emitted: the shadcn CLI
// only registers a `--color-*` utility for a variable whose value looks like a
// colour (#…, rgb…, hsl…, oklch…), so `var(--x)` values would install without
// their bg-* / text-* utilities.
//
// Outputs:
//   registry/theme/registry.json  the registry item (included by registry.json)
//   theme/theme.css               what `shadcn add @hbd/theme` writes into a project,
//                                 imported by the docs app so it renders the real theme

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

// ── token parsing ────────────────────────────────────────────────────────────
function declarations(css, selector) {
  const flat = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");
  const norm = (s) => s.replace(/\s+/g, "");
  for (const [, sel, body] of flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (norm(sel) !== norm(selector)) continue;
    return Object.fromEntries(
      [...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]),
    );
  }
  throw new Error(`selector ${selector} not found`);
}

function resolveAll(map) {
  const done = {};
  const substitute = (value, stack) =>
    value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (_, name, fallback) => {
      const hit = resolve(name, stack);
      if (hit !== undefined) return hit;
      if (fallback !== undefined) return substitute(fallback.trim(), stack);
      throw new Error(`unresolved ${name} (via ${stack.join(" -> ")})`);
    });
  const resolve = (name, stack = []) => {
    if (name in done) return done[name];
    if (!(name in map)) return undefined;
    if (stack.includes(name)) throw new Error(`cycle: ${[...stack, name].join(" -> ")}`);
    return (done[name] = substitute(map[name], [...stack, name]));
  };
  for (const name of Object.keys(map)) resolve(name);
  return done;
}

const base = declarations(read("tokens/tokens.css"), ":root");
const lightMap = {
  ...base,
  ...declarations(read("tokens/themes/light.css"), ':root,[data-theme="light"]'),
};
const themes = {
  light: resolveAll(lightMap),
  dark: resolveAll({
    ...lightMap,
    ...declarations(read("tokens/themes/dark.css"), '[data-theme="dark"]'),
  }),
  "high-contrast": resolveAll({
    ...lightMap,
    ...declarations(read("tokens/themes/high-contrast.css"), '[data-theme="high-contrast"]'),
  }),
};
const token = (theme, name) => {
  const v = themes[theme][`--hbd-${name}`];
  if (v === undefined) throw new Error(`unknown token --hbd-${name}`);
  return v;
};

// ── the variable contract ────────────────────────────────────────────────────
// shadcn's standard set first, so apps (and any stock shadcn component) keep
// working, then the HBD semantic layer, then the primitive palette.
const color = (name) => `color-${name}`;
const SEMANTIC = {
  background: color("surface-default"),
  foreground: color("text-primary"),
  card: color("surface-default"),
  "card-foreground": color("text-primary"),
  popover: color("surface-raised"),
  "popover-foreground": color("text-primary"),
  primary: color("surface-action"),
  "primary-foreground": color("text-on-action"),
  secondary: color("surface-raised"),
  "secondary-foreground": color("text-primary"),
  muted: color("surface-muted"),
  "muted-foreground": color("text-muted"),
  accent: color("surface-subtle"),
  "accent-foreground": color("text-primary"),
  destructive: color("surface-destructive"),
  "destructive-foreground": color("text-on-destructive"),
  border: color("border-default"),
  input: color("border-default"),
  ring: color("focus-ring-outline"),
  "chart-1": color("gold"),
  "chart-2": color("blood"),
  "chart-3": color("sapphire"),
  "chart-4": color("emerald"),
  "chart-5": color("amethyst"),
  sidebar: color("surface-subtle"),
  "sidebar-foreground": color("text-primary"),
  "sidebar-primary": color("surface-action"),
  "sidebar-primary-foreground": color("text-on-action"),
  "sidebar-accent": color("surface-raised"),
  "sidebar-accent-foreground": color("text-primary"),
  "sidebar-border": color("border-subtle"),
  "sidebar-ring": color("focus-ring-outline"),
  surface: color("surface-subtle"),
  "surface-foreground": color("text-primary"),
};
// Every key an existing shadcn theme may already define in `.dark` — emitted in
// dark even when equal to light, or the app's old dark value would win.
const SHADCN_DARK_KEYS = Object.keys(SEMANTIC);

const HBD = {
  "surface-subtle": color("surface-subtle"),
  "surface-muted": color("surface-muted"),
  "surface-raised": color("surface-raised"),
  "surface-overlay": color("surface-overlay"),
  "surface-inverse": color("surface-inverse"),
  "surface-code": color("surface-code"),
  "primary-hover": color("surface-action-hover"),
  "primary-active": color("surface-action-active"),
  "foreground-secondary": color("text-secondary"),
  "foreground-placeholder": color("text-placeholder"),
  "foreground-disabled": color("text-disabled"),
  "foreground-inverse": color("text-inverse"),
  "foreground-link": color("text-link"),
  "foreground-link-hover": color("text-link-hover"),
  "foreground-heading": color("text-heading"),
  "foreground-emphasis": color("text-emphasis"),
  "foreground-emphasis-strong": color("text-emphasis-strong"),
  "foreground-gold": color("text-gold"),
  "border-subtle": color("border-subtle"),
  "border-strong": color("border-strong"),
  "border-action": color("border-action"),
  "border-error": color("border-error"),
  "border-gold": color("border-gold"),
  "border-ink": color("border-ink-brown"),
  "input-focus": color("input-focus-border"),
  "destructive-hover": color("surface-destructive-hover"),
  ...Object.fromEntries(
    ["success", "warning", "info", "error"].flatMap((s) => [
      [s, color(`status-${s}-surface`)],
      [`${s}-foreground`, color(`status-${s}-text`)],
      [`${s}-border`, color(`status-${s}-border`)],
      [`${s}-icon`, color(`status-${s}-icon`)],
    ]),
  ),
  ...Object.fromEntries(
    [
      "abjuration",
      "conjuration",
      "divination",
      "enchantment",
      "evocation",
      "illusion",
      "necromancy",
      "transmutation",
    ].flatMap((s) => [
      [`school-${s}`, color(`school-${s}`)],
      [`school-${s}-accent`, color(`school-${s}-accent`)],
      [`school-${s}-foreground`, color(`school-${s}-text`)],
    ]),
  ),
  ...Object.fromEntries(
    ["default", "keyword", "string", "comment", "number", "function", "operator"].map((s) => [
      `syntax-${s}`,
      `syntax-${s}`,
    ]),
  ),
};

const PALETTE = Object.fromEntries(
  Object.keys(base)
    .map((k) => k.replace(/^--hbd-color-/, ""))
    .filter(
      (k) =>
        /^(ink|parchment|crimson|gold|forest|sapphire)-\d+$/.test(k) ||
        [
          "ink-brown",
          "ink-faded",
          "gold",
          "gold-bright",
          "gold-deep",
          "sapphire",
          "blood",
          "blood-deep",
          "emerald",
          "emerald-bright",
          "azure",
          "amethyst",
          "rose",
          "umber",
          "nightshade",
          "shadow-bg",
        ].includes(k),
    )
    .map((k) => [k, color(k)]),
);

// Elevation deepens in dark mode, so these live in :root / .dark rather than @theme.
const SHADOWS = {
  "shadow-sm": "shadow-sm",
  "shadow-md": "shadow-md",
  "shadow-lg": "shadow-lg",
  "shadow-xl": "shadow-xl",
  "shadow-inner": "shadow-inner",
};

// No custom names for font sizes, tracking, leading or shadows: tailwind-merge
// (inside every component's cn()) treats an unknown `text-label` as a text
// COLOUR and drops it when merged with `text-muted-foreground`, and an unknown
// `shadow-hbd` as a shadow colour that never conflicts with `shadow-none`.
// Components use Tailwind's scale or arbitrary values for those instead.
const THEME = {
  "font-sans": "font-family-ui",
  "font-serif": "font-family-serif",
  "font-mono": "font-family-mono",
  "font-display": "font-family-display",
  "font-accent": "font-family-accent",
  "font-heading": "font-family-accent",
  "radius-sm": "radius-sm",
  "radius-md": "radius-md",
  "radius-lg": "radius-lg",
  "radius-xl": "radius-xl",
  "ease-spring": "ease-spring",
  "ease-anticipate": "ease-anticipate",
};

// Continuous animations. Keyframes ride along in the item's `css` (the CLI writes them
// inside @theme inline, where Tailwind only emits them once an `animate-*` utility is used).
const KEYFRAMES = {
  "hbd-spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
  "hbd-shimmer": {
    "0%": { transform: "translateX(-100%)" },
    "100%": { transform: "translateX(100%)" },
  },
  "hbd-progress-stripe": {
    from: { "background-position": `${token("light", "space-8")} 0` },
    to: { "background-position": "0 0" },
  },
  "hbd-progress-indeterminate": {
    "0%": { transform: "translateX(-100%)" },
    "100%": { transform: "translateX(350%)" },
  },
};
const ANIMATIONS = {
  "animate-hbd-spin": `hbd-spin ${token("light", "duration-spin")} linear infinite`,
  "animate-hbd-shimmer": `hbd-shimmer ${token("light", "duration-pulse")} ease-in-out infinite`,
  "animate-hbd-progress-stripe": `hbd-progress-stripe ${token("light", "duration-slow")} linear infinite`,
  "animate-hbd-progress-indeterminate": `hbd-progress-indeterminate 1.5s ${token("light", "ease-in-out")} infinite`,
};

const pick = (theme, table) =>
  Object.fromEntries(Object.entries(table).map(([k, t]) => [k, token(theme, t)]));
const differs = (a, b) => Object.fromEntries(Object.entries(a).filter(([k, v]) => b[k] !== v));

const light = {
  radius: token("light", "radius-lg"),
  ...pick("light", SEMANTIC),
  ...pick("light", HBD),
  ...pick("light", PALETTE),
  ...pick("light", SHADOWS),
};
const darkAll = { ...pick("dark", SEMANTIC), ...pick("dark", HBD), ...pick("dark", SHADOWS) };
const dark = {
  ...Object.fromEntries(SHADCN_DARK_KEYS.map((k) => [k, darkAll[k]])),
  ...differs(darkAll, light),
};
const highContrast = differs(
  {
    ...pick("high-contrast", SEMANTIC),
    ...pick("high-contrast", HBD),
    ...pick("high-contrast", SHADOWS),
  },
  light,
);
const theme = { ...pick("light", THEME), ...ANIMATIONS };

// Every typeface is a published npm package, so a consumer's bundler serves them and
// nothing is fetched at runtime.
const FONT_PACKAGES = [
  "@fontsource/cinzel",
  "@fontsource/im-fell-english",
  "@fontsource/jetbrains-mono",
  "@fontsource/roboto",
];

const FONT_IMPORTS = [
  "@fontsource/cinzel/400.css",
  "@fontsource/cinzel/600.css",
  "@fontsource/cinzel/700.css",
  "@fontsource/cinzel/900.css",
  "@fontsource/im-fell-english/400.css",
  "@fontsource/im-fell-english/400-italic.css",
  "@fontsource/jetbrains-mono/400.css",
  "@fontsource/jetbrains-mono/500.css",
  "@fontsource/roboto/300.css",
  "@fontsource/roboto/400.css",
  "@fontsource/roboto/400-italic.css",
  "@fontsource/roboto/500.css",
  "@fontsource/roboto/600.css",
  "@fontsource/roboto/700.css",
];

const BODY = `bg-background text-foreground font-serif text-[${token("light", "font-size-body")}] leading-[${token("light", "line-height-body")}] antialiased`;

const css = {
  '@import "tw-animate-css"': {},
  "@layer base": {
    "*": { "@apply border-border outline-ring/50": {} },
    body: { [`@apply ${BODY}`]: {} },
  },
  // Unlike cssVars, keys under `css` are written verbatim — they need the `--`.
  ".high-contrast": Object.fromEntries(Object.entries(highContrast).map(([k, v]) => [`--${k}`, v])),
  ...Object.fromEntries(
    Object.entries(KEYFRAMES).map(([name, frames]) => [`@keyframes ${name}`, frames]),
  ),
};

const item = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "theme",
  type: "registry:theme",
  title: "Here Be Dragons Theme",
  description:
    "Parchment, ink and blood: the full shadcn variable set plus the HBD palette, status and spell-school colours, radii and offset shadows. Merged into your CSS file — nothing is overwritten wholesale. Light, .dark and .high-contrast. Ships no font files: it only sets the font-family variables, so add @hbd/fonts for our typefaces or point the variables at your own.",
  devDependencies: ["tw-animate-css"],
  cssVars: { theme, light, dark },
  css,
};

// Deliberately NOT a registryDependency of the theme: a consumer who wants their own
// typefaces installs the theme alone and the font-family variables fall back through
// Cinzel / Georgia / Arial to the system stack.
const fontsItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "fonts",
  type: "registry:theme",
  title: "Here Be Dragons Fonts",
  description:
    "The Here Be Dragons typefaces — Cinzel, IM Fell English, Roboto and JetBrains Mono — as npm packages imported from your CSS, so your bundler serves them and nothing is fetched at runtime (offline and Electron safe). Optional: skip it, or override --font-display / --font-sans, to use your own.",
  dependencies: FONT_PACKAGES,
  css: Object.fromEntries(FONT_IMPORTS.map((f) => [`@import "${f}"`, {}])),
};

// ── theme/theme.css: what the CLI writes, for the docs app ───────────────────
// Mirrors shadcn's update-theme step: every variable gets an @theme inline entry,
// `--color-<name>` when its value is a colour, `--<name>` otherwise.
const isColor = (v) => /^(#|rgb|hsl|oklch)/.test(v) || v.includes("--color-");
function themeCss() {
  const decl = (k, v) => `  --${k}: ${v};`;
  const inline = new Map(Object.entries(theme).map(([k, v]) => [`--${k}`, v]));
  const vars = { ...theme, ...light, ...dark };
  for (const [k, v] of Object.entries(vars)) {
    if (k === "radius") {
      const scale = { "2xl": 1.8, "3xl": 2.2, "4xl": 2.6 };
      for (const [s, f] of Object.entries(scale))
        if (!inline.has(`--radius-${s}`)) inline.set(`--radius-${s}`, `calc(var(--radius) * ${f})`);
      continue;
    }
    const name = isColor(v) ? `--color-${k}` : `--${k}`;
    if (!inline.has(name)) inline.set(name, `var(--${k})`);
  }
  const block = (sel, obj) =>
    `${sel} {\n${Object.entries(obj)
      .map(([k, v]) => decl(k, v))
      .join("\n")}\n}`;
  const keyframes = Object.entries(KEYFRAMES)
    .map(([name, frames]) => {
      const steps = Object.entries(frames)
        .map(
          ([at, props]) =>
            `    ${at} {\n${Object.entries(props)
              .map(([p, v]) => `      ${p}: ${v};`)
              .join("\n")}\n    }`,
        )
        .join("\n");
      return `  @keyframes ${name} {\n${steps}\n  }`;
    })
    .join("\n");
  return (
    [
      "/* GENERATED by packages/hbd/scripts/build-theme.mjs — do not edit. Mirrors `shadcn add @hbd/theme`. */",
      block(":root", light),
      block(".dark", dark),
      `@theme inline {\n${[...inline].map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n${keyframes}\n}`,
      `@layer base {\n  * {\n    @apply border-border outline-ring/50;\n  }\n  body {\n    @apply ${BODY};\n  }\n}`,
      block(".high-contrast", highContrast),
    ].join("\n\n") + "\n"
  );
}

const prettierConfig = (await prettier.resolveConfig(join(ROOT, "registry.json"))) ?? {};
const writeFragment = async (dir, contents) => {
  const file = join(ROOT, `registry/${dir}/registry.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    await prettier.format(JSON.stringify(contents), { ...prettierConfig, parser: "json" }),
  );
};
await writeFragment("theme", { items: [item] });
await writeFragment("fonts", { items: [fontsItem] });

mkdirSync(join(ROOT, "theme"), { recursive: true });
writeFileSync(join(ROOT, "theme/theme.css"), themeCss());
// Mirrors `shadcn add @hbd/fonts`, kept separate so the docs import exactly what a
// consumer would get from each item.
writeFileSync(
  join(ROOT, "theme/fonts.css"),
  "/* GENERATED by packages/hbd/scripts/build-theme.mjs — do not edit. Mirrors `shadcn add @hbd/fonts`. */\n" +
    FONT_IMPORTS.map((f) => `@import "${f}";`).join("\n") +
    "\n",
);

// For the parity check against browser-computed tokens.
if (process.argv.includes("--dump")) {
  writeFileSync(join(ROOT, "theme/.resolved.json"), JSON.stringify(themes, null, 1));
}

console.log(
  `theme: ${Object.keys(light).length} light, ${Object.keys(dark).length} dark, ${Object.keys(highContrast).length} high-contrast, ${Object.keys(theme).length} @theme vars`,
);
