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
  type LinkKind,
} from "@/lib/graph-types";

const KnowledgeGraph = dynamic(() => import("../graph/KnowledgeGraph"), {
  ssr: false,
  loading: () => <GraphSkeleton />,
});

// ── Constants ───────────────────────────────────────────────────

const LEGEND: { key: string; label: string; color: string }[] = [
  { key: "role", label: "Experience", color: "#22d3ee" },
  { key: "project", label: "Key Projects", color: "#3b82f6" },
  { key: "skill", label: "Skills & Systems", color: "#6b7280" },
  { key: "blog", label: "Writing", color: "#a78bfa" },
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

type ViewMode = "overview" | "explore";

// ── Loading skeleton ────────────────────────────────────────────

function GraphSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
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
  const prevNodeId = useRef<string | null>(null);

  useEffect(() => {
    if (!panelRef.current) return;
    const currentId = node?.id ?? null;
    if (currentId === prevNodeId.current) return;
    prevNodeId.current = currentId;

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
        <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] mb-1.5">
          {DEFAULT_NARRATIVE.subtitle}
        </p>
        <h3 className={`font-semibold text-[var(--text-primary)] mb-2 ${compact ? "text-sm" : "text-lg"}`}>
          {DEFAULT_NARRATIVE.title}
        </h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {DEFAULT_NARRATIVE.body}
        </p>
      </div>
    );
  }

  return (
    <div ref={panelRef} className="flex h-full flex-col justify-center">
      {/* Type badge + period + context */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1.5">
        <p className="text-[10px] uppercase tracking-widest text-[var(--accent)]">
          {TYPE_LABELS[node.type]}
        </p>
        {node.period && (
          <span className="text-[10px] text-[var(--text-muted)]/70">{node.period}</span>
        )}
        {node.context && (
          <span className="text-[10px] italic text-cyan-400/60">{node.context}</span>
        )}
      </div>

      <h3 className={`font-semibold text-[var(--text-primary)] leading-tight mb-2 ${compact ? "text-sm" : "text-base"}`}>
        {node.label}
      </h3>

      {/* Impact badges */}
      {node.badges && node.badges.length > 0 && (
        <div className="flex gap-1.5 mb-2.5">
          {node.badges.map((b) => {
            const meta = BADGE_META[b];
            return (
              <span
                key={b}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${meta.color}15`,
                  color: meta.color,
                  border: `1px solid ${meta.color}30`,
                }}
              >
                <span className="text-[8px]">{meta.icon}</span>
                {meta.label}
              </span>
            );
          })}
        </div>
      )}

      {node.summary && (
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-2.5">
          {node.summary}
        </p>
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
        <p className="mt-3 text-[10px] text-[var(--text-muted)]">
          Click again to view full page →
        </p>
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
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!node || !containerRef.current) {
      setPos(null);
      return;
    }
    const onMove = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const tooltipW = tooltipRef.current?.offsetWidth ?? 200;
      const tooltipH = tooltipRef.current?.offsetHeight ?? 60;

      let x = e.clientX - rect.left + 14;
      let y = e.clientY - rect.top - 10;

      if (x + tooltipW > rect.width - 8) x = e.clientX - rect.left - tooltipW - 14;
      if (y - tooltipH < 8) y = e.clientY - rect.top + 20;

      setPos({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [node, containerRef]);

  if (!node || !pos) return null;

  return (
    <div
      ref={tooltipRef}
      className="pointer-events-none absolute z-30 max-w-[220px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 shadow-xl transition-opacity duration-150"
      style={{ left: pos.x, top: pos.y, transform: "translateY(-100%)" }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <p className="text-[10px] uppercase tracking-wider text-[var(--accent)]">
          {TYPE_LABELS[node.type]}
        </p>
        {node.badges && node.badges.length > 0 && (
          <div className="flex gap-0.5">
            {node.badges.map((b) => (
              <span
                key={b}
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: BADGE_META[b].color }}
              />
            ))}
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-[var(--text-primary)] leading-tight">
        {node.label}
      </p>
      {node.context && (
        <p className="mt-0.5 text-[9px] italic text-cyan-400/60">{node.context}</p>
      )}
      {node.summary && (
        <p className="mt-1 text-[10px] text-[var(--text-muted)] leading-snug line-clamp-2">
          {node.summary}
        </p>
      )}
    </div>
  );
}

// ── Performance detection ───────────────────────────────────────

function useIsLowPerf(): boolean {
  const [low, setLow] = useState(false);
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency ?? 4;
    setLow(isMobile || cores <= 2);
  }, []);
  return low;
}

function pruneForPerformance(data: GraphData): GraphData {
  const keep = new Set<string>();
  for (const n of data.nodes) {
    if (n.type === "role" || n.type === "project") keep.add(n.id);
  }
  const linkCount = new Map<string, number>();
  for (const l of data.links) {
    const s = typeof l.source === "string" ? l.source : "";
    const t = typeof l.target === "string" ? l.target : "";
    linkCount.set(s, (linkCount.get(s) ?? 0) + 1);
    linkCount.set(t, (linkCount.get(t) ?? 0) + 1);
  }
  for (const n of data.nodes) {
    if (n.type === "skill" && (linkCount.get(n.id) ?? 0) >= 2) keep.add(n.id);
    if (n.type === "blog") keep.add(n.id);
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

// ── Mode toggle ─────────────────────────────────────────────────

function ModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--bg)] p-0.5">
      {(["overview", "explore"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-all duration-200 ${
            mode === m
              ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          {m === "overview" ? "Overview" : "Explore"}
        </button>
      ))}
    </div>
  );
}

// ── Badge legend ────────────────────────────────────────────────

function BadgeLegend() {
  return (
    <div className="flex flex-wrap gap-3 mt-2">
      {(Object.entries(BADGE_META) as [BadgeKind, typeof BADGE_META[BadgeKind]][]).map(
        ([key, meta]) => (
          <div key={key} className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            {meta.label}
          </div>
        ),
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

interface AboutProps {
  overviewData: GraphData;
  exploreData: GraphData;
}

export default function About({ overviewData, exploreData }: AboutProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mode, setMode] = useState<ViewMode>("overview");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const reduced = useReducedMotion();
  const lowPerf = useIsLowPerf();

  const activeData = useMemo(() => {
    const raw = mode === "overview" ? overviewData : exploreData;
    return lowPerf ? pruneForPerformance(raw) : raw;
  }, [mode, overviewData, exploreData, lowPerf]);

  const storyNodeIds = mode === "overview" ? STORY_NODE_IDS : undefined;
  const storyEdgeList = mode === "overview" ? STORY_EDGES : undefined;

  const measure = useCallback(() => {
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    setDimensions({
      width: Math.round(rect.width),
      height: Math.min(Math.round(rect.width * 0.65), 560),
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const handleModeChange = useCallback((m: ViewMode) => {
    setMode(m);
    setSelectedNode(null);
    setHoveredNode(null);
  }, []);

  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    setSelectedNode(node);
  }, []);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
  }, []);

  // Entrance animation
  useLayoutEffect(() => {
    if (reduced || !sectionRef.current) return;
    const targets = sectionRef.current.querySelectorAll("[data-about-animate]");
    gsap.set(targets, { opacity: 0, y: 40, filter: "blur(4px)" });
    const tween = gsap.to(targets, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.8,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
    });
    return () => {
      tween.kill();
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === sectionRef.current)
        .forEach((st) => st.kill());
    };
  }, [reduced]);

  if (reduced) {
    return (
      <section id="about" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4 text-gradient">
            About
          </h2>
          <p className="text-[var(--text-muted)] leading-relaxed max-w-2xl">
            Software engineer from IIT Kharagpur focused on backend systems,
            infrastructure, and developer tooling. I build production analytics
            platforms, agentic services, vector search pipelines, and LLM
            integrations.
          </p>
          <p className="mt-3 text-sm text-[var(--text-muted)]/70">
            Interactive system map disabled for reduced-motion preference.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="about" className="py-20 px-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div data-about-animate className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gradient">
              About
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)] max-w-md">
              How my roles, projects, and skills connect — an evolving system, not a timeline.
            </p>
          </div>
          <ModeToggle mode={mode} onChange={handleModeChange} />
        </div>

        {/* Legend row */}
        <div data-about-animate className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5">
          {LEGEND.filter((l) => mode === "explore" || l.key !== "blog").map(
            (item) => (
              <div
                key={item.key}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </div>
            ),
          )}
          <span className="hidden sm:inline text-[var(--border)]">|</span>
          <BadgeLegend />
        </div>

        {/* Main layout */}
        <div data-about-animate className="grid gap-5 lg:grid-cols-[1fr_280px]">
          {/* Graph */}
          <div
            ref={canvasContainerRef}
            className="relative w-full rounded-xl border border-white/5 bg-black/20 overflow-hidden"
            style={{ minHeight: 400 }}
          >
            <GraphErrorBoundary>
              {dimensions.width > 0 && (
                <KnowledgeGraph
                  data={activeData}
                  width={dimensions.width}
                  height={dimensions.height}
                  storyNodeIds={storyNodeIds}
                  storyEdges={storyEdgeList}
                  onNodeSelect={handleNodeSelect}
                  onNodeHoverChange={handleNodeHover}
                />
              )}
            </GraphErrorBoundary>

            <Tooltip
              node={hoveredNode && !selectedNode ? hoveredNode : null}
              containerRef={canvasContainerRef}
            />

            <div
              className="pointer-events-none absolute inset-0 rounded-xl"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 50%, rgba(10, 10, 12, 0.85) 100%)",
              }}
            />
          </div>

          {/* Narrative panel (desktop) */}
          <div className="hidden lg:flex flex-col rounded-xl border border-white/5 bg-black/20 px-5 py-5">
            <NarrativePanel node={selectedNode} />
          </div>
        </div>

        {/* Narrative panel (mobile) */}
        {selectedNode && (
          <div className="mt-4 rounded-xl border border-white/5 bg-black/20 px-5 py-4 lg:hidden">
            <NarrativePanel node={selectedNode} compact />
          </div>
        )}

        {/* Hint */}
        <div data-about-animate className="mt-3 text-center">
          <p className="text-xs text-[var(--text-muted)] hidden sm:block">
            {mode === "overview"
              ? "Guided path highlighted — click any node for details."
              : "Full graph — hover to preview, click to focus, click again to navigate."}
          </p>
          <p className="text-xs text-[var(--text-muted)] sm:hidden">
            Tap a node to see details.
          </p>
        </div>
      </div>
    </section>
  );
}
