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
  { key: "role", label: "Experience", color: "#3b82f6" },
  { key: "project", label: "Key Projects", color: "#22d3ee" },
  { key: "skill", label: "Skills", color: "#64748b" },
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
    <div className="flex aspect-[10/7] max-h-[min(380px,85vw)] w-full items-center justify-center sm:max-h-[440px] lg:aspect-auto lg:min-h-[min(640px,76vh)] lg:max-h-none">
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
  const prevKey = useRef<string | null>(null);
  /** Stable across parent re-renders so we do not re-run fade on the same selection (mobile was getting opacity stuck at 0 when rAF was cancelled). */
  const narrativeKey = node?.id ?? "__default__";

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    if (narrativeKey === prevKey.current) {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      return;
    }
    prevKey.current = narrativeKey;

    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    const raf = requestAnimationFrame(() => {
      if (panelRef.current !== el) return;
      el.style.transition = "opacity 0.28s ease, transform 0.28s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
    return () => {
      cancelAnimationFrame(raf);
      if (panelRef.current === el) {
        el.style.transition = "";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }
    };
  }, [narrativeKey]);

  const pillClass =
    "rounded-md border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-medium text-[var(--text-muted)]";

  if (!node) {
    return (
      <div ref={panelRef} className="flex h-full flex-col justify-center">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-cyan-400/90">
          {DEFAULT_NARRATIVE.eyebrow}
        </p>
        <h3 className={`mb-3 font-semibold text-[var(--text-primary)] ${compact ? "text-sm" : "text-lg"}`}>
          {DEFAULT_NARRATIVE.title}
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-[var(--text-muted)]">
          {DEFAULT_NARRATIVE.body}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]/60">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400/50" />
          Click a node to explore
        </div>
      </div>
    );
  }

  const roleDetail =
    node.type === "role" && Boolean(node.company || node.jobTitle);

  if (roleDetail) {
    return (
      <div ref={panelRef} className="flex h-full flex-col justify-center">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-cyan-400/90">
          {DEFAULT_NARRATIVE.eyebrow}
        </p>
        <h3
          className={`mb-2 font-semibold text-[var(--text-primary)] ${compact ? "text-xs" : "text-base"}`}
        >
          {DEFAULT_NARRATIVE.title}
        </h3>
        {node.company && (
          <p
            className={`font-bold tracking-tight text-white ${compact ? "text-sm" : "text-lg"}`}
          >
            {node.company}
          </p>
        )}
        {node.jobTitle && (
          <p className="mt-1 text-sm font-medium text-cyan-400">{node.jobTitle}</p>
        )}
        {node.period && (
          <p className="mt-2 text-sm text-[var(--text-muted)]">{node.period}</p>
        )}
        {node.context && (
          <p className="mt-1 text-[10px] italic text-cyan-400/45">{node.context}</p>
        )}

        {node.badges && node.badges.length > 0 && (
          <div className="mb-3 mt-3 flex flex-wrap gap-1.5">
            {node.badges.map((b) => {
              const m = BADGE_META[b];
              return (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${m.color}12`,
                    color: m.color,
                    border: `1px solid ${m.color}28`,
                  }}
                >
                  <span className="text-[8px]">{m.icon}</span>
                  {m.label}
                </span>
              );
            })}
          </div>
        )}

        {node.highlights && node.highlights.length > 0 ? (
          <ul className={`mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed text-[var(--text-muted)] ${compact ? "text-xs" : ""}`}>
            {node.highlights.map((line, i) => (
              <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
            ))}
          </ul>
        ) : (
          node.summary && (
            <p className={`mt-3 text-sm leading-relaxed text-[var(--text-muted)] ${compact ? "text-xs" : ""}`}>
              {node.summary}
            </p>
          )
        )}

        {node.impact && (
          <p className={`mt-3 text-xs leading-relaxed ${compact ? "text-[10px]" : ""}`}>
            <span className="font-medium text-cyan-400/90">Impact </span>
            <span className="text-[var(--text-muted)]">{node.impact}</span>
          </p>
        )}

        {node.techs && node.techs.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {node.techs.map((t) => (
              <span key={t} className={pillClass}>
                {t}
              </span>
            ))}
          </div>
        )}

        {node.url && (
          <p className="mt-4 text-[10px] text-[var(--text-muted)]/55">
            Click again to view full page →
          </p>
        )}
      </div>
    );
  }

  return (
    <div ref={panelRef} className="flex h-full flex-col justify-center">
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
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

      <h3 className={`mb-2 font-semibold leading-tight text-[var(--text-primary)] ${compact ? "text-sm" : "text-base"}`}>
        {node.label}
      </h3>

      {node.badges && node.badges.length > 0 && (
        <div className="mb-2.5 flex gap-1.5">
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
        <p className="mb-2.5 text-sm leading-relaxed text-[var(--text-muted)]">{node.summary}</p>
      )}

      {node.impact && (
        <p className="mb-2.5 text-xs leading-relaxed">
          <span className="font-medium text-[var(--accent)]">Impact </span>
          <span className="text-[var(--text-muted)]">{node.impact}</span>
        </p>
      )}

      {node.techs && node.techs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {node.techs.map((t) => (
            <span key={t} className={pillClass}>
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

  /** Read the *CSS-sized* graph frame only. The SVG is absolutely positioned so it cannot inflate this box (avoids ResizeObserver ↔ height feedback loops). */
  const measure = useCallback(() => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w <= 0 || h <= 0) return;
    setDims((prev) =>
      prev.width === w && prev.height === h ? prev : { width: w, height: h },
    );
  }, []);

  useEffect(() => {
    measure();
    const raf = requestAnimationFrame(() => measure());
    window.addEventListener("resize", measure);
    const el = canvasRef.current;
    let ro: ResizeObserver | undefined;
    if (el && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      ro.observe(el);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
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
      <section id="about" className="px-4 py-16 sm:px-6 sm:py-20 md:px-8">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-white text-gradient sm:mb-4 sm:text-3xl">
            About
          </h2>
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
    <section
      ref={sectionRef}
      id="about"
      className="relative overflow-x-hidden py-16 sm:py-24 md:py-28"
    >
      {/* Section wash — full-bleed, low contrast */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[85%] bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(56,189,248,0.07),transparent_65%)]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <div data-anim className="mb-6 sm:mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-gradient sm:text-4xl md:text-5xl">
            About
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] sm:mt-3 sm:text-base">
            How my roles, projects, and skills connect — an evolving{" "}
            <strong className="font-semibold text-white/90">system</strong>, not a timeline.
          </p>
        </div>

        <div
          data-anim
          className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[11px] text-[var(--text-muted)] sm:mb-8 sm:gap-x-8 sm:gap-y-3 sm:text-sm"
        >
          {LEGEND.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Centerpiece: graph + glowing spine + panel share one card height (lg+) */}
      <div
        data-anim
        className="relative mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-8 xl:px-10"
      >
        <div className="flex flex-col gap-4 sm:gap-6 lg:gap-0">
          <div
            className={[
              "flex min-h-0 flex-col overflow-hidden rounded-xl border border-cyan-500/15 bg-[#030508] sm:rounded-2xl",
              "shadow-[0_0_0_1px_rgba(34,211,238,0.08)_inset,0_0_80px_-20px_rgba(34,211,238,0.14)]",
              "lg:flex-row lg:items-stretch lg:min-h-[min(640px,76vh)]",
            ].join(" ")}
          >
            <div
              ref={canvasRef}
              className={[
                "relative isolate w-full min-w-0 overflow-hidden rounded-xl border border-cyan-500/10 bg-[#030508]",
                "shadow-[0_0_0_1px_rgba(34,211,238,0.06)_inset,0_0_80px_-20px_rgba(34,211,238,0.12)] sm:rounded-2xl",
                /* Mobile/tablet: fixed aspect + max height — height does NOT come from SVG (prevents runaway vertical growth). */
                "max-lg:mx-auto max-lg:flex-none max-lg:aspect-[10/7] max-lg:max-h-[min(380px,85vw)] max-lg:min-h-0 sm:max-lg:max-h-[min(440px,82vw)]",
                "lg:flex-1 lg:aspect-auto lg:max-h-none lg:min-h-0 lg:rounded-none lg:border-0 lg:shadow-none",
              ].join(" ")}
              onMouseMove={onMouseMove}
            >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.5]"
              aria-hidden
              style={{
                backgroundImage: [
                  "radial-gradient(1.2px 1.2px at 6% 14%, rgba(255,255,255,0.4), transparent)",
                  "radial-gradient(1px 1px at 18% 72%, rgba(147,197,253,0.5), transparent)",
                  "radial-gradient(1.5px 1.5px at 34% 28%, rgba(255,255,255,0.25), transparent)",
                  "radial-gradient(1px 1px at 52% 8%, rgba(165,243,252,0.45), transparent)",
                  "radial-gradient(1px 1px at 71% 64%, rgba(255,255,255,0.3), transparent)",
                  "radial-gradient(1.2px 1.2px at 88% 22%, rgba(125,211,252,0.4), transparent)",
                  "radial-gradient(1px 1px at 92% 78%, rgba(255,255,255,0.22), transparent)",
                  "radial-gradient(1px 1px at 12% 44%, rgba(186,230,253,0.35), transparent)",
                  "radial-gradient(1.3px 1.3px at 45% 88%, rgba(255,255,255,0.28), transparent)",
                  "radial-gradient(1px 1px at 63% 38%, rgba(103,232,249,0.4), transparent)",
                  "radial-gradient(1px 1px at 78% 12%, rgba(255,255,255,0.2), transparent)",
                  "radial-gradient(1.2px 1.2px at 25% 91%, rgba(147,197,253,0.35), transparent)",
                  "radial-gradient(1px 1px at 56% 52%, rgba(255,255,255,0.18), transparent)",
                  "radial-gradient(1px 1px at 39% 6%, rgba(224,242,254,0.5), transparent)",
                  "radial-gradient(1.4px 1.4px at 84% 48%, rgba(255,255,255,0.32), transparent)",
                ].join(", "),
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              aria-hidden
              style={{
                background: [
                  `radial-gradient(ellipse 55% 40% at ${38 + mousePos.x * 8}% ${36 + mousePos.y * 10}%, rgba(56,189,248,0.14), transparent 70%)`,
                  "radial-gradient(ellipse 80% 55% at 50% 120%, rgba(15,23,42,0.85), transparent 55%)",
                  "radial-gradient(ellipse 50% 35% at 80% 20%, rgba(34,211,238,0.08), transparent 65%)",
                ].join(", "),
              }}
            />

            <div className="absolute inset-0 z-[1] min-h-0 min-w-0">
              <GraphErrorBoundary>
                {dims.width > 0 && dims.height > 0 && (
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
            </div>

            <Tooltip
              node={hovered && !selected ? hovered : null}
              containerRef={canvasRef}
            />

            <div
              className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl lg:rounded-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 45%, rgba(2,4,8,0.75) 100%)",
              }}
            />

            <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden max-w-[min(92%,20rem)] -translate-x-1/2 px-2 text-center text-[11px] leading-snug text-[var(--text-muted)]/55 sm:bottom-4 sm:block sm:max-w-[90%] sm:px-0 sm:text-xs">
              Guided path highlighted — click any node for details
            </p>
            <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 max-w-[min(92%,18rem)] -translate-x-1/2 px-2 text-center text-[10px] leading-snug text-[var(--text-muted)]/55 sm:bottom-4 sm:hidden sm:text-[11px]">
              Tap a node for details
            </p>
            </div>

            {/* Full-height glowing spine between graph and detail panel */}
            <div
              className="pointer-events-none relative z-[2] hidden w-0 shrink-0 self-stretch overflow-visible lg:block"
              aria-hidden
            >
              <div
                className="absolute bottom-0 left-1/2 top-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-cyan-200/35 via-cyan-400/85 to-cyan-200/35 shadow-[0_0_8px_2px_rgba(34,211,238,0.38),0_0_20px_6px_rgba(56,189,248,0.14)]"
              />
            </div>

            <aside className="hidden min-h-0 min-w-0 shrink-0 flex-col lg:flex lg:w-[min(320px,34%)] lg:max-w-[380px]">
              <div className="flex h-full min-h-0 flex-col justify-center overflow-y-auto border-t border-white/10 bg-black/40 px-6 py-8 shadow-[inset_12px_0_48px_-28px_rgba(34,211,238,0.12)] backdrop-blur-xl lg:border-t-0 lg:px-7 lg:py-10">
                <NarrativePanel node={selected} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {selected && (
        <div className="mx-auto mt-4 w-full max-w-[1600px] px-3 sm:mt-6 sm:px-6 lg:hidden">
          <div className="max-h-[min(70dvh,560px)] overflow-y-auto overscroll-contain rounded-xl border border-white/10 border-l-2 border-l-cyan-400/55 bg-black/40 px-4 py-3.5 shadow-[0_0_40px_-14px_rgba(34,211,238,0.15)] backdrop-blur-xl sm:rounded-2xl sm:px-5 sm:py-4">
            <NarrativePanel key={selected.id} node={selected} compact />
          </div>
        </div>
      )}
    </section>
  );
}
