"use client";

import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { GraphData, NodeType } from "@/lib/graph";

const KnowledgeGraph = dynamic(() => import("./KnowledgeGraph"), {
  ssr: false,
});

// ── Legend chip ─────────────────────────────────────────────────

const LEGEND: { type: NodeType; label: string; color: string }[] = [
  { type: "project", label: "Projects", color: "#3b82f6" },
  { type: "blog", label: "Blog Posts", color: "#a78bfa" },
  { type: "skill", label: "Skills", color: "#6b7280" },
];

// ── Section ────────────────────────────────────────────────────

interface GraphSectionProps {
  data: GraphData;
}

export default function GraphSection({ data }: GraphSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const reduced = useReducedMotion();

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDimensions({
      width: Math.round(rect.width),
      height: Math.min(Math.round(rect.width * 0.55), 520),
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const stableData = useMemo(() => data, [data]);

  if (reduced) {
    return (
      <section id="graph" className="py-20 px-6">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
            Knowledge Graph
          </h2>
          <p className="text-muted max-w-xl mx-auto">
            An interactive graph connecting my projects, blog posts, and skills.
            Disabled for reduced-motion preference.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="graph" className="py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
            Knowledge Graph
          </h2>
          <p className="text-muted max-w-xl mx-auto text-sm">
            How my projects, writing, and skills connect.
            <span className="hidden sm:inline">
              {" "}Hover to explore — click a node to focus, click again to navigate.
            </span>
          </p>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-5 mb-6">
          {LEGEND.map((item) => (
            <div key={item.type} className="flex items-center gap-1.5 text-xs text-muted">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>

        {/* Graph canvas */}
        <div
          ref={containerRef}
          className="relative w-full rounded-xl border border-white/5 bg-black/30 overflow-hidden"
          style={{ minHeight: 320 }}
        >
          {dimensions.width > 0 && (
            <KnowledgeGraph
              data={stableData}
              width={dimensions.width}
              height={dimensions.height}
            />
          )}

          {/* Vignette overlay so edges don't end abruptly */}
          <div
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(10, 10, 12, 0.85) 100%)",
            }}
          />
        </div>

        {/* Mobile tap hint */}
        <p className="sm:hidden text-center text-xs text-muted mt-3">
          Tap a node to focus — tap again to visit the page.
        </p>
      </div>
    </section>
  );
}
