"use client";

import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import GraphErrorBoundary from "@/components/graph/GraphErrorBoundary";
import {
  STORY_NODE_IDS,
  STORY_EDGES,
  DEFAULT_NARRATIVE,
  type GraphData,
  type GraphNode,
  type NodeType,
  type BadgeKind,
} from "@/lib/graph-types";

const CareerGraph = dynamic(() => import("../graph/CareerGraph"), {
  ssr: false,
  loading: () => <GraphSkeleton />,
});

// ── Constants ───────────────────────────────────────────────────

const LEGEND: { key: string; label: string; color: string }[] = [
  { key: "role", label: "Experience", color: "#22d3ee" },
  { key: "project", label: "Key Projects", color: "#3b82f6" },
  { key: "skill", label: "Skills", color: "#475569" },
];

const TYPE_LABELS: Record<NodeType, string> = {
  role: "Work Experience",
  project: "Project",
  blog: "Blog Post",
  skill: "Skill",
};

const BADGE_META: Record<BadgeKind, { label: string; icon: string; color: string }> = {
  production: { label: "Production", icon: "⚙", color: "#22c55e" },
  scale:      { label: "Scale",      icon: "↗", color: "#f59e0b" },
  analytics:  { label: "Analytics",  icon: "◆", color: "#3b82f6" },
};

// ── Loading skeleton ────────────────────────────────────────────

function GraphSkeleton() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        <p className="text-xs text-[var(--text-muted)]">Loading graph&hellip;</p>
      </div>
    </div>
  );
}

// ── Narrative panel ─────────────────────────────────────────────

interface NarrativePanelProps {
  node: GraphNode | null;
  compact?: boolean;
}

