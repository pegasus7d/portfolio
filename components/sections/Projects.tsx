"use client";

import { useEffect, useRef, useState } from "react";
import { SectionWrapper } from "@/components/layout";
import { Textify } from "@/components/textify";
import { SectionContinue } from "@/components/journey";
import ProjectCard from "@/components/projects/ProjectCard";
import {
  HIGHLIGHT_PROJECT_EVENT,
  HIGHLIGHT_TECH_EVENT,
  type HighlightProjectDetail,
  type HighlightTechDetail,
} from "@/lib/journey";
import type { ProjectMeta } from "@/lib/types";

interface ProjectsSectionProps {
  projects: ProjectMeta[];
}

export default function Projects({ projects }: ProjectsSectionProps) {
  const [highlightSlugs, setHighlightSlugs] = useState<string[]>([]);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const arm = (slugs: string[]) => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
      setHighlightSlugs(slugs);
      clearTimer.current = setTimeout(() => setHighlightSlugs([]), 5000);
    };
    const onP = (e: Event) => {
      const d = (e as CustomEvent<HighlightProjectDetail>).detail;
      if (d?.slug) arm([d.slug]);
    };
    const onT = (e: Event) => {
      const d = (e as CustomEvent<HighlightTechDetail>).detail;
      if (d?.matchingSlugs?.length) arm(d.matchingSlugs);
    };
    window.addEventListener(HIGHLIGHT_PROJECT_EVENT, onP);
    window.addEventListener(HIGHLIGHT_TECH_EVENT, onT);
    return () => {
      window.removeEventListener(HIGHLIGHT_PROJECT_EVENT, onP);
      window.removeEventListener(HIGHLIGHT_TECH_EVENT, onT);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  return (
    <SectionWrapper id="projects" staggerChildren>
      <Textify
        variant="reveal"
        content="Projects"
        tag="h2"
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        trigger="scroll"
        duration={0.8}
      />
      <p className="mt-2 text-[var(--text-muted)]">
        Systems I have designed, built, and shipped.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.slug}
            project={project}
            highlighted={highlightSlugs.includes(project.slug)}
          />
        ))}
      </div>

      <SectionContinue cta="Explore skills & stack ↓" toId="skills" />
    </SectionWrapper>
  );
}
