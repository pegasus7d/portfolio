# Portfolio — System Design & Development Plan

**Author:** Debayan Biswas
**Stack:** Next.js 15 (App Router), Tailwind CSS, GSAP + ScrollTrigger, tsparticles, Obsidian (Markdown content), custom Textify system
**Optional:** Framer Motion, Shiki

---

## PHASE 1 — SYSTEM ARCHITECTURE

### Layer Model

```
┌─────────────────────────────────────────────┐
│                 BROWSER                      │
│  Particle canvas · GSAP timeline · Textify   │
├─────────────────────────────────────────────┤
│             RENDERING (Next.js)              │
│  App Router · RSC for static · Client for    │
│  interactive sections · ISR for blog         │
├─────────────────────────────────────────────┤
│              CONTENT LAYER                   │
│  /content (Obsidian vault subset)            │
│  Markdown + frontmatter → gray-matter →      │
│  unified/remark/rehype pipeline → MDX or     │
│  HTML string per page                        │
├─────────────────────────────────────────────┤
│              ANIMATION LAYER                 │
│  GSAP ScrollTrigger (scroll-driven)          │
│  Textify (text micro-animations)             │
│  tsparticles (background canvas)             │
│  Framer Motion (layout transitions, exits)   │
└─────────────────────────────────────────────┘
```

### Data Flow

1. Obsidian vault lives in `content/` (git-tracked).
2. At build time, `lib/content.ts` reads `.md` files, parses frontmatter with `gray-matter`, converts body with `remark` + `rehype` (optionally `next-mdx-remote` for MDX).
3. Next.js RSC pages consume parsed data as props. Blog uses `generateStaticParams`.
4. Client components mount GSAP timelines in `useLayoutEffect`, register ScrollTrigger, and instantiate Textify and tsparticles.
5. No external CMS dependency. Content changes = commit + redeploy (or ISR webhook).

### Folder Structure

```
portfolio/
├── app/
│   ├── layout.tsx              # root layout, fonts, metadata, particle bg
│   ├── page.tsx                # home (hero + about + projects + skills + contact)
│   ├── blog/
│   │   ├── page.tsx            # blog index
│   │   └── [slug]/
│   │       └── page.tsx        # individual post (ISR)
│   └── projects/
│       └── [slug]/
│           └── page.tsx        # case-study deep dive
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── SectionWrapper.tsx  # scroll-trigger registration, padding, id
│   ├── textify/
│   │   ├── Textify.tsx         # main component
│   │   ├── variants/           # typewriter.ts, highlight.ts, stagger.ts
│   │   └── useTextify.ts       # hook for imperative control
│   ├── particles/
│   │   └── ParticleBg.tsx      # tsparticles canvas, lazy loaded
│   ├── projects/
│   │   ├── ProjectCard.tsx     # grid card with hover tilt + GSAP reveal
│   │   └── ProjectCaseStudy.tsx
│   ├── blog/
│   │   ├── BlogCard.tsx
│   │   └── BlogRenderer.tsx    # markdown body + Shiki code blocks
│   └── ui/                     # button, badge, tag, tooltip primitives
├── content/
│   ├── projects/               # one .md per project
│   │   ├── intentflow.md
│   │   └── ...
│   └── blog/                   # one .md per post
│       ├── building-intentflow.md
│       └── ...
├── lib/
│   ├── content.ts              # gray-matter + remark pipeline
│   ├── gsap.ts                 # shared GSAP defaults, ScrollTrigger setup
│   └── fonts.ts                # next/font imports
├── hooks/
│   ├── useScrollTrigger.ts     # reusable GSAP ScrollTrigger registration
│   ├── useInView.ts            # intersection observer fallback
│   └── useReducedMotion.ts     # prefers-reduced-motion check
├── styles/
│   └── globals.css             # Tailwind directives, custom properties
├── public/
│   ├── og.png                  # default OG image
│   └── favicon.ico
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── DESIGN.md                   # this file
```

### Reusable Components Summary

