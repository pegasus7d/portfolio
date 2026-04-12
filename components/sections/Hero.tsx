"use client";

import { useRef, useLayoutEffect, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Textify } from "@/components/textify";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const ParticleBg = dynamic(
  () => import("@/components/particles/ParticleBg"),
  { ssr: false }
);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [spotlightVisible, setSpotlightVisible] = useState(false);
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

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reduced || !spotlightRef.current || !sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      spotlightRef.current.style.left = `${e.clientX - rect.left}px`;
      spotlightRef.current.style.top = `${e.clientY - rect.top}px`;
      if (!spotlightVisible) setSpotlightVisible(true);
    },
    [reduced, spotlightVisible]
  );

  const onMouseLeave = useCallback(() => {
    setSpotlightVisible(false);
  }, []);

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 overflow-hidden"
    >
      <ParticleBg />

      {/* Cursor-follow spotlight */}
      <div
        ref={spotlightRef}
        className="cursor-spotlight hidden md:block"
        style={{ opacity: spotlightVisible ? 1 : 0 }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-2xl text-center">
        <Textify
          variant="typewriter"
          content="Debayan Biswas"
          tag="h1"
          className="text-gradient text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
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
          <a href="/#about" className="btn-primary">
            <span className="relative z-10">About</span>
          </a>
          <a href="/#contact" className="btn-secondary">
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
