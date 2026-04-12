import { getAllProjects, getAllPosts } from "./content";
import { STORY_NODE_IDS, STORY_EDGES } from "./graph-types";
import type { GraphNode, GraphLink, GraphData, BadgeKind } from "./graph-types";

export type { NodeType, GraphNode, GraphLink, GraphData, BadgeKind, LinkKind } from "./graph-types";
export { STORY_NODE_IDS, STORY_EDGES, DEFAULT_NARRATIVE } from "./graph-types";

// ── Badge assignment rules ──────────────────────────────────────

const BADGE_RULES: Record<string, BadgeKind[]> = {
  "role:cimba":               ["production", "analytics"],
  "role:ittiam":              ["scale"],
  "project:usage-insights":   ["production", "analytics"],
  "project:intentflow":       ["production"],
  "project:distributed-encode": ["scale"],
};

function assignMeta(node: GraphNode): GraphNode {
  const badges = BADGE_RULES[node.id];
  return {
    ...node,
    ...(badges ? { badges } : {}),
    ...(STORY_NODE_IDS.has(node.id) ? { storyOrder: STORY_ORDER[node.id] ?? 99 } : {}),
  };
}

const STORY_ORDER: Record<string, number> = {
  "role:iit": 0,
  "role:onelot": 1,
  "role:ittiam": 1,
  "role:cimba": 2,
};

// ── Base knowledge graph ────────────────────────────────────────

export function buildGraphData(): GraphData {
  const projects = getAllProjects();
  const posts = getAllPosts();

  const nodeMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const projectSlugs = new Set(projects.map((p) => p.slug));

  for (const project of projects) {
    const nodeId = `project:${project.slug}`;
    nodeMap.set(nodeId, assignMeta({
      id: nodeId,
      label: project.title,
      type: "project",
      url: `/projects/${project.slug}`,
      summary: project.summary,
      techs: project.stack,
    }));

    for (const tech of project.stack) {
      const skillId = `skill:${tech.toLowerCase()}`;
      if (!nodeMap.has(skillId)) {
        nodeMap.set(skillId, { id: skillId, label: tech, type: "skill" });
      }
      links.push({ source: nodeId, target: skillId });
    }
  }

  for (const post of posts) {
    const nodeId = `blog:${post.slug}`;
    nodeMap.set(nodeId, {
      id: nodeId,
      label: post.title,
      type: "blog",
      url: `/blog/${post.slug}`,
      summary: post.summary,
      techs: post.tags,
    });

    for (const tag of post.tags) {
      const tagLower = tag.toLowerCase();
      if (projectSlugs.has(tagLower)) {
        links.push({ source: nodeId, target: `project:${tagLower}` });
        continue;
      }
      const skillId = `skill:${tagLower}`;
      if (!nodeMap.has(skillId)) {
        nodeMap.set(skillId, { id: skillId, label: tag, type: "skill" });
      }
      links.push({ source: nodeId, target: skillId });
    }
  }

  return { nodes: Array.from(nodeMap.values()), links };
}

// ── Role data ───────────────────────────────────────────────────

interface RoleEntry {
  id: string;
  label: string;
  company: string;
  period: string;
  summary: string;
  impact: string;
  skills: string[];
  projects: string[];
  context?: string;
  logo?: string;
}

const IIT_NODE: GraphNode = {
  id: "role:iit",
  label: "IIT Kharagpur",
  type: "role",
  period: "2021 — 2025",
  summary: "B.Sc. (Hons.) Physics — built engineering skills through internships, open-source, and coursework in systems and algorithms.",
  impact: "Foundation in physics-driven problem solving and systems thinking.",
  techs: ["algorithms", "systems", "physics"],
  logo: "/logos/iitkgp-logo.jpg",
  storyOrder: 0,
};

