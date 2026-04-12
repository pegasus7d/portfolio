"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import ForceGraph2D from "react-force-graph-2d";
import type {
  GraphData,
  GraphNode,
  NodeType,
  BadgeKind,
  LinkKind,
} from "@/lib/graph-types";

// ── Visual config ──────────────────────────────────────────────

const NODE_COLORS: Record<NodeType, string> = {
  project: "#3b82f6",
  blog: "#a78bfa",
  skill: "#6b7280",
  role: "#22d3ee",
};

const NODE_GLOW_COLORS: Record<NodeType, string> = {
  project: "rgba(59, 130, 246, 0.5)",
  blog: "rgba(167, 139, 250, 0.45)",
  skill: "rgba(107, 114, 128, 0.3)",
  role: "rgba(34, 211, 238, 0.5)",
};

const NODE_SIZES: Record<NodeType, number> = {
  project: 7,
  blog: 5,
  skill: 3.5,
  role: 9,
};

const ROOT_NODE_ID = "role:iit";
const ROOT_SIZE = 13;
const ROOT_GLOW_COLOR = "rgba(34, 211, 238, 0.65)";

const LINK_COLOR = "rgba(59, 130, 246, 0.06)";
const LINK_HIGHLIGHT_COLOR = "rgba(59, 130, 246, 0.35)";
const STORY_LINK_COLOR = "rgba(34, 211, 238, 0.3)";
const PROGRESSION_LINK_COLOR = "rgba(34, 211, 238, 0.45)";

const BADGE_ICONS: Record<BadgeKind, string> = {
  production: "⚙",
  scale: "↗",
  analytics: "◆",
};

const BADGE_COLORS: Record<BadgeKind, string> = {
  production: "#22c55e",
  scale: "#f59e0b",
  analytics: "#3b82f6",
};

const NODE_STAGGER_MS = 120;

// ── X-position targets for left→right flow (fraction of width) ──

const LAYER_X: Record<number, number> = {
  0: 0.12,  // IIT (root)
  1: 0.40,  // Internships
  2: 0.68,  // Full-time
};

// ── Types ──────────────────────────────────────────────────────