| Component | Responsibility | Rendering |
|-----------|---------------|-----------|
| `SectionWrapper` | Wraps each page section; registers a GSAP ScrollTrigger on mount; accepts `id`, `className`, `animation` prop | Client |
| `Textify` | Animated text rendering with variant system | Client |
| `ParticleBg` | Full-viewport tsparticles canvas, lazy loaded | Client |
| `ProjectCard` | Tilt-on-hover card with image, tags, summary | Client |
| `BlogRenderer` | Renders parsed markdown/MDX with Shiki-highlighted code | Server (with client islands for copy button) |

---

## PHASE 2 — UX + UI STRATEGY

### Sections (single-page home + dedicated routes)

| # | Section | Description | Key Animation |
|---|---------|-------------|---------------|
| 1 | **Hero** | Full viewport. Particle background. Name via Textify typewriter. One-liner tagline fades in. Scroll-down indicator pulses. | Particles drift; name types in; tagline stagger reveals |
| 2 | **About** | Two-column: photo/illustration left, short bio right. Timeline of career below (vertical line, nodes per role). | Nodes slide in on scroll; photo parallax |
| 3 | **Projects** | 3-column grid of ProjectCards. Click opens case-study route with problem/approach/outcome/stack. | Cards stagger in; hover tilt + shadow lift |
| 4 | **Skills** | Grouped chips (backend, infra, frontend, AI) with subtle entrance. No progress bars (they are meaningless). | Chip groups fade in left-to-right per row |
| 5 | **Blog** | Latest 3 posts as BlogCards; "View all" links to /blog. | Cards slide up on scroll |
| 6 | **Contact** | Email link, LinkedIn, GitHub. Minimal. Optional form via Formspree/Resend. | Fade in |

### Animation Philosophy

1. **Scroll-driven, not autoplay.** Every animation fires when the element enters the viewport via ScrollTrigger. Nothing animates offscreen.
2. **Once per session.** Animations play once and stay in end state; no looping distractions.
3. **Reduced motion respected.** `useReducedMotion` hook disables GSAP timelines and Textify effects; content remains fully accessible.
4. **Fast perceived load.** Hero particles and Textify start immediately. Below-fold sections use `will-change: transform` only when entering viewport.
5. **No scroll hijacking.** Native scroll throughout. ScrollTrigger pins are used sparingly (at most one pinned hero sequence).

### Visual Design System

**Colors (dark-first, light toggle optional)**

```
--bg:           #0a0a0a
--bg-elevated:  #141414
--surface:      #1e1e1e
--border:       #2a2a2a
--text-primary: #ededed
--text-muted:   #888888
--accent:       #3b82f6   (blue-500)
--accent-glow:  #3b82f620 (accent at 12% for glow)
```

**Typography**

- Headings: `Inter` or `Satoshi` (variable weight, next/font)
- Body: same family, 400 weight
- Code: `JetBrains Mono` (next/font, for Shiki blocks and terminal UI)
- Scale: 14/16/20/28/40/56px mapped to Tailwind `text-sm` through `text-6xl`

**Spacing**

- Section vertical padding: `py-24 md:py-32`
- Content max-width: `max-w-5xl mx-auto px-6`
- Component gaps: multiples of 4 (`gap-4`, `gap-8`, `gap-12`)

**Motion Principles**

- Duration: 0.4–0.8s for entrances, 0.2s for micro-interactions
- Easing: GSAP `power3.out` for entrances, `power2.inOut` for morphs
- Stagger: 0.05–0.1s between sibling elements

---

## PHASE 3 — TEXTIFY SYSTEM DESIGN

### Purpose

A single React component that takes plain text (or markdown fragments) and renders them with configurable text animations. Replaces scattered one-off animation code with a composable, performant system.

### API

```tsx
<Textify
  variant="typewriter"        // "typewriter" | "highlight" | "stagger" | "reveal" | "none"
  content="Backend engineer."
  tag="h1"                    // rendered HTML element (default "span")
  className="text-5xl"
  delay={0.2}                 // seconds before animation starts
  duration={1.2}              // total animation duration
  trigger="scroll"            // "scroll" | "mount" | "manual"
  highlightColor="#3b82f6"    // only for variant="highlight"
  cursor={true}               // blinking cursor for typewriter
  onComplete={() => {}}       // callback when animation finishes
/>
```

