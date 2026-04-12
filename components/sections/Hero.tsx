"use client";

import { useRef, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import { Textify } from "@/components/textify";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const ParticleBg = dynamic(
  () => import("@/components/particles/ParticleBg"),
  { ssr: false }
);

export default function Hero() {
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced) return;

    const els = [ctaRef.current, scrollRef.current].filter(Boolean);
    gsap.set(els, { opacity: 0, y: 20 });

    gsap.to(els, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.2,
      ease: "power3.out",
      delay: 2.8,
    });
  }, [reduced]);

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 overflow-hidden">
      <ParticleBg />

      <div className="relative z-10 max-w-2xl text-center">
        <Textify
          variant="typewriter"
          content="Debayan Biswas"
          tag="h1"
          className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          duration={1.4}
          cursor
        />
        <Textify
          variant="stagger"
          content="Backend and systems engineer. Building production analytics, agentic runtimes, data pipelines, and LLM integrations."
          tag="p"
          className="mt-6 text-lg text-[var(--text-muted)] sm:text-xl"
          delay={1.6}
          duration={1.0}
        />
        <div
          ref={ctaRef}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <a
            href="#projects"
            className="group relative rounded-md bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-[var(--accent-glow)]"
          >
            <span className="relative z-10">View Work</span>
            <span className="absolute inset-0 rounded-md bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
          <a
            href="#contact"
            className="rounded-md border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--surface)] hover:border-[var(--text-muted)]"
          >
            Contact
          </a>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="h-6 w-4 animate-bounce rounded-full border-2 border-[var(--text-muted)] p-0.5">
          <div className="mx-auto h-1.5 w-0.5 rounded-full bg-[var(--text-muted)]" />
        </div>
      </div>
    </section>
  );
}