interface FGNode {
  id: string;
  label: string;
  type: NodeType;
  url?: string;
  summary?: string;
  impact?: string;
  period?: string;
  context?: string;
  techs?: string[];
  badges?: BadgeKind[];
  logo?: string;
  storyOrder?: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface FGLink {
  source: string | FGNode;
  target: string | FGNode;
  label?: string;
  kind?: LinkKind;
}

function fgNodeId(n: string | FGNode): string {
  return typeof n === "string" ? n : n.id;
}

// ── Logo preloader ─────────────────────────────────────────────

function useLogoImages(nodes: GraphNode[]): Map<string, HTMLImageElement> {
  const cacheRef = useRef(new Map<string, HTMLImageElement>());
  const [, bump] = useState(0);

  useEffect(() => {
    let changed = false;
    for (const node of nodes) {
      if (!node.logo || cacheRef.current.has(node.id)) continue;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = node.logo;
      img.onload = () => {
        cacheRef.current.set(node.id, img);
        changed = true;
        bump((v) => v + 1);
      };
    }
    if (changed) bump((v) => v + 1);
  }, [nodes]);

  return cacheRef.current;
}

// ── Component ──────────────────────────────────────────────────

interface KnowledgeGraphProps {
  data: GraphData;
  width: number;
  height: number;
  storyNodeIds?: Set<string>;
  storyEdges?: [string, string][];
  onNodeSelect?: (node: GraphNode | null) => void;
  onNodeHoverChange?: (node: GraphNode | null) => void;
}

export default function KnowledgeGraph({
  data,
  width,
  height,
  storyNodeIds,
  storyEdges,
  onNodeSelect,
  onNodeHoverChange,
}: KnowledgeGraphProps) {
  const fgRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const router = useRouter();
  const logoImages = useLogoImages(data.nodes);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const frameRef = useRef(0);
  const revealStartRef = useRef(0);
  const [revealReady, setRevealReady] = useState(false);

  const nodeCount = data.nodes.length;

  const storyLinkSet = useMemo(() => {
    if (!storyEdges || storyEdges.length === 0) return null;
    const set = new Set<string>();
    for (const [s, t] of storyEdges) {
      set.add(`${s}__${t}`);
      set.add(`${t}__${s}`);
    }
    return set;
  }, [storyEdges]);

  const revealOrder = useMemo(() => {
    const order = new Map<string, number>();
    const sorted = [...data.nodes].sort((a, b) => {
      if (a.storyOrder !== undefined && b.storyOrder !== undefined)
        return a.storyOrder - b.storyOrder;
      if (a.storyOrder !== undefined) return -1;
      if (b.storyOrder !== undefined) return 1;
      const prio: Record<NodeType, number> = { role: 0, project: 1, blog: 2, skill: 3 };
      return (prio[a.type] ?? 4) - (prio[b.type] ?? 4);
    });
    sorted.forEach((n, i) => order.set(n.id, i));
    return order;
  }, [data.nodes]);

  useEffect(() => {
    let raf: number;
    const tick = () => { frameRef.current += 1; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      revealStartRef.current = performance.now();
      setRevealReady(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [data]);

  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    }),
    [data],
  );

  const connectedIds = useMemo(() => {
    const active = focusedNode ?? hoveredNode;
    if (!active) return null;
    const set = new Set<string>();
    set.add(active);
    for (const link of data.links) {
      const src = typeof link.source === "string" ? link.source : link.source;
      const tgt = typeof link.target === "string" ? link.target : link.target;
      if (src === active) set.add(tgt);
      if (tgt === active) set.add(src);
    }
    return set;
  }, [hoveredNode, focusedNode, data.links]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const onVis = () => { if (document.hidden) fg.pauseAnimation?.(); else fg.resumeAnimation?.(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Configure forces: stronger repulsion for spacing + X-force for left→right
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    const applyForces = () => {
      fg.d3Force?.("charge")?.strength(-160).distanceMax(250);
      fg.d3Force?.("link")?.distance(60);

      // Horizontal layering force: pull story nodes toward their target X
      if (storyNodeIds) {
        const d3 = (window as any).d3; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (d3?.forceX) {
          fg.d3Force(
            "layerX",
            d3.forceX((node: FGNode) => {
              if (node.storyOrder !== undefined && LAYER_X[node.storyOrder] !== undefined) {
                return LAYER_X[node.storyOrder] * width;
              }
              return width * 0.85;
            }).strength((node: FGNode) => {
              return node.storyOrder !== undefined ? 0.3 : 0.05;
            }),
          );
          fg.d3Force(
            "layerY",
            d3.forceY(height / 2).strength(0.04),
          );
        }
      }

      fg.d3ReheatSimulation?.();
    };

    setTimeout(applyForces, 200);
  }, [width, height, storyNodeIds]);

  // ── Reveal alpha ───────────────────────────────────────────

  const getRevealAlpha = useCallback(
    (nid: string): number => {
      if (!revealReady) return 0;
      const elapsed = performance.now() - revealStartRef.current;
      const order = revealOrder.get(nid) ?? nodeCount;
      return Math.max(0, Math.min(1, (elapsed - order * NODE_STAGGER_MS) / 500));
    },
    [revealReady, revealOrder, nodeCount],
  );

  const getNodeAlpha = useCallback(
    (nid: string, ntype: NodeType): number => {
      const reveal = getRevealAlpha(nid);
      if (reveal < 0.01) return 0;
      let base: number;
      if (connectedIds) {
        base = connectedIds.has(nid) ? 1 : 0.08;
      } else if (storyNodeIds) {
        if (storyNodeIds.has(nid)) base = 1;
        else if (ntype === "project") base = 0.65;
        else base = 0.18;
      } else {
        base = 1;
      }
      return base * reveal;
    },
    [connectedIds, storyNodeIds, getRevealAlpha],
  );

  // ── Paint node ─────────────────────────────────────────────

  const paintNode = useCallback(
    (node: FGNode, ctx: CanvasRenderingContext2D) => {
      const alpha = getNodeAlpha(node.id, node.type);
      if (alpha < 0.01) return;

      const isRoot = node.id === ROOT_NODE_ID;
      const isOnStory = storyNodeIds?.has(node.id);
      const baseSize = isRoot ? ROOT_SIZE : (NODE_SIZES[node.type] ?? 4);
      const size = isOnStory && !isRoot ? baseSize + 2 : baseSize;
      const color = NODE_COLORS[node.type] ?? "#6b7280";
      const glowColor = isRoot ? ROOT_GLOW_COLOR : (NODE_GLOW_COLORS[node.type] ?? "rgba(107,114,128,0.3)");
      const isHighlighted = hoveredNode === node.id || focusedNode === node.id;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Outer glow — root gets a double-layer glow
      if (alpha > 0.15) {
        if (isRoot) {
          // Wide ambient glow
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, size + 16, 0, Math.PI * 2);
          ctx.fillStyle = glowColor;
          ctx.globalAlpha = (0.08 + 0.04 * Math.sin(frameRef.current * 0.02)) * alpha;
          ctx.fill();
          ctx.globalAlpha = alpha;
        }

        const pulse = isHighlighted
          ? 0.45 + 0.2 * Math.sin(frameRef.current * 0.04)
          : isRoot
            ? 0.3 + 0.1 * Math.sin(frameRef.current * 0.02)
            : isOnStory
              ? 0.22 + 0.08 * Math.sin(frameRef.current * 0.025)
              : 0.1;
        const glowSize = isHighlighted ? size + 8 : isRoot ? size + 10 : isOnStory ? size + 6 : size + 3;

        ctx.beginPath();
        ctx.arc(node.x!, node.y!, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = pulse * alpha;
        ctx.fill();
        ctx.globalAlpha = alpha;
      }

      // Core circle — root gets a subtle ring
      if (isRoot) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size + 1, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      const logoImg = node.logo ? logoImages.get(node.id) : undefined;

      // Fill circle (darker background when logo is present)
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size, 0, Math.PI * 2);
      ctx.fillStyle = logoImg ? "rgba(10, 12, 18, 0.9)" : color;
      ctx.fill();

      // Draw logo clipped to circle ("cover" fit)
      if (logoImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size * 0.82, 0, Math.PI * 2);
        ctx.clip();
        ctx.filter = "grayscale(0.55) brightness(1.5)";

        const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
        const clipDiam = size * 1.64;
        let drawW: number, drawH: number;
        if (aspect > 1) {
          drawH = clipDiam;
          drawW = clipDiam * aspect;
        } else {
          drawW = clipDiam;
          drawH = clipDiam / aspect;
        }
        ctx.drawImage(
          logoImg,
          node.x! - drawW / 2,
          node.y! - drawH / 2,
          drawW,
          drawH,
        );
        ctx.filter = "none";
        ctx.restore();

        // Colored ring around logo node
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = isRoot ? 1.4 : 0.9;
        ctx.globalAlpha = alpha * 0.75;
        ctx.stroke();
        ctx.globalAlpha = alpha;
      }

      if (isHighlighted && !logoImg) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fill();
      }

      // Impact badges
      if (node.badges && node.badges.length > 0 && alpha > 0.4) {
        const badgeR = 2.2;
        const startAngle = -Math.PI / 2;
        node.badges.forEach((badge, i) => {
          const angle = startAngle + (i * Math.PI) / 3;
          const bx = node.x! + (size + badgeR + 2.5) * Math.cos(angle);
          const by = node.y! + (size + badgeR + 2.5) * Math.sin(angle);
          ctx.beginPath();
          ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
          ctx.fillStyle = BADGE_COLORS[badge];
          ctx.globalAlpha = alpha * 0.85;
          ctx.fill();
          ctx.globalAlpha = alpha;
          ctx.font = "bold 2.5px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#000";
          ctx.fillText(BADGE_ICONS[badge], bx, by + 0.3);
        });
      }

      // Label
      const showLabel = node.type !== "skill" || isHighlighted || isOnStory;
      if (showLabel && alpha > 0.12) {
        const fontSize = isRoot ? 4.5 : isOnStory && node.type === "role" ? 4 : node.type === "skill" ? 3 : 3.5;
        ctx.font = `${isHighlighted || isOnStory || isRoot ? "600 " : ""}${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = alpha > 0.5 ? "#ededed" : "#555555";
        const maxChars = node.type === "skill" ? 12 : 22;
        const label = node.label.length > maxChars ? node.label.slice(0, maxChars) + "…" : node.label;
        ctx.fillText(label, node.x!, node.y! + size + 3);
      }

      ctx.restore();
    },
    [connectedIds, hoveredNode, focusedNode, storyNodeIds, getNodeAlpha, logoImages],
  );

  // ── Paint link ─────────────────────────────────────────────

  const paintLink = useCallback(
    (link: FGLink, ctx: CanvasRenderingContext2D) => {
      const src = typeof link.source === "string" ? null : link.source;
      const tgt = typeof link.target === "string" ? null : link.target;
      if (!src?.x || !tgt?.x) return;

      const srcId = fgNodeId(link.source);
      const tgtId = fgNodeId(link.target);
      const srcAlpha = getRevealAlpha(srcId);
      const tgtAlpha = getRevealAlpha(tgtId);
      const linkAlpha = Math.min(srcAlpha, tgtAlpha);
      if (linkAlpha < 0.01) return;

      const isHighlighted =
        connectedIds && connectedIds.has(srcId) && connectedIds.has(tgtId);
      const isStoryLink = storyLinkSet?.has(`${srcId}__${tgtId}`);
      const kind: LinkKind = (link.kind as LinkKind) ?? "default";

      ctx.save();
      ctx.globalAlpha = linkAlpha;

      // Draw the line
      if (kind === "parallel" && isStoryLink) {
        // Dashed line for parallel (IIT → Intern)
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = isHighlighted ? LINK_HIGHLIGHT_COLOR : STORY_LINK_COLOR;
        ctx.lineWidth = isHighlighted ? 1.2 : 0.9;
        if (isHighlighted) {
          ctx.shadowColor = "rgba(34,211,238,0.2)";
          ctx.shadowBlur = 4;
        }
      } else if (kind === "progression" && isStoryLink) {
        // Solid bold for progression (Intern → Full-time)
        ctx.setLineDash([]);
        ctx.strokeStyle = isHighlighted ? LINK_HIGHLIGHT_COLOR : PROGRESSION_LINK_COLOR;
        ctx.lineWidth = isHighlighted ? 1.5 : 1.4;
        ctx.shadowColor = "rgba(34,211,238,0.25)";
        ctx.shadowBlur = 5;
      } else if (isHighlighted) {
        ctx.setLineDash([]);
        ctx.strokeStyle = LINK_HIGHLIGHT_COLOR;
        ctx.lineWidth = 1;
        ctx.shadowColor = "rgba(59,130,246,0.3)";
        ctx.shadowBlur = 6;
      } else if (isStoryLink) {
        ctx.setLineDash([]);
        ctx.strokeStyle = STORY_LINK_COLOR;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = "rgba(34,211,238,0.15)";
        ctx.shadowBlur = 3;
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = connectedIds ? "rgba(59,130,246,0.02)" : LINK_COLOR;
        ctx.lineWidth = 0.4;
      }

      ctx.beginPath();
      ctx.moveTo(src.x, src.y!);
      ctx.lineTo(tgt.x, tgt.y!);
      ctx.stroke();
      ctx.setLineDash([]);

      // Traveling dot on story links
      if (isStoryLink && linkAlpha > 0.5) {
        const speed = kind === "progression" ? 2500 : 3500;
        const t = (performance.now() % speed) / speed;
        const dx = tgt.x - src.x;
        const dy = tgt.y! - src.y!;
        ctx.beginPath();
        ctx.arc(src.x + dx * t, src.y! + dy * t, kind === "progression" ? 1.4 : 1, 0, Math.PI * 2);
        ctx.fillStyle = kind === "progression" ? "rgba(34, 211, 238, 0.85)" : "rgba(34, 211, 238, 0.5)";
        ctx.shadowColor = "rgba(34,211,238,0.5)";
        ctx.shadowBlur = 4;
        ctx.fill();
      }

      // Edge label
      if (link.label && (isStoryLink || isHighlighted) && linkAlpha > 0.4) {
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y! + tgt.y!) / 2;
        const angle = Math.atan2(tgt.y! - src.y!, tgt.x - src.x);

        ctx.save();
        ctx.shadowBlur = 0;
        ctx.translate(mx, my);
        const readable = angle > Math.PI / 2 || angle < -Math.PI / 2
          ? angle + Math.PI
          : angle;
        ctx.rotate(readable);

        ctx.font = "italic 2.5px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "rgba(34, 211, 238, 0.45)";
        ctx.fillText(link.label, 0, -2.5);

        ctx.restore();
      }

      ctx.restore();
    },
    [connectedIds, storyLinkSet, getRevealAlpha],
  );

  // ── Interactions ───────────────────────────────────────────

  const onNodeHover = useCallback(
    (node: FGNode | null) => {
      setHoveredNode(node?.id ?? null);
      document.body.style.cursor = node ? "pointer" : "default";
      onNodeHoverChange?.(node ? (node as GraphNode) : null);
    },
    [onNodeHoverChange],
  );

  const onNodeClick = useCallback(
    (node: FGNode) => {
      if (focusedNode === node.id) {
        if (node.url) router.push(node.url);
        setFocusedNode(null);
        onNodeSelect?.(null);
      } else {
        setFocusedNode(node.id);
        fgRef.current?.centerAt?.(node.x, node.y, 600);
        fgRef.current?.zoom?.(2, 600);
        onNodeSelect?.(node as GraphNode);
      }
    },
    [focusedNode, router, onNodeSelect],
  );

  const onBackgroundClick = useCallback(() => {
    setFocusedNode(null);
    fgRef.current?.zoom?.(1, 400);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      width={width}
      height={height}
      backgroundColor="transparent"
      nodeCanvasObject={paintNode}
      nodePointerAreaPaint={(node: FGNode, color: string, ctx: CanvasRenderingContext2D) => {
        const size = node.id === ROOT_NODE_ID ? ROOT_SIZE : (NODE_SIZES[node.type] ?? 4);
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size + 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }}
      linkCanvasObject={paintLink}
      onNodeHover={onNodeHover}
      onNodeClick={onNodeClick}
      onBackgroundClick={onBackgroundClick}
      cooldownTicks={120}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      enableZoomInteraction={false}
      enablePanInteraction={false}
    />
  );
}
