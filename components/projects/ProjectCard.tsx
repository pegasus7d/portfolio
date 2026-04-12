"use client";

import Link from "next/link";
import { useRef, useCallback } from "react";
import type { ProjectMeta } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectMeta;
  /** Pulsed when linked from the career graph or system map */
  highlighted?: boolean;
}

export default function ProjectCard({ project, highlighted }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px) scale3d(1.02, 1.02, 1.02)`;

    // Feed cursor position to CSS variable for the glow
    card.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
    card.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)";
  }, []);

  return (
    <Link
      href={`/projects/${project.slug}`}
      data-project-slug={project.slug}
      className={[
        "block h-full rounded-lg transition-[box-shadow,ring-color] duration-500 ease-out",
        highlighted
          ? "ring-2 ring-[var(--accent)]/90 ring-offset-2 ring-offset-[var(--bg)] shadow-[0_0_36px_-6px_rgba(59,130,246,0.5)]"
          : "",
      ].join(" ")}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="card-glow group h-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-300 ease-out sm:p-6"
      >
        {project.featured && (
          <span className="mb-3 inline-block rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
            Featured
          </span>
        )}

        <h3 className="text-base font-semibold tracking-tight transition-colors group-hover:text-[var(--accent)] sm:text-lg">
          {project.title}
        </h3>

        <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
          {project.summary}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-[var(--bg)] px-2.5 py-0.5 text-[11px] text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]"
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
