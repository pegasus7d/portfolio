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
import type { GraphData, NodeType } from "@/lib/graph";

// ── Visual config ──────────────────────────────────────────────

const NODE_COLORS: Record<NodeType, string> = {
  project: "#3b82f6",
  blog: "#a78bfa",
  skill: "#6b7280",
};

const NODE_GLOW_COLORS: Record<NodeType, string> = {
  project: "rgba(59, 130, 246, 0.5)",
  blog: "rgba(167, 139, 250, 0.45)",
  skill: "rgba(107, 114, 128, 0.3)",
};

const NODE_SIZES: Record<NodeType, number> = {
  project: 7,
  blog: 5,
  skill: 3.5,
};

const LINK_COLOR = "rgba(59, 130, 246, 0.06)";
const LINK_HIGHLIGHT_COLOR = "rgba(59, 130, 246, 0.35)";

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
  const frameRef = useRef(0);

  // Tick counter for pulse animation
  useEffect(() => {
    let raf: number;
    const tick = () => {
      frameRef.current += 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    }),
    [data]
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
      const glowColor = NODE_GLOW_COLORS[node.type] ?? "rgba(107,114,128,0.3)";
      const isActive = !connectedIds || connectedIds.has(node.id);
      const isHighlighted = hoveredNode === node.id || focusedNode === node.id;
      const alpha = isActive ? 1 : 0.12;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Outer glow ring (always on for active, brighter for highlighted)
      if (isActive) {
        const pulse = isHighlighted
          ? 0.4 + 0.2 * Math.sin(frameRef.current * 0.04)
          : 0.15;
        const glowSize = isHighlighted ? size + 8 : size + 4;

        ctx.beginPath();
        ctx.arc(node.x!, node.y!, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = pulse * alpha;
        ctx.fill();
        ctx.globalAlpha = alpha;
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Inner highlight dot for focused/hovered
      if (isHighlighted) {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fill();
      }

      // Label
      if (
        node.type !== "skill" ||
        hoveredNode === node.id ||
        focusedNode === node.id
      ) {
        ctx.font = `${node.type === "skill" ? 3 : 3.5}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = isActive ? "#ededed" : "#444444";

        const maxChars = node.type === "skill" ? 12 : 20;
        const label =
          node.label.length > maxChars
            ? node.label.slice(0, maxChars) + "..."
            : node.label;
        ctx.fillText(label, node.x!, node.y! + size + 2.5);
      }

      ctx.restore();
    },
    [connectedIds, hoveredNode, focusedNode]
  );

  const paintLink = useCallback(
    (link: FGLink, ctx: CanvasRenderingContext2D) => {
      const src = typeof link.source === "string" ? null : link.source;
      const tgt = typeof link.target === "string" ? null : link.target;
      if (!src?.x || !tgt?.x) return;

      const srcId = nodeId(link.source);
      const tgtId = nodeId(link.target);
      const isHighlighted =
        connectedIds && connectedIds.has(srcId) && connectedIds.has(tgtId);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(src.x, src.y!);
      ctx.lineTo(tgt.x, tgt.y!);
      ctx.strokeStyle = isHighlighted ? LINK_HIGHLIGHT_COLOR : (connectedIds ? "rgba(59,130,246,0.02)" : LINK_COLOR);
      ctx.lineWidth = isHighlighted ? 1 : 0.4;

      if (isHighlighted) {
        ctx.shadowColor = "rgba(59,130,246,0.3)";
        ctx.shadowBlur = 6;
      }

      ctx.stroke();
      ctx.restore();
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
        if (node.url) router.push(node.url);
        setFocusedNode(null);
      } else {
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
        ctx.arc(node.x!, node.y!, size + 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }}
      linkCanvasObject={paintLink}
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
