"use client";

import { SectionWrapper } from "@/components/layout";
import { Textify } from "@/components/textify";
import ProjectCard from "@/components/projects/ProjectCard";
import type { ProjectMeta } from "@/lib/types";

interface ProjectsSectionProps {
  projects: ProjectMeta[];
}

export default function Projects({ projects }: ProjectsSectionProps) {
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
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </SectionWrapper>
  );
}
