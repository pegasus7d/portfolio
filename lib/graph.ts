import { getAllProjects, getAllPosts } from "./content";

export type NodeType = "project" | "blog" | "skill";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  url?: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Builds a knowledge graph from content markdown files.
 *
 * Relationships:
 *  - Project → skill nodes (from frontmatter `stack`)
 *  - Blog → skill nodes (from frontmatter `tags`, matched against known skills)
 *  - Blog → project (if a tag or slug reference matches a project slug)
 *
 * Skill nodes are deduplicated and normalized to lowercase IDs.
 */
export function buildGraphData(): GraphData {
  const projects = getAllProjects();
  const posts = getAllPosts();

  const nodeMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  const projectSlugs = new Set(projects.map((p) => p.slug));

  for (const project of projects) {
    const nodeId = `project:${project.slug}`;
    nodeMap.set(nodeId, {
      id: nodeId,
      label: project.title,
      type: "project",
      url: `/projects/${project.slug}`,
    });

    for (const tech of project.stack) {
      const skillId = `skill:${tech.toLowerCase()}`;
      if (!nodeMap.has(skillId)) {
        nodeMap.set(skillId, {
          id: skillId,
          label: tech,
          type: "skill",
        });
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
    });

    for (const tag of post.tags) {
      const tagLower = tag.toLowerCase();

      // If tag matches a project slug, link blog → project directly
      if (projectSlugs.has(tagLower)) {
        links.push({ source: nodeId, target: `project:${tagLower}` });
        continue;
      }

      // Otherwise treat as skill node
      const skillId = `skill:${tagLower}`;
      if (!nodeMap.has(skillId)) {
        nodeMap.set(skillId, {
          id: skillId,
          label: tag,
          type: "skill",
        });
      }
      links.push({ source: nodeId, target: skillId });
    }
  }

  // Connect projects that share skills (shared stack items)
  const skillToProjects = new Map<string, string[]>();
  for (const link of links) {
    const src = typeof link.source === "string" ? link.source : "";
    const tgt = typeof link.target === "string" ? link.target : "";
    if (src.startsWith("project:") && tgt.startsWith("skill:")) {
      const arr = skillToProjects.get(tgt) ?? [];
      arr.push(src);
      skillToProjects.set(tgt, arr);
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links,
  };
}
