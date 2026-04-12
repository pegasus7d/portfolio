"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type {
  GraphData,
  GraphNode,
  NodeType,
  LinkKind,
} from "@/lib/graph-types";
import { STORY_NODE_IDS } from "@/lib/graph-types";

// ── Visual tokens ───────────────────────────────────────────────

const COLOR: Record<NodeType, string> = {
  project: "#3b82f6",
  blog: "#a78bfa",
  skill: "#475569",
  role: "#22d3ee",
};

const GLOW_FILL: Record<NodeType, string> = {
  project: "rgba(59,130,246,0.18)",
  blog: "rgba(167,139,250,0.14)",
  skill: "rgba(71,85,105,0.08)",
  role: "rgba(34,211,238,0.18)",
};

/** IIT + internships + Cimba: timeline tiles (rounded squares). All other nodes are circles. */
function isSquareCareerNode(n: GraphNode): boolean {
  return n.type === "role" && STORY_NODE_IDS.has(n.id);
}

/**
 * Half-height baseline; circles use r as radius; squares use this for box sizing.
 */
const RADIUS: Record<NodeType, number> = {
  role: 26,
  project: 16,
  blog: 12,
  skill: 8,
};

const ROOT_ID = "role:iit";
const ROOT_R = 32;

function getR(n: GraphNode): number {
  return n.id === ROOT_ID ? ROOT_R : RADIUS[n.type] ?? 8;
}

/** Rounded square (timeline tile) for the four story roles only. */
function getSquareNodeBox(n: GraphNode): {
  halfW: number;
  halfH: number;
  rx: number;
} {
  const r = getR(n);
  const isRoot = n.id === ROOT_ID;
  return {
    halfW: isRoot ? r * 1.24 : r * 1.18,
    halfH: r,
    rx: Math.min(14, r * 0.2),
  };
}

