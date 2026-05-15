# 15Element.AI Design System

A design system distilled from the 15Element.AI brand mark. Use it for slides, marketing pages, product UI, and pitch decks. Everything is wired up so an agent (or a designer) can produce brand-consistent artifacts immediately.

> **Status: brand foundations + sample UI.** No production codebase or Figma was provided — UI kits in this system are aesthetic demonstrations, not recreations of an existing product. Once a real codebase or Figma is connected, the UI kit should be regenerated against it.

---

## About 15Element.AI

**15Element.AI is a B2B lead-generation agency** based in Canada, operating across LATAM (México, Chile, Colombia, Ecuador) and Canada. Founded by Luis Balaguer (18 years as a Fortune 500 B2B consultant; teacher at ITESM, Sheridan College, Humber College).

### What they sell
**Pipeline B2B sin anuncios.** They generate qualified leads for B2B companies using three pillars:

1. **SEO · AEO · GEO** — positioning the client's company in Google *and* in the answers given by ChatGPT, Gemini, and Perplexity. When a decision-maker asks an AI who solves their problem, the client appears.
2. **Belñales de compra en LinkedIn** — monitoring LinkedIn in real time for buying signals: role changes, team expansions, new hires, posts about active problems. Each signal becomes a contextual outreach opportunity.
3. **Email outreach con contexto** — messages built on the specific signal, not generic templates. They claim 4× response rates vs. generic outreach.

**They explicitly do not use Meta Ads or Google Ads.** "100% orgánico — 0 ads" is a tagline-grade positioning statement.

### Real proof points used in copy
- 842 leads B2B in 10 months for Nextco
- $9M USD project closed for Top Energy via LinkedIn organic
- 59.9% LinkedIn connection rate for Itechmaint (1,144 of 1,914)
- Active clients: Nextco, Spakio, Sport City, Mercedes-Benz, Cinépolis, ITESM, IPADE, Honda, SEIDOR, Quickcap, Royal LePage, and others.
- Free 45-min audit with a $100 USD PayPal guarantee if the prospect sees no value.

### Sister product
**AI OS** at `15e.ai` — mentioned in the footer but not detailed on the marketing site. (Distinct from the agency offering. If we need to design for it, please share its surface.)

### Sources used to build this system
- `15Element NEW Logo.pdf` and ~20 raster exports of the mark
- `https://www.15element.ai` — the marketing site (Spanish, LATAM/Canada audience)
- ~~No codebase or Figma file~~ — still not provided; component visuals were grounded in the marketing site's copy and feel, not in source code.

---

## Quick index

| Path | Purpose |
|---|---|
| `colors_and_type.css` | All design tokens — colors, fonts, spacing, radii, shadows, motion, plus base element styling |
| `assets/` | Logo files (mark only, with wordmark, horizontal lockup; color / navy / white) |
| `assets/source/` | Original vector PDF |
| `preview/` | Design-system cards (registered to the Design System tab) |
| `ui_kits/brand-demo/` | Sample components rendered with brand tokens — buttons, inputs, cards, badges, alerts, plus a landing-page demo |
| `ui_kits/ai-product/` | Speculative AI-product surface (chat / workspace) — flagged as exploratory, not a recreation |
| `SKILL.md` | Agent Skill manifest — drop into a Claude Code skills folder to use the system there |

---

## Content Fundamentals

**Voice is direct, anti-marketing, results-first.** The website is in Spanish (LATAM/Canada B2B audience) with surgical English fragments for technical terms (AEO, GEO, ICP). Every claim is paired with a number or a named client. There is no hedging, no fluff, no exclamation marks.

### Rules drawn from the live site

