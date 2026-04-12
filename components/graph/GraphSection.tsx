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
import { motion, AnimatePresence } from "framer-motion";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import GraphErrorBoundary from "./GraphErrorBoundary";
import { SectionContinue } from "@/components/journey";
import {
  HIGHLIGHT_TECH_EVENT,
  scrollToSectionId,
  type HighlightTechDetail,
} from "@/lib/journey";
import { systemNodeMatchesStack } from "@/lib/stack-match";
import type { ProjectMeta } from "@/lib/types";
import { buildSystemGraph } from "@/lib/system-graph";
import type { SystemNode } from "@/lib/system-graph";

const SystemVisualization = dynamic(() => import("./SystemVisualization"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[420px] items-center justify-center lg:min-h-[520px]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
    </div>
  ),
});

const systemData = buildSystemGraph();

interface GraphSectionProps {
  projects: ProjectMeta[];
}

export default function GraphSection({ projects }: GraphSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [selected, setSelected] = useState<SystemNode | null>(null);
  const reduced = useReducedMotion();

  const measure = useCallback(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = Math.round(rect.width);
    if (w < 32) return;
    const h = Math.max(360, Math.round(rect.height));
    setDims({ width: w, height: Math.min(h, 640) });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    const el = canvasWrapRef.current;
    let ro: ResizeObserver | undefined;
    if (el && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      ro.observe(el);
    }
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [measure]);

  useLayoutEffect(() => {
    if (reduced || !sectionRef.current) return;

    const heading = sectionRef.current.querySelector("[data-sys-heading]");
    const sub = sectionRef.current.querySelector("[data-sys-sub]");
    const legend = sectionRef.current.querySelector("[data-sys-legend]");
    const canvas = sectionRef.current.querySelector("[data-sys-canvas]");

    const targets = [heading, sub, legend, canvas].filter(Boolean);
    gsap.set(targets, { opacity: 0, y: 36, filter: "blur(4px)" });

    const tween = gsap.to(targets, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.75,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        once: true,
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === sectionRef.current)
        .forEach((st) => st.kill());
    };
  }, [reduced]);

  const stableData = useMemo(() => systemData, []);

  const onSystemSelect = useCallback(
    (node: SystemNode | null) => {
      setSelected(node);
      if (!node) return;
      const matchingSlugs = projects
        .filter((p) => systemNodeMatchesStack(node, p.stack))
        .map((p) => p.slug);
      window.dispatchEvent(
        new CustomEvent<HighlightTechDetail>(HIGHLIGHT_TECH_EVENT, {
          detail: { nodeId: node.id, matchingSlugs },
        }),
      );
      if (matchingSlugs.length > 0) {
        scrollToSectionId("projects");
      }
    },
    [projects],
  );

  if (reduced) {
    return (
      <section id="graph" className="relative w-full py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white">
            System map
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            An interactive view of how I connect platforms, data, and APIs.
            Disabled when reduced motion is preferred.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="graph"
      className="relative w-full overflow-hidden py-24 sm:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(59,130,246,0.08),transparent_55%),radial-gradient(ellipse_50%_40%_at_80%_60%,rgba(139,92,246,0.06),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
        }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-8">
        <div data-sys-heading className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            System map
          </h2>
        </div>
        <p
          data-sys-sub
          className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-[var(--text-muted)] sm:text-base"
        >
          How I think in systems: platforms, data paths, and APIs working
          together — not a pile of isolated tools. Hover to trace connections;
          click a technology for where I have used it.
        </p>

        <div
          data-sys-legend
          className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs text-[var(--text-muted)] sm:text-sm"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
            Platform &amp; runtime
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.45)]" />
            Data &amp; messaging
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-px w-6 bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
            Real architectural links
          </div>
        </div>
      </div>

      <div
        data-sys-canvas
        className="relative mx-auto mt-12 w-[min(92vw,1420px)]"
      >
        <div className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#05060a]/85 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_0_100px_-40px_rgba(59,130,246,0.12)] lg:flex-row lg:items-stretch">
          <div
            ref={canvasWrapRef}
            className="relative h-[clamp(420px,52vh,600px)] w-full flex-1 overflow-hidden bg-[#05060a] lg:min-h-[520px]"
          >
            <GraphErrorBoundary>
              {dims.width > 0 && dims.height > 0 && (
                <SystemVisualization
                  data={stableData}
                  width={dims.width}
                  height={dims.height}
                  reducedMotion={reduced}
                  onSelect={onSystemSelect}
                />
              )}
            </GraphErrorBoundary>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 42%, rgba(3,4,8,0.65) 100%)",
              }}
            />
          </div>

          <AnimatePresence mode="wait">
            {selected && (
              <motion.aside
                key={selected.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="w-full shrink-0 border-t border-white/[0.08] bg-black/45 px-6 py-8 backdrop-blur-xl sm:px-8 lg:w-[min(100%,340px)] lg:border-l lg:border-t-0 lg:border-white/[0.06]"
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-violet-300/80">
                  In production systems
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
                  {selected.label}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
                  {selected.usage}
                </p>
                <p className="mt-5 border-t border-white/10 pt-5 text-sm leading-relaxed">
                  <span className="font-medium text-sky-400/90">Impact </span>
                  <span className="text-[var(--text-muted)]">
                    {selected.impact}
                  </span>
                </p>
                <button
                  type="button"
                  className="mt-6 text-xs text-[var(--text-muted)]/70 underline-offset-4 transition hover:text-white hover:underline"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-[11px] text-[var(--text-muted)]/55 sm:text-xs">
          Calm motion by design — click empty space on the map to clear your
          selection.
        </p>

        <div className="relative mx-auto mt-4 w-full max-w-[1600px] px-4 sm:px-8">
          <SectionContinue cta="Read my thinking ↓" toId="blog" />
        </div>
      </div>
    </section>
  );
}
