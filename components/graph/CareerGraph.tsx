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

const RADIUS: Record<NodeType, number> = {
  role: 16,
  project: 10,
  blog: 7,
  skill: 4.5,
};

const ROOT_ID = "role:iit";
const ROOT_R = 20;

function getR(n: GraphNode): number {
  return n.id === ROOT_ID ? ROOT_R : RADIUS[n.type] ?? 5;
}

// ── Fixed layout ────────────────────────────────────────────────

const STORY_POS: Record<string, [number, number]> = {
  "role:iit":    [0.11, 0.50],
  "role:ittiam": [0.38, 0.27],
  "role:onelot": [0.38, 0.73],
  "role:cimba":  [0.66, 0.50],
};

function computeLayout(
  data: GraphData,
  w: number,
  h: number,
): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  if (w === 0 || h === 0) return pos;

  const storyIds = new Set(Object.keys(STORY_POS));
  for (const [id, [fx, fy]] of Object.entries(STORY_POS)) {
    pos.set(id, { x: fx * w, y: fy * h });
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

    const skAngle =
      px < 0.25
        ? Math.PI
        : px > 0.55
          ? 0
          : py < 0.5
            ? -Math.PI / 2
            : Math.PI / 2;
    const skSpread = Math.PI * 0.55;
    const skDist = 55 + skills.length * 4;
    skills.forEach((sk, i) => {
      const f = skills.length === 1 ? 0.5 : i / (skills.length - 1);
      const a = skAngle - skSpread / 2 + skSpread * f;
      pos.set(sk.id, {
        x: p.x + skDist * Math.cos(a),
        y: p.y + skDist * Math.sin(a),
      });
    });

    const prAngle = px > 0.55 ? Math.PI * 0.08 : Math.PI * 0.05;
    const prSpread = Math.PI * 0.35;
    const prDist = 65;
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
  for (const n of data.nodes) {
    if (!pos.has(n.id)) {
      pos.set(n.id, { x: w * 0.88, y: oy });
      oy += 30;
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

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
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

      {/* ── Edges ──────────────────────────────────────────── */}

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

        const sIdx = order.get(src) ?? 0;
        const tIdx = order.get(tgt) ?? 0;
        const edgeDelay = 0.3 + Math.max(sIdx, tIdx) * 0.09 + 0.5;

        const edgeOpacity = connected
          ? isHL
            ? 1
            : 0.04
          : isSL
            ? 1
            : 0.15;

        const stroke =
          isHL
            ? "rgba(59,130,246,0.45)"
            : kind === "progression" && isSL
              ? "rgba(34,211,238,0.42)"
              : isSL
                ? "rgba(34,211,238,0.22)"
                : "rgba(148,163,184,0.06)";

        const sw =
          kind === "progression" && isSL
            ? isHL
              ? 2
              : 1.8
            : isHL
              ? 1.2
              : isSL
                ? 1.3
                : 0.4;

        const isDashed = kind === "parallel" && isSL;

        if (isDashed) {
          return (
            <motion.line
              key={`e-${src}-${tgt}`}
              x1={sp.x}
              y1={sp.y}
              x2={tp.x}
              y2={tp.y}
              stroke={stroke}
              strokeWidth={sw}
              strokeDasharray="5 5"
              initial={{ opacity: 0 }}
              animate={{ opacity: edgeOpacity }}
              transition={{
                delay: edgeDelay,
                duration: 0.5,
                ease: "easeOut",
              }}
            />
          );
        }

        return (
          <motion.path
            key={`e-${src}-${tgt}`}
            d={`M ${sp.x} ${sp.y} L ${tp.x} ${tp.y}`}
            stroke={stroke}
            strokeWidth={sw}
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: edgeOpacity }}
            transition={{
              pathLength: {
                delay: edgeDelay,
                duration: 0.45,
                ease: "easeOut",
              },
              opacity: {
                delay: edgeDelay,
                duration: 0.3,
              },
            }}
          />
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
          const dotR = kind === "progression" ? 2 : 1.4;

          return (
            <motion.circle
              key={`dot-${src}-${tgt}`}
              r={dotR}
              fill="rgba(34,211,238,0.8)"
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
        const idx = order.get(node.id) ?? 0;
        const isStory = storyNodeIds?.has(node.id);
        const isRoot = node.id === ROOT_ID;
        const isActive =
          hoveredId === node.id || focusedId === node.id;

        const nodeOpacity = connected
          ? connected.has(node.id)
            ? 1
            : 0.08
          : isStory
            ? 1
            : node.type === "project"
              ? 0.55
              : 0.18;

        const showLabel =
          node.type === "role" ||
          node.type === "project" ||
          isActive;

        // Deterministic float params
        const h = hashId(node.id);
        const floatAx = 1 + ((h & 0xff) / 255) * 1;
        const floatAy = 1 + (((h >> 8) & 0xff) / 255) * 1;
        const floatDur = 4 + ((h >> 16) & 0xff) / 255 * 2;

        const entryDelay = 0.3 + idx * 0.09;

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
                    scale: isActive ? 1.08 : 1,
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
                    scale: {
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    },
                    opacity: { duration: 0.3 },
                  }
                : {
                    delay: entryDelay,
                    duration: 0.45,
                    ease: "easeOut",
                  }
            }
            whileHover={phase === "idle" ? { scale: 1.1 } : undefined}
            drag={phase === "idle"}
            dragConstraints={{
              left: -40,
              right: 40,
              top: -40,
              bottom: 40,
            }}
            dragElastic={0.15}
            dragMomentum={false}
            dragSnapToOrigin
            style={{ cursor: "pointer" }}
            onMouseEnter={() => handleNodeEnter(node)}
            onMouseLeave={handleNodeLeave}
            onClick={(e: React.MouseEvent) => handleNodeClick(node, e)}
          >
            {/* Glow circle */}
            {(isStory || isActive) && (
              <motion.circle
                r={r + (isActive ? 6 : isRoot ? 5 : 3)}
                fill={
                  isRoot ? "rgba(34,211,238,0.2)" : GLOW_FILL[node.type]
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

            {/* Core circle */}
            <circle
              r={r}
              fill={node.logo ? "rgba(8,10,16,0.92)" : COLOR[node.type]}
            />

            {/* Logo (circular crop via CSS clip-path) */}
            {node.logo && (
              <image
                href={node.logo}
                x={-r * 0.75}
                y={-r * 0.75}
                width={r * 1.5}
                height={r * 1.5}
                preserveAspectRatio="xMidYMid slice"
                filter="url(#desat)"
                style={{
                  clipPath: "circle(50% at 50% 50%)",
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Accent ring for logo nodes */}
            {node.logo && (
              <circle
                r={r}
                fill="none"
                stroke={COLOR[node.type]}
                strokeWidth={isRoot ? 1.6 : isStory ? 1 : 0.6}
                opacity={0.6}
              />
            )}

            {/* Inner dot for non-logo active nodes */}
            {!node.logo && isActive && (
              <circle r={r * 0.3} fill="rgba(255,255,255,0.4)" />
            )}

            {/* Label */}
            {showLabel && (
              <text
                y={r + 14}
                textAnchor="middle"
                fill={
                  nodeOpacity > 0.4
                    ? "rgba(237,237,237,0.92)"
                    : "rgba(120,120,120,0.6)"
                }
                fontSize={
                  isRoot ? 12 : node.type === "role" ? 11 : 10
                }
                fontWeight={isStory || isActive ? 600 : 400}
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
