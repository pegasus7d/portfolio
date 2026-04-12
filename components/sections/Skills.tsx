"use client";

import { useRef, useLayoutEffect } from "react";
import { SectionWrapper } from "@/components/layout";
import { SectionContinue } from "@/components/journey";
import { Textify } from "@/components/textify";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const SKILL_GROUPS = [
  {
    label: "Backend & Systems",
    items: ["Java", "Go", "OpenAPI", "REST", "Distributed Systems", "Event-Driven Workers", "WebSockets"],
  },
  {
    label: "Data & Search",
    items: ["PostgreSQL", "Redis", "DuckDB", "Azure AI Search", "NFS"],
  },
  {
    label: "Infra & Delivery",
    items: ["Docker", "Linux", "Kubernetes", "KEDA", "BullMQ", "FFmpeg", "CI/CD", "DataDog"],
  },
  {
    label: "Languages",
    items: ["Scala", "Python", "JavaScript", "TypeScript", "C/C++"],
  },
  {
    label: "Frontend",
    items: ["React", "Next.js", "Node", "ECharts"],
  },
  {
    label: "Security & AI",
    items: ["JWT", "RBAC", "MCP", "LLM APIs"],
  },
] as const;

export default function Skills() {
  const gridRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !gridRef.current) return;

    const groups = gridRef.current.querySelectorAll("[data-skill-group]");

    groups.forEach((group) => {
      const label = group.querySelector("[data-skill-label]");
      const chips = group.querySelectorAll("[data-skill-chip]");

      if (label) gsap.set(label, { opacity: 0, y: 10 });
      gsap.set(chips, { opacity: 0, scale: 0.8 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: group,
          start: "top 85%",
          once: true,
        },
      });

      if (label) {
        tl.to(label, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
      }

      tl.to(
        chips,
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          stagger: 0.04,
          ease: "back.out(1.5)",
        },
        "-=0.2"
      );
    });

    return () => {
      ScrollTrigger.getAll()
        .filter((st) => {
          const trigger = st.trigger;
          return trigger && gridRef.current?.contains(trigger);
        })
        .forEach((st) => st.kill());
    };
  }, [reduced]);

  return (
    <SectionWrapper id="skills">
      <Textify
        variant="reveal"
        content="Skills"
        tag="h2"
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        trigger="scroll"
        duration={0.8}
      />

      <div ref={gridRef} className="mt-10 grid min-w-0 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {SKILL_GROUPS.map((group) => (
          <div key={group.label} data-skill-group className="min-w-0">
            <h3
              data-skill-label
              className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)]"
            >
              {group.label}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.items.map((skill) => (
                <span
                  key={skill}
                  data-skill-chip
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)] transition-all duration-300 hover:border-[var(--accent)] hover:text-[var(--text-primary)] hover:shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionContinue cta="See systems I designed ↓" toId="graph" />
    </SectionWrapper>
  );
}