### Variants

| Variant | Behavior | GSAP technique |
|---------|----------|----------------|
| `typewriter` | Characters appear one by one with optional blinking cursor | `gsap.to` on character `<span>` opacity, staggered |
| `highlight` | Text renders instantly, then a colored underline/background sweeps left to right | `gsap.fromTo` on `::after` pseudo `scaleX(0) → scaleX(1)` |
| `stagger` | Words or lines fade + translate up in sequence | `gsap.from` with `y: 20, opacity: 0, stagger: 0.08` |
| `reveal` | Clip-path wipe reveals text block | `gsap.fromTo` on `clipPath` |
| `none` | Static render, no animation (SSR safe, reduced-motion fallback) | — |

### Internal Architecture

```
Textify.tsx
├── splits content into <span> per char/word/line based on variant
├── wraps each span with data attributes for GSAP targeting
├── calls useTextify(ref, variant, options) in useLayoutEffect
│   └── useTextify.ts
│       ├── imports variant function from variants/
│       ├── creates GSAP timeline
│       ├── if trigger === "scroll", registers ScrollTrigger
│       ├── if trigger === "manual", returns { play, reverse, restart }
│       └── returns cleanup function
└── renders with tag prop, forwards ref and className
```

### Performance Considerations

- Character splitting happens once on mount; memoized with `useMemo`.
- GSAP timelines are killed on unmount via cleanup return.
- `will-change: transform, opacity` applied only during animation, removed after.
- `variant="none"` renders plain text with zero JS overhead (pure RSC compatible).
- Reduced-motion: `useReducedMotion()` forces variant to `"none"` automatically.

---

## PHASE 4 — OBSIDIAN INTEGRATION

### Content Structure in `content/`

```
content/
├── projects/
│   ├── intentflow.md
│   ├── usage-insights.md
│   └── distributed-encode.md
└── blog/
    ├── building-intentflow.md
    ├── mcp-oauth-deep-dive.md
    └── ask-cimba-test-infra.md
```

### Frontmatter Schema — Projects

```yaml
---
title: "IntentFlow"
slug: "intentflow"
summary: "Compiler-style LLM execution in Go"
stack: ["Go", "PostgreSQL", "OpenAPI", "MCP"]
date: "2026-02-01"
status: "active"           # active | archived
cover: "/images/intentflow-cover.png"
featured: true
---
```

### Frontmatter Schema — Blog

```yaml
---
title: "How I re-architected Ask Cimba tests"
slug: "ask-cimba-test-infra"
date: "2026-03-15"
tags: ["testing", "java", "ci-cd"]
summary: "From a 700-line Python script to modular Java with 71% less YAML."
draft: false
---
```

### Parsing Strategy (`lib/content.ts`)

```
readFile → gray-matter (frontmatter + body)
                          ↓
                   remark() pipeline
                   .use(remarkGfm)
                   .use(remarkShiki, { theme: 'one-dark-pro' })  // code highlighting at build
                          ↓
                   rehype pipeline
                   .use(rehypeStringify)
                          ↓
              { metadata: Frontmatter, html: string }
```

Expose two main functions:
- `getAllProjects()` — returns sorted project metadata array
- `getProjectBySlug(slug)` — returns full project with rendered HTML
- `getAllPosts()` / `getPostBySlug(slug)` — same pattern for blog

### Syncing Strategy

**Git-based (recommended):**
- Obsidian vault's `projects/` and `blog/` folders are symlinked or copied into `content/`.
- Alternatively, the portfolio repo IS the Obsidian vault (with `.obsidian/` gitignored).
- On push to main, Vercel rebuilds. Blog posts with `draft: true` are excluded from `generateStaticParams`.

**Local dev:**
- Write in Obsidian, save, Next.js dev server hot-reloads via file watching.

