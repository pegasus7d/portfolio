"use client";

import {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";
import type { SystemGraphData, SystemNode } from "@/lib/system-graph";
import { layoutPosition } from "@/lib/system-graph";

const NODE_R = 24;
const HIT_PAD = 10;
/** Sine wobble layered on top of linear drift */
const FLOAT_AMP = 5.2;
const FLOAT_PERIOD_MIN = 4600;
const FLOAT_PERIOD_MAX = 7200;

type FloatCfg = { px: number; py: number; tx: number; ty: number };

function hashFloat(id: string): FloatCfg {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  const u = (s: number) => ((h >>> s) & 0xffff) / 0xffff;
  return {
    px: u(0) * Math.PI * 2,
    py: u(8) * Math.PI * 2,
    tx: FLOAT_PERIOD_MIN + u(16) * (FLOAT_PERIOD_MAX - FLOAT_PERIOD_MIN),
    ty: FLOAT_PERIOD_MIN + u(24) * (FLOAT_PERIOD_MAX - FLOAT_PERIOD_MIN),
  };
}

/** Layered slow drift; higher `scale` adds a second loop for clearer motion */
function motionDelta(
  now: number,
  f: FloatCfg | undefined,
  scale: number,
  reduced: boolean,
): { dx: number; dy: number } {
  if (reduced) return { dx: 0, dy: 0 };
  const tx = f?.tx ?? 5600;
  const ty = f?.ty ?? 6400;
  const px = f?.px ?? 0;
  const py = f?.py ?? 0;
  const base = FLOAT_AMP * scale;
  let dx = base * Math.sin(now / tx + px);
  let dy = base * Math.cos(now / ty + py);
  if (scale > 1.12) {
    const wobble = FLOAT_AMP * 0.68 * scale;
    dx += wobble * Math.sin(now / (tx * 0.5) + py * 1.12);
    dy += wobble * Math.cos(now / (ty * 0.56) + px * 0.88);
  }
  return { dx, dy };
}

function useImageCache(nodes: SystemNode[]) {
  const cache = useRef(new Map<string, HTMLImageElement | "err">());
  const [, v] = useState(0);
  useEffect(() => {
    for (const n of nodes) {
      if (cache.current.has(n.id)) continue;
      const img = new Image();
      if (/^https?:\/\//i.test(n.logoUrl)) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        cache.current.set(n.id, img);
        v((x) => x + 1);
      };
      img.onerror = () => {
        cache.current.set(n.id, "err");
        v((x) => x + 1);
      };
      img.src = n.logoUrl;
    }
  }, [nodes]);
  return cache.current;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
}

/** Background specks — a bit calmer than nodes */
const BG_PARTICLE_SPEED = 0.32;
/** Graph nodes — faster bounce so the map feels alive */
const NODE_DRIFT_SPEED = 0.45;

function makeParticles(w: number, h: number, count: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * BG_PARTICLE_SPEED,
      vy: (Math.random() - 0.5) * BG_PARTICLE_SPEED,
      r: 0.4 + Math.random() * 1.2,
      a: 0.08 + Math.random() * 0.18,
    });
  }
  return out;
}

type NodePhys = { x: number; y: number; vx: number; vy: number };

function bounceInRect(
  x: number,
  y: number,
  vx: number,
  vy: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
): { x: number; y: number; vx: number; vy: number } {
  let nx = x + vx;
  let ny = y + vy;
  let nvx = vx;
  let nvy = vy;
  if (nx < minX || nx > maxX) {
    nvx *= -1;
    nx = Math.max(minX, Math.min(maxX, nx));
  }
  if (ny < minY || ny > maxY) {
    nvy *= -1;
    ny = Math.max(minY, Math.min(maxY, ny));
  }
  return { x: nx, y: ny, vx: nvx, vy: nvy };
}

/** One integration step; lazy-init at layout anchor if missing */
function stepNodePhysics(
  nodes: SystemNode[],
  w: number,
  h: number,
  phys: Map<string, NodePhys>,
) {
  const pad = NODE_R + 6;
  const minX = pad;
  const maxX = w - pad;
  const minY = pad;
  const maxY = h - pad;
  for (const n of nodes) {
    let s = phys.get(n.id);
    if (!s) {
      const p = layoutPosition(n.id, w, h);
      s = {
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * NODE_DRIFT_SPEED,
        vy: (Math.random() - 0.5) * NODE_DRIFT_SPEED,
      };
      phys.set(n.id, s);
    }
    const next = bounceInRect(s.x, s.y, s.vx, s.vy, minX, maxX, minY, maxY);
    s.x = next.x;
    s.y = next.y;
    s.vx = next.vx;
    s.vy = next.vy;
  }
}

interface SystemVisualizationProps {
  data: SystemGraphData;
  width: number;
  height: number;
  reducedMotion?: boolean;
  onSelect?: (node: SystemNode | null) => void;
  onHoverChange?: (node: SystemNode | null) => void;
}

