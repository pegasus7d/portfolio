"use client";

import type { JourneyStepId } from "@/lib/journey";
import { scrollToSectionId } from "@/lib/journey";

interface SectionContinueProps {
  cta: string;
  toId: JourneyStepId;
  className?: string;
}

export default function SectionContinue({
  cta,
  toId,
  className = "",
}: SectionContinueProps) {
  return (
    <div
      className={[
        "mt-14 flex justify-center border-t border-white/[0.06] pt-10 md:mt-16 md:pt-12",
        className,
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => scrollToSectionId(toId, "smooth")}
        className="group flex flex-col items-center gap-2 text-center text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      >
        <span className="font-medium tracking-wide text-[var(--text-muted)] transition group-hover:text-[var(--accent)]">
          {cta}
        </span>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.03] text-[var(--accent)] transition group-hover:border-[var(--accent)]/35 group-hover:bg-[var(--accent)]/10 group-hover:shadow-[0_0_24px_-4px_rgba(59,130,246,0.35)]"
          aria-hidden
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="animate-bounce"
          >
            <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </div>
  );
}
