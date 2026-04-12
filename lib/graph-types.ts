export type NodeType = "project" | "blog" | "skill" | "role";

export type BadgeKind = "production" | "scale" | "analytics";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  url?: string;
  summary?: string;
  impact?: string;
  period?: string;
  techs?: string[];
  badges?: BadgeKind[];
  /** Contextual label shown in tooltip/panel (e.g. "During IIT Kharagpur") */
  context?: string;
  /** Path to a logo image (only for role/company nodes) */
  logo?: string;
  /** 0-based order within the story path (undefined = not on path) */
  storyOrder?: number;
  /** Organization / school name (detail panel) */
  company?: string;
  /** Role or degree title, shown in accent color in the panel */
  jobTitle?: string;
  /** Short bullet lines for the detail panel */
  highlights?: string[];
}

export type LinkKind = "parallel" | "progression" | "default";

export interface GraphLink {
  source: string;
  target: string;
  /** Subtle label rendered on the edge (e.g. "During degree") */
  label?: string;
  /** Visual treatment: parallel (dashed), progression (solid bold), default */
  kind?: LinkKind;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/** All node IDs on the guided story path */
export const STORY_NODE_IDS = new Set([
  "role:iit",
  "role:onelot",
  "role:ittiam",
  "role:cimba",
]);

/**
 * Directed story edges — represents the actual career graph:
 *   IIT ──┬── OneLot ──┐
 *         └── Ittiam ──┴── Cimba
 */
export const STORY_EDGES: [string, string][] = [
  ["role:iit", "role:onelot"],
  ["role:iit", "role:ittiam"],
  ["role:onelot", "role:cimba"],
  ["role:ittiam", "role:cimba"],
];

/** Default narrative shown before any node is selected. */
export const DEFAULT_NARRATIVE = {
  title: "Career Progression",
  subtitle: "From IIT → Internships → Production Systems",
  body: "Backend-focused engineer building analytics platforms, agentic runtimes, and infrastructure. Click any node to explore.",
  /** Uppercase eyebrow in the panel */
  eyebrow: "FROM IIT → INTERNSHIPS → PRODUCTION SYSTEMS",
};
