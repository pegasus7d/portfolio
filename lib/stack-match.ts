import type { SystemNode } from "@/lib/system-graph";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Map system graph ids to substrings that appear in project frontmatter `stack`. */
const ID_ALIASES: Record<string, string[]> = {
  nextdotjs: ["next", "nextjs"],
  nodejs: ["node"],
  apacheecharts: ["echart"],
  postgresql: ["postgres"],
  kubernetes: ["k8s"],
  microsoftazure: ["azure"],
  azuredevops: ["azure", "devops"],
  googlegemini: ["gemini"],
  chatgpt: ["openai", "gpt"],
  playwright: ["playwright"],
  spring: ["spring"],
};

/**
 * Whether a system-map node corresponds to a tech listed on a project card.
 */
export function systemNodeMatchesStack(
  node: SystemNode,
  stack: string[],
): boolean {
  const labelN = norm(node.label);
  const idN = norm(node.id);

  for (const raw of stack) {
    const tn = norm(raw);
    if (!tn) continue;
    if (tn === labelN || tn.includes(labelN) || labelN.includes(tn)) {
      return true;
    }
    if (tn === idN || idN.includes(tn) || tn.includes(idN)) {
      return true;
    }
  }

  const aliases = ID_ALIASES[node.id];
  if (aliases) {
    for (const raw of stack) {
      const lower = raw.toLowerCase();
      if (aliases.some((a) => lower.includes(a))) return true;
    }
  }

  return false;
}
