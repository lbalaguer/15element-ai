---
name: 15element-design
description: Use this skill to generate well-branded interfaces and assets for 15Element.AI, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files. The token system lives in `colors_and_type.css` — import it and use the CSS variables. Logo assets are in `assets/`. Component patterns are in `ui_kits/`. The `preview/` directory has small card-sized specimens of every token group.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules in `README.md` to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Brand quick reference

- **Display type:** Saira Condensed (Google Fonts). Uppercase for wordmark & eyebrows; sentence case with terminal periods for hero/section headlines (matches the live site).
- **Body type:** IBM Plex Sans.
- **Mono type:** IBM Plex Mono.
- **Ink:** `#2A2E46` (brand navy) — primary text and dark surfaces.
- **Accent / primary action:** `#209499` (element teal).
- **Categorical accents:** `#7EB749` green, `#BD2429` red, `#209499` teal, `#ED9321` orange — use as categories, never as a multi-color gradient (the gradient is reserved for the logo mark only).
- **Tone:** confident, direct, technical. Avoid AI clichés ("supercharge," "magic"). Display headlines in ALL-CAPS condensed; body in sentence case.
- **Iconography:** Lucide via CDN (substitution — replace if brand has another set).
