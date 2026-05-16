# 15element.ai

Sitio web oficial de **15Element AI** — agencia SEO B2B + AEO + LinkedIn orgánico para empresas B2B en LATAM y Norteamérica.

**Live:** https://15element.ai

## Stack

HTML estático generado con un build script casero (sin dependencies). Deploy en Netlify desde la rama `main`.

- **Build script:** [`build.js`](./build.js) — inyecta partials, resuelve paths relativos, escribe HTML al root
- **Partials:** [`_partials/`](./_partials/) — nav, footer, WhatsApp float, theme toggle
- **Styles:** [`_styles/common.css`](./_styles/common.css) + [`_styles/pages/`](./_styles/pages/) — chrome compartido + CSS por página
- **Source HTML:** [`_src/`](./_src/) — páginas con placeholders (`{{ASSETS}}`, `<!-- @include nav -->`)
- **Design tokens:** [`colors_and_type.css`](./colors_and_type.css) — variables CSS (colores, tipografía, sombras, espaciado)

## Estructura del sitio (27 páginas)

```
/                                  Home
/servicios/                        Servicios overview + 4 sub-pages
  ├── seo-aeo-geo/
  ├── linkedin-prospecting/
  ├── senales-de-compra/
  └── email-outreach/
/industrias/                       Industrias overview + 6 verticales
  ├── manufactura/
  ├── energia-solar/
  ├── logistica/
  ├── tecnologia-saas/
  ├── consultoria/
  └── fintech/
/casos/                            Casos de éxito
/nosotros/                         Bio Luis Balaguer + timeline + recos
/contacto/                         Calendario GHL embebido
/blog/                             Overview + 8 artículos
/politica-de-privacidad/
/terminos-de-servicio/
```

## Workflow de desarrollo

```bash
# Editar páginas en _src/
# Editar estilos en _styles/pages/[slug].css o _styles/common.css

# Regenerar HTML al root
node build.js
```

El build genera 27 HTMLs. El deploy de Netlify sirve directamente desde la raíz (no hay build command en producción — el HTML ya está committeado).

## SEO/AEO

- Schema.org JSON-LD en cada página (`Organization`, `Service`, `BlogPosting`, `Person`, `BreadcrumbList`, `FAQPage`)
- Sitemap automático en [`sitemap.xml`](./sitemap.xml)
- 301 redirects de URLs WordPress legacy en [`netlify.toml`](./netlify.toml)
- Cache headers optimizados (assets immutable, HTML must-revalidate)

## Contacto

[hola@15element.ai](mailto:hola@15element.ai) · [LinkedIn](https://www.linkedin.com/in/lfbalaguer/)

© 2026 15Element AI · Burlington, Ontario, Canadá
