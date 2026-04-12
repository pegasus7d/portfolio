"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  JOURNEY_STEPS,
  JOURNEY_EVENT,
  scrollToSectionId,
  type JourneyDetail,
  type JourneyStepId,
} from "@/lib/journey";

/** Right-side dot nav — home page only */
export default function JourneyRail() {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState<JourneyStepId | "">("");

  useEffect(() => {
    if (pathname !== "/") return;
    const onJourney = (e: Event) => {
      const d = (e as CustomEvent<JourneyDetail>).detail;
      if (d?.activeId !== undefined) setActiveId(d.activeId);
    };
    window.addEventListener(JOURNEY_EVENT, onJourney as EventListener);
    return () =>
      window.removeEventListener(JOURNEY_EVENT, onJourney as EventListener);
  }, [pathname]);

  if (pathname !== "/") return null;

  return (
    <nav
      className="pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
      aria-label="On-page sections"
    >
      <ul className="pointer-events-auto flex flex-col gap-2.5 rounded-full border border-white/[0.08] bg-[var(--bg)]/75 px-2 py-3 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        {JOURNEY_STEPS.map((step) => {
          const active = activeId === step.id;
          const isContact = step.id === "contact";
          return (
            <li key={step.id}>
              <button
                type="button"
                title={step.navLabel}
                aria-current={active ? "location" : undefined}
                onClick={() => scrollToSectionId(step.id)}
                className={[
                  "relative flex h-2.5 w-2.5 items-center justify-center rounded-full transition-all duration-300",
                  active
                    ? isContact
                      ? "scale-125 bg-gradient-to-br from-violet-400 to-indigo-400 shadow-[0_0_12px_rgba(167,139,250,0.75)]"
                      : "scale-125 bg-gradient-to-br from-indigo-400 to-blue-400 shadow-[0_0_12px_rgba(99,102,241,0.85)]"
                    : "bg-white/20 hover:scale-110 hover:bg-white/40",
                ].join(" ")}
              >
                <span className="sr-only">{step.navLabel}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
