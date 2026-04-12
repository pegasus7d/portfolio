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
  LinkKind,
} from "@/lib/graph-types";

// ── Visual tokens ───────────────────────────────────────────────

const COLOR: Record<NodeType, string> = {
  project: "#3b82f6",
  blog: "#a78bfa",
  skill: "#475569",
  role: "#22d3ee",
};

const GLOW: Record<NodeType, string> = {
  project: "rgba(59,130,246,0.22)",
  blog: "rgba(167,139,250,0.18)",
  skill: "rgba(71,85,105,0.10)",
  role: "rgba(34,211,238,0.22)",
};

const R: Record<NodeType, number> = {
  role: 16,
  project: 10,
  blog: 7,
  skill: 4.5,
};

const ROOT = "role:iit";
const ROOT_R = 20;

const LK_BASE = "rgba(148,163,184,0.05)";
const LK_DIM = "rgba(148,163,184,0.012)";
const LK_HL = "rgba(59,130,246,0.4)";
const LK_STORY = "rgba(34,211,238,0.22)";
const LK_PROG = "rgba(34,211,238,0.42)";

// ── Animation timing ────────────────────────────────────────────

const REVEAL_WAIT = 300;
const NODE_STAGGER = 90;
const NODE_DUR = 450;
const FLOAT_AMP = 1.5;
const FLOAT_MIN_T = 4000;
const FLOAT_MAX_T = 6000;
const DRAG_LIMIT = 40;
const SPRING_MS = 350;

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
      if (storyIds.has(nid)) { parent = nid; break; }
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

    // Skills fan away from graph center
    const skAngle =
      px < 0.25 ? Math.PI : px > 0.55 ? 0 : py < 0.5 ? -Math.PI / 2 : Math.PI / 2;
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

    // Projects placed outward from parent
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

// ── Types ───────────────────────────────────────────────────────

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

function nid(n: string | FGNode): string {
  return typeof n === "string" ? n : n.id;
}

function nr(n: FGNode): number {
  return n.id === ROOT ? ROOT_R : R[n.type] ?? 5;
}

// ── Deterministic float config per node ─────────────────────────

interface Float {
  ax: number;
  ay: number;
  px: number;
  py: number;
  tx: number;
  ty: number;
}

function makeFloat(id: string): Float {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  const u = (shift: number) => ((h >>> shift) & 0xffff) / 0xffff;
  return {
    ax: FLOAT_AMP * (0.6 + 0.8 * u(0)),
    ay: FLOAT_AMP * (0.6 + 0.8 * u(4)),
    px: u(8) * Math.PI * 2,
    py: u(12) * Math.PI * 2,
    tx: FLOAT_MIN_T + u(16) * (FLOAT_MAX_T - FLOAT_MIN_T),
    ty: FLOAT_MIN_T + u(20) * (FLOAT_MAX_T - FLOAT_MIN_T),
  };
}

// ── Logo preloader ──────────────────────────────────────────────

function useLogos(nodes: GraphNode[]): Map<string, HTMLImageElement> {
  const cache = useRef(new Map<string, HTMLImageElement>());
  const [, bump] = useState(0);
  useEffect(() => {
    for (const n of nodes) {
      if (!n.logo || cache.current.has(n.id)) continue;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = n.logo;
      img.onload = () => {
        cache.current.set(n.id, img);
        bump((v) => v + 1);
      };
    }
  }, [nodes]);
  return cache.current;
}

// ── Spring state for drag release ───────────────────────────────

interface Spring {
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  t0: number;
}