---

## PHASE 5 — PERFORMANCE + ENGINEERING

### Bundle Optimization

| Concern | Strategy |
|---------|----------|
| tsparticles is large (~40KB gzipped) | Dynamic import with `next/dynamic`, `ssr: false`, loaded only on hero mount |
| GSAP + ScrollTrigger | Tree-shake: import only `gsap` and `ScrollTrigger`, register plugin once in `lib/gsap.ts` |
| Shiki themes | Use `rehype-shiki` at build time (zero client JS for syntax highlighting) |
| Framer Motion | Import only `motion`, `AnimatePresence` from `framer-motion`; avoid importing the full package |
| Images | `next/image` everywhere with `priority` on hero, `loading="lazy"` elsewhere |
| Fonts | `next/font/google` with `display: swap`, subset to latin |

### Animation Performance

- All GSAP animations target `transform` and `opacity` only (compositor-friendly, no layout thrash).
- `will-change` applied dynamically via GSAP's `onStart` / `onComplete`.
- Particle canvas runs on `requestAnimationFrame`; paused when tab is hidden via `document.visibilitychange`.
- ScrollTrigger uses `IntersectionObserver` internally; no scroll-event listeners.

### Lazy Loading

- Blog posts below fold: images lazy loaded.
- Project case-study pages: code-split per route automatically by App Router.
- ParticleBg: dynamically imported, shows nothing until loaded (hero text still renders immediately).

### SEO

- `metadata` export on every page/layout (title, description, openGraph, twitter).
- `generateMetadata` on dynamic routes using frontmatter.
- Sitemap via `app/sitemap.ts` (reads all slugs from content at build).
- `robots.ts` with sensible defaults.
- JSON-LD for Person schema on home page.
- All content rendered as HTML by RSC (not hydration-dependent).

### Code Quality

- **Code splitting:** automatic via App Router; manual `next/dynamic` for heavy client components.
- **Reusable hooks:** `useScrollTrigger`, `useInView`, `useReducedMotion`, `useTextify`.
- **Clean architecture:** content parsing in `lib/`, animation setup in `lib/gsap.ts`, components are pure UI + effects.
- **TypeScript strict mode.** Frontmatter types defined in `lib/types.ts`.
- **ESLint + Prettier** from day one.

---

## PHASE 6 — IMPLEMENTATION ROADMAP

### Step 1: Project Setup (Day 1)

**What:** Scaffold Next.js, install deps, configure Tailwind, set up fonts and global styles.

**Key files:**
- `package.json`
- `tailwind.config.ts`
- `app/layout.tsx`
- `styles/globals.css`
- `lib/fonts.ts`

**Dependencies:**
```
next react react-dom
tailwindcss @tailwindcss/typography postcss autoprefixer
gsap @gsap/react
@tsparticles/react @tsparticles/slim
gray-matter remark remark-gfm rehype rehype-stringify
shiki (or rehype-shiki)
framer-motion (optional)
```

### Step 2: Layout System (Day 2)

**What:** Navbar, Footer, SectionWrapper, dark theme, responsive container.

**Key files:**
- `components/layout/Navbar.tsx`
- `components/layout/Footer.tsx`
- `components/layout/SectionWrapper.tsx`
- `lib/gsap.ts` (register ScrollTrigger)
- `hooks/useScrollTrigger.ts`
- `hooks/useReducedMotion.ts`

### Step 3: Textify System (Day 3–4)

**What:** Build Textify component and all variants. Test each variant in isolation.

**Key files:**
- `components/textify/Textify.tsx`
- `components/textify/useTextify.ts`
- `components/textify/variants/typewriter.ts`
- `components/textify/variants/highlight.ts`
- `components/textify/variants/stagger.ts`
- `components/textify/variants/reveal.ts`

### Step 4: Obsidian Integration (Day 4–5)

**What:** Content parsing pipeline. Create sample project and blog markdown files. Wire up to pages.

**Key files:**
- `lib/content.ts`
- `lib/types.ts` (frontmatter types)
- `content/projects/intentflow.md`
- `content/blog/building-intentflow.md`