export default function SystemVisualization({
  data,
  width,
  height,
  reducedMotion = false,
  onSelect,
  onHoverChange,
}: SystemVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const images = useImageCache(data.nodes);
  const hoverId = useRef<string | null>(null);
  const selectedId = useRef<string | null>(null);
  const [, bump] = useState(0);

  const floats = useMemo(() => {
    const m = new Map<string, FloatCfg>();
    for (const n of data.nodes) m.set(n.id, hashFloat(n.id));
    return m;
  }, [data.nodes]);

  const nodeById = useMemo(
    () => new Map(data.nodes.map((n) => [n.id, n])),
    [data.nodes],
  );

  const particlesRef = useRef<Particle[]>([]);
  useEffect(() => {
    if (width > 0 && height > 0) {
      const count = width < 480 ? 16 : width < 768 ? 28 : 42;
      particlesRef.current = makeParticles(width, height, count);
    }
  }, [width, height]);

  const nodePhysRef = useRef(new Map<string, NodePhys>());
  const lastCanvasSize = useRef({ w: 0, h: 0 });
  useEffect(() => {
    if (width < 16 || height < 16) return;
    const phys = nodePhysRef.current;
    const resized =
      lastCanvasSize.current.w !== width ||
      lastCanvasSize.current.h !== height;
    lastCanvasSize.current = { w: width, h: height };

    const want = new Set(data.nodes.map((n) => n.id));
    for (const id of [...phys.keys()]) {
      if (!want.has(id)) phys.delete(id);
    }

    for (const n of data.nodes) {
      const p = layoutPosition(n.id, width, height);
      let s = phys.get(n.id);
      if (!s) {
        s = {
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * NODE_DRIFT_SPEED,
          vy: (Math.random() - 0.5) * NODE_DRIFT_SPEED,
        };
        phys.set(n.id, s);
      } else if (resized) {
        s.x = p.x;
        s.y = p.y;
      }
    }
  }, [width, height, data.nodes]);

  const basePos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const n of data.nodes) {
      m.set(n.id, layoutPosition(n.id, width, height));
    }
    return m;
  }, [data.nodes, width, height]);

  const adj = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const n of data.nodes) m.set(n.id, new Set());
    for (const e of data.edges) {
      m.get(e.source)?.add(e.target);
      m.get(e.target)?.add(e.source);
    }
    return m;
  }, [data.nodes, data.edges]);

  const setHover = useCallback(
    (id: string | null) => {
      if (hoverId.current === id) return;
      hoverId.current = id;
      const node = id ? data.nodes.find((n) => n.id === id) ?? null : null;
      onHoverChange?.(node);
    },
    [data.nodes, onHoverChange],
  );

  const pickNode = useCallback(
    (cx: number, cy: number): string | null => {
      const t = performance.now();
      for (const n of data.nodes) {
        const p = basePos.get(n.id);
        if (!p) continue;
        const f = floats.get(n.id);
        const scale = n.motionScale ?? 1;
        const { dx, dy } = motionDelta(t, f, scale, reducedMotion);
        let x = p.x + dx;
        let y = p.y + dy;
        if (!reducedMotion) {
          const s = nodePhysRef.current.get(n.id);
          if (s) {
            x = s.x + dx;
            y = s.y + dy;
          }
        }
        const d = Math.hypot(cx - x, cy - y);
        if (d < NODE_R + HIT_PAD) return n.id;
      }
      return null;
    },
    [data.nodes, basePos, floats, reducedMotion],
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, now: number) => {
      ctx.clearRect(0, 0, width, height);

      if (!reducedMotion) {
        stepNodePhysics(data.nodes, width, height, nodePhysRef.current);
      }

      const active = selectedId.current ?? hoverId.current;
      const conn = active ? adj.get(active) : null;
      const fadeOthers = Boolean(active);

      const nodeXY = (id: string) => {
        const p = basePos.get(id)!;
        const f = floats.get(id);
        const scale = nodeById.get(id)?.motionScale ?? 1;
        const { dx, dy } = motionDelta(now, f, scale, reducedMotion);
        if (reducedMotion) {
          return { x: p.x + dx, y: p.y + dy };
        }
        const s = nodePhysRef.current.get(id);
        return {
          x: (s?.x ?? p.x) + dx,
          y: (s?.y ?? p.y) + dy,
        };
      };

      const pulse = reducedMotion
        ? 0.5
        : 0.42 + 0.1 * Math.sin(now / 900);

      // Edges
      for (const e of data.edges) {
        const a = nodeXY(e.source);
        const b = nodeXY(e.target);
        const hl =
          Boolean(active) &&
          (e.source === active || e.target === active);
        const dim = fadeOthers && !hl;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = hl
          ? `rgba(129,140,248,${0.55 + pulse * 0.25})`
          : dim
            ? "rgba(148,163,184,0.04)"
            : "rgba(96,165,250,0.14)";
        ctx.lineWidth = hl ? 1.35 : 0.65;
        if (hl) {
          ctx.shadowColor = "rgba(129,140,248,0.35)";
          ctx.shadowBlur = 8;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Nodes
      for (const n of data.nodes) {
        const { x, y } = nodeXY(n.id);
        const isSel = selectedId.current === n.id;
        const isHov = hoverId.current === n.id;
        const inSet =
          !fadeOthers ||
          n.id === active ||
          (conn?.has(n.id) ?? false);
        const alpha = inSet ? 1 : 0.12;
        const img = images.get(n.id);

        ctx.save();
        ctx.globalAlpha = alpha;

        if (inSet && (isSel || isHov)) {
          const gr = NODE_R + (isSel ? 10 : 7);
          ctx.beginPath();
          ctx.arc(x, y, gr, 0, Math.PI * 2);
          ctx.fillStyle = isSel
            ? "rgba(129,140,248,0.2)"
            : "rgba(96,165,250,0.14)";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, NODE_R, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(8,10,18,0.94)";
        ctx.fill();

        if (img && img !== "err") {
          ctx.save();
          // Many checked-in SVGs are black or #231f20; without a light pad they disappear on the dark node fill.
          ctx.beginPath();
          ctx.arc(x, y, NODE_R * 0.88, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(248,250,252,0.98)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, NODE_R * 0.88, 0, Math.PI * 2);
          ctx.clip();
          const iw = img.naturalWidth;
          const ih = img.naturalHeight;
          const aspect = iw / ih;
          const d = NODE_R * 1.76;
          let dw: number;
          let dh: number;
          if (aspect > 1) {
            dh = d;
            dw = d * aspect;
          } else {
            dw = d;
            dh = d / aspect;
          }
          ctx.globalAlpha = alpha * 0.95;
          ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
          ctx.restore();
        } else {
          ctx.fillStyle = `#${n.brandColor}`;
          ctx.globalAlpha = alpha * 0.35;
          ctx.beginPath();
          ctx.arc(x, y, NODE_R * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, NODE_R, 0, Math.PI * 2);
        ctx.strokeStyle = inSet
          ? `#${n.brandColor}`
          : "rgba(148,163,184,0.25)";
        ctx.lineWidth = inSet ? 1.8 : 0.8;
        ctx.globalAlpha = alpha * (inSet ? 0.85 : 0.4);
        ctx.stroke();

        ctx.fillStyle =
          alpha > 0.5 ? "rgba(237,242,255,0.92)" : "rgba(148,163,184,0.35)";
        ctx.globalAlpha = alpha;
        ctx.font = "600 11px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const short =
          n.label.length > 14 ? `${n.label.slice(0, 12)}…` : n.label;
        ctx.fillText(short, x, y + NODE_R + 6);

        ctx.restore();
      }
    },
    [
      width,
      height,
      data.edges,
      data.nodes,
      basePos,
      floats,
      adj,
      images,
      reducedMotion,
      nodeById,
    ],
  );

  const drawBg = useCallback(
    (ctx: CanvasRenderingContext2D, now: number) => {
      ctx.clearRect(0, 0, width, height);
      if (reducedMotion) return;
      const parts = particlesRef.current;
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147,197,253,${p.a * (0.82 + 0.18 * Math.sin(now / 1800 + p.x * 0.012))})`;
        ctx.fill();
      }
    },
    [width, height, reducedMotion],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const bg = bgRef.current;
    if (!canvas || !bg || width < 16 || height < 16) return;
    const ctx = canvas.getContext("2d");
    const bctx = bg.getContext("2d");
    if (!ctx || !bctx) return;

    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    bg.width = width * dpr;
    bg.height = height * dpr;
    bg.style.width = `${width}px`;
    bg.style.height = `${height}px`;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    const tick = (t: number) => {
      drawBg(bctx, t);
      draw(ctx, t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width, height, draw, drawBg]);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = pickNode(x, y);
      setHover(id);
    },
    [pickNode, setHover],
  );

  const onLeave = useCallback(() => {
    setHover(null);
  }, [setHover]);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.stopPropagation();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = pickNode(x, y);
      if (!id) {
        selectedId.current = null;
        onSelect?.(null);
        bump((n) => n + 1);
        return;
      }
      if (selectedId.current === id) {
        selectedId.current = null;
        onSelect?.(null);
      } else {
        selectedId.current = id;
        const node = data.nodes.find((n) => n.id === id) ?? null;
        onSelect?.(node);
      }
      bump((n) => n + 1);
    },
    [pickNode, onSelect, data.nodes],
  );

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={bgRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      />
      <canvas
        ref={canvasRef}
        className="relative z-[1] block h-full w-full cursor-default"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
        role="img"
        aria-label="Interactive system map of technologies and how they connect"
      />
    </div>
  );
}