// ── Easing ──────────────────────────────────────────────────────

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// ── Component ───────────────────────────────────────────────────

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
  const logos = useLogos(data.nodes);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const frame = useRef(0);
  const mountT = useRef(performance.now());
  const springs = useRef(new Map<string, Spring>());

  // ── Precomputed layout ─────────────────────────────────────

  const layout = useMemo(
    () => computeLayout(data, width, height),
    [data, width, height],
  );

  const homeRef = useRef(new Map<string, { x: number; y: number }>());
  useEffect(() => {
    homeRef.current = new Map(layout);
  }, [layout]);

  const floats = useMemo(() => {
    const m = new Map<string, Float>();
    for (const n of data.nodes) m.set(n.id, makeFloat(n.id));
    return m;
  }, [data.nodes]);

  // ── Story helpers ──────────────────────────────────────────

  const storyLinkSet = useMemo(() => {
    if (!storyEdges?.length) return null;
    const s = new Set<string>();
    for (const [a, b] of storyEdges) {
      s.add(`${a}__${b}`);
      s.add(`${b}__${a}`);
    }
    return s;
  }, [storyEdges]);

  const revealIdx = useMemo(() => {
    const m = new Map<string, number>();
    const sorted = [...data.nodes].sort((a, b) => {
      if (a.storyOrder !== undefined && b.storyOrder !== undefined)
        return a.storyOrder - b.storyOrder;
      if (a.storyOrder !== undefined) return -1;
      if (b.storyOrder !== undefined) return 1;
      const p: Record<NodeType, number> = { role: 0, project: 1, blog: 2, skill: 3 };
      return (p[a.type] ?? 4) - (p[b.type] ?? 4);
    });
    sorted.forEach((n, i) => m.set(n.id, i));
    return m;
  }, [data.nodes]);

  const totalNodes = data.nodes.length;

  // ── Graph data with fixed positions ────────────────────────

  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => {
        const p = layout.get(n.id) ?? { x: width / 2, y: height / 2 };
        return { ...n, x: p.x, y: p.y, fx: p.x, fy: p.y };
      }),
      links: data.links.map((l) => ({ ...l })),
    }),
    [data, layout, width, height],
  );

  // Connected IDs for highlight/dim
  const connected = useMemo(() => {
    const active = focused ?? hovered;
    if (!active) return null;
    const s = new Set<string>([active]);
    for (const l of data.links) {
      const src = typeof l.source === "string" ? l.source : "";
      const tgt = typeof l.target === "string" ? l.target : "";
      if (src === active) s.add(tgt);
      if (tgt === active) s.add(src);
    }
    return s;
  }, [hovered, focused, data.links]);

  // ── rAF loop: frame counter + spring animations ────────────

  useEffect(() => {
    let raf: number;
    const tick = () => {
      frame.current += 1;
      const now = performance.now();

      for (const [nodeId, sp] of springs.current) {
        const t = Math.min(1, (now - sp.t0) / SPRING_MS);
        const e = easeOut(t);
        const nx = sp.fx + (sp.tx - sp.fx) * e;
        const ny = sp.fy + (sp.ty - sp.fy) * e;

        const nodes = fgRef.current?.graphData()?.nodes as FGNode[] | undefined;
        const node = nodes?.find((n) => n.id === nodeId);
        if (node) {
          node.fx = nx;
          node.fy = ny;
          node.x = nx;
          node.y = ny;
        }
        if (t >= 1) springs.current.delete(nodeId);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Reset mount time on data change
  useEffect(() => {
    mountT.current = performance.now();
  }, [data]);

  // Pause rendering when tab hidden
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const h = () => {
      if (document.hidden) fg.pauseAnimation?.();
      else fg.resumeAnimation?.();
    };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, []);

  // Strip all d3 forces — positions are fully deterministic
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const strip = () => {
      fg.d3Force?.("charge", null);
      fg.d3Force?.("link", null);
      fg.d3Force?.("center", null);
    };
    setTimeout(strip, 50);
  }, []);

  // ── Animation helpers ─────────────────────────────────────

  const elapsed = useCallback(
    () => performance.now() - mountT.current,
    [],
  );

  const nodeReveal = useCallback(
    (id: string): number => {
      const e = elapsed() - REVEAL_WAIT;
      const idx = revealIdx.get(id) ?? totalNodes;
      return clamp((e - idx * NODE_STAGGER) / NODE_DUR, 0, 1);
    },
    [elapsed, revealIdx, totalNodes],
  );

  const edgeReveal = useCallback(
    (sId: string, tId: string): number => {
      const sp = nodeReveal(sId);
      const tp = nodeReveal(tId);
      const both = Math.min(sp, tp);
      if (both < 0.5) return 0;
      return clamp((both - 0.5) / 0.5, 0, 1);
    },
    [nodeReveal],
  );

  const nodeAlpha = useCallback(
    (id: string, type: NodeType): number => {
      const r = nodeReveal(id);
      if (r < 0.01) return 0;
      let base: number;
      if (connected) {
        base = connected.has(id) ? 1 : 0.07;
      } else if (storyNodeIds) {
        base = storyNodeIds.has(id) ? 1 : type === "project" ? 0.5 : 0.15;
      } else {
        base = 1;
      }
      return base * r;
    },
    [connected, storyNodeIds, nodeReveal],
  );

  const getFloat = useCallback(
    (id: string): { dx: number; dy: number } => {
      const f = floats.get(id);
      if (!f) return { dx: 0, dy: 0 };

      const revealDone =
        REVEAL_WAIT + (revealIdx.get(id) ?? totalNodes) * NODE_STAGGER + NODE_DUR;
      const sinceReady = elapsed() - revealDone;
      if (sinceReady < 0) return { dx: 0, dy: 0 };

      const fadeIn = clamp(sinceReady / 1500, 0, 1);
      const now = performance.now();
      return {
        dx: f.ax * Math.sin(now / f.tx + f.px) * fadeIn,
        dy: f.ay * Math.cos(now / f.ty + f.py) * fadeIn,
      };
    },
    [floats, revealIdx, totalNodes, elapsed],
  );

  // ── Paint node ────────────────────────────────────────────

  const paintNode = useCallback(
    (node: FGNode, ctx: CanvasRenderingContext2D) => {
      const a = nodeAlpha(node.id, node.type);
      if (a < 0.01) return;

      const reveal = nodeReveal(node.id);
      const fl = getFloat(node.id);
      const baseR = nr(node);
      const isRoot = node.id === ROOT;
      const isStory = storyNodeIds?.has(node.id);
      const isActive = hovered === node.id || focused === node.id;
      const isFocused = focused === node.id;
      const color = COLOR[node.type];
      const glow = GLOW[node.type];
      const logo = node.logo ? logos.get(node.id) : undefined;

      const revealScale = 0.75 + 0.25 * easeOut(reveal);
      const hoverScale = isActive ? 1.08 : 1;
      const r = baseR * revealScale * hoverScale;

      const cx = node.x! + fl.dx;
      const cy = node.y! + fl.dy;

      ctx.save();
      ctx.globalAlpha = a;

      // Soft glow — visible only for story/active nodes
      if (a > 0.2 && (isStory || isActive)) {
        const gr = r + (isActive ? 6 : isRoot ? 5 : 3);
        const pa = isFocused
          ? 0.15 + 0.05 * Math.sin(frame.current * 0.03)
          : isActive
            ? 0.13
            : isRoot
              ? 0.10 + 0.03 * Math.sin(frame.current * 0.02)
              : 0.06;
        ctx.beginPath();
        ctx.arc(cx, cy, gr, 0, Math.PI * 2);
        ctx.fillStyle = isRoot ? "rgba(34,211,238,0.25)" : glow;
        ctx.globalAlpha = pa * a;
        ctx.fill();
        ctx.globalAlpha = a;
      }

      // Core circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = logo ? "rgba(8,10,16,0.92)" : color;
      ctx.fill();

      // Logo rendering (cover fit inside circle)
      if (logo) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
        ctx.clip();
        const aspect = logo.naturalWidth / logo.naturalHeight;
        const d = r * 1.5;
        let dw: number, dh: number;
        if (aspect > 1) { dh = d; dw = d * aspect; }
        else { dw = d; dh = d / aspect; }
        ctx.filter = "grayscale(0.35) brightness(1.35)";
        ctx.drawImage(logo, cx - dw / 2, cy - dh / 2, dw, dh);
        ctx.filter = "none";
        ctx.restore();

        // Accent ring
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = isRoot ? 1.6 : isStory ? 1.0 : 0.6;
        ctx.globalAlpha = a * 0.6;
        ctx.stroke();
        ctx.globalAlpha = a;
      } else if (isActive) {
        // Inner dot for non-logo active nodes
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fill();
      }

      // Label (roles + projects + active only)
      const showLabel = node.type === "role" || node.type === "project" || isActive;
      if (showLabel && a > 0.15) {
        const fs =
          isRoot ? 5.5 : node.type === "role" ? 4.5 : node.type === "project" ? 3.8 : 3.2;
        ctx.font = `${isStory || isActive ? "600 " : ""}${fs}px Inter,system-ui,sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = a > 0.4 ? "rgba(237,237,237,0.92)" : "rgba(120,120,120,0.6)";
        const max = node.type === "skill" ? 10 : 20;
        const lbl =
          node.label.length > max ? node.label.slice(0, max) + "\u2026" : node.label;
        ctx.fillText(lbl, cx, cy + r + 4);
      }

      ctx.restore();
    },
    [connected, hovered, focused, storyNodeIds, nodeAlpha, nodeReveal, getFloat, logos],
  );

  // ── Paint link ────────────────────────────────────────────

  const paintLink = useCallback(
    (link: FGLink, ctx: CanvasRenderingContext2D) => {
      const src = typeof link.source === "string" ? null : link.source;
      const tgt = typeof link.target === "string" ? null : link.target;
      if (!src?.x || !tgt?.x) return;

      const sId = nid(link.source);
      const tId = nid(link.target);

      const drawP = edgeReveal(sId, tId);
      if (drawP < 0.01) return;

      const isHL = connected && connected.has(sId) && connected.has(tId);
      const isSL = storyLinkSet?.has(`${sId}__${tId}`);
      const kind: LinkKind = (link.kind as LinkKind) ?? "default";

      const sf = getFloat(sId);
      const tf = getFloat(tId);
      const sx = src.x + sf.dx;
      const sy = src.y! + sf.dy;
      const fullTx = tgt.x + tf.dx;
      const fullTy = tgt.y! + tf.dy;

      // Edge grows from source toward target during reveal
      const ep = easeOut(drawP);
      const tx = sx + (fullTx - sx) * ep;
      const ty = sy + (fullTy - sy) * ep;

      ctx.save();
      ctx.globalAlpha = drawP;

      if (kind === "parallel" && isSL) {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = isHL ? LK_HL : LK_STORY;
        ctx.lineWidth = isHL ? 1.5 : 1;
      } else if (kind === "progression" && isSL) {
        ctx.setLineDash([]);
        ctx.strokeStyle = isHL ? LK_HL : LK_PROG;
        ctx.lineWidth = isHL ? 2 : 1.8;
        ctx.shadowColor = "rgba(34,211,238,0.12)";
        ctx.shadowBlur = 4;
      } else if (isHL) {
        ctx.setLineDash([]);
        ctx.strokeStyle = LK_HL;
        ctx.lineWidth = 1.2;
      } else if (isSL) {
        ctx.setLineDash([]);
        ctx.strokeStyle = LK_STORY;
        ctx.lineWidth = 1.3;
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = connected ? LK_DIM : LK_BASE;
        ctx.lineWidth = 0.4;
      }

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Traveling dot on story edges (only once fully drawn)
      if (isSL && drawP > 0.95) {
        const speed = kind === "progression" ? 2200 : 3200;
        const t = (performance.now() % speed) / speed;
        const dotR = kind === "progression" ? 1.8 : 1.2;
        ctx.beginPath();
        ctx.arc(
          sx + (fullTx - sx) * t,
          sy + (fullTy - sy) * t,
          dotR,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "rgba(34,211,238,0.75)";
        ctx.shadowColor = "rgba(34,211,238,0.4)";
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Edge label (appears as edge finishes drawing)
      if (link.label && (isSL || isHL) && drawP > 0.7) {
        const mx = (sx + fullTx) / 2;
        const my = (sy + fullTy) / 2;
        const angle = Math.atan2(fullTy - sy, fullTx - sx);
        ctx.save();
        ctx.globalAlpha = clamp((drawP - 0.7) / 0.3, 0, 1);
        ctx.translate(mx, my);
        ctx.rotate(
          angle > Math.PI / 2 || angle < -Math.PI / 2 ? angle + Math.PI : angle,
        );
        ctx.font = "italic 2.8px Inter,system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "rgba(34,211,238,0.38)";
        ctx.fillText(link.label, 0, -3);
        ctx.restore();
      }

      ctx.restore();
    },
    [connected, storyLinkSet, edgeReveal, getFloat],
  );

  // ── Interactions ──────────────────────────────────────────

  const onHover = useCallback(
    (node: FGNode | null) => {
      setHovered(node?.id ?? null);
      document.body.style.cursor = node ? "pointer" : "default";
      onNodeHoverChange?.(node ? (node as GraphNode) : null);
    },
    [onNodeHoverChange],
  );

  const onClick = useCallback(
    (node: FGNode) => {
      if (focused === node.id) {
        if (node.url) router.push(node.url);
        setFocused(null);
        onNodeSelect?.(null);
      } else {
        setFocused(node.id);
        onNodeSelect?.(node as GraphNode);
      }
    },
    [focused, router, onNodeSelect],
  );

  const onBgClick = useCallback(() => {
    setFocused(null);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  // ── Drag: constrain ±40px, spring back on release ─────────

  const onDrag = useCallback((node: FGNode) => {
    const h = homeRef.current.get(node.id);
    if (!h) return;
    node.fx = clamp(node.x!, h.x - DRAG_LIMIT, h.x + DRAG_LIMIT);
    node.fy = clamp(node.y!, h.y - DRAG_LIMIT, h.y + DRAG_LIMIT);
  }, []);

  const onDragEnd = useCallback((node: FGNode) => {
    const h = homeRef.current.get(node.id);
    if (!h) return;
    node.fx = node.x!;
    node.fy = node.y!;
    springs.current.set(node.id, {
      fx: node.x!,
      fy: node.y!,
      tx: h.x,
      ty: h.y,
      t0: performance.now(),
    });
  }, []);

  // ── Render ────────────────────────────────────────────────

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      width={width}
      height={height}
      backgroundColor="transparent"
      nodeCanvasObject={paintNode}
      nodePointerAreaPaint={(
        node: FGNode,
        hitColor: string,
        ctx: CanvasRenderingContext2D,
      ) => {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, nr(node) + 6, 0, Math.PI * 2);
        ctx.fillStyle = hitColor;
        ctx.fill();
      }}
      linkCanvasObject={paintLink}
      onNodeHover={onHover}
      onNodeClick={onClick}
      onBackgroundClick={onBgClick}
      onNodeDrag={onDrag}
      onNodeDragEnd={onDragEnd}
      cooldownTicks={Infinity}
      d3AlphaDecay={0}
      d3VelocityDecay={1}
      enableZoomInteraction={false}
      enablePanInteraction={false}
    />
  );
}
