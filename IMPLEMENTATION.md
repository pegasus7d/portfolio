# Portfolio — Implementation Overview

This document describes what is built in this Next.js portfolio: stack, routes, sections, data layer, and the two graph experiences.

For product and UX intent, see [DESIGN.md](./DESIGN.md).

---

## Stack

| Area | Technology |
|------|------------|
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Motion | GSAP + ScrollTrigger (`lib/gsap.ts`), Framer Motion (SVG career graph) |
| 2D graph (full knowledge map) | `react-force-graph-2d` |
| Content | Markdown in `content/` with gray-matter, remark (GFM → HTML) |
| SEO | `app/sitemap.ts`, `app/robots.ts`, JSON-LD Person schema (`lib/jsonld.ts`) |

---

## App routes

| Route | Purpose |
|-------|---------|
| `/` | Home: Hero, About, Projects, Skills, Graph section, Blog preview, Contact |
| `/blog` | Blog index |
| `/blog/[slug]` | Individual post (SSG) |
| `/projects/[slug]` | Individual project (SSG) |
| `robots.txt`, `sitemap.xml` | SEO |

Layout: [`app/layout.tsx`](app/layout.tsx) (fonts, global shell). [`app/template.tsx`](app/template.tsx) for page transitions if configured.

---

## Homepage sections (`app/page.tsx`)

1. **Hero** — [`components/sections/Hero.tsx`](components/sections/Hero.tsx): primary headline, CTA, lighting/particle backdrop.
2. **About** — [`components/sections/About.tsx`](components/sections/About.tsx): “System evolution” career visualization (see below), narrative panel, tooltip, legend, reduced-motion fallback text.
3. **Projects** — [`components/sections/Projects.tsx`](components/sections/Projects.tsx): cards from `getAllProjects()`.
4. **Skills** — [`components/sections/Skills.tsx`](components/sections/Skills.tsx).
5. **Graph** — [`components/graph/GraphSection.tsx`](components/graph/GraphSection.tsx): full knowledge graph (projects, blog, skills) via **KnowledgeGraph**.
6. **Blog preview** — [`components/sections/BlogPreview.tsx`](components/sections/BlogPreview.tsx): latest posts.
7. **Contact** — [`components/sections/Contact.tsx`](components/sections/Contact.tsx): links, icons, refined hover/lighting (Lucide where used).

**Layout:** [`components/layout/Navbar.tsx`](components/layout/Navbar.tsx) (anchors: About, Projects, Graph, Blog, Contact), [`components/layout/Footer.tsx`](components/layout/Footer.tsx).

---

## Two graph systems

### 1. Career graph (About section)

- **Component:** [`components/graph/CareerGraph.tsx`](components/graph/CareerGraph.tsx)
- **Rendering:** SVG + **Framer Motion** (fixed layout, no physics).
- **Data:** `buildOverviewGraph()` from [`lib/graph.ts`](lib/graph.ts), optionally pruned on low-end devices in About.
- **Behavior:**
  - Precomputed positions: IIT (left) → internships (middle) → Cimba (right); projects/skills fan from parent roles.
  - Staggered node reveal; edges draw with `pathLength` (or fade for dashed story edges).
  - Idle float, hover scale, click to focus + narrative panel; second click navigates if `url` exists.
  - Constrained drag (±40px) with snap-back (`dragSnapToOrigin`).
  - Story path: `STORY_NODE_IDS`, `STORY_EDGES` in [`lib/graph-types.ts`](lib/graph-types.ts); traveling dots on story edges after intro.
- **Shared types:** [`lib/graph-types.ts`](lib/graph-types.ts) (`GraphNode`, `GraphLink`, `LinkKind`, badges, logos, `context`).

### 2. Full knowledge graph (Graph section)

- **Component:** [`components/graph/KnowledgeGraph.tsx`](components/graph/KnowledgeGraph.tsx)
- **Rendering:** **`react-force-graph-2d`** (canvas, custom node/link painting).
- **Data:** `buildGraphData()` — all projects, posts, skills, and links from markdown-derived graph.
- **Loaded from:** [`components/graph/GraphSection.tsx`](components/graph/GraphSection.tsx) (dynamic import, `ssr: false`).