function NarrativePanel({ node, compact }: NarrativePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!panelRef.current) return;
    const id = node?.id ?? null;
    if (id === prevId.current) return;
    prevId.current = id;
    const el = panelRef.current;
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    const raf = requestAnimationFrame(() => {
      el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
    return () => cancelAnimationFrame(raf);
  }, [node]);

  if (!node) {
    return (
      <div ref={panelRef} className="flex h-full flex-col justify-center">
        <p className="text-[10px] uppercase tracking-widest text-cyan-400/70 mb-1.5">
          {DEFAULT_NARRATIVE.subtitle}
        </p>
        <h3 className={`font-semibold text-[var(--text-primary)] mb-3 ${compact ? "text-sm" : "text-lg"}`}>
          {DEFAULT_NARRATIVE.title}
        </h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
          {DEFAULT_NARRATIVE.body}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]/60">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400/40 animate-pulse" />
          Click a node to explore
        </div>
      </div>
    );
  }

  return (
    <div ref={panelRef} className="flex h-full flex-col justify-center">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1.5">
        <p className="text-[10px] uppercase tracking-widest text-[var(--accent)]">
          {TYPE_LABELS[node.type]}
        </p>
        {node.period && (
          <span className="text-[10px] text-[var(--text-muted)]/70">{node.period}</span>
        )}
        {node.context && (
          <span className="text-[10px] italic text-cyan-400/50">{node.context}</span>
        )}
      </div>

      <h3 className={`font-semibold text-[var(--text-primary)] leading-tight mb-2 ${compact ? "text-sm" : "text-base"}`}>
        {node.label}
      </h3>

      {node.badges && node.badges.length > 0 && (
        <div className="flex gap-1.5 mb-2.5">
          {node.badges.map((b) => {
            const m = BADGE_META[b];
            return (
              <span
                key={b}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${m.color}15`, color: m.color, border: `1px solid ${m.color}30` }}
              >
                <span className="text-[8px]">{m.icon}</span>
                {m.label}
              </span>
            );
          })}
        </div>
      )}

      {node.summary && (
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-2.5">{node.summary}</p>
      )}

      {node.impact && (
        <p className="text-xs leading-relaxed mb-2.5">
          <span className="font-medium text-[var(--accent)]">Impact </span>
          <span className="text-[var(--text-muted)]">{node.impact}</span>
        </p>
      )}

      {node.techs && node.techs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {node.techs.map((t) => (
            <span
              key={t}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {node.url && (
        <p className="mt-3 text-[10px] text-[var(--text-muted)]/60">Click again to view full page →</p>
      )}
    </div>
  );
}

// ── Tooltip ─────────────────────────────────────────────────────

interface TooltipProps {
  node: GraphNode | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function Tooltip({ node, containerRef }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!node || !containerRef.current) { setPos(null); return; }
    const onMove = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const tw = ref.current?.offsetWidth ?? 200;
      const th = ref.current?.offsetHeight ?? 60;
      let x = e.clientX - rect.left + 14;
      let y = e.clientY - rect.top - 10;
      if (x + tw > rect.width - 8) x = e.clientX - rect.left - tw - 14;
      if (y - th < 8) y = e.clientY - rect.top + 20;
      setPos({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [node, containerRef]);

  if (!node || !pos) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute z-30 max-w-[220px] rounded-lg border border-white/10 bg-[#0c0d10]/95 backdrop-blur-sm px-3 py-2 shadow-2xl"
      style={{ left: pos.x, top: pos.y, transform: "translateY(-100%)" }}
    >
      <p className="text-[10px] uppercase tracking-wider text-cyan-400/70 mb-0.5">
        {TYPE_LABELS[node.type]}
      </p>
      <p className="text-xs font-medium text-[var(--text-primary)] leading-tight">{node.label}</p>
      {node.context && <p className="mt-0.5 text-[9px] italic text-cyan-400/50">{node.context}</p>}
      {node.summary && (
        <p className="mt-1 text-[10px] text-[var(--text-muted)] leading-snug line-clamp-2">{node.summary}</p>
      )}
    </div>
  );
}

// ── Perf detection ──────────────────────────────────────────────

function useIsLowPerf(): boolean {
  const [low, setLow] = useState(false);
  useEffect(() => {
    const mob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setLow(mob || (navigator.hardwareConcurrency ?? 4) <= 2);
  }, []);
  return low;
}

function prune(data: GraphData): GraphData {
  const keep = new Set<string>();
  for (const n of data.nodes) {
    if (n.type === "role" || n.type === "project") keep.add(n.id);
  }
  const lc = new Map<string, number>();
  for (const l of data.links) {
    const s = typeof l.source === "string" ? l.source : "";
    const t = typeof l.target === "string" ? l.target : "";
    lc.set(s, (lc.get(s) ?? 0) + 1);
    lc.set(t, (lc.get(t) ?? 0) + 1);
  }
  for (const n of data.nodes) {
    if (n.type === "skill" && (lc.get(n.id) ?? 0) >= 2) keep.add(n.id);
  }
  return {
    nodes: data.nodes.filter((n) => keep.has(n.id)),
    links: data.links.filter((l) => {
      const s = typeof l.source === "string" ? l.source : "";
      const t = typeof l.target === "string" ? l.target : "";
      return keep.has(s) && keep.has(t);
    }),
  };
}

// ── Main component ──────────────────────────────────────────────

interface AboutProps {
  overviewData: GraphData;
  exploreData: GraphData;
}

export default function About({ overviewData }: AboutProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const reduced = useReducedMotion();
  const lowPerf = useIsLowPerf();

  const graphData = useMemo(
    () => lowPerf ? prune(overviewData) : overviewData,
    [overviewData, lowPerf],
  );

  const measure = useCallback(() => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDims({
      width: Math.round(rect.width),
      height: Math.min(Math.round(rect.width * 0.62), 540),
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const onSelect = useCallback((n: GraphNode | null) => setSelected(n), []);
  const onHover = useCallback((n: GraphNode | null) => setHovered(n), []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  // Entrance animation
  useLayoutEffect(() => {
    if (reduced || !sectionRef.current) return;
    const targets = sectionRef.current.querySelectorAll("[data-anim]");
    gsap.set(targets, { opacity: 0, y: 30, filter: "blur(3px)" });
    const tw = gsap.to(targets, {
      opacity: 1, y: 0, filter: "blur(0px)",
      duration: 0.7, stagger: 0.1, ease: "power3.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
    });
    return () => {
      tw.kill();
      ScrollTrigger.getAll().filter((st) => st.trigger === sectionRef.current).forEach((st) => st.kill());
    };
  }, [reduced]);

  if (reduced) {
    return (
      <section id="about" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4 text-gradient">About</h2>
          <p className="text-[var(--text-muted)] leading-relaxed max-w-2xl">
            Software engineer from IIT Kharagpur focused on backend systems,
            infrastructure, and developer tooling. I build production analytics
            platforms, agentic services, and LLM integrations.
          </p>
          <p className="mt-3 text-sm text-[var(--text-muted)]/70">
            Interactive graph disabled for reduced-motion preference.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="about" className="py-20 px-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div data-anim className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gradient">
            About
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)] max-w-lg">
            How my roles, projects, and skills connect — an evolving system, not a timeline.
          </p>
        </div>

        {/* Legend */}
        <div data-anim className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5">
          {LEGEND.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Main layout */}
        <div data-anim className="grid gap-5 lg:grid-cols-[1fr_280px]">
          {/* Graph container */}
          <div
            ref={canvasRef}
            className="relative w-full rounded-xl border border-white/[0.06] bg-[#08090c]/60 overflow-hidden"
            style={{ minHeight: 400 }}
            onMouseMove={onMouseMove}
          >
            {/* Parallax radial gradient — shifts subtly with cursor */}
            <div
              className="pointer-events-none absolute inset-0 transition-transform duration-700 ease-out"
              style={{
                background: `radial-gradient(ellipse 60% 50% at ${30 + mousePos.x * 10}% ${45 + mousePos.y * 10}%, rgba(34,211,238,0.035) 0%, transparent 70%)`,
              }}
            />

            <GraphErrorBoundary>
              {dims.width > 0 && (
                <CareerGraph
                  data={graphData}
                  width={dims.width}
                  height={dims.height}
                  storyNodeIds={STORY_NODE_IDS}
                  storyEdges={STORY_EDGES}
                  onNodeSelect={onSelect}
                  onNodeHoverChange={onHover}
                />
              )}
            </GraphErrorBoundary>

            <Tooltip
              node={hovered && !selected ? hovered : null}
              containerRef={canvasRef}
            />

            {/* Edge vignette */}
            <div
              className="pointer-events-none absolute inset-0 rounded-xl"
              style={{
                background: "radial-gradient(ellipse at center, transparent 45%, rgba(8,9,12,0.8) 100%)",
              }}
            />
          </div>

          {/* Narrative panel */}
          <div className="hidden lg:flex flex-col rounded-xl border border-white/[0.06] bg-[#08090c]/60 px-5 py-5">
            <NarrativePanel node={selected} />
          </div>
        </div>

        {/* Mobile panel */}
        {selected && (
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#08090c]/60 px-5 py-4 lg:hidden">
            <NarrativePanel node={selected} compact />
          </div>
        )}

        {/* Hint */}
        <div data-anim className="mt-3 text-center">
          <p className="text-[11px] text-[var(--text-muted)]/60 hidden sm:block">
            Guided path highlighted — click any node for details
          </p>
          <p className="text-[11px] text-[var(--text-muted)]/60 sm:hidden">
            Tap a node to see details
          </p>
        </div>
      </div>
    </section>
  );
}