function clipIdForNode(id: string): string {
  return `cg-clip-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function straightEdgePath(
  sp: { x: number; y: number },
  tp: { x: number; y: number },
): string {
  return `M ${sp.x} ${sp.y} L ${tp.x} ${tp.y}`;
}

/** Fit entire logo inside tile (no crop). `slice` was clipping wide marks. */
const LOGO_PAR = "xMidYMid meet" as const;

/** Inner padding for logo area inside square tiles */
function squareLogoPad(halfW: number, halfH: number): number {
  return Math.max(6, Math.min(halfW, halfH) * 0.12);
}

// ── Fixed layout ────────────────────────────────────────────────

/** Wider horizontal spread for large / full-width graph canvases */
const STORY_POS: Record<string, [number, number]> = {
  "role:iit":    [0.085, 0.50],
  "role:ittiam": [0.40, 0.26],
  "role:onelot": [0.40, 0.74],
  /** Nearer the graph/panel seam so edges read as meeting the glowing spine */
  "role:cimba":  [0.88, 0.50],
};

function computeLayout(
  data: GraphData,
  w: number,
  h: number,
): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  if (w === 0 || h === 0) return pos;

  /** Shrink radial offsets on narrow canvases; keeps satellites inside the viewBox. */
  const layoutScale = Math.min(1, Math.max(0.42, w / 520));
  const pad = Math.max(28, Math.min(44, w * 0.09));

  const storyIds = new Set(Object.keys(STORY_POS));
  for (const [id, [fx, fy]] of Object.entries(STORY_POS)) {
    let x = fx * w;
    let y = fy * h;
    if (w < 520) {
      const cx = 0.5 * w;
      x = cx + (x - cx) * (0.82 + 0.18 * (w / 520));
      y = Math.min(Math.max(y, pad + 40), h - pad - 40);
    }
    pos.set(id, { x, y });
  }

  const adj = new Map<string, Set<string>>();
  for (const n of data.nodes) adj.set(n.id, new Set());
  for (const l of data.links) {
    const s = typeof l.source === "string" ? l.source : "";
    const t = typeof l.target === "string" ? l.target : "";
    adj.get(s)?.add(t);
    adj.get(t)?.add(s);
  }

  const groups = new Map<string, GraphNode[]>();
  for (const node of data.nodes) {
    if (storyIds.has(node.id)) continue;
    const nbrs = adj.get(node.id);
    if (!nbrs) continue;
    let parent: string | null = null;
    for (const nid of nbrs) {
      if (storyIds.has(nid)) {
        parent = nid;
        break;
      }
    }
    if (parent) {
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent)!.push(node);
    }
  }

  for (const [pid, children] of groups) {
    const p = pos.get(pid)!;
    const px = p.x / w;
    const py = p.y / h;

    const projects = children.filter((n) => n.type === "project");
    const skills = children.filter((n) => n.type !== "project");

    let skAngle =
      px < 0.25
        ? Math.PI
        : px > 0.55
          ? 0
          : py < 0.5
            ? -Math.PI / 2
            : Math.PI / 2;
    const skSpread = Math.PI * 0.55;
    const skDist = (96 + skills.length * 6) * layoutScale;
    const midSkillA = skAngle;
    const probeX = p.x + skDist * Math.cos(midSkillA);
    if (probeX > w - pad) skAngle = Math.PI;
    else if (probeX < pad) skAngle = 0;

    skills.forEach((sk, i) => {
      const f = skills.length === 1 ? 0.5 : i / (skills.length - 1);
      const a = skAngle - skSpread / 2 + skSpread * f;
      pos.set(sk.id, {
        x: p.x + skDist * Math.cos(a),
        y: p.y + skDist * Math.sin(a),
      });
    });

    let prAngle = px > 0.55 ? Math.PI * 0.08 : Math.PI * 0.05;
    if (p.x > w * 0.58) prAngle = Math.PI - Math.PI * 0.1;
    const prSpread = Math.PI * 0.35;
    const prDist = 118 * layoutScale;
    projects.forEach((pr, i) => {
      const f = projects.length === 1 ? 0.5 : i / (projects.length - 1);
      const a = prAngle - prSpread / 2 + prSpread * f;
      pos.set(pr.id, {
        x: p.x + prDist * Math.cos(a),
        y: p.y + prDist * Math.sin(a),
      });
    });
  }

  let oy = h * 0.2;
  const orphanStep = 48 * layoutScale;
  for (const n of data.nodes) {
    if (!pos.has(n.id)) {
      pos.set(n.id, { x: Math.min(w * 0.88, w - pad), y: oy });
      oy += orphanStep;
    }
  }
  return pos;
}

// ── Helpers ─────────────────────────────────────────────────────

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return h >>> 0;
}

function revealOrder(nodes: GraphNode[]): Map<string, number> {
  const m = new Map<string, number>();
  const sorted = [...nodes].sort((a, b) => {
    if (a.storyOrder !== undefined && b.storyOrder !== undefined)
      return a.storyOrder - b.storyOrder;
    if (a.storyOrder !== undefined) return -1;
    if (b.storyOrder !== undefined) return 1;
    const p: Record<NodeType, number> = { role: 0, project: 1, blog: 2, skill: 3 };
    return (p[a.type] ?? 4) - (p[b.type] ?? 4);
  });
  sorted.forEach((n, i) => m.set(n.id, i));
  return m;
}

// ── Component ───────────────────────────────────────────────────

interface CareerGraphProps {
  data: GraphData;
  width: number;
  height: number;
  storyNodeIds?: Set<string>;
  storyEdges?: [string, string][];
  onNodeSelect?: (node: GraphNode | null) => void;
  onNodeHoverChange?: (node: GraphNode | null) => void;
}

export default function CareerGraph({
  data,
  width,
  height,
  storyNodeIds,
  storyEdges,
  onNodeSelect,
  onNodeHoverChange,
}: CareerGraphProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"entry" | "idle">("entry");

  const layout = useMemo(
    () => computeLayout(data, width, height),
    [data, width, height],
  );
  const order = useMemo(() => revealOrder(data.nodes), [data.nodes]);

  const storyLinkSet = useMemo(() => {
    if (!storyEdges?.length) return null;
    const s = new Set<string>();
    for (const [a, b] of storyEdges) {
      s.add(`${a}__${b}`);
      s.add(`${b}__${a}`);
    }
    return s;
  }, [storyEdges]);

  const connected = useMemo(() => {
    const active = focusedId ?? hoveredId;
    if (!active) return null;
    const s = new Set<string>([active]);
    for (const l of data.links) {
      const src = typeof l.source === "string" ? l.source : "";
      const tgt = typeof l.target === "string" ? l.target : "";
      if (src === active) s.add(tgt);
      if (tgt === active) s.add(src);
    }
    return s;
  }, [hoveredId, focusedId, data.links]);

  // Render order: skills → projects → roles (roles on top)
  const renderNodes = useMemo(() => {
    const prio: Record<NodeType, number> = { skill: 0, blog: 1, project: 2, role: 3 };
    return [...data.nodes].sort(
      (a, b) => (prio[a.type] ?? 0) - (prio[b.type] ?? 0),
    );
  }, [data.nodes]);

  // Switch from entry → idle after stagger completes
  useEffect(() => {
    const maxIdx = data.nodes.length - 1;
    const totalMs = (300 + maxIdx * 90 + 450 + 400) * 1;
    const t = setTimeout(() => setPhase("idle"), totalMs);
    return () => clearTimeout(t);
  }, [data.nodes.length]);

  // ── Interaction handlers ──────────────────────────────────

  const handleBgClick = useCallback(() => {
    setFocusedId(null);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  const handleNodeEnter = useCallback(
    (node: GraphNode) => {
      setHoveredId(node.id);
      onNodeHoverChange?.(node);
    },
    [onNodeHoverChange],
  );

  const handleNodeLeave = useCallback(() => {
    setHoveredId(null);
    onNodeHoverChange?.(null);
  }, [onNodeHoverChange]);

  const handleNodeClick = useCallback(
    (node: GraphNode, e: React.MouseEvent) => {
      e.stopPropagation();
      if (focusedId === node.id) {
        if (node.url) router.push(node.url);
        setFocusedId(null);
        onNodeSelect?.(null);
      } else {
        setFocusedId(node.id);
        onNodeSelect?.(node);
      }
    },
    [focusedId, router, onNodeSelect],
  );

  // ── Render ────────────────────────────────────────────────

  if (width <= 0 || height <= 0) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full max-h-full max-w-full touch-manipulation"
      onClick={handleBgClick}
      style={{ cursor: "default", overflow: "visible" }}
    >
      <defs>
        <filter id="desat">
          <feColorMatrix type="saturate" values="0.65" />
        </filter>
        <filter
          id="dot-glow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>

      {/* ── Edges (straight paths + soft glow) ─────────────── */}

      {data.links.map((link) => {
        const src = typeof link.source === "string" ? link.source : "";
        const tgt = typeof link.target === "string" ? link.target : "";
        const sp = layout.get(src);
        const tp = layout.get(tgt);
        if (!sp || !tp) return null;

        const isSL = storyLinkSet?.has(`${src}__${tgt}`);
        const kind: LinkKind = link.kind ?? "default";
        const isHL =
          connected && connected.has(src) && connected.has(tgt);

        const d = straightEdgePath(sp, tp);

        const sIdx = order.get(src) ?? 0;
        const tIdx = order.get(tgt) ?? 0;
        const edgeDelay = 0.3 + Math.max(sIdx, tIdx) * 0.09 + 0.5;

        const edgeOpacity = connected
          ? isHL
            ? 1
            : isSL
              ? 0.34
              : 0.04
          : isSL
            ? 1
            : 0.055;

        const stroke =
          isHL
            ? "rgba(56,189,248,0.95)"
            : kind === "progression" && isSL
              ? "rgba(34,211,238,0.72)"
              : isSL
                ? "rgba(34,211,238,0.38)"
                : "rgba(148,163,184,0.06)";

        const sw =
          kind === "progression" && isSL
            ? isHL
              ? 2.4
              : 2
            : isHL
              ? 2
              : isSL
                ? 1.6
                : 0.4;

        const isDashed = kind === "parallel" && isSL;
        const dash = isDashed ? "7 11" : undefined;
        const glowExtra = isSL ? (isHL ? 14 : 11) : 5;
        const glowOpacity =
          edgeOpacity * (isSL ? (isHL ? 0.55 : 0.4) : 0.25);

        const pathTransition = {
          pathLength: {
            delay: edgeDelay,
            duration: 0.55,
            ease: "easeOut" as const,
          },
          opacity: {
            delay: edgeDelay,
            duration: 0.35,
          },
        };

        return (
          <g key={`e-${src}-${tgt}`}>
            <motion.path
              d={d}
              stroke={stroke}
              strokeWidth={sw + glowExtra}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={dash}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: glowOpacity }}
              transition={pathTransition}
              style={{ filter: isSL ? "blur(5px)" : "blur(2px)" }}
            />
            <motion.path
              d={d}
              stroke={stroke}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={dash}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: edgeOpacity }}
              transition={pathTransition}
            />
          </g>
        );
      })}

      {/* ── Edge labels ────────────────────────────────────── */}

      {data.links
        .filter((l) => l.label)
        .map((link) => {
          const src = typeof link.source === "string" ? link.source : "";
          const tgt = typeof link.target === "string" ? link.target : "";
          const sp = layout.get(src);
          const tp = layout.get(tgt);
          if (!sp || !tp) return null;

          const mx = (sp.x + tp.x) / 2;
          const my = (sp.y + tp.y) / 2;
          const deg =
            (Math.atan2(tp.y - sp.y, tp.x - sp.x) * 180) / Math.PI;
          const readable = deg > 90 || deg < -90 ? deg + 180 : deg;

          const sIdx = order.get(src) ?? 0;
          const tIdx = order.get(tgt) ?? 0;
          const labelDelay =
            0.3 + Math.max(sIdx, tIdx) * 0.09 + 0.8;

          return (
            <motion.text
              key={`lbl-${src}-${tgt}`}
              x={mx}
              y={my - 6}
              textAnchor="middle"
              fill="rgba(34,211,238,0.38)"
              fontSize={9}
              fontStyle="italic"
              fontFamily="Inter, system-ui, sans-serif"
              transform={`rotate(${readable}, ${mx}, ${my - 6})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: labelDelay, duration: 0.4 }}
              style={{ pointerEvents: "none" }}
            >
              {link.label}
            </motion.text>
          );
        })}

      {/* ── Traveling dots on story edges ───────────────────── */}

      {phase === "idle" &&
        storyEdges?.map(([src, tgt]) => {
          const sp = layout.get(src);
          const tp = layout.get(tgt);
          if (!sp || !tp) return null;

          const link = data.links.find(
            (l) =>
              (typeof l.source === "string" ? l.source : "") === src &&
              (typeof l.target === "string" ? l.target : "") === tgt,
          );
          const kind = link?.kind ?? "default";
          const speed = kind === "progression" ? 2.2 : 3.2;
          const dotR = kind === "progression" ? 2.8 : 2.1;

          return (
            <motion.circle
              key={`dot-${src}-${tgt}`}
              r={dotR}
              fill="rgba(147,197,253,0.95)"
              filter="url(#dot-glow)"
              initial={{ opacity: 0 }}
              animate={{
                cx: [sp.x, tp.x],
                cy: [sp.y, tp.y],
                opacity: 1,
              }}
              transition={{
                cx: {
                  duration: speed,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "linear",
                },
                cy: {
                  duration: speed,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "linear",
                },
                opacity: { duration: 0.4 },
              }}
            />
          );
        })}

      {/* ── Nodes ──────────────────────────────────────────── */}

      {renderNodes.map((node) => {
        const pos = layout.get(node.id);
        if (!pos) return null;

        const r = getR(node);
        const square = isSquareCareerNode(node);
        const box = square ? getSquareNodeBox(node) : null;
        const halfW = box?.halfW ?? 0;
        const halfH = box?.halfH ?? 0;
        const rx = box?.rx ?? 0;

        const idx = order.get(node.id) ?? 0;
        /** About: only IIT + internships + Cimba stay crisp; rest stay faded. */
        const inPrimary = STORY_NODE_IDS.has(node.id);
        const isRoot = node.id === ROOT_ID;
        const isActive =
          hoveredId === node.id || focusedId === node.id;

        /** Focus/hover spotlights neighbors; career tiles stay visible so the story path never “turns off.” */
        const nodeOpacity = connected
          ? connected.has(node.id) || inPrimary
            ? 1
            : 0.06
          : inPrimary
            ? 1
            : node.type === "project"
              ? 0.15
              : 0.09;

        const showLabel =
          inPrimary ||
          ((node.type === "project" ||
            node.type === "skill" ||
            node.type === "blog") &&
            isActive);

        const h = hashId(node.id);
        const floatAmp = inPrimary ? 1 : 2.6;
        const floatAx =
          floatAmp * (1 + ((h & 0xff) / 255) * 1);
        const floatAy =
          floatAmp * (1 + (((h >> 8) & 0xff) / 255) * 1);
        const floatDur = inPrimary
          ? 4 + ((h >> 16) & 0xff) / 255 * 2
          : 2.8 + ((h >> 16) & 0xff) / 255 * 1.8;

        const entryDelay = 0.3 + idx * 0.09;
        const labelY = square ? halfH + 22 : r + 22;
        const logoPad = square ? squareLogoPad(halfW, halfH) : 0;
        const logoIw = square ? 2 * halfW - 2 * logoPad : r * 1.5;
        const logoIh = square ? 2 * halfH - 2 * logoPad : r * 1.5;
        const logoIx = square ? -halfW + logoPad : -r * 0.75;
        const logoIy = square ? -halfH + logoPad : -r * 0.75;

        const activeScale = isActive ? 1.08 : 1;

        return (
          <motion.g
            key={node.id}
            initial={{ x: pos.x, y: pos.y, scale: 0.75, opacity: 0 }}
            animate={
              phase === "idle"
                ? {
                    x: [
                      pos.x,
                      pos.x + floatAx,
                      pos.x - floatAx,
                      pos.x,
                    ],
                    y: [
                      pos.y,
                      pos.y - floatAy,
                      pos.y + floatAy,
                      pos.y,
                    ],
                    scale: 1,
                    opacity: nodeOpacity,
                  }
                : {
                    x: pos.x,
                    y: pos.y,
                    scale: 1,
                    opacity: nodeOpacity,
                  }
            }
            transition={
              phase === "idle"
                ? {
                    x: {
                      duration: floatDur,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    y: {
                      duration: floatDur + 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    scale: { duration: 0.4, ease: "easeOut" },
                    opacity: { duration: 0.3 },
                  }
                : {
                    delay: entryDelay,
                    duration: 0.45,
                    ease: "easeOut",
                  }
            }
            style={{ cursor: "pointer" }}
            onMouseEnter={() => handleNodeEnter(node)}
            onMouseLeave={handleNodeLeave}
            onClick={(e: React.MouseEvent) => handleNodeClick(node, e)}
          >
            <g
              style={{
                transform: `scale(${activeScale})`,
                transformOrigin: "0 0",
                transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {square ? (
              <>
                <defs>
                  {node.logo && (
                    <clipPath id={clipIdForNode(node.id)}>
                      <rect
                        x={logoIx}
                        y={logoIy}
                        width={logoIw}
                        height={logoIh}
                        rx={Math.max(3, rx - logoPad * 0.35)}
                      />
                    </clipPath>
                  )}
                </defs>

                {(inPrimary || isActive) && (
                  <motion.rect
                    x={-halfW - (isActive ? 10 : isRoot ? 9 : 6)}
                    y={-halfH - (isActive ? 10 : isRoot ? 9 : 6)}
                    width={2 * halfW + (isActive ? 20 : isRoot ? 18 : 12)}
                    height={2 * halfH + (isActive ? 20 : isRoot ? 18 : 12)}
                    rx={rx + (isActive ? 5 : 4)}
                    fill={
                      isRoot
                        ? "rgba(34,211,238,0.2)"
                        : GLOW_FILL[node.type]
                    }
                    animate={{
                      opacity: isActive
                        ? [0.4, 0.6, 0.4]
                        : isRoot
                          ? [0.25, 0.35, 0.25]
                          : 0.25,
                    }}
                    transition={
                      isActive || isRoot
                        ? {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                        : { duration: 0.3 }
                    }
                  />
                )}

                <rect
                  x={-halfW}
                  y={-halfH}
                  width={2 * halfW}
                  height={2 * halfH}
                  rx={rx}
                  fill={
                    node.logo ? "rgba(8,10,16,0.92)" : COLOR[node.type]
                  }
                />

                {node.logo && (
                  <image
                    href={node.logo}
                    x={logoIx}
                    y={logoIy}
                    width={logoIw}
                    height={logoIh}
                    preserveAspectRatio={LOGO_PAR}
                    filter="url(#desat)"
                    clipPath={`url(#${clipIdForNode(node.id)})`}
                    style={{ pointerEvents: "none" }}
                  />
                )}

                <rect
                  x={-halfW}
                  y={-halfH}
                  width={2 * halfW}
                  height={2 * halfH}
                  rx={rx}
                  fill="none"
                  stroke={
                    isActive
                      ? "rgba(103,232,249,0.95)"
                      : COLOR[node.type]
                  }
                  strokeWidth={
                    node.logo
                      ? isRoot
                        ? 2.6
                        : inPrimary
                          ? isActive
                            ? 2.4
                            : 2
                          : 0.85
                      : isActive
                        ? 1.6
                        : 0.5
                  }
                  opacity={
                    node.logo
                      ? isActive
                        ? 1
                        : inPrimary
                          ? 0.88
                          : 0.5
                      : isActive
                        ? 0.9
                        : 0.35
                  }
                  style={
                    isActive || (inPrimary && node.logo)
                      ? {
                          filter:
                            isActive
                              ? "drop-shadow(0 0 10px rgba(34,211,238,0.65)) drop-shadow(0 0 22px rgba(56,189,248,0.35))"
                              : "drop-shadow(0 0 6px rgba(34,211,238,0.35))",
                        }
                      : undefined
                  }
                />

                {!node.logo && isActive && (
                  <rect
                    x={-halfW * 0.45}
                    y={-halfH * 0.35}
                    width={halfW * 0.9}
                    height={halfH * 0.7}
                    rx={rx * 0.4}
                    fill="rgba(255,255,255,0.18)"
                  />
                )}
              </>
            ) : (
              <>
                <defs>
                  {node.logo && (
                    <clipPath id={clipIdForNode(node.id)}>
                      <circle r={r * 0.75} />
                    </clipPath>
                  )}
                </defs>

                {(inPrimary || isActive) && (
                  <motion.circle
                    r={r + (isActive ? 9 : isRoot ? 8 : 5)}
                    fill={
                      isRoot
                        ? "rgba(34,211,238,0.2)"
                        : GLOW_FILL[node.type]
                    }
                    animate={{
                      opacity: isActive
                        ? [0.4, 0.6, 0.4]
                        : isRoot
                          ? [0.25, 0.35, 0.25]
                          : 0.25,
                    }}
                    transition={
                      isActive || isRoot
                        ? {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                        : { duration: 0.3 }
                    }
                  />
                )}

                <circle
                  r={r}
                  fill={
                    node.logo ? "rgba(8,10,16,0.92)" : COLOR[node.type]
                  }
                />

                {node.logo && (
                  <image
                    href={node.logo}
                    x={logoIx}
                    y={logoIy}
                    width={logoIw}
                    height={logoIh}
                    preserveAspectRatio={LOGO_PAR}
                    filter="url(#desat)"
                    clipPath={`url(#${clipIdForNode(node.id)})`}
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {node.logo && (
                  <circle
                    r={r}
                    fill="none"
                    stroke={COLOR[node.type]}
                    strokeWidth={
                      isRoot ? 2.2 : inPrimary ? 1.35 : 0.85
                    }
                    opacity={0.6}
                  />
                )}

                {!node.logo && isActive && (
                  <circle
                    r={r * 0.3}
                    fill="rgba(255,255,255,0.4)"
                  />
                )}
              </>
            )}
            </g>
            {showLabel && (
              <text
                y={labelY}
                textAnchor="middle"
                fill={
                  nodeOpacity > 0.4
                    ? "rgba(237,237,237,0.92)"
                    : "rgba(120,120,120,0.6)"
                }
                fontSize={
                  (isRoot ? 15 : node.type === "role" ? 13 : 11.5) *
                  (width < 420 ? 0.9 : 1)
                }
                fontWeight={inPrimary || isActive ? 600 : 400}
                fontFamily="Inter, system-ui, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {node.label.length > 20
                  ? node.label.slice(0, 20) + "\u2026"
                  : node.label}
              </text>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}