### Error handling

- [`components/graph/GraphErrorBoundary.tsx`](components/graph/GraphErrorBoundary.tsx) wraps graph UIs so failures do not crash the page.

---

## Data and graph builders (`lib/`)

| Module | Role |
|--------|------|
| [`lib/content.ts`](lib/content.ts) | Read `content/projects/*.md`, `content/blog/*.md`; frontmatter + HTML body for detail pages. |
| [`lib/graph-types.ts`](lib/graph-types.ts) | Client-safe types and constants: `STORY_NODE_IDS`, `STORY_EDGES`, `DEFAULT_NARRATIVE`, node/link kinds. |
| [`lib/graph.ts`](lib/graph.ts) | Server-only: `buildGraphData()`, `buildOverviewGraph()`, `buildEvolutionGraph()`, role nodes (IIT, Cimba, Ittiam, OneLot), story edges, badges, logos under `public/logos/`. |
| [`lib/types.ts`](lib/types.ts) | Project/post frontmatter types. |
| [`lib/jsonld.ts`](lib/jsonld.ts) | Person structured data for homepage. |
| [`lib/fonts.ts`](lib/fonts.ts) | Font configuration. |

**Why split graph-types vs graph:** Client components must not import Node `fs`; shared types/constants live in `graph-types.ts`.

---

## Content

- **Projects:** `content/projects/*.md` (title, slug, date, summary, stack, body).
- **Blog:** `content/blog/*.md` (title, slug, date, summary, tags, body).

Images and static assets: `public/` (including `public/logos/` for role logos).

---

## Motion, accessibility, performance

- **Reduced motion:** [`hooks/useReducedMotion.ts`](hooks/useReducedMotion.ts) — About swaps to static copy; graph sections respect preference where implemented.
- **GSAP:** Centralized in [`lib/gsap.ts`](lib/gsap.ts) for ScrollTrigger registration.
- **Particles:** [`components/particles/ParticleBg.tsx`](components/particles/ParticleBg.tsx), [`components/particles/ParticleBgLight.tsx`](components/particles/ParticleBgLight.tsx) (lighter variant where used).
- **Text animations:** [`components/textify/`](components/textify/) — Textify hook/variants (reveal, stagger, typewriter, etc.).

---

## Component map (high level)

```
app/
  page.tsx              # Composes homepage + graph data builders
  layout.tsx
  blog/, projects/      # Dynamic routes + loading UI

components/
  layout/               # Navbar, Footer, SectionWrapper
  sections/             # Hero, About, Projects, Skills, BlogPreview, Contact
  graph/                # CareerGraph, KnowledgeGraph, GraphSection, GraphErrorBoundary
  projects/             # ProjectCard
  particles/
  textify/
  icons.tsx

hooks/                  # useReducedMotion, useScrollTrigger, useInView
lib/                    # content, graph, graph-types, gsap, jsonld, fonts, types
content/                # Markdown source
public/                 # Static assets, logos
```

---

## Dependencies worth knowing

- **`framer-motion`** — Career graph (About).
- **`react-force-graph-2d`** — Full knowledge graph (Graph section only).
- **`gsap`** — Scroll-driven section entrances and nav polish.
- **`gray-matter`, `remark`, `remark-gfm`, `remark-html`** — Markdown pipeline.

---

## Local development

```bash
cd portfolio
npm install
npm run dev
```

Production build: `npm run build`.

---

## Maintenance notes

- To change the **guided career path** (nodes and edges shown in About), edit `STORY_NODE_IDS` / `STORY_EDGES` and role data in [`lib/graph-types.ts`](lib/graph-types.ts) and [`lib/graph.ts`](lib/graph.ts).
- **About** uses `overviewData` only (`buildOverviewGraph()`); `exploreData` on `page.tsx` is kept for API compatibility but is not required by the current About implementation.
- **Graph section** remains the place for the large exploratory graph; do not remove `react-force-graph-2d` unless GraphSection is migrated or removed.