const ROLES: RoleEntry[] = [
  {
    id: "role:cimba",
    label: "SWE @ Cimba.ai",
    company: "Cimba.ai",
    period: "May 2025 — Present",
    summary:
      "Led Usage Insights platform, shipped agentic runtimes, MCP OAuth, Redis caching, and re-architected LLM test infrastructure.",
    impact: "Built production analytics serving all agent metrics; 40% faster test cycles.",
    skills: ["java", "postgresql", "redis", "react", "mcp", "llm apis"],
    projects: ["usage-insights", "intentflow"],
    logo: "/logos/cimba-logo.png",
  },
  {
    id: "role:ittiam",
    label: "SWE Intern @ Ittiam",
    company: "Ittiam Systems",
    period: "Jun 2024 — Jul 2024",
    summary:
      "Built Kubernetes dev stack, distributed encode pipeline with KEDA autoscaling, and fixed A/V sync in video pipelines.",
    impact: "Autoscaling pipeline reduced idle compute by ~60%.",
    skills: ["kubernetes", "docker", "redis", "ffmpeg", "keda"],
    projects: ["distributed-encode"],
    context: "During IIT Kharagpur",
    logo: "/logos/ittiam-logo.png",
  },
  {
    id: "role:onelot",
    label: "SWE Intern @ OneLot",
    company: "OneLot",
    period: "Dec 2023 — Apr 2024",
    summary:
      "Shipped Next.js server/client refactors, built forms and custom hooks, integrated Slack for team workflows.",
    impact: "Refactored core pages to SSR; shipped production forms end-to-end.",
    skills: ["next.js", "react", "node"],
    projects: [],
    context: "During IIT Kharagpur",
    logo: "/logos/onelot-logo.png",
  },
];

function buildRoleNode(role: RoleEntry): GraphNode {
  return assignMeta({
    id: role.id,
    label: role.label,
    type: "role",
    summary: role.summary,
    impact: role.impact,
    period: role.period,
    techs: role.skills,
    context: role.context,
    logo: role.logo,
  });
}

/**
 * Adds story-edge links with labels and visual kinds.
 *   IIT ─ ─┬─ ─ OneLot ──┐
 *           └─ ─ Ittiam ──┴──▶ Cimba
 */
function addStoryEdges(links: GraphLink[]) {
  for (const [src, tgt] of STORY_EDGES) {
    const isFromIIT = src === "role:iit";
    links.push({
      source: src,
      target: tgt,
      kind: isFromIIT ? "parallel" : "progression",
      ...(isFromIIT ? { label: "During degree" } : {}),
    });
  }
}

// ── Overview graph (curated, ~10 nodes) ─────────────────────────

export function buildOverviewGraph(): GraphData {
  const nodeMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const allProjects = getAllProjects();
  const projectMap = new Map(allProjects.map((p) => [p.slug, p]));

  nodeMap.set(IIT_NODE.id, assignMeta(IIT_NODE));

  for (const role of ROLES) {
    nodeMap.set(role.id, buildRoleNode(role));

    for (const projSlug of role.projects) {
      const projId = `project:${projSlug}`;
      const meta = projectMap.get(projSlug);
      if (!nodeMap.has(projId) && meta) {
        nodeMap.set(projId, assignMeta({
          id: projId,
          label: meta.title,
          type: "project",
          url: `/projects/${projSlug}`,
          summary: meta.summary,
          techs: meta.stack,
        }));
      }
      if (nodeMap.has(projId)) {
        links.push({ source: role.id, target: projId });
      }
    }

    for (const skill of role.skills.slice(0, 3)) {
      const skillId = `skill:${skill}`;
      if (!nodeMap.has(skillId)) {
        nodeMap.set(skillId, { id: skillId, label: skill, type: "skill" });
      }
      links.push({ source: role.id, target: skillId });
    }
  }

  addStoryEdges(links);

  return { nodes: Array.from(nodeMap.values()), links };
}

// ── Full evolution graph ────────────────────────────────────────

export function buildEvolutionGraph(): GraphData {
  const base = buildGraphData();
  const nodeMap = new Map(base.nodes.map((n) => [n.id, n]));
  const links = [...base.links];
  const allProjects = getAllProjects();
  const projectMap = new Map(allProjects.map((p) => [p.slug, p]));

  nodeMap.set(IIT_NODE.id, assignMeta(IIT_NODE));

  for (const role of ROLES) {
    nodeMap.set(role.id, buildRoleNode(role));

    for (const skill of role.skills) {
      const skillId = `skill:${skill}`;
      if (!nodeMap.has(skillId)) {
        nodeMap.set(skillId, { id: skillId, label: skill, type: "skill" });
      }
      links.push({ source: role.id, target: skillId });
    }

    for (const proj of role.projects) {
      const projId = `project:${proj}`;
      const meta = projectMap.get(proj);
      if (!nodeMap.has(projId) && meta) {
        nodeMap.set(projId, assignMeta({
          id: projId,
          label: meta.title,
          type: "project",
          url: `/projects/${proj}`,
          summary: meta.summary,
          techs: meta.stack,
        }));
      }
      if (nodeMap.has(projId)) {
        links.push({ source: role.id, target: projId });
      }
    }
  }

  addStoryEdges(links);

  return { nodes: Array.from(nodeMap.values()), links };
}
