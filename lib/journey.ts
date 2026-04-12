/**
 * Single-page guided flow: section order, labels, and “what’s next” copy.
 */

export type JourneyStepId =
  | "intro"
  | "about"
  | "projects"
  | "skills"
  | "graph"
  | "blog"
  | "contact";

export interface JourneyStep {
  id: JourneyStepId;
  /** Short label for dots / tooltips */
  short: string;
  /** Navbar-style name */
  navLabel: string;
  /** CTA at bottom of this section (null = last) */
  nextCta: string | null;
  /** Target id for the CTA anchor */
  nextTargetId: JourneyStepId | null;
}

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: "intro",
    short: "Intro",
    navLabel: "Intro",
    nextCta: "See how my path connects ↓",
    nextTargetId: "about",
  },
  {
    id: "about",
    short: "Path",
    navLabel: "About",
    nextCta: "See projects I built ↓",
    nextTargetId: "projects",
  },
  {
    id: "projects",
    short: "Work",
    navLabel: "Projects",
    nextCta: "Explore skills & stack ↓",
    nextTargetId: "skills",
  },
  {
    id: "skills",
    short: "Skills",
    navLabel: "Skills",
    nextCta: "See systems I designed ↓",
    nextTargetId: "graph",
  },
  {
    id: "graph",
    short: "Systems",
    navLabel: "Architecture",
    nextCta: "Read my thinking ↓",
    nextTargetId: "blog",
  },
  {
    id: "blog",
    short: "Blog",
    navLabel: "Blog",
    nextCta: "Get in touch ↓",
    nextTargetId: "contact",
  },
  {
    id: "contact",
    short: "Contact",
    navLabel: "Contact",
    nextCta: null,
    nextTargetId: null,
  },
];

/** Sections used for scroll-spy + progress (subset of journey; intro optional). */
export const SCROLL_SPY_IDS: JourneyStepId[] = [
  "intro",
  "about",
  "projects",
  "skills",
  "graph",
  "blog",
  "contact",
];

export const NAV_SCROLL_SPY_IDS: JourneyStepId[] = [
  "about",
  "projects",
  "skills",
  "graph",
  "blog",
  "contact",
];

export type JourneyDetail = {
  activeId: JourneyStepId | "";
  progress: number;
};

export const JOURNEY_EVENT = "portfolio:journey";

export function dispatchJourney(detail: JourneyDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<JourneyDetail>(JOURNEY_EVENT, { detail }),
  );
}

export function scrollToSectionId(
  id: JourneyStepId,
  behavior: ScrollBehavior = "smooth",
) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior, block: "start" });
}

export const HIGHLIGHT_PROJECT_EVENT = "portfolio:highlight-project";
export const HIGHLIGHT_TECH_EVENT = "portfolio:highlight-tech";

export type HighlightProjectDetail = { slug: string };
export type HighlightTechDetail = {
  nodeId: string;
  /** Project slugs whose stack matches this system node */
  matchingSlugs: string[];
};
