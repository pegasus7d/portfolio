"use client";

import Link from "next/link";
import { useRef } from "react";
import type { ProjectMeta } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectMeta;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  };

  return (
    <Link href={`/projects/${project.slug}`}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-300 ease-out hover:border-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent-glow)]"
      >
        {project.featured && (
          <span className="mb-3 inline-block rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
            Featured
          </span>
        )}

        <h3 className="text-lg font-semibold tracking-tight group-hover:text-[var(--accent)] transition-colors">
          {project.title}
        </h3>

        <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
          {project.summary}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-[var(--bg)] px-2.5 py-0.5 text-[11px] text-[var(--text-muted)]"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-1 text-xs text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
          <span>Read case study</span>
          <span aria-hidden="true">&rarr;</span>
        </div>
      </div>
    </Link>
  );
}