### Step 5: Sections (Day 5–8)

**What:** Build all home page sections and route pages.

| Section | Key files |
|---------|-----------|
| Hero | `app/page.tsx` (hero block), `components/particles/ParticleBg.tsx` |
| About | inline in `app/page.tsx` or `components/sections/About.tsx` |
| Projects | `components/projects/ProjectCard.tsx`, `app/projects/[slug]/page.tsx` |
| Skills | inline section with chip groups |
| Blog | `components/blog/BlogCard.tsx`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `components/blog/BlogRenderer.tsx` |
| Contact | inline section, optional Formspree form |

### Step 6: Animations (Day 8–10)

**What:** Wire GSAP ScrollTrigger to every SectionWrapper. Add Textify to headings. Add hover effects to cards. Tune timings.

**Key files:**
- Every section component
- `hooks/useScrollTrigger.ts` (may need refinement)
- `lib/gsap.ts` (shared defaults)

### Step 7: Polish (Day 10–12)

**What:** OG images, sitemap, robots, JSON-LD, Lighthouse audit, mobile QA, deploy to Vercel.

**Key files:**
- `app/sitemap.ts`
- `app/robots.ts`
- `public/og.png`
- Vercel project settings

---

## PHASE 7 — DIFFERENTIATORS

### 1. Terminal-Style Command Palette

A `Cmd+K` overlay styled as a terminal. User can type commands like `projects`, `about`, `blog`, `contact` to navigate. Shows recent "commands" (pages visited). Built with `cmdk` library + custom terminal skin.

**Why it stands out:** Signals engineering identity. Memorable interaction pattern.

### 2. Architecture Diagrams as Interactive Components

For each project case study, render system architecture as an interactive SVG or canvas (not a static image). Nodes highlight on hover with tooltips explaining each service. Built with a small custom component using SVG + GSAP.

**Why:** Proves you think in systems, not just features.

### 3. "Ask Debayan" AI Chat

A small chat widget (bottom-right) powered by an OpenAI/Gemini API route. System prompt is seeded with your resume, project details, and blog posts. Visitors can ask "What stack did you use for IntentFlow?" and get a grounded answer.

**Why:** Differentiator that also demos your LLM integration skills. Rate-limit to control cost.

### 4. Commit-Graph Timeline

Instead of a plain career timeline, render your experience as a commit graph (like GitHub's contribution heatmap or git log). Each "commit" is a key achievement. Hover shows details. Built with SVG + GSAP.

**Why:** Visually unique, resonates with engineering audience.

### 5. Live Code Playground

For selected blog posts, embed a sandboxed code editor (Monaco or CodeMirror) with runnable snippets. Example: a Go snippet from IntentFlow that visitors can modify and run via a serverless function.

**Why:** Interactive content keeps visitors engaged 3-5x longer.

### 6. Reading Progress + Estimated Time

Blog posts show a thin progress bar at the top and "X min read" based on word count. Simple but polished.

### 7. Page Transitions

Use Framer Motion `AnimatePresence` + Next.js `template.tsx` for smooth cross-fade or slide transitions between routes. Most Next.js portfolios have zero page transitions; this alone lifts perceived quality.

### 8. Easter Eggs

- Konami code triggers a retro mode (pixelated fonts, 8-bit particle colors).
- Clicking the profile photo N times triggers a fun animation.
- Hidden `/uses` page listing your actual dev setup.

---

## Summary

This portfolio is designed as three layers: **content** (Obsidian markdown, git-synced), **rendering** (Next.js App Router, RSC for static, client for interactive), and **animation** (GSAP ScrollTrigger, Textify, tsparticles). Every section is scroll-triggered, reduced-motion safe, and SEO-first. The Textify system is a standalone composable that replaces ad-hoc text animations. Differentiators (terminal palette, architecture diagrams, AI chat, commit timeline) are chosen to signal engineering depth, not just visual polish.

Build time estimate: 10–14 days for a complete, deployed, polished version.
