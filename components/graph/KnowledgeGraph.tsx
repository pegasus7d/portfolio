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
import type { GraphData, GraphNode, NodeType } from "@/lib/graph";

// ── Visual config ──────────────────────────────────────────────

const NODE_COLORS: Record<NodeType, string> = {
  project: "#3b82f6",
  blog: "#a78bfa",
  skill: "#6b7280",
};

const NODE_SIZES: Record<NodeType, number> = {
  project: 7,
  blog: 5,
  skill: 3.5,
};

const LINK_COLOR = "rgba(59, 130, 246, 0.08)";
const LINK_HIGHLIGHT_COLOR = "rgba(59, 130, 246, 0.4)";
const GLOW_ALPHA = 0.25;

// ── Types for the force graph internal representation ──────────

interface FGNode {
  id: string;
  label: string;
  type: NodeType;
  url?: string;
  x?: number;
  y?: number;
}

interface FGLink {
  source: string | FGNode;
  target: string | FGNode;
}

function nodeId(n: string | FGNode): string {
  return typeof n === "string" ? n : n.id;
}

// ── Component ──────────────────────────────────────────────────

interface KnowledgeGraphProps {
  data: GraphData;
  width: number;
  height: number;
}

export default function KnowledgeGraph({
  data,
  width,
  height,
}: KnowledgeGraphProps) {
  const fgRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const router = useRouter();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);

  // Memoize the graph data object identity so ForceGraph doesn't re-init
  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    }),
    [data]
  );

  // Set of node IDs connected to the hovered/focused node
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

  // Pause simulation when tab is hidden
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    const onVisibility = () => {
      if (document.hidden) {
        fg.pauseAnimation?.();
      } else {
        fg.resumeAnimation?.();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Cool down after initial layout
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    setTimeout(() => fg.d3Force?.("charge")?.strength(-80), 300);
  }, []);

  // ── Render callbacks ───────────────────────────────────────

  const paintNode = useCallback(
    (node: FGNode, ctx: CanvasRenderingContext2D) => {
      const size = NODE_SIZES[node.type] ?? 4;
      const color = NODE_COLORS[node.type] ?? "#6b7280";
      const isActive = !connectedIds || connectedIds.has(node.id);
      const alpha = isActive ? 1 : 0.15;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Glow
      if (isActive && (hoveredNode === node.id || focusedNode === node.id)) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size + 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = GLOW_ALPHA;
        ctx.fill();
        ctx.globalAlpha = alpha;
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Label (only for project/blog or when hovered)
      if (
        node.type !== "skill" ||
        hoveredNode === node.id ||
        focusedNode === node.id
      ) {
        ctx.font = `${node.type === "skill" ? 3 : 3.5}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = isActive ? "#ededed" : "#555555";

        const maxChars = node.type === "skill" ? 12 : 20;
        const label =
          node.label.length > maxChars
            ? node.label.slice(0, maxChars) + "..."
            : node.label;
        ctx.fillText(label, node.x!, node.y! + size + 2);
      }

      ctx.restore();
    },
    [connectedIds, hoveredNode, focusedNode]
  );

  const linkColor = useCallback(
    (link: FGLink) => {
      if (!connectedIds) return LINK_COLOR;
      const src = nodeId(link.source);
      const tgt = nodeId(link.target);
      return connectedIds.has(src) && connectedIds.has(tgt)
        ? LINK_HIGHLIGHT_COLOR
        : "rgba(59, 130, 246, 0.03)";
    },
    [connectedIds]
  );

  const onNodeHover = useCallback((node: FGNode | null) => {
    setHoveredNode(node?.id ?? null);
    document.body.style.cursor = node?.url ? "pointer" : "default";
  }, []);

  const onNodeClick = useCallback(
    (node: FGNode) => {
      if (focusedNode === node.id) {
        // Second click on focused node → navigate
        if (node.url) router.push(node.url);
        setFocusedNode(null);
      } else {
        // First click → focus and center
        setFocusedNode(node.id);
        fgRef.current?.centerAt?.(node.x, node.y, 600);
        fgRef.current?.zoom?.(2.5, 600);
      }
    },
    [focusedNode, router]
  );

  const onBackgroundClick = useCallback(() => {
    setFocusedNode(null);
    fgRef.current?.zoom?.(1, 400);
  }, []);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      width={width}
      height={height}
      backgroundColor="transparent"
      nodeCanvasObject={paintNode}
      nodePointerAreaPaint={(node: FGNode, color: string, ctx: CanvasRenderingContext2D) => {
        const size = NODE_SIZES[node.type] ?? 4;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size + 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }}
      linkColor={linkColor}
      linkWidth={0.5}
      linkDirectionalParticles={0}
      onNodeHover={onNodeHover}
      onNodeClick={onNodeClick}
      onBackgroundClick={onBackgroundClick}
      cooldownTicks={80}
      d3AlphaDecay={0.03}
      d3VelocityDecay={0.3}
      enableZoomInteraction={false}
      enablePanInteraction={false}
    />
  );
}