- **Language.** Primary copy is **Spanish** (Latin American register — "tú" form, neutral LATAM Spanish). English used only for industry terms and the AI OS surface. When writing for international audiences, English copy mirrors the same direct register.
- **Casing.** Headlines are **sentence case with terminal periods** — a deliberate stylistic choice that reads as declarative and final. The wordmark and category eyebrows (e.g. `EL SISTEMA`, `RESULTADOS REALES`) are uppercase. Body is sentence case.
  - ✅ `Pipeline B2B sin anuncios. Solo señales reales.`
  - ✅ `Lo que pasa a los 60 días`
  - ✅ `EL PROCESO` (eyebrow)
  - ❌ `PIPELINE B2B SIN ANUNCIOS` (don't shout the headline)
- **Sentence rhythm.** Short. Often fragments. The em-dash carries the heavy emphasis. Sentences land on the verb or on the number. Examples used verbatim on the site:
  - `No demos. No proyecciones.`
  - `Sin Meta. Sin Google Ads. Sin depender de referidos.`
  - `Cada señal es una ventana de oportunidad.`
  - `Sin letra pequeña.`
- **Numbers are the proof.** Every claim is paired with a measured outcome. `842 leads`. `$9M USD`. `59.9% tasa de conexión`. `22 años`. `4× más respuesta`. Treat numbers as typographic objects — set them tight, in the display family, often pulled out as oversized callouts.
- **Negation as positioning.** "Sin X. Sin Y. Sin Z." is a recurring construction. The brand defines itself by what it doesn't do (no ads, no referrals, no DIY, no overnight promises).
- **Client names as proof.** Real, named clients (BOSCH, Continental, Mercedes-Benz, ITESM, Cinépolis, Honda) appear early and often. Use names — don't say "a Fortune 500 client."
- **Anti-jargon, pro-specifics.** Avoid "supercharge," "unlock," "transform," "AI-powered." Use the actual mechanism: "detectamos cambios de rol y nuevas contrataciones." If a sentence works without the word "AI," remove it.
- **Tone toward the reader.** Confident but never condescending. The reader is a business owner or director who already knows their problem — the site explains the *mechanism*, not the problem.
- **No emoji.** Not on the site. Don't add them to derivative work.
- **Punctuation accents.** Em-dash for the strong aside. Star (★) for credibility (`Google Reviews ★★★★★`). Arrow (→) for call-to-action links. No exclamation marks anywhere.

### Voice cheatsheet by surface

| Surface | Pattern | Real example |
|---|---|---|
| Hero headline | Short declarative + period | `Pipeline B2B sin anuncios. Solo señales reales.` |
| Eyebrow | Uppercase 2–3 words | `EL SISTEMA` / `RESULTADOS REALES` |
| Section H2 | Sentence case, often a question or claim | `Por qué tu pipeline depende del azar` |
| Stat block | Big number + tight noun phrase | `842 leads B2B generados` |
| Proof line | Client name + concrete outcome | `$9M USD proyecto cerrado por LinkedIn orgánico` |
| CTA | Imperative verb + concrete object | `Agenda tu auditoría gratuita` |
| Guarantee | Specific, almost flippant | `Si no ves valor al terminar — $100 USD a tu PayPal` |
| Empty state / 404 | Dry, factual | `Conexión perdida. Reintentando en 4s.` |

---

## Visual Foundations

**Color philosophy.** Navy `#2A2E46` is the brand's ink — used as background, primary text, and the canvas that the colored elements sit on. The four element colors (green, red, teal, orange) function as **categorical accents**, not as a gradient palette to bleed across surfaces. Pick one per surface for emphasis; let the rest sit quiet. The colors only appear in **gradient form** inside the logo mark itself — do not apply the multi-color gradient as a background fill across UI.

| Token | Hex | Role |
|---|---|---|
| `--brand-navy` | `#2A2E46` | Ink, dark backgrounds, primary text |
| `--brand-green` | `#7EB749` | Categorical / success accent |
| `--brand-red` | `#BD2429` | Categorical / danger accent |
| `--brand-teal` | `#209499` | **Primary action color**, info, links |
| `--brand-orange` | `#ED9321` | Categorical / warning accent |
| `--ink-300` | `#BDBEC0` | Wordmark secondary gray |

**Typography.** Two-family system.
- **Display: Saira Condensed** (Google Fonts) — the confirmed display face. Weights 700–900. Use uppercase for the wordmark, eyebrows, and category labels; sentence case (with terminal periods) for headlines, matching the live site.
- **Body: IBM Plex Sans** — slightly humanist sans, technical feel, pairs well with the condensed display.
- **Mono: IBM Plex Mono** — for code, numbers-as-data, and IDs.

**Spacing.** 4px base; the active scale is `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`. Use `--sp-*` tokens; never hard-code spacing in components.

**Backgrounds.** Solid color is the default — `--bg` (off-white) or `--bg-inverse` (navy). No textures, no patterns, no full-bleed photography by default. When a surface needs life, use a **single brand color block** at low saturation (10–20% over navy) or a soft radial behind a numerical display. **The conic/multi-color gradient is reserved for the logo mark only** — never as a background.

**Animation.** Brief and functional. `--dur-fast: 120ms` for hovers, `--dur-base: 200ms` for state changes, `--dur-slow: 320ms` for layout transitions. Use `--ease-standard` (subtle deceleration). No bounces, no spring physics — the brand is industrial, not playful. Fade + 4px translate is the default entrance.

**Hover states.** Solid buttons darken one step (`--brand-teal-600`). Ghost / outline buttons fill in with `--bg-sunken`. Links underline. Cards lift by `--shadow-md` and translate `-2px`. Never use opacity-only hovers on interactive elements — they read as disabled.

**Press states.** Translate `+1px` and reduce shadow by one step. Solid buttons go one shade darker than hover. No scale transforms.

**Borders.** 1px default, `--border` color (light) or `rgba(255,255,255,0.08)` (dark). Use `--border-strong` for emphasis. Border radius scale leans medium — `--r-md: 10px` is the default for cards and inputs, `--r-pill` for badges and segmented controls.

**Shadows.** Tight and tinted with brand navy (`rgba(20, 22, 42, …)`) rather than neutral black. Five steps: `xs sm md lg xl`. Inset highlight (`--shadow-inset`) for raised buttons on dark surfaces.

**Focus rings.** `0 0 0 3px rgba(32, 148, 153, 0.35)` — the teal at 35% opacity. Always visible, never removed.

**Cards.** Default card = `--bg-elevated` + `1px solid --border` + `--r-md` + `--shadow-sm`. No colored left-border accents. No outer glow.

**Transparency / blur.** Used sparingly: only for modal scrims (`rgba(20, 22, 42, 0.65)` + `backdrop-filter: blur(8px)`) and for sticky nav backgrounds (`rgba(255, 255, 255, 0.85)` + `blur(12px)`).

**Imagery.** No stock photography in the system yet. When real photography is added, it should be high-contrast, slightly cool-tinted to harmonize with navy, and never decorative — every photo should carry meaning. Avoid warm sunsets and people-in-meetings tropes.

**Layout rules.** Generous whitespace. Content max-width `1200px` for marketing surfaces, `1440px` for app surfaces. The brand mark, when used as a fixed element (nav, footer), sits at a consistent `28–40px` height; never scaled smaller than the wordmark's "5" character is legible.

---

## Iconography

> ⚠️ **No icon system was provided.** This system links to **Lucide** via CDN as a substitution. Replace with the project's actual icon set when known.

- **Style.** 1.5px stroke weight, square caps, square joins, 24×24 viewBox. The icon shape's silhouette should be readable at 16px.
- **Color.** Icons inherit `currentColor`. Default to `--fg` for body context, `--fg-muted` for secondary, brand color for active states.
- **Sizing.** Use the spacing scale: `16px` for inline, `20px` for buttons, `24px` for navigation, `32px+` for feature lists.
- **Emoji.** Not used in product UI. Acceptable in casual marketing copy (e.g. a single 👋 in an empty state) but never as a UI affordance.
- **Unicode symbols.** Avoid using as icons. The arrow → and bullet • are acceptable as typographic ornaments.
- **Logo as icon.** The mark may appear as a 1× favicon, app icon, and brand badge — never as decoration mid-paragraph.

```html
<!-- Recommended: Lucide via CDN -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<i data-lucide="arrow-right"></i>
```

---

## How to use this system

**For one-off artifacts (slides, mocks).** Link `colors_and_type.css` and reach for semantic tokens (`--fg`, `--bg-elevated`, `--accent`). Pull logos from `assets/`. Reference `ui_kits/brand-demo/` for component patterns.

**For production code.** Copy `colors_and_type.css` and the logos. The token names are intentionally CSS-var-first so they map cleanly to any framework's theme system.

**For Claude Code / agents.** See `SKILL.md` — drop this whole folder into `.claude/skills/` and invoke as `15element-design`.

---

## Open questions / next steps

1. **AI OS surface (`15e.ai`).** The footer links to a separate AI OS product. Not currently documented in this system. If we're building for it, please share screenshots or access.
2. **Codebase or Figma.** Still missing. The brand demo is hand-built against the live marketing site's copy and structure; a codebase would let us match the actual layout, animations, and component choices exactly.
3. **English voice variant.** The site is primarily Spanish. If you need English versions of the same brand voice for Canadian/US clients, share a couple of English emails or pages and I'll calibrate.
