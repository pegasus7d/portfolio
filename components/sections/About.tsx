"use client";

import { useRef, useLayoutEffect } from "react";
import { SectionWrapper } from "@/components/layout";
import { Textify } from "@/components/textify";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const TIMELINE = [
  {
    period: "May 2025 — Present",
    role: "Software Engineer",
    company: "Cimba.ai",
    description:
      "Led Usage Insights, shipped agentic runtimes, MCP OAuth, Redis caching, and re-architected LLM test infrastructure.",
  },
  {
    period: "Jun 2024 — Jul 2024",
    role: "Software Engineer Intern",
    company: "Ittiam Systems",
    description:
      "Built Kubernetes dev stack, distributed encode pipeline with KEDA autoscaling, and fixed A/V sync in video pipelines.",
  },
  {
    period: "Dec 2023 — Apr 2024",
    role: "Software Engineer Intern",
    company: "OneLot",
    description:
      "Shipped Next.js server/client refactors, built forms and custom hooks, integrated Slack for team workflows.",
  },
] as const;

export default function About() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const bioExtraRef = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !timelineRef.current) return;

    const nodes = timelineRef.current.querySelectorAll("[data-timeline-node]");
    gsap.set(nodes, { opacity: 0, x: -20 });

    const tween = gsap.to(nodes, {
      opacity: 1,
      x: 0,
      duration: 0.5,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: timelineRef.current,
        start: "top 80%",
        once: true,
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === timelineRef.current)
        .forEach((st) => st.kill());
    };
  }, [reduced]);

  useLayoutEffect(() => {
    if (reduced || !bioExtraRef.current) return;

    gsap.set(bioExtraRef.current, { opacity: 0, y: 15 });
    const tween = gsap.to(bioExtraRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      scrollTrigger: {
        trigger: bioExtraRef.current,
        start: "top 85%",
        once: true,
      },
    });

    return () => { tween.kill(); };
  }, [reduced]);

  return (
    <SectionWrapper id="about">
      <Textify
        variant="reveal"
        content="About"
        tag="h2"
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        trigger="scroll"
        duration={0.8}
      />

      <div className="mt-8 grid gap-12 md:grid-cols-2">
        <div>
          <Textify
            variant="stagger"
            content="I am a software engineer from IIT Kharagpur (Physics) focused on backend systems, infrastructure, and developer tooling. I build and operate production analytics platforms, agentic services, vector search pipelines, and LLM integrations."
            tag="p"
            className="text-[var(--text-muted)] leading-relaxed"
            trigger="scroll"
            delay={0.2}
            duration={1.0}
          />
          <p
            ref={bioExtraRef}
            className="mt-4 text-[var(--text-muted)] leading-relaxed"
          >
            I care about ownership, reliability, and shipping things that work at
            scale. I think in systems, not features.
          </p>
        </div>

        <div
          ref={timelineRef}
          className="relative pl-6 border-l border-[var(--border)]"
        >
          {TIMELINE.map((item, i) => (
            <div
              key={i}
              data-timeline-node
              className="relative mb-8 last:mb-0"
            >
              <div className="absolute -left-[calc(1.5rem+4.5px)] top-1.5 h-[9px] w-[9px] rounded-full border-2 border-[var(--accent)] bg-[var(--bg)]" />
              <time className="text-xs text-[var(--text-muted)]">
                {item.period}
              </time>
              <h3 className="mt-1 font-semibold">
                {item.role}{" "}
                <span className="text-[var(--accent)]">@ {item.company}</span>
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
